import MidiPlayer from 'midi-player-js';
import WebAudioFontPlayer from 'webaudiofontplayer';
import AudioCompressor from './libraries/audiocompressor';
import indexedDbStorage from './libraries/indexeddbstorage';
import DefaultPreset from "./presets/defaultpreset.json";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


export default class MidiAudioPlayer extends MidiPlayer.Player {

    static ENDPOINT        = 'https://webaudiofonts.github.io/presets/';
    static DEFAULT_PRESET  = -1;
    static REFERENCE_GAIN  = 0.15;
    static KARAOKE_CHANNEL = 0;

    #catalog       = null;
	#audioCtx      = null;
	#compressor    = null;
    #vocalChannel  = null;
    #activeNotes   = {};
    #channelStates = {};
    #instruments   = {};
    #players       = {};
    #channels      = {};
    #lyrics        = null;
    #haveLyrics    = false;
    #title         = '';

	#opts = {
        volume: 0.7,
        reverb: 0,
        onEndFile: null,
        localCache: false,
        presetAuto: false,
        presetRandom: false,
        preferred: [],
        karaoke: false,
        karaokeDelay: 0,
        muteExpression: false,
        maxCharPerLine: 48,
        presets: { [-1]: -1 },
	};


	constructor(opts = {}) {
        super();
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
        if(this.#opts.karaoke) this.#sendKaraokeFrame('intro');
	}

    get catalog() { return this.getCatalog(); }
    get channels() { return this.#players; }
    get channelStates() { return this.#channelStates; }
    get volume() { return this.#opts.volume; }
    set volume(vol) { this.#opts.volume = clamp(vol, 0, 1); this.#compressor.masterVolume = this.#opts.volume; }
    get rever() { return this.#compressor.reverb; }
    set rever(rev) { this.#compressor.reverb = rev; }
    get muteExpression() { return this.#opts.muteExpression; }
    set muteExpression(val) { this.#opts.muteExpression = Boolean(val); }
    get eqFrequencies() { return this.#compressor.eqFrequencies; }
    get eq() { return this.#compressor.getEQ(); }


    async close() {
        Object.keys(this.#players).forEach(id => this.#players[id].close());
        await this.#audioCtx.close();
    }


    async getCatalog() {
        if(this.#catalog) return this.#catalog;
        const cachedata = this.#opts.localCache ? await localStorage.getItem('waf_catalog') : null;
        if (cachedata) this.#catalog = JSON.parse(cachedata);
        else {
            this.#log(`Downloading catalog...`);
            const response = await fetch(`${MidiAudioPlayer.ENDPOINT}catalog.json`);
            if (!response.ok) throw new Error(`Impossible to download catalog: ${response.status}`);
            this.#catalog = await response.json();
            if(this.#opts.localCache) await localStorage.setItem('waf_catalog', JSON.stringify(this.#catalog));
        }
        const catalogDate = new Date(this.#catalog.updatedAt).getTime();
        const catalogVersion = await indexedDbStorage.getItem(`waf_catalog_version`) || 1;
        if(catalogVersion < catalogDate) {
            await indexedDbStorage.clear();
            indexedDbStorage.setItem(`waf_catalog_version`, catalogDate)
        }
        return this.#catalog;
    }


    async getCategories() {
        return (await this.getCatalog()).categories;
    }


    async getProgramInstruments(program) {
        const categories = await this.getCategories();
        let instruments = [];
        await Promise.all(categories.map(async category => category.instruments.filter(elm => elm.program == program).forEach(elm => instruments = [...instruments, ...elm.presets])));
        return instruments;
    }


    async getPreset(id) {
        try {
            if(id == '-1') return DefaultPreset;
            if(typeof id === 'object') return id;
            const cacheid = `waf_preset_${id}`;
            const cachedata = this.#opts.localCache ? await indexedDbStorage.getItem(cacheid) : null;
            if (cachedata) return JSON.parse(cachedata);
            this.#log(`Downloading preset ${id}...`);
            const response = await fetch(`${MidiAudioPlayer.ENDPOINT}${id}.json`);
            const preset = await response.json();
            if(preset.zones === undefined) {
                console.error(`Invalid preset: ${$id}`);
                throw new Error(`Invalid preset: ${$id}`);
            }
            if(this.#opts.localCache) await indexedDbStorage.setItem(cacheid, JSON.stringify(preset), true);
            return preset;
        } catch(e) {
            console.error(`Invalid preset: ${id}`);
            throw new Error(`Invalid preset: ${id}`);
        }
    }


    async loadPreset(presetId, channel = null) {
        const preset = await this.getPreset(presetId);

        if(channel !== null) {
            this.#players[channel].preset = preset;
        }

    }


    async load(content) {
		if(this.isPlaying()) this.stop();
		this.#clearActiveNotes();
        await Promise.all(Object.values(this.#players).map(async player => player.close()));
        this.#players = {};
        this.#instruments = {};
        this.#activeNotes = {};
        this.#title = "";
		this.#log('Loading buffer...');
        try {
            await this.loadArrayBuffer(content);
        } catch(e) {
            await this.loadArrayBuffer(await this.#repairMidi(content));
        }

        this.#log('Loading instruments...');
        this.#channels = await this.#getInstruments();
        this.#channelStates = Object.keys(this.#channels).reduce((acc, key) => ({ ...acc, [key]: false }), {});
        const uniqueInstruments = await this.#getUniqueInstruments();
        if(!Object.values(this.#channels).length) this.#log("Error: no instrument found");
        if(this.#opts.presetRandom || this.#opts.presetAuto) await this.getCatalog();
        const presets = Promise.all([...uniqueInstruments].map(async program => {
            let preset = null;
            if((this.#opts.presetAuto || this.#opts.presetRandom) && this.#opts.presets[program] != MidiAudioPlayer.DEFAULT_PRESET) preset = await this.getPreset(this.#opts.presets[program]);
            else if(this.#opts.presetRandom) preset = await this.#getRandomPreset(program);
            else if(this.#opts.presetAuto) preset = await this.#getAutoPreset(program);
            else preset = await this.getPreset(this.#opts.presets[program]);
            this.#instruments[program] = preset;
        }));

        if(this.#opts.karaoke) {
            this.#log('Generating karaoke frames...');
            this.#lyrics = null;
            await this.#generateKaraokeFrames();
            if(this.#title) this.#sendKaraokeFrame('title', this.#title);
        }

        this.#log(`Trim midi events...`);
        this.#trimMidiEvents();
        queueMicrotask(() => this.triggerPlayerEvent('computed'));

        await presets;
        await Promise.all(Object.keys(this.#channels).map(async channel => {
            if(this.#players[channel]) this.#players[channel].close();
            this.#players[channel] = await this.#createPlayer(this.#instruments[this.#channels[channel]]);
        }));

        this.#log("Initializing instrument states...");
        await this.#initInstrumentStates();
        await this.triggerPlayerEvent('presetsLoaded', this.#instruments);
        this.#log("Player ready");
	}


	async play(content = null) {
        if (this.#audioCtx.state === 'suspended') {
            try { if(!await this.#audioCtx.resume()) return false; }
            catch (e) { return false; }
        }
		if(content) await this.load(content);
        await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
        this.#compressor.restoreReverb();
        if(!this.isPlaying()) {
            if (!this.startTime) this.startTime = new Date().getTime();
            this.scheduledTime = Date.now();
            this.schedulePlayLoop(this.sampleRate);
        }
        return true;
	}


	async pause() {
        await super.pause();
        this.#compressor.killReverbTail();
        await this.#clearActiveNotes();
        await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
	}


    async stop(skipKill = false) {
        await super.stop();
        this.setTimeoutId = false;
        if(!skipKill) {
            this.#compressor.killReverbTail();
            await Promise.all(Object.keys(this.#players).map(async k => await this.#players[k]?.cancelQueue()));
        }
        await this.#clearActiveNotes();
        if(this.#opts.karaoke) this.#sendKaraokeFrame('intro');
        return this;
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


    async skipToSeconds(seconds) {
        const songTime = this.getSongTime();
        if (seconds < 0 || seconds > songTime) throw seconds + " seconds not within song time of " + songTime;
        await this.skipToTick(this.secondsToTicks(seconds));
        return this;
    }


    async generateWaveformSVG(samples = 1000) {
        if (!this.totalTicks || !this.events) return '';
        const waveform = new Array(samples).fill(0);
        const tickInterval = this.totalTicks / samples;
        const allEvents = this.events
            .flatMap((track, trackIdx) =>
                track.map(event => ({
                    ...event,
                    computedChannel: event.channel !== undefined ? event.channel : trackIdx
                }))
            )
            .filter(event =>
                event.name === 'Controller Change' ||
                event.name === 'Program Change' ||
                (event.name === 'Note on' && event.velocity > 0)
            )
            .sort((a, b) => a.tick - b.tick);
        const channelsVolume = new Map();
        const channelsExpression = new Map();
        allEvents.forEach(event => {
            const idx = Math.floor(event.tick / tickInterval);
            if (idx >= samples) return;
            const chan = event.computedChannel;
            if (!channelsVolume.has(chan)) channelsVolume.set(chan, 100);
            if (!channelsExpression.has(chan)) channelsExpression.set(chan, 127);
            if (event.name === 'Controller Change') {
                if (event.number === 7) channelsVolume.set(chan, event.value);
                else if (event.number === 11) channelsExpression.set(chan, event.value);
            }
            else if (event.name === 'Note on') {
                const volFactor = channelsVolume.get(chan) / 127;
                const expFactor = channelsExpression.get(chan) / 127;
                const modulatedVelocity = event.velocity * volFactor * expFactor;
                waveform[idx] += modulatedVelocity;
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

    // ----------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------------

    async triggerPlayerEvent(playerEvent, data) {
        if(playerEvent == 'fileLoaded') return;
        else if(playerEvent == 'computed') {
            if(this.#opts.muteExpression) this.#vocalChannel = await this.#detectKaraokeVocalChannel();
            super.triggerPlayerEvent(playerEvent, {
                title: this.#title,
                tempo: this.tempo,
                division: this.division,
                duration: this.getSongTime(),
                sampleRate: this.sampleRate,
                totalTicks: this.totalTicks,
                totalEvents: this.totalEvents,
                channels: await this.#channels,
            });
        } else if(playerEvent == 'endOfFile' && this.#opts.karaoke) {
            queueMicrotask(() => super.triggerPlayerEvent(playerEvent, data));
        } else super.triggerPlayerEvent(playerEvent, data);
    }


    async playLoop(dryRun) {
        if (this.inLoop) return;
        if (!dryRun && this.endOfFile() && this.tick > 0) {
            await this.stop(true);
            this.tick = 0;
            this.triggerPlayerEvent('endOfFile');
            return;
        }
        this.inLoop = true;
        this.tick = this.getCurrentTick();
        const tracksLen = this.tracks.length;
        for (let i = 0; i < tracksLen; i++) {
            const result = this.tracks[i].handleEvent(this.tick, dryRun);
            if (!result) continue;
            const isArray = result.constructor === Array;
            const eventsLen = isArray ? result.length : 1;
            for (let j = 0; j < eventsLen; j++) {
                const event = isArray ? result[j] : result;
                const { name, data, value } = event;
                if (name === 'Set Tempo') this.setTempo(data);
                if (dryRun) {
                    if (name === 'Program Change' && !this.instruments.includes(value)) this.instruments.push(value);
                } else {
                    this.emitEvent(event);
                }
            }
        }
        if (!dryRun && this.isPlaying()) this.triggerPlayerEvent('playing', { tick: this.tick });
        this.inLoop = false;
    }


    schedulePlayLoop(delay) {
        this.setTimeoutId = setTimeout(() => {
            if (this.setTimeoutId === false) return;
            this.playLoop();
            const currentAudioTime = this.#audioCtx.currentTime;
            if (!this._lastAudioTime) this._lastAudioTime = currentAudioTime;
            const elapsed = currentAudioTime - this._lastAudioTime;
            this._lastAudioTime = currentAudioTime;
            const sampleRateSec = this.sampleRate / 1000;
            const drift = elapsed - sampleRateSec;
            const nextDelay = Math.max(0, this.sampleRate - (drift * 1000));
            this.schedulePlayLoop(nextDelay);
        }, delay);
    }


    emitEvent(event) {
        this.#handleMidiPipeline(event);
    }


    ticksToSeconds(startTick, endTick) {
        if (endTick === undefined) {
            endTick = startTick;
            startTick = 0;
        }
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


    getTickBeforeSeconds(targetTick, seconds) {
        if (targetTick <= 0) return 0;
        const targetTime = this.ticksToSeconds(0, targetTick);
        const desiredTime = Math.max(0, targetTime - seconds);
        return this.secondsToTicks(desiredTime);
    }


    async skipToTick(tick) {
        const safeTick = Math.max(0, Math.min(tick, this.totalTicks || 0));
        const wasPlaying = this.isPlaying();
        this.#clearActiveNotes();
        Object.keys(this.channels).forEach(k => this.channels[k]?.cancelQueue?.());
        if (wasPlaying) super.pause();
        this.startTick = safeTick;
        this.tick = safeTick;
        if (this.tempoMap && this.tempoMap.length > 0) {
            for (let i = this.tempoMap.length - 1; i >= 0; i--) {
                if (this.tempoMap[i].tick <= safeTick) {
                    this.setTempo(this.tempoMap[i].tempo);
                    break;
                }
            }
        }
        try {
            const controllerChange = [];
            const programChange = [];
            const pitchBend = [];
            const karaokeEvent = [];

            this.#collectStateAtTick(safeTick).forEach(event => {
                const channel = event.channel;
                if ((channel === undefined || !this.channels[channel]) && event.name !== 'Karaoke Event') return;
                switch(event.name) {
                    case 'Controller Change': controllerChange[event.channel] = event; break;
                    case 'Program Change': programChange[event.channel] = event; break;
                    case 'Pitch Bend': pitchBend[event.channel] = event; break;
                    case 'Karaoke Event': karaokeEvent[event.channel] = event; break;
                }
            });
            controllerChange.forEach(evt => this.emitEvent(evt));
            programChange.forEach(evt => this.emitEvent(evt));
            pitchBend.forEach(evt => this.emitEvent(evt));
            karaokeEvent.forEach(evt => this.triggerPlayerEvent('karaoke', { type: evt.type, tick: evt.tick, html: evt.text}));
        } catch (e) {
            console.warn("Chase MIDI Error:", e);
            this.#log("Chase MIDI Error:", e);
        }
        if (this.tracks && this.tracks.length > 0) {
            this.tracks.forEach((track, index) => {
                const trackEvents = this.events[index];
                if (trackEvents && trackEvents.length > 0) {
                    let low = 0;
                    let high = trackEvents.length - 1;
                    let pointer = trackEvents.length;
                    while (low <= high) {
                        const mid = (low + high) >> 1;
                        if (trackEvents[mid].tick >= safeTick) {
                            pointer = mid;
                            high = mid - 1;
                        } else {
                            low = mid + 1;
                        }
                    }
                    track.eventIndex = pointer;
                } else if (typeof track.setEventIndexByTick === 'function') {
                    track.setEventIndexByTick(safeTick);
                }
            });
        }
        if (wasPlaying) this.play();
        else this.triggerPlayerEvent('playing', { tick: safeTick });
        return this;
    }


    #collectStateAtTick(tick) {
        const dominated = {};
        if (!this.events) return [];
        for (let t = 0; t < this.events.length; t++) {
            const trackEvents = this.events[t];
            if (!trackEvents || trackEvents.length === 0) continue;
            let low = 0;
            let high = trackEvents.length - 1;
            let endIdx = trackEvents.length;
            while (low <= high) {
                const mid = (low + high) >> 1;
                if (trackEvents[mid].tick >= tick) {
                    endIdx = mid;
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            }
            for (let i = 0; i < endIdx; i++) {
                const event = trackEvents[i];
                let key;
                if (event.name === 'Program Change') {
                    key = 'pc:' + event.channel;
                }else if (event.name === 'Controller Change') {
                    key = 'cc:' + event.channel + ':' + event.number;
                } else if (event.name === 'Pitch Bend') {
                    key = 'pb:' + event.channel;
                } else if (event.name === 'Karaoke Event') {
                    key = 'ke:' + event.channel;
                }
                if (key) {
                    dominated[key] = event;
                }
            }
        }
        return Object.keys(dominated).map(key => dominated[key]);
    }


    async #initInstrumentStates() {
        if (this.events) {
            this.#collectStateAtTick(1).forEach(event => {
                const channel = event.channel;
                if (!this.#players[channel]) return;
                switch (event.name) {
                    case 'Controller Change':
                        this.#players[channel].setController(event.number, event.value);
                        break;
                    case 'Pitch Bend':
                        this.#players[channel].setPitchBend?.(event.value);
                        break;
                    case 'Program Change':
                        if ((this.#opts.presetAuto || this.#opts.presetRandom) &&
                            event.value >= 0 && event.value <= 127 &&
                            this.#instruments[event.value + 1] !== undefined &&
                            event.channel != 10) {
                            if (this.#players[channel].preset?.program !== (event.value + 1)) {
                                this.#players[channel].preset = this.#instruments[event.value + 1];
                            }
                        }
                        break;
                }
            });
        }
    }


    async #getInstruments() {
        const instrumentMap = {};
        const channelUsed = new Set();
        this.events.forEach(track => {
            track.forEach(event => {
                if (event.name === 'Program Change' && event.value >= 0 && event.value <= 127) {
                    if(instrumentMap[event.channel]) return;
                    else if(event.channel == 10) instrumentMap[event.channel] = -1;
                    else instrumentMap[event.channel] = event.value + 1;
                }  else if (event.name === 'Note on' && event.channel == 10) {
                    instrumentMap[event.channel] = -1;
                    channelUsed.add(10);
                } else if(event.name === 'Note on') {
                    channelUsed.add(event.channel);
                }
            });
        });
        Object.keys(instrumentMap).forEach(channel => {
            if(!channelUsed.has(Number(channel))) delete instrumentMap[channel];
        });
        return instrumentMap;
    }


    async #getUniqueInstruments() {
        const instrumentMap = new Set();
        this.events.forEach(track => {
            track.forEach(event => {
                if (event.name === 'Program Change' && event.value >= 0 && event.value <= 127) {
                    instrumentMap.add(event.channel == 10 ? -1 : (event.value + 1));
                } else if (event.name === 'Note on' && event.channel == 10) instrumentMap.add(-1);
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


    async #createPlayer(preset) {
        return new WebAudioFontPlayer(preset, this.#audioCtx, this.#compressor);
    }


    async #handleMidiPipeline(event) {
        if(!this.isPlaying()) return;
        switch (event.name) {
            case 'Note on':
                if (event.tick < (this.tick - 100)) return;
                if (event.noteNumber === undefined) return;
                if (event.channel == this.#vocalChannel && this.#opts.muteExpression) return;
                if (event.velocity > 0 && event.velocity <= 127) {
                    this.#stopNote(event.channel, event.noteNumber);
                    const noteVelocityRatio = event.velocity / 127;
                    const finalVol = MidiAudioPlayer.REFERENCE_GAIN * Math.pow(noteVelocityRatio, 2);
                    const envelope = this.#players[event.channel]?.queueWaveTable(0, event.noteNumber, 2, finalVol);
                    if (envelope) this.#addNote(event.channel, event.noteNumber, envelope)
                } else {
                    this.#stopNote(event.channel, event.noteNumber);
                }
                break;
            case 'Note off':
                if (event.noteNumber === undefined) return;
                this.#stopNote(event.channel, event.noteNumber);
                break;
            case 'Controller Change':
                this.#players[event.channel]?.setController(event.number, event.value);
                break;
            case 'Pitch Bend':
                this.#players[event.channel]?.setPitchBend?.(event.value);
                break;
            case 'Program Change':
                return;
                if(!this.#players[event.channel]) return;
                if(event.channel == 10 || event.value > 127 || event.value < 0) break;
                if(!this.#opts.presetAuto && !this.#opts.presetRandom) break;
                if(this.#players[event.channel] !== undefined && this.#players[event.channel].preset.program != (event.value + 1))
                    this.#players[event.channel].preset = this.#instruments[event.value + 1];
                break;
            case 'Karaoke Event':
                if (event.tick < (this.tick - this.secondsToTicks(10))) return;
                this.triggerPlayerEvent('karaoke', { type: event.type, tick: event.tick, html: event.text});
                break;
        }
    }


    #addNote(channel, note, envelope) {
        if (!this.#activeNotes[channel]) this.#activeNotes[channel] = new Map();
        this.#activeNotes[channel].set(note, envelope);
        this.#updateChannelStates();
        const realDurationMs = (envelope.duration || 0) * 1000;
        envelope.cleanupTimer = setTimeout(() => {
            if (this.#activeNotes[channel]?.get(note) === envelope) {
                this.#activeNotes[channel].delete(note);
                this.#updateChannelStates();
            }
        }, realDurationMs + 50);
    }


    #stopNote(channel, noteNumber) {
        const player = this.#players[channel];
        const envelope = this.#activeNotes[channel]?.get(noteNumber);
        if (envelope) {
            if (envelope.cleanupTimer) clearTimeout(envelope.cleanupTimer);
            const removeNoteFromRegistry = () => {
                this.#activeNotes[channel]?.delete(noteNumber);
                this.#updateChannelStates();
            };
            if (player && player.isSustainActive()) {
                player.registerSustainNote(() => envelope.cancel(false));
            } else {
                envelope.cancel(false);
            }
            removeNoteFromRegistry();
        }
    }


    #clearActiveNotes() {
        Object.keys(this.#activeNotes).forEach(channel => {
            this.#activeNotes[channel].forEach((envelope, note) => {
                if (envelope) {
                    if (envelope.cleanupTimer) clearTimeout(envelope.cleanupTimer);
                    if (envelope.cancel) envelope.cancel(true);
                }
                this.#activeNotes[channel]?.delete(note);
            });
        });
        this.#updateChannelStates();
    }


    async #updateChannelStates() {
        let hasChanged = false;
        const nextStates = {};
        Object.keys(this.#players).forEach(channel => {
            const isActive = Boolean(this.#activeNotes[channel]?.size && this.#activeNotes[channel].size > 0);
            nextStates[channel] = isActive;
            if (this.#channelStates[channel] !== isActive) hasChanged = true;
        });
        if (hasChanged) {
            this.#channelStates = nextStates;
            this.triggerPlayerEvent('channelState', this.#channelStates);
        }
    }


    async #repairMidi(buffer) {
        const src = new Uint8Array(buffer);
        const view = new DataView(buffer);
        const magic = String.fromCharCode(...src.slice(0, 4));
        if (magic !== 'MThd') throw new Error('Invalid MIDI file (MThd missing)');
        const headerLen = view.getUint32(4);
        const format = view.getUint16(8);
        const ntrks = view.getUint16(10);
        const division = view.getUint16(12);
        const EOT = [0xFF, 0x2F, 0x00];
        const chunks = [];
        let pos = 8 + headerLen;
        while (pos < src.length) {
            if (pos + 8 > src.length) {
                break;
            }
            const tag = String.fromCharCode(...src.slice(pos, pos + 4));
            const declaredLen = view.getUint32(pos + 4);
            const dataStart = pos + 8;
            const dataEnd = dataStart + declaredLen;
            if (tag !== 'MTrk') {
                const end = Math.min(dataEnd, src.length);
                chunks.push({ tag, data: src.slice(pos, end), repaired: false });
                pos = dataEnd;
                continue;
            }
            const trackNum = chunks.filter(c => c.tag === 'MTrk').length + 1;
            const available = Math.min(declaredLen, src.length - dataStart);
            const trackData = src.slice(dataStart, dataStart + available);
            const last3 = trackData.slice(-3);
            const hasEOT = last3[0] === 0xFF && last3[1] === 0x2F && last3[2] === 0x00;
            if (hasEOT && available === declaredLen) {
                chunks.push({ tag, data: trackData, repaired: false });
            } else {
                let repairedData;
                if (available < declaredLen) {
                    const missing = declaredLen - available;
                    const last2 = trackData.slice(-2);
                    if (last2[0] === 0xFF && last2[1] === 0x2F) {
                        repairedData = new Uint8Array(trackData.length + 1);
                        repairedData.set(trackData);
                        repairedData[trackData.length] = 0x00;
                    } else {
                        repairedData = new Uint8Array(trackData.length + 3);
                        repairedData.set(trackData);
                        repairedData.set(EOT, trackData.length);
                    }
                } else {
                    repairedData = new Uint8Array(trackData.length + 3);
                    repairedData.set(trackData);
                    repairedData.set(EOT, trackData.length);
                }
                chunks.push({ tag, data: repairedData, repaired: true });
            }
            pos = dataEnd;
        }
        const fixedNtrks = chunks.filter(c => c.tag === 'MTrk').length;
        const totalSize = 14 + chunks.reduce((acc, c) => acc + 8 + c.data.length, 0);
        const out = new Uint8Array(totalSize);
        const outView = new DataView(out.buffer);
        out.set([0x4D, 0x54, 0x68, 0x64], 0);
        outView.setUint32(4, 6);
        outView.setUint16(8, format);
        outView.setUint16(10, fixedNtrks);
        outView.setUint16(12, division);
        let outPos = 14;
        for (const chunk of chunks) {
            const tagBytes = chunk.tag.split('').map(c => c.charCodeAt(0));
            out.set(tagBytes, outPos);
            outView.setUint32(outPos + 4, chunk.data.length);
            out.set(chunk.data, outPos + 8);
            outPos += 8 + chunk.data.length;
        }
        const repairedCount = chunks.filter(c => c.repaired).length;
        return out.buffer;
    }


    #trimMidiEvents() {
        if (!this.events || this.events.length === 0) return;
        let firstNoteTick = Infinity;
        let lastNoteTick = 0;
        this.events.forEach(track => {
            track.forEach(event => {
                if (event.name === 'Note on' || event.name === 'Note off') {
                    if (event.tick < firstNoteTick) firstNoteTick = event.tick;
                    if (event.tick > lastNoteTick) lastNoteTick = event.tick;
                }
            });
        });
        if (firstNoteTick === Infinity) return;
        const allSetupEventsBeforeFirstNote = [];
        this.events.forEach((track, trackIdx) => {
            track.forEach(event => {
                const isSetupEvent = event.name === 'Program Change' ||
                    event.name === 'Controller Change' ||
                    event.name === 'Pitch Bend' ||
                    event.name === 'Set Tempo';
                if (event.tick < firstNoteTick && isSetupEvent) {
                    allSetupEventsBeforeFirstNote.push({ event, trackIdx });
                }
            });
        });
        const uniqueSetupByTrack = Object.fromEntries(this.events.map((_, idx) => [idx, []]));
        const globalUniqueKeys = new Set();
        for (let i = allSetupEventsBeforeFirstNote.length - 1; i >= 0; i--) {
            const { event, trackIdx } = allSetupEventsBeforeFirstNote[i];
            const channel = event.channel !== undefined ? event.channel : `track-${trackIdx}`;
            let key = null;
            if (event.name === 'Program Change') {
                key = `pc:${channel}`;
            } else if (event.name === 'Controller Change') {
                key = `cc:${channel}:${event.number}`;
            } else if (event.name === 'Pitch Bend') {
                key = `pb:${channel}`;
            } else if (event.name === 'Set Tempo') {
                key = 'tempo';
            }
            if (key) {
                if (!globalUniqueKeys.has(key)) {
                    globalUniqueKeys.add(key);
                    const clonedEvent = { ...event, tick: 0 };
                    uniqueSetupByTrack[trackIdx].push(clonedEvent);
                }
            }
        }
        const trimmedEvents = this.events.map((track, trackIdx) => {
            const newTrack = [];
            track.forEach(event => {
                const isSetupEvent = event.name === 'Program Change' ||
                    event.name === 'Controller Change' ||
                    event.name === 'Pitch Bend' ||
                    event.name === 'Set Tempo';
                const isTextOrKaraoke = event.name === 'Text Event' ||
                    event.name === 'Lyric Event' ||
                    event.name === 'Track Name' ||
                    event.name === 'Karaoke Event';

                if (event.tick < firstNoteTick) {
                    if (!isSetupEvent && (isTextOrKaraoke || trackIdx === 0)) {
                        event.tick = 0;
                        newTrack.push(event);
                    }
                } else {
                    event.tick = event.tick - firstNoteTick;
                    const maxAllowedTick = lastNoteTick - firstNoteTick;
                    if (event.tick > maxAllowedTick) {
                        event.tick = maxAllowedTick;
                    }
                    newTrack.push(event);
                }
            });
            const filteredTrackSetup = uniqueSetupByTrack[trackIdx] || [];
            return [...filteredTrackSetup, ...newTrack].sort((a, b) => a.tick - b.tick);
        });
        this.events = trimmedEvents;
        this.totalTicks = lastNoteTick - firstNoteTick;
        if (typeof this.computeTempoMap === 'function') this.computeTempoMap();
    }


    async #extractLyrics() {
        if (this.#lyrics) return this.#lyrics;
        const structure = { language: "", title: "", paragraphs: [] };
        let bestTrack = null;
        let maxTextEventsCount = 0;
        this.events.forEach(track => {
            const textEventsInTrack = track.filter(e =>
                e.name === 'Text Event' ||
                e.name === 'Lyric Event' ||
                e.name === 'Cue Point' ||
                e.name === 'Marker' ||
                e.name === 'Track Name'
            );
            const realLyricsCount = textEventsInTrack.filter(e => {
                const textStr = e.string || e.text || "";
                return textStr && !textStr.startsWith('@');
            }).length;
            if (realLyricsCount > maxTextEventsCount) {
                maxTextEventsCount = realLyricsCount;
                bestTrack = textEventsInTrack;
            }
        });

        if (!bestTrack || bestTrack.length === 0) return structure;
        const allTextEvents = bestTrack.sort((a, b) => a.tick - b.tick);
        let paragraphs = [];
        let currentParaLines = [];
        let currentLineBlocks = [];
        let lastBlockTick = 0;
        allTextEvents.forEach(event => {
            let text = this.#decodeKaraokeString(event.string || "");
            if (!text) return;
            if (/^Track-/i.test(text.trim()) ||
                /^Piste/i.test(text.trim()) ||
                text.trim() === "" ||
                (event.tick === 0 && text.length > 20)) {
                return;
            }
            if (text.startsWith('@L')) {
                structure.language = text.substring(2).trim();
                return;
            }
            if (text.startsWith('@T')) {
                structure.title += (structure.title ? ' / ' : '') + text.substring(2).trim();
                return;
            }
            if (text.startsWith('@') ||
                text.startsWith('(') ||
                text.startsWith('PART') ||
                /^\d+\s+\d+/.test(text.trim())) {
                return;
            }
            if (/^(Verse|Chorus|Bridge|Break|Intro|End\.)/i.test(text.trim())) {
                const isExplicitCut = text.startsWith('\\') || text.startsWith('/');
                const isNaturalTransition = currentLineBlocks.length === 0 || (event.tick - lastBlockTick > 500);
                if (isExplicitCut || isNaturalTransition) {
                    if (currentLineBlocks.length > 0) {
                        currentParaLines.push({ tick: currentLineBlocks[0].tick, blocks: currentLineBlocks });
                        currentLineBlocks = [];
                    }
                    if (currentParaLines.length > 0) {
                        while (currentParaLines.length > 4) {
                            const linesToPush = currentParaLines.splice(0, 4);
                            paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
                        }
                        if (currentParaLines.length > 0) {
                            paragraphs.push({ tick: currentParaLines[0].tick, lines: currentParaLines });
                            currentParaLines = [];
                        }
                    }
                }
                return;
            }
            let forceNewLine = false;
            if (currentLineBlocks.length > 0) {
                const prevBlock = currentLineBlocks[currentLineBlocks.length - 1];
                const prevText = prevBlock.text;
                const currentTrimmed = text.trimLeft();
                if (currentTrimmed.length > 0) {
                    const isCapitalized = /^[A-Z]/.test(currentTrimmed) || /^'[A-Z]/.test(currentTrimmed);
                    const prevIsCapitalized = /^[A-Z]/.test( prevText.trim()) || /^'[A-Z]/.test( prevText.trim());
                    if (isCapitalized && !prevText.endsWith(' ') && prevText.trim() != 'o' && !prevIsCapitalized) {
                        if (event.tick > lastBlockTick) {
                            forceNewLine = true;
                        }
                    }
                    if (text.startsWith('"') && prevText.endsWith('"')) {
                        forceNewLine = true;
                    }
                    if (text.startsWith('"') && (prevText.endsWith(')') || prevText.endsWith(')"'))) {
                        forceNewLine = true;
                    }
                    if (currentTrimmed.startsWith('"') && prevText.trimRight().endsWith(')')) {
                        forceNewLine = true;
                    }
                }
            }
            const isNewParagraphMarker = text.startsWith('\\');
            const isNewLineMarker = text.startsWith('/') || forceNewLine;
            if (isNewParagraphMarker || isNewLineMarker) {
                if (text.startsWith('\\') || text.startsWith('/')) {
                    text = text.substring(1);
                }
            }
            text = text.replace(/[\r\n]/g, "");
            let isTimeGapTrigger = false;
            if (lastBlockTick > 0 && event.tick > lastBlockTick) {
                const secondsSilence = this.ticksToSeconds(lastBlockTick, event.tick);
                if (secondsSilence > 2.5) {
                    isTimeGapTrigger = true;
                }
            }
            const currentLineChars = currentLineBlocks.reduce((sum, b) => sum + b.text.length, 0);
            const isWordLimitTrigger = currentLineChars + text.length > this.#opts.maxCharPerLine;

            if (isNewLineMarker || isNewParagraphMarker || isTimeGapTrigger || isWordLimitTrigger) {
                if (currentLineBlocks.length > 0) {
                    currentParaLines.push({ tick: currentLineBlocks[0].tick, blocks: currentLineBlocks });
                    currentLineBlocks = [];
                }
                if (currentParaLines.length > 0) {
                    if (isNewParagraphMarker || isTimeGapTrigger) {
                        while (currentParaLines.length > 4) {
                            const linesToPush = currentParaLines.splice(0, 4);
                            paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
                        }
                        if (currentParaLines.length > 0) {
                            paragraphs.push({ tick: currentParaLines[0].tick, lines: currentParaLines });
                            currentParaLines = [];
                        }
                    }
                    else if (currentParaLines.length >= 6) {
                        const linesToPush = currentParaLines.splice(0, 4);
                        paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
                    }
                }
            }
            if (text.length > 0) {
                currentLineBlocks.push({ text: text, tick: event.tick });
                lastBlockTick = event.tick;
            }
        });
        if (currentLineBlocks.length > 0) {
            currentParaLines.push({
                tick: currentLineBlocks[0].tick,
                blocks: currentLineBlocks
            });
        }
        while (currentParaLines.length > 4) {
            const linesToPush = currentParaLines.splice(0, 4);
            paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
        }
        if (currentParaLines.length > 0) {
            paragraphs.push({ tick: currentParaLines[0].tick, lines: currentParaLines });
        }
        paragraphs = paragraphs.filter(p => {
            return !(p.lines.length == 1 && p.lines[0].blocks.length == 1 && (['intro', 'outro', 'sfx', 'solo', 'chorus', 'verse', 'bridge', 'break', 'end'].includes(p.lines[0].blocks[0].text.toLowerCase().trim())));
        });
        if(paragraphs.length <= 2) paragraphs = [];
        structure.paragraphs = paragraphs;
        this.#lyrics = structure;
        return structure;
    }


    async #generateKaraokeFrames() {
        const lyrics = await this.#extractLyrics();
        if (!lyrics.paragraphs.length) {
            this.#haveLyrics = false;
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: `<span class="karaoke-intro"></span>`,
                name: 'Karaoke Event',
                type: 'intro',
                tick: 0,
                channel: MidiAudioPlayer.KARAOKE_CHANNEL,
            });
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL] = this.events[MidiAudioPlayer.KARAOKE_CHANNEL].sort((a, b) => a.tick - b.tick);
            return;
        }
        this.#haveLyrics = true;
        this.#title = lyrics.title;
        let lastFrameEnd = 0;
        const delayTicks = this.secondsToTicks(this.#opts.karaokeDelay);
        const threeSecondsInTicks = this.secondsToTicks(3);
        const fiveSecondsInTicks = this.secondsToTicks(5);
        const sevenSecondsInTicks = this.secondsToTicks(7);
        const tenSecondsInTicks = this.secondsToTicks(10);
        const allBlocksInSong = [];
        lyrics.paragraphs.forEach((p, pIdx) => {
            p.lines.forEach((l, lIdx) => {
                l.blocks.forEach(b => {
                    allBlocksInSong.push({
                        block: b,
                        lineIdx: lIdx,
                        paraIdx: pIdx,
                        paragraph: p,
                        fastLinesText: p.lines.map(li => li.blocks.map(bl => bl.text).join(''))
                    });
                });
            });
        });
        const paragraphDisplayTicks = [];
        lyrics.paragraphs.forEach((p, pIdx) => {
            let paragraphDisplayTick = this.getTickBeforeSeconds(p.tick, 5);
            if (paragraphDisplayTick < lastFrameEnd)
                paragraphDisplayTick = lastFrameEnd + ((p.tick - lastFrameEnd) / 2);
            if (pIdx === 0 && paragraphDisplayTick < 20)
                paragraphDisplayTick = 20;
            paragraphDisplayTicks[pIdx] = paragraphDisplayTick;
            const fastLinesText = p.lines.map(li => li.blocks.map(b => b.text).join(''));
            const initialHTML = fastLinesText
                .map(lineText => `<span class="karaoke-coming">${lineText}</span>`)
                .join('<br/>');
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: initialHTML,
                name: 'Karaoke Event',
                type: 'lyric',
                tick: paragraphDisplayTick,
                channel: MidiAudioPlayer.KARAOKE_CHANNEL,
            });
            if (p.lines.length > 0) {
                const lastLine = p.lines[p.lines.length - 1];
                if (lastLine.blocks.length > 0)
                    lastFrameEnd = lastLine.blocks[lastLine.blocks.length - 1].tick;
            }
        });
        const firstParaDisplayTick = paragraphDisplayTicks[0] || 0;
        if (firstParaDisplayTick > 25) {
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: `<span class="karaoke-clear"></span>`,
                name: 'Karaoke Event',
                type: 'clear',
                tick: 5,
                channel: MidiAudioPlayer.KARAOKE_CHANNEL,
            });
        }
        allBlocksInSong.forEach((current, index) => {
            const currentBlock = current.block;
            const currentLineIdx = current.lineIdx;
            const currentParaIdx = current.paraIdx;
            const p = current.paragraph;
            const fastLinesText = current.fastLinesText;
            const generateHTML = (forceAllPlayedOnActiveLine = false) => {
                return p.lines.map((li, liIdx) => {
                    if (liIdx < currentLineIdx)
                        return `<span class="karaoke-played">${fastLinesText[liIdx]}</span>`;
                    if (liIdx > currentLineIdx)
                        return `<span class="karaoke-coming">${fastLinesText[liIdx]}</span>`;
                    let lineHTML = '';
                    li.blocks.forEach(block => {
                        let className = 'coming';
                        if (forceAllPlayedOnActiveLine || block.tick < currentBlock.tick)
                            className = 'played';
                        else if (block.tick === currentBlock.tick)
                            className = 'playing';
                        lineHTML += `<span class="karaoke-${className}">${block.text}</span>`;
                    });
                    return lineHTML;
                }).join('<br>');
            };
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: generateHTML(false),
                name: 'Karaoke Event',
                type: 'lyric',
                tick: currentBlock.tick - delayTicks,
                channel: MidiAudioPlayer.KARAOKE_CHANNEL,
            });
            const next = allBlocksInSong[index + 1];
            if (next) {
                const tickDifference = next.block.tick - currentBlock.tick;
                if (tickDifference > threeSecondsInTicks) {
                    let targetCleanupTick = currentBlock.tick + threeSecondsInTicks;
                    let targetClearTick = currentBlock.tick + sevenSecondsInTicks;
                    let shouldAddClear = tickDifference > tenSecondsInTicks && currentParaIdx > 0;
                    if (next.paraIdx !== currentParaIdx) {
                        const nextParaDisplayTick = paragraphDisplayTicks[next.paraIdx];
                        if (targetCleanupTick >= nextParaDisplayTick)
                            targetCleanupTick = nextParaDisplayTick - 1;
                        if (shouldAddClear)
                            if (targetClearTick >= nextParaDisplayTick || (nextParaDisplayTick - targetClearTick) < threeSecondsInTicks)
                                shouldAddClear = false;
                    }
                    if (targetCleanupTick > currentBlock.tick) {
                        this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                            text: generateHTML(true),
                            name: 'Karaoke Event',
                            type: 'lyric',
                            tick: targetCleanupTick - delayTicks,
                            channel: MidiAudioPlayer.KARAOKE_CHANNEL,
                        });
                    }
                    if (shouldAddClear && targetClearTick > targetCleanupTick) {
                        this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                            text: `<span class="karaoke-clear"></span>`,
                            name: 'Karaoke Event',
                            type: 'clear',
                            tick: targetClearTick - delayTicks,
                            channel: MidiAudioPlayer.KARAOKE_CHANNEL,
                        });
                    }
                }
            }
            lastFrameEnd = currentBlock.tick;
        });
        if ((this.totalTicks - lastFrameEnd) > this.secondsToTicks(5)) {
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: `<span class="karaoke-clear"></span>`,
                name: 'Karaoke Event',
                type: 'clear',
                tick: lastFrameEnd + this.secondsToTicks(5),
                channel: MidiAudioPlayer.KARAOKE_CHANNEL,
            });
        } else {
            this.events[MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: `<span class="karaoke-clear"></span>`,
                name: 'Karaoke Event',
                type: 'clear',
                tick: this.totalTicks - 1,
                channel: MidiAudioPlayer.KARAOKE_CHANNEL,
            });
        }
        this.events[MidiAudioPlayer.KARAOKE_CHANNEL] = this.events[MidiAudioPlayer.KARAOKE_CHANNEL].sort((a, b) => a.tick - b.tick);
    }


    async #detectKaraokeVocalChannel() {
        const lyrics = await this.#extractLyrics();
        if (!lyrics || !lyrics.paragraphs || lyrics.paragraphs.length === 0) return null;
        const textTicks = [];
        lyrics.paragraphs.forEach(p => {
            p.lines.forEach(l => {
                l.blocks.forEach(b => {
                    textTicks.push(b.tick);
                });
            });
        });
        if (textTicks.length === 0) return null;
        const channelsToScan = Object.keys(this.#channels)
            .map(Number)
            .filter(chan => chan !== 10);
        let bestChannel = null;
        let maxMatches = 0;
        const tickTolerance = this.division ? (this.division / 4) : 24;
        channelsToScan.forEach(channel => {
            let matches = 0;
            const channelNotes = this.events.flatMap(track =>
                track.filter(event =>
                    event.name === 'Note on' &&
                    event.velocity > 0 &&
                    event.channel === channel
                )
            );
            textTicks.forEach(textTick => {
                const hasMatchingNote = channelNotes.some(note => Math.abs(note.tick - textTick) <= tickTolerance);
                if (hasMatchingNote) matches++;
            });
            if (matches > maxMatches) {
                maxMatches = matches;
                bestChannel = channel;
            }
        });
        const confidenceThreshold = textTicks.length * 0.20;
        return maxMatches >= confidenceThreshold ? bestChannel : null;
    }


    #decodeKaraokeString(str) {
        if (!str) return '';
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff;
        const decoder = new TextDecoder('windows-1252');
        let decoded = decoder.decode(bytes);
        decoded = decoded.replace(/ÿ/g, '');
        decoded = decoded.replace(/’/g, "'");
        decoded = decoded.replace(/`/g, "'");
        return decoded;
    }


    #sendKaraokeFrame(type = 'clear', text = '') {
        const html = `<span class="karaoke-${type}">${text.replace(/\s\/\s/g, '<br>')}</span>`;
        if(this.#opts.karaoke) {
            if(type == 'title') queueMicrotask(() => this.triggerPlayerEvent('karaoke', { type: type, title: text, html: html}));
            else queueMicrotask(() => this.triggerPlayerEvent('karaoke', { type: type, html: html}));
        }
    }


    async #log(str, err = false) {
        queueMicrotask(() => this.triggerPlayerEvent('logs', str));
    }

}