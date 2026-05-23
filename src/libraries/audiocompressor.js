export default class AudioCompressor {
    #input = null;
    #output = null;
    #audioCtx = null;
    #limiter = null;
    #analyser = null;
    #reverbNode = null;
    #reverbWet = null;
    #currentReverbLevel = 0;
    #eqBands = new Map();
    
    static #EQ_FREQUENCIES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
    static #EQ_Q = new Map([
        [32,    0.7],
        [64,    0.8],
        [128,   0.9],
        [256,   1.0],
        [512,   1.1],
        [1024,  1.2],
        [2048,  1.4],
        [4096,  1.6],
        [8192,  1.8],
        [16384, 2.0],
    ]);
    

    constructor(audioCtx, volume, reverb) {
        this.#audioCtx = audioCtx;
        this.#input = this.#audioCtx.createGain();
        let lastNode = this.#input;
        const frequencies = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
        frequencies.forEach(freq => {
            lastNode = this.#bandEqualizer(lastNode, freq);
            const label = freq < 1000 ? freq : (freq / 1024) + 'k';
            this[`band${label}`] = lastNode;
        });

        this.#currentReverbLevel = reverb;
        this.#reverbNode = this.#audioCtx.createConvolver();
        this.#reverbWet = this.#audioCtx.createGain();
        this.#reverbWet.gain.setValueAtTime(reverb, this.#audioCtx.currentTime);
        this.#generateImpulseResponse(1.5, 2.0);

        this.#limiter = this.#audioCtx.createDynamicsCompressor();
        this.#limiter.threshold.setValueAtTime(-10.0, this.#audioCtx.currentTime);
        this.#limiter.ratio.setValueAtTime(20, this.#audioCtx.currentTime);
        this.#limiter.attack.setValueAtTime(0.001, this.#audioCtx.currentTime);
        this.#limiter.release.setValueAtTime(0.1, this.#audioCtx.currentTime);
        this.#limiter.knee.setValueAtTime(0, this.#audioCtx.currentTime);

        this.#analyser = this.#audioCtx.createAnalyser();
        this.#analyser.fftSize = 256;
        this.#analyser.smoothingTimeConstant = 0.6;

        this.#output = this.#audioCtx.createGain();
        this.#output.gain.setValueAtTime(volume, this.#audioCtx.currentTime);

        lastNode.connect(this.#output);
        this.#output.connect(this.#limiter);
        this.#output.connect(this.#reverbNode);
        this.#reverbNode.connect(this.#reverbWet);
        this.#limiter.connect(this.#analyser);
        this.#reverbWet.connect(this.#analyser);
        this.#analyser.connect(this.#audioCtx.destination);
    }

    get analyser() { return this.#analyser || null; }
    get input() { return this.#input; }
    get reverb() { return this.#currentReverbLevel; }
    set reverb(value) {
        this.#currentReverbLevel = Math.max(0, Math.min(1, value));
        this.#reverbWet.gain.setTargetAtTime(this.#currentReverbLevel, this.#audioCtx.currentTime, 0.1);
    }
    get masterVolume() { return this.#output.gain.value; }
    set masterVolume(value) {
        const linearValue = Math.max(0, Math.min(1, value));
        const logVolume = Math.pow(linearValue, 2);
        this.#output.gain.setTargetAtTime(logVolume, this.#audioCtx.currentTime, 0.01);
    }


    killReverbTail() {
        const now = this.#audioCtx.currentTime;
        this.#reverbWet.gain.cancelScheduledValues(now);
        this.#reverbWet.gain.setValueAtTime(0, now);
    }


    restoreReverb() {
        this.reverb = this.#currentReverbLevel;
    }


    /**
     * Applique des gains EQ avec interpolation Bézier cubique entre les bandes.
     *
     * @param {Object} gains  Clés = fréquences Hz (parmi les 10 bandes),
     *                        valeurs = gain en dB [-12 .. +12].
     *                        Les bandes non spécifiées gardent leur valeur courante.
     * @param {number} [smoothTime=0.04]  Constante de lissage WebAudio (secondes).
     *
     * @example
     * // Preset "Basses boostées"
     * eq.setEQ({ 32: 6, 64: 4, 128: 2, 256: 0, 16384: 1 });
     *
     * // Preset "Smiley face"
     * eq.setEQ({ 32: 5, 64: 3, 256: -2, 1024: -4, 2048: -2, 8192: 3, 16384: 5 });
     */
    setEQ(gains, smoothTime = 0.04) {
        const freqs  = AudioCompressor.#EQ_FREQUENCIES;
        const now    = this.#audioCtx.currentTime;
        const MAX_DB = 12;

        const targetGains = new Map();
        for (const freq of freqs) {
            const band = this.#eqBands.get(freq);
            targetGains.set(freq, band.gain);
        }
        for (const [key, val] of Object.entries(gains)) {
            const freq = Number(key);
            if (this.#eqBands.has(freq)) {
                targetGains.set(freq, Math.max(-MAX_DB, Math.min(MAX_DB, val)));
            }
        }

        const smoothedGains = this.#catmullRomSmooth(freqs, targetGains);

        for (const freq of freqs) {
            const band    = this.#eqBands.get(freq);
            const dbValue = smoothedGains.get(freq);
            band.filter.gain.setTargetAtTime(dbValue, now, smoothTime);
            band.gain = dbValue;
        }
    }

    /**
     * Retourne l'état courant de l'EQ.
     * @returns {Object}  { 32: dB, 64: dB, … 16384: dB }
     */
    getEQ() {
        const result = {};
        for (const [freq, band] of this.#eqBands) result[freq] = band.gain;
        return result;
    }

    /**
     * Remet toutes les bandes à 0 dB.
     * @param {number} [smoothTime=0.04]
     */
    resetEQ(smoothTime = 0.04) {
        const flat = {};
        for (const freq of AudioCompressor.#EQ_FREQUENCIES) flat[freq] = 0;
        this.setEQ(flat, smoothTime);
    }

    /**
     * Applique un preset nommé.
     * @param {'flat'|'bass'|'treble'|'vocal'|'loudness'|'classical'|'jazz'|'electronic'} name
     */
    setEQPreset(name) {
        const presets = {
            flat:       { 32:0, 64:0, 128:0, 256:0, 512:0, 1024:0, 2048:0, 4096:0, 8192:0, 16384:0 },
            bass:       { 32:7, 64:6, 128:4, 256:2, 512:0, 1024:-1, 2048:-1, 4096:0, 8192:0, 16384:0 },
            treble:     { 32:0, 64:0, 128:0, 256:0, 512:0, 1024:1, 2048:3, 4096:5, 8192:7, 16384:8 },
            vocal:      { 32:-3, 64:-2, 128:0, 256:2, 512:4, 1024:5, 2048:4, 4096:2, 8192:1, 16384:0 },
            loudness:   { 32:6, 64:4, 128:1, 256:0, 512:-1, 1024:-1, 2048:0, 4096:2, 8192:4, 16384:5 },
            classical:  { 32:4, 64:3, 128:2, 256:0, 512:0, 1024:0, 2048:0, 4096:2, 8192:3, 16384:4 },
            jazz:       { 32:4, 64:3, 128:1, 256:0, 512:-1, 1024:-1, 2048:0, 4096:1, 8192:3, 16384:4 },
            electronic: { 32:6, 64:5, 128:2, 256:-1, 512:-2, 1024:-1, 2048:2, 4096:4, 8192:5, 16384:6 },
        };
        const preset = presets[name];
        if (!preset) throw new Error(`Preset EQ inconnu : "${name}". Disponibles : ${Object.keys(presets).join(', ')}`);
        this.setEQ(preset);
    }


    /**
     * Lisse les gains cibles avec des splines Catmull-Rom en espace log-fréquence.
     * Retourne une nouvelle Map freq→dB avec les mêmes clés.
     * @private
     */
    #catmullRomSmooth(freqs, targetGains) {
        const logFreqs = freqs.map(f => Math.log2(f));
        const gains    = freqs.map(f => targetGains.get(f));
        const n        = freqs.length;

        const tangents = gains.map((_, i) => {
            const prev = i > 0     ? gains[i - 1] : gains[i];
            const next = i < n - 1 ? gains[i + 1] : gains[i];
            const dx   = (i > 0 && i < n - 1)
                ? logFreqs[i + 1] - logFreqs[i - 1]
                : (i === 0 ? logFreqs[1] - logFreqs[0] : logFreqs[n-1] - logFreqs[n-2]);
            return dx === 0 ? 0 : (next - prev) / dx;
        });

        const smoothed = new Map();
        for (let i = 0; i < n; i++) {
            const seg  = Math.min(i, n - 2);
            const t    = i === seg ? 0.0 : 1.0;
            const g    = this.#hermite(
                gains[seg], gains[seg + 1],
                tangents[seg] * (logFreqs[seg + 1] - logFreqs[seg]),
                tangents[seg + 1] * (logFreqs[seg + 1] - logFreqs[seg]),
                t
            );
            smoothed.set(freqs[i], gains[i]);
            void g;
        }

        for (let i = 1; i < n - 1; i++) {
            const prev = smoothed.get(freqs[i - 1]);
            const curr = smoothed.get(freqs[i]);
            const next = smoothed.get(freqs[i + 1]);
            smoothed.set(freqs[i], prev * (1/6) + curr * (4/6) + next * (1/6));
        }

        return smoothed;
    }

    /** Hermite cubique P(t) avec t ∈ [0,1] */
    #hermite(p0, p1, m0, m1, t) {
        const t2 = t * t, t3 = t2 * t;
        return (2*t3 - 3*t2 + 1) * p0
             + (t3 - 2*t2 + t)   * m0
             + (-2*t3 + 3*t2)    * p1
             + (t3 - t2)         * m1;
    }


    #bandEqualizer(from, frequency) {
        const filter = this.#audioCtx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.setValueAtTime(frequency, this.#audioCtx.currentTime);
        filter.gain.setValueAtTime(0, this.#audioCtx.currentTime);
        const q = AudioCompressor.#EQ_Q.get(frequency) ?? 1.0;
        filter.Q.setValueAtTime(q, this.#audioCtx.currentTime);
        this.#eqBands.set(frequency, { filter, gain: 0 });
        from.connect(filter);
        return filter;
    }


    #generateImpulseResponse(duration, decay) {
        const sampleRate = this.#audioCtx.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.#audioCtx.createBuffer(2, length, sampleRate);
        const preDelayTime = 0.015;
        const preDelaySamples = Math.floor(preDelayTime * sampleRate);
        for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const data = impulse.getChannelData(channel);
            let lastValue = 0;
            const channelOffset = channel === 1 ? Math.floor(0.002 * sampleRate) : 0;
            for (let i = 0; i < length; i++) {
                if (i < preDelaySamples) {
                    data[i] = 0;
                    continue;
                }
                const t = (i - preDelaySamples) / sampleRate;
                const envelope = Math.exp(-t * (decay / duration));
                const dampingFactor = Math.max(0.01, 0.2 * Math.exp(-t * 2.5));
                const whiteNoise = (Math.random() * 2 - 1);
                lastValue = (whiteNoise * dampingFactor) + (lastValue * (1 - dampingFactor));
                let sampleValue = lastValue * envelope;
                if (t < 0.04) {
                    if ((i % 123 === 0) || (i % 234 === 0)) {
                        sampleValue += (Math.random() * 2 - 1) * 0.2 * (0.04 - t) / 0.04;
                    }
                }
                if (i + channelOffset < length) data[i + channelOffset] = sampleValue;
                else data[i] = sampleValue;
            }
        }
        this.#reverbNode.buffer = impulse;
    }

}