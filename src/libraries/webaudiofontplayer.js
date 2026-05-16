export default class WebAudioFontPlayer {

    #audioCtx = null;
    #compressor = null;
    #preset = null;

    #envelopes = [];
    #afterTime = 0.05;
    #nearZero = 0.000001;

    #bendRange = 2;

    #mainGain = null;
    #sustain = false;
    #pitchBendValue = 8192;
    #notesWaitingForSustain = new Set();
    

    constructor(audioCtx, compressor, preset) {
        this.#audioCtx = audioCtx;
        this.#compressor = compressor;
        this.#preset = preset;

        this.#mainGain = this.#audioCtx.createGain();
        this.#mainGain.gain.setValueAtTime(0.7, this.#audioCtx.currentTime);
        this.#mainGain.connect(this.#compressor.input);

        this.#preset.zones.map(zone => this.#adjustZone(zone));
    }

    get preset() { return this.#preset; }
    set preset(preset) {
        this.#preset = preset;
        this.#preset.zones.map(zone => this.#adjustZone(zone));
    }


    queueWaveTable(when, pitch, duration, volume, slides) {
        if(this.#audioCtx.state === 'suspended') this.#audioCtx.resume().catch(() => { });

        const vol = this.#limitVolume(volume);
        const zone = this.#findZone(pitch);
        if (!zone?.buffer) return null;

        const baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
        const currentBendSemitones = ((this.#pitchBendValue - 8192) / 8192) * this.#bendRange;
        const playbackRate = Math.pow(2, (100.0 * (pitch + currentBendSemitones) - baseDetune) / 1200.0);

        const startWhen = Math.max(when, this.#audioCtx.currentTime);
        let waveDuration = duration + this.#afterTime;

        const loop = zone.loopStart >= 1 && zone.loopStart < zone.loopEnd;
        if (!loop) waveDuration = Math.min(waveDuration, zone.buffer.duration / playbackRate);

        const envelope = this.#findEnvelope();
        this.#setupEnvelope(envelope, zone, vol, startWhen, waveDuration, duration);

        const source = this.#audioCtx.createBufferSource();
        source.buffer = zone.buffer;
        source.playbackRate.setValueAtTime(playbackRate, 0);

        if (slides?.length > 0) {
            source.playbackRate.setValueAtTime(playbackRate, startWhen);
            slides.forEach(s => {
                const newRate = Math.pow(2, (100.0 * (pitch + s.delta) - baseDetune) / 1200.0);
                source.playbackRate.linearRampToValueAtTime(newRate, startWhen + s.when);
            });
        }

        source.loop = loop;
        if (loop) {
            const d = zone.delay ?? 0;
            source.loopStart = zone.loopStart / zone.sampleRate + d;
            source.loopEnd = zone.loopEnd / zone.sampleRate + d;
        }

        source.connect(envelope);
        source.start(startWhen, zone.delay ?? 0);
        source.stop(startWhen + waveDuration);

        envelope.audioBufferSourceNode = source;
        envelope.when = startWhen;
        envelope.duration = waveDuration;

        envelope.pitch = pitch;
        envelope.baseDetune = baseDetune;

        return envelope;
    }


    async cancelQueue() {
        this.#envelopes.forEach(e => {
            e.gain.cancelScheduledValues(0);
            e.gain.setValueAtTime(this.#nearZero, this.#audioCtx.currentTime);
            e.when = -1;
            try { e.audioBufferSourceNode?.disconnect(); } catch (e) { }
        });
    }


    isSustainActive() {
        return this.#sustain;
    }


    registerSustainNote(cancelFn) {
        this.#notesWaitingForSustain.add(cancelFn);
    }



    setPitchBend(value) {
        this.#pitchBendValue = value;
        const normalized = value - 8192;
        const semitones = normalized >= 0 
            ? (normalized / 8191) * this.#bendRange 
            : (normalized / 8192) * this.#bendRange;
        const now = this.#audioCtx.currentTime;
        this.#envelopes.forEach(e => {
            if (e.audioBufferSourceNode && e.when + e.duration > now) {
                const originalPitch = e.pitch;
                const baseDetune = e.baseDetune;
                const totalCents = (originalPitch * 100) - baseDetune + (semitones * 100);
                const newRate = Math.pow(2, totalCents / 1200.0);
                e.audioBufferSourceNode.playbackRate.setTargetAtTime(newRate, now, 0.05);
            }
        });
    }


    setController(number, value) {
        const now = this.#audioCtx.currentTime;
        switch (number) {
            case 7:
                const vol = value / 127;
                this.#mainGain.gain.setTargetAtTime(vol, now, 0.05);
                break;
            case 64:
                this.#sustain = value >= 64;
                if (!this.#sustain) {
                    this.#notesWaitingForSustain.forEach(cancelFn => cancelFn());
                    this.#notesWaitingForSustain.clear();
                }
                break;
        }
    }


    #adjustZone(zone) {
        if (zone.buffer) return Promise.resolve(zone);
        zone.delay = 0;
        if (zone.sample) {
            const binaryString = atob(zone.sample);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            const int16Samples = new Int16Array(bytes.buffer);
            const numSamples = int16Samples.length;
            zone.buffer = this.#audioCtx.createBuffer(1, numSamples, zone.sampleRate);
            const float32Array = zone.buffer.getChannelData(0);
            for (let i = 0; i < numSamples; i++) float32Array[i] = int16Samples[i] / 32768.0;
            this.#applyZoneParameters(zone);
            return zone;
        } else if (zone.file) {
            const decoded = atob(zone.file);
            const uint8Array = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) uint8Array[i] = decoded.charCodeAt(i);
            this.#audioCtx.decodeAudioData(
                uint8Array.buffer,
                audioBuffer => {
                    zone.buffer = audioBuffer;
                    this.#applyZoneParameters(zone);
                    return zone;
                },
                error => {
                    console.error("Audio decoding error:", error);
                    console.warning(this.#preset);
                    return false;
                }
            );
        } else {
            this.#applyZoneParameters(zone);
            return zone;
        }
    };


    #applyZoneParameters(zone) {
        zone.loopStart = this.#numValue(zone.loopStart, 0);
        zone.loopEnd = this.#numValue(zone.loopEnd, 0);
        zone.coarseTune = this.#numValue(zone.coarseTune, 0);
        zone.fineTune = this.#numValue(zone.fineTune, 0);
        zone.originalPitch = this.#numValue(zone.originalPitch, 6000);
        zone.sampleRate = this.#numValue(zone.sampleRate, 44100);
    };


    #setupEnvelope(envelope, zone, volume, when, sampleDuration, noteDuration) {
        envelope.gain.setValueAtTime(this.#noZeroVolume(0), this.#audioCtx.currentTime);

        const duration = Math.min(noteDuration, sampleDuration - this.#afterTime);
        const ahdsr = (zone.ahdsr && zone.ahdsr.length > 0) ? zone.ahdsr : [
            { duration: 0, volume: 1 },
            { duration: duration, volume: 1 }
        ];

        envelope.gain.cancelScheduledValues(when);
        const initialVol = (ahdsr[0]?.volume ?? 1) * volume;
        envelope.gain.setValueAtTime(this.#noZeroVolume(initialVol), when);

        let lastTime = 0;
        let lastVolume = ahdsr[0]?.volume ?? 1;

        for (const stage of ahdsr) {
            const { duration: stageDuration, volume: stageVolume } = stage;
            if (stageDuration <= 0) continue;
            const remainingTime = duration - lastTime;
            if (stageDuration > remainingTime) {
                const ratio = remainingTime / stageDuration;
                const interpolatedVolume = lastVolume + ratio * (stageVolume - lastVolume);
                envelope.gain.linearRampToValueAtTime(
                    this.#noZeroVolume(volume * interpolatedVolume),
                    when + duration
                );
                break;
            }
            lastTime += stageDuration;
            lastVolume = stageVolume;
            envelope.gain.linearRampToValueAtTime(
                this.#noZeroVolume(volume * lastVolume),
                when + lastTime
            );
        }

        envelope.gain.linearRampToValueAtTime(this.#noZeroVolume(0), when + duration + this.#afterTime);
    }


    #findEnvelope(destinationNode) {
        let envelope = this.#envelopes.find(e => e.target === this.#audioCtx.destination && this.#audioCtx.currentTime > e.when + e.duration + 0.001);
        if (envelope) {
            if (envelope.audioBufferSourceNode) {
                try {
                    envelope.audioBufferSourceNode.stop(0);
                    envelope.audioBufferSourceNode.disconnect();
                } catch (e) { }
                envelope.audioBufferSourceNode = null;
            }
        } else {
            envelope = this.#audioCtx.createGain();
            envelope.gain.value = 0;
            const target = destinationNode || this.#mainGain; 
            envelope.target = target;
            envelope.connect(target);
            envelope.cancel = () => {
                if (envelope.when + envelope.duration > this.#audioCtx.currentTime) {
                    envelope.gain.cancelScheduledValues(0);
                    envelope.gain.setTargetAtTime(this.#nearZero, this.#audioCtx.currentTime, 0.1);
                    envelope.when = this.#audioCtx.currentTime + 0.00001;
                    envelope.duration = 0;
                }
            };
            this.#envelopes.push(envelope);
        }
        return envelope;
    }


    #findZone(pitch) {
        const zone = this.#preset.zones.findLast(z => pitch >= z.keyRangeLow && pitch <= z.keyRangeHigh + 1);
        if (zone) this.#adjustZone(zone);
        return zone;
    };

    
    #limitVolume(v) {
        const requestedVolume = v ? 1.0 * v : 0.5;
        return Math.min(requestedVolume, 0.8);
    };


    #noZeroVolume(n) {
        return n > this.#nearZero ? n : this.#nearZero;
    }


    #numValue(a, b) {
        return typeof a === "number" ? a : b;
    }

}
