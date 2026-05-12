import MidiPlayer from 'midi-player-js';
import WebAudioFontPlayer from "./webaudiofontplayer";
import indexedDbStorage from './indexeddbstorage';
import DefaultPreset from "./presets/defaultpreset.json";


export default class MidiAudioPlayer extends MidiPlayer.Player {

    static ENDPOINT = 'https://zmotrin.github.io/webaudiofontjson/';
    
    static PIANO =    1;
    static BASS =     2;
    static STRINGS =  3;
    static GUITAR =   4;
    static DRUM =    10;

    #catalog = null;

	#audioCtx = null;
	#activeNotes = null;

    #players = {
        [MidiAudioPlayer.PIANO]:   null,
        [MidiAudioPlayer.BASS]:    null,
        [MidiAudioPlayer.STRINGS]: null,
        [MidiAudioPlayer.GUITAR]:  null,
        [MidiAudioPlayer.DRUM]:    null,
    };
    #actives = {
        [MidiAudioPlayer.PIANO]:   true,
        [MidiAudioPlayer.BASS]:    true,
        [MidiAudioPlayer.STRINGS]: true,
        [MidiAudioPlayer.GUITAR]:  true,
        [MidiAudioPlayer.DRUM]:    true,
    };
    // #channels = {
    //     "piano":   [MidiAudioPlayer.PIANO],
    //     "bass":    [MidiAudioPlayer.BASS],
    //     "strings": [MidiAudioPlayer.STRINGS],
    //     "guitar":  [MidiAudioPlayer.GUITAR],
    //     "drum":    [MidiAudioPlayer.DRUM],
    // };


	#opts = {
		// preset: DefaultPreset,
        volume: 0.5,
		onEndFile: null,
        localCache: true,
        // fillDefault: false,
        activeChannels: {
            [MidiAudioPlayer.PIANO]:   true,
            [MidiAudioPlayer.BASS]:    true,
            [MidiAudioPlayer.STRINGS]: true,
            [MidiAudioPlayer.GUITAR]:  true,
            [MidiAudioPlayer.DRUM]:    true,
        },
        presets: {
            [MidiAudioPlayer.PIANO]:   DefaultPreset,
            [MidiAudioPlayer.BASS]:    DefaultPreset,
            [MidiAudioPlayer.STRINGS]: DefaultPreset,
            [MidiAudioPlayer.GUITAR]:  DefaultPreset,
            [MidiAudioPlayer.DRUM]:    DefaultPreset,
        },
	};


	constructor(opts = {}) {
        super(event => this.#handleMidiPipeline(event));
        this.#opts = {
            ...this.#opts,
            ...opts,
            activeChannels: {
                ...(this.#opts.activeChannels || {}),
                ...(opts.activeChannels || {})
            },
            presets: {
                ...(this.#opts.presets || {}),
                ...(opts.presets || {})
            },
        };

        this.#activeNotes = new Map();
		this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        Object.keys(this.#players).forEach(k => this.#players[k] = new WebAudioFontPlayer(this.#audioCtx, this.#opts.presets[k]));

        this.on('endOfFile', async () => {
			await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 1)));
			await this.#endOfFile();
        });
	}


    async getCatalog() {   
        if(this.#catalog) return this.#catalog;
        const cachedata = this.#opts.localCache ? await indexedDbStorage.getItem('waf_catalog') : null;
        if (cachedata) this.#catalog = JSON.parse(cachedata);
        else {
            const response = await fetch(`${MidiAudioPlayer.ENDPOINT}catalog.json`);
            this.#catalog = await response.json();
            if(this.#opts.localCache) await indexedDbStorage.setItem('waf_catalog', JSON.stringify(this.#catalog));
        }
        return this.#catalog;
    }


    async getCategories() {
        return (await this.getCatalog()).categories;
    }


    async getPreset(id) {
        const cacheid = `waf_preset_${id}`;
        const cachedata = this.#opts.localCache ? await indexedDbStorage.getItem(cacheid) : null;
        if (cachedata) return JSON.parse(cachedata);
        const response = await fetch(`${MidiAudioPlayer.ENDPOINT}presets/${id}.json`);
        const preset = await response.json();
        if(this.#opts.localCache) await indexedDbStorage.setItem(cacheid, JSON.stringify(preset));
        return preset;
    }

    
    async loadPreset(id) {
        const preset = await this.getPreset(id);
        const player = new WebAudioFontPlayer(this.#audioCtx, preset);
        this.#players[preset.channel] = player;
    }


    async load(content) {
		if(this.isPlaying()) this.stop();
		this.#clearActiveNotes();
		await this.loadArrayBuffer(content);
	}


	async play(content = null) {
		if(content) await this.load(content);
        await this.#audioCtx.resume();
		await super.play();
	}
    

	async pause() {
        await super.pause();
        await this.#clearActiveNotes();
        await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
	}

	
    async stop() {
        await super.stop();
        await this.#clearActiveNotes();
        await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
	}
    

    setActiveChannel(channel, value) {
        this.#opts.activeChannels[channel] = value;
        if(!value) this.#clearChannel(channel);
    }


	async #endOfFile() {
		if(typeof this.#opts.onEndFile == 'function') await this.#opts.onEndFile();
	}


    async #handleMidiPipeline(event) {
        if (event.name !== 'Note on' && event.name !== 'Note off') return;
        if (!this.isPlaying()) return;
        if (event.noteNumber === undefined) return;
        switch (event.name) {
            case 'Note on':
                // console.log(event);
                if(!this.#opts.activeChannels[event.channel]) break;
                if (event.velocity > 0 && event.velocity <= 127) {
                    this.#stopNotePipe(event.noteNumber);
                    const normalizedMaster = this.#opts.volume * 100 / 256;
                    const masterGain = Math.pow(normalizedMaster, 2);
                    const noteVelocityRatio = event.velocity / 127;
                    const finalVol = masterGain * Math.pow(noteVelocityRatio, 2);
                    const envelope = this.#players[event.channel]?.queueWaveTable(0, event.noteNumber, 2, finalVol);
                    if(envelope) {
                        envelope.channel = event.channel;
                        this.#activeNotes.set(event.noteNumber, envelope);
                    }
                } else {
                    this.#stopNotePipe(event.noteNumber);
                }
                break;
            case 'Note off':
                this.#stopNotePipe(event.noteNumber);
                break;
        }
    }


    #clearChannel(channel) {
        if (this.#activeNotes) {
            this.#activeNotes.forEach((envelope, note) => { 
                if (envelope && envelope.cancel && envelope.channel == channel) {
                    envelope.cancel();
                    this.#activeNotes.delete(note);
                }
            });
        }
    }


    #stopNotePipe(noteNumber) {
        const envelope = this.#activeNotes.get(noteNumber);
        if (envelope) {
            envelope.cancel();
            this.#activeNotes.delete(noteNumber);
        }
    }


    #clearActiveNotes() {
        if (this.#activeNotes) {
            this.#activeNotes.forEach((envelope, note) => { if (envelope && envelope.cancel) envelope.cancel(); });
            this.#activeNotes.clear();
        }
    }

}

