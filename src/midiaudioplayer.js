import MidiPlayer from 'midi-player-js';
import WebAudioFontPlayer from "./libraries/webaudiofontplayer";
import AudioCompressor from './libraries/audiocompressor';
import indexedDbStorage from './libraries/indexeddbstorage';
import DefaultPreset from "./presets/defaultpreset.json";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


export default class MidiAudioPlayer extends MidiPlayer.Player {

    static ENDPOINT       = 'https://zmotrin.github.io/webaudiofontjson/';
    static DEFAULTPRESET  = -1;
    static REFERENCE_GAIN = 0.15;

    #catalog       = null;
	#audioCtx      = null;
	#compressor    = null;
    #activeNotes   = {};
    #channelStates = {};
    #instruments   = {};
    #players       = {};
    #channels      = {};

	#opts = {
        volume: 0.7,
        reverb: 0,
        onEndFile: null,
        localCache: false,
        presetAuto: false,
        presetRandom: false,
        preferred: [],
        presets: { [-1]: -1 },
	};


	constructor(opts = {}) {
        super(event => this.#handleMidiPipeline(event));
        this.#opts.presets = { ...this.#opts.presets, ...Object.fromEntries(Array.from({ length: 128 }, (_, i) => [i + 1, -1]))};
        this.#opts = {
            ...this.#opts,
            ...opts,
            presets: {
                ...this.#opts.presets,
                ...(opts.presets || {})
            },
        };
		this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.#compressor = new AudioCompressor(this.#audioCtx, this.#opts.volume, this.#opts.reverb);
	}

    get channels() { return this.#players; }
    get channelStates() { return this.#channelStates; }
    get volume() { return this.#opts.volume; }
    set volume(vol) { this.#opts.volume = clamp(vol, 0, 1); this.#compressor.masterVolume = this.#opts.volume; }
    get rever() { return this.#compressor.reverb; }
    set rever(rev) { this.#compressor.reverb = rev; }


    async getCatalog() {
        if(this.#catalog) return this.#catalog;
        const cachedata = this.#opts.localCache ? await indexedDbStorage.getItem('waf_catalog') : null;
        if (cachedata) this.#catalog = JSON.parse(cachedata);
        else {
            this.#log(`Downloading catalog...`);
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
        try {
            if(id == '-1') return DefaultPreset;
            if(typeof id === 'object') return id;
            const cacheid = `waf_preset_${id}`;
            const cachedata = this.#opts.localCache ? await indexedDbStorage.getItem(cacheid) : null;
            if (cachedata) return JSON.parse(cachedata);
            this.#log(`Downloading preset ${id}...`);
            const response = await fetch(`${MidiAudioPlayer.ENDPOINT}presets/${id}.json`);
            const preset = await response.json();
            if(this.#opts.localCache) await indexedDbStorage.setItem(cacheid, JSON.stringify(preset));
            return preset;
        } catch(e) {
            throw new Error(`Invalid preset: ${id}`);
        }
    }


    async load(content) {
		if(this.isPlaying()) this.stop();
		this.#clearActiveNotes();
        this.#players = {};
        this.#instruments = {};
        this.#activeNotes = {};
		this.#log('Loading buffer...');
        await this.loadArrayBuffer(content);
        this.#log('Loading instruments...');
        this.#instruments = {};
        this.#channels = await this.#getInstruments();
        this.#channelStates = Object.keys(this.#channels).reduce((acc, key) => ({ ...acc, [key]: false }), {});
        const uniqueInstruments = await this.#getUniqueInstruments();
        if(!Object.values(this.#channels).length) this.#log("Error: no instrument found");
        if(this.#opts.presetRandom || this.#opts.presetAuto) await this.getCatalog();
        await Promise.all([...uniqueInstruments].map(async program => {
            let preset = null;
            if((this.#opts.presetAuto || this.#opts.presetRandom) && this.#opts.presets[program] != MidiAudioPlayer.DEFAULTPRESET) preset = await this.getPreset(this.#opts.presets[program]);
            else if(this.#opts.presetRandom) preset = await this.#getRandomPreset(program);
            else if(this.#opts.presetAuto) preset = await this.#getAutoPreset(program);
            else preset = await this.getPreset(this.#opts.presets[program]);
            this.#instruments[program] = preset;
        }));
        await Promise.all(Object.keys(this.#channels).map(async channel => {
            this.#players[channel] = await this.#createWebAudioFontPlayer(this.#instruments[this.#channels[channel]]);
        }));
        return this.#players;
	}


	async play(content = null) {
		if(content) await this.load(content);
        await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
        this.#compressor.restoreReverb();
        return await super.play();
	}


	async pause() {
        await super.pause();
        this.#compressor.killReverbTail();
        await this.#clearActiveNotes();
        await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
	}


    async stop(skipKill = false) {
        await super.stop();
        if(!skipKill) {
            this.#compressor.killReverbTail();
            await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
        }
        await this.#clearActiveNotes();
	}


    getRealTimeVolume() {
        const analyser = this.#compressor.analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let values = 0;
        for (let i = 0; i < dataArray.length; i++) values += dataArray[i];
        return values / (dataArray.length * 100);
    }


    getSongTimeRemaining() {
        return this.ticksToSeconds(this.getCurrentTick(), this.totalTicks);
    }


    async generateWaveformSVG(samples = 1000) {
        if (!this.totalTicks || !this.events) return '';
        const waveform = new Array(samples).fill(0);
        const tickInterval = this.totalTicks / samples;
        const allEvents = [];
        this.events.forEach(track => track.forEach(event => {
            if (
                event.name === 'Controller Change' ||
                event.name === 'Program Change' ||
                (event.name === 'Note on' && event.velocity > 0)
            ) {
                allEvents.push(event);
            }
        }));
        allEvents.sort((a, b) => a.tick - b.tick);
        const channelsVolume = new Array(16).fill(100);
        const channelsExpression = new Array(16).fill(127);
        const activeInstruments = new Array(16).fill(false);
        activeInstruments[9] = true;
        allEvents.forEach(event => {
            const idx = Math.floor(event.tick / tickInterval);
            if (idx >= samples) return;
            const chan = event.channel;
            if (event.name === 'Program Change') {
                if (chan !== undefined) {
                    activeInstruments[chan] = true;
                }
            }
            else if (event.name === 'Controller Change') {
                if (chan !== undefined) {
                    if (event.controllerType === 7) channelsVolume[chan] = event.value;
                    else if (event.controllerType === 11) channelsExpression[chan] = event.value;
                }
            }
            else if (event.name === 'Note on') {
                if (chan !== undefined && activeInstruments[chan]) {
                    const volFactor = channelsVolume[chan] / 127;
                    const expFactor = channelsExpression[chan] / 127;
                    const modulatedVelocity = event.velocity * volFactor * expFactor;
                    waveform[idx] += modulatedVelocity;
                }
            }
        });
        const maxAmp = waveform.reduce((max, val) => {
            if (isNaN(val)) return max;
            return val > max ? val : max;
        }, 0);
        const normalized = maxAmp > 0 ? waveform.map(v => isNaN(v) ? 0 : v / maxAmp) : waveform.fill(0);
        const width = samples;
        const height = width / 5;
        const points = normalized.map((val, i) => {
            const x = i;
            const y = Math.max(0, Math.min(height, height - (val * height)));
            return `${x},${y.toFixed(2)}`;
        });
        const d = `M 0,${height} L ${points.join(' L ')} L ${width},${height}`;
        return `<svg class="midiaudioplayer-waveform" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
    }


    async extractLyrics() {
        const structure = { language: "", title: "", paragraphs: [{ lines: [{ blocks: [] }] }] };
        let currentPara = structure.paragraphs[0];
        let currentLine = currentPara.lines[0];
        this.events.forEach(track => {
            track.forEach(event => {
                if (event.name === 'Text Event' || event.name === 'Lyric Event') {
                    let text = event.string;
                    if (text.startsWith('@L')) structure.language = text.substring(2);
                    if (text.startsWith('@T')) structure.title += (structure.title ? ' / ' : '') + text.substring(2);
                    if (text.startsWith('\\')) {
                        const newPara = { tick: event.tick, lines: [{ blocks: [] }] };
                        structure.paragraphs.push(newPara);
                        currentPara = newPara;
                        currentLine = currentPara.lines[0];
                        text = text.substring(1);
                    }
                    if (text.startsWith('/')) {
                        const newLine = { tick: event.tick, blocks: [] };
                        currentPara.lines.push(newLine);
                        currentLine = newLine;
                        text = text.substring(1);
                    }
                    if(!event.tick) return;
                    if (text.length > 0) {
                        currentLine.blocks.push({
                            text: text,
                            tick: event.tick
                        });
                    }
                }
            });
        });
        structure.paragraphs = structure.paragraphs.filter(p => p.lines.some(l => l.blocks.length > 0));
        return structure;
    }


    async triggerPlayerEvent(playerEvent, data) {
        if(playerEvent == 'fileLoaded') {
            super.triggerPlayerEvent(playerEvent, {
                tempo: this.tempo,
                division: this.division,
                duration: this.getSongTime(),
                sampleRate: this.sampleRate,
                totalTicks: this.totalTicks,
                totalEvents: this.totalEvents,
                channels: await this.#channels,
            });
        } else super.triggerPlayerEvent(playerEvent, data);
    }


    playLoop(dryRun) {
        if (this.inLoop) return;
        if (!dryRun && this.endOfFile() && this.tick > 0) {
            this.stop(true);
            this.tick = 0;
            queueMicrotask(() => this.triggerPlayerEvent('endOfFile'));
            return;
        }
        this.inLoop = true;
        this.tick = this.getCurrentTick();
        this.tracks.forEach((track) => {
            const result = track.handleEvent(this.tick, dryRun);
            if (!result) return;
            const events = Array.isArray(result) ? result : [result];
            events.forEach((event) => {
                const { name, data, value } = event;
                if (name === 'Set Tempo') this.setTempo(data);
                if (dryRun) {
                    if (name === 'Program Change' && !this.instruments.includes(value)) {
                        this.instruments.push(value);
                    }
                } else this.emitEvent(event);
            });
        });
        if (!dryRun && this.isPlaying()) this.triggerPlayerEvent('playing', { tick: this.tick });
        this.inLoop = false;
    }


    ticksToSeconds(startTick, endTick) {
        if (startTick >= endTick) return 0;
        let seconds = 0;
        const len = this.tempoMap.length;
        const timeFactor = 60 / this.division;
        let low = 0;
        let high = len - 1;
        let startIndex = 0;
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (this.tempoMap[mid].tick <= startTick) {
                startIndex = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        let currentTick = startTick;
        for (let i = startIndex; i < len; i++) {
            const entry = this.tempoMap[i];
            const nextTick = (i + 1 < len) ? this.tempoMap[i + 1].tick : endTick;
            if (nextTick <= startTick) continue;
            const segStart = Math.max(entry.tick, startTick);
            const segEnd = Math.min(nextTick, endTick);
            if (segStart >= endTick) break;
            seconds += ((segEnd - segStart) / entry.tempo) * timeFactor;
            currentTick = segEnd;
        }
        if (currentTick < endTick) {
            const lastEntry = this.tempoMap[len - 1];
            seconds += ((endTick - currentTick) / lastEntry.tempo) * timeFactor;
        }
        return seconds;
    }


    secondsToTicks(seconds) {
        let remainingSeconds = seconds;
        const len = this.tempoMap.length;
        const factor = 60 / this.division;
        for (let i = 0; i < len; i++) {
            const entry = this.tempoMap[i];
            const nextTick = (i + 1 < len) ? this.tempoMap[i + 1].tick : Infinity;
            const segmentTicks = nextTick - entry.tick;
            const segmentSeconds = (segmentTicks / entry.tempo) * factor;
            if (remainingSeconds <= segmentSeconds) {
                return entry.tick + Math.round((remainingSeconds * entry.tempo) / factor);
            }
            remainingSeconds -= segmentSeconds;
        }
        return this.totalTicks;
    }


    async getProgramInstruments(program) {
        const categories = await this.getCategories();
        let instruments = [];
        await Promise.all(categories.map(async category => category.instruments.filter(elm => elm.program == program).forEach(elm => instruments = [...instruments, ...elm.presets])));
        return instruments;
    }


    async #getInstruments() {
        const instrumentMap = {};
        this.events.forEach(track => {
            track.forEach(event => {
                if (event.name === 'Program Change') {
                    if(instrumentMap[event.channel]) return;
                    else if(event.channel == 10) instrumentMap[event.channel] = -1;
                    else instrumentMap[event.channel] = event.value + 1;
                }
            });
        });
        return instrumentMap;
    }


    async #getUniqueInstruments() {
        const instrumentMap = new Set();
        this.events.forEach(track => {
            track.forEach(event => {
                if (event.name === 'Program Change') {
                    instrumentMap.add(event.channel == 10 ? -1 : (event.value + 1));
                }
            });
        });
        return instrumentMap;
    }


    async #getRandomPreset(program) {
        const instruments = await this.getProgramInstruments(program);
        if(!instruments.length) return null;
        return await this.getPreset(instruments[Math.floor(Math.random() * instruments.length)].id);
    }


    async #getAutoPreset(program) {
        const instruments = await this.getProgramInstruments(program);
        if(!instruments.length) return null;
        let preset = null;
        this.#opts.preferred.some(bank => {
            preset = instruments.find(elm => elm.bank == bank);
            if(preset) return true;
        });
        if(preset) return await this.getPreset(preset.id);
        else return await this.getPreset(instruments[0].id);
    }


    async #createWebAudioFontPlayer(preset) {
        return new WebAudioFontPlayer(this.#audioCtx, this.#compressor, preset);
    }


    async #handleMidiPipeline(event) {
        if(!this.isPlaying()) return;
        switch (event.name) {
            case 'Text Event':
                if(event.string.startsWith('@')) break;
                if(!event.tick) break;
                const text = /^[\\\/]/i.test(event.string) ? event.string.substring(1) : event.string;
                this.triggerPlayerEvent('lyrics', {
                    string: text,
                    tick: event.tick,
                    paragraphe: event.string.startsWith('\\'),
                    line: event.string.startsWith('/')
                });
                break;
            case 'Note on':
                if(event.tick < (this.getCurrentTick() - 10)) return;
                if(event.noteNumber === undefined) return;
                if (event.velocity > 0 && event.velocity <= 127) {
                    this.#stopNote(event.channel, event.noteNumber);
                    const normalizedMaster = this.#opts.volume * 100 / 255;
                    const masterGain = Math.pow(normalizedMaster, 2);
                    const noteVelocityRatio = event.velocity / 127;
                    const finalVol = MidiAudioPlayer.REFERENCE_GAIN * Math.pow(noteVelocityRatio, 2);
                    const envelope = this.#players[event.channel]?.queueWaveTable(0, event.noteNumber, 2, finalVol);
                    if(envelope) this.#addNote(event.channel, event.noteNumber, envelope)
                } else this.#stopNote(event.channel, event.noteNumber);
                break;
            case 'Note off':
                if(event.tick < (this.getCurrentTick() - 100)) return;
                if(event.noteNumber === undefined) return;
                this.#stopNote(event.channel, event.noteNumber);
                break;
            case 'Controller Change':
                this.#players[event.channel]?.setController(event.number, event.value);
                break;
            case 'Pitch Bend':
                this.#players[event.channel]?.setPitchBend?.(event.value);
                break;
            case 'Program Change':
                if(event.channel == 10) break;
                if(!this.#opts.presetAuto && !this.#opts.presetRandom) break;
                if(this.#players[event.channel].preset.program != (event.value + 1)) {
                    this.#players[event.channel].preset = this.#instruments[event.value + 1];
                }
                break;
        }
    }


    #addNote(channel, note, envelope) {
        if (!this.#activeNotes[channel]) this.#activeNotes[channel] = new Map();
        this.#activeNotes[channel].set(note, envelope);
        const realDurationMs = (envelope.duration || 0) * 1000;
        const decayTime = Math.max(500, realDurationMs + 100);
        setTimeout(() => {
            if (this.#activeNotes[channel]?.get(note) === envelope) {
                this.#activeNotes[channel].delete(note);
                this.#updateChannelStates();
            }
        }, decayTime);
        this.#updateChannelStates();
    }


    #stopNote(channel, noteNumber) {
        const player = this.#players[channel];
        const envelope = this.#activeNotes[channel]?.get(noteNumber);
        if (envelope) {
            if (player && player.isSustainActive()) {
                player.registerSustainNote(() => {
                    envelope.cancel();
                    this.#activeNotes[channel]?.delete(noteNumber);
                    this.#updateChannelStates();
                });
            } else {
                envelope.cancel();
                this.#activeNotes[channel]?.delete(noteNumber);
            }
        }
        this.#updateChannelStates();
    }


    #clearActiveNotes() {
        Object.keys(this.#activeNotes).map(channel => {
            this.#activeNotes[channel].forEach((envelope, note) => {
                if (envelope && envelope.cancel) {
                    envelope.cancel();
                }
                this.#activeNotes[channel]?.delete(note);
            });
        });
        this.#updateChannelStates();
    }


    #updateChannelStates() {
        const channelStates = structuredClone(this.#channelStates);
        Object.keys(this.#activeNotes).forEach(channel => channelStates[channel] = Boolean(this.#activeNotes[channel].size));
        if(channelStates != this.#channelStates) {
            this.#channelStates = channelStates;
            if(Object.values(this.#channelStates).length) this.triggerPlayerEvent('channelState', this.#channelStates);
        }
    }


    #log(str, err = false) {
        this.triggerPlayerEvent('logs', str);
    }

}