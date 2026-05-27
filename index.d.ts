/**
 * @module midi-audio-player
 *
 * TypeScript declarations for `midi-audio-player` v2.0.0
 *
 * A lightweight browser-based MIDI playback engine built on top of the Web Audio API
 * and WebAudioFont. Supports real MIDI file playback, karaoke, EQ, reverb, waveform
 * generation, per-channel volume control, and a rich event system.
 *
 * @author Maxime Larrivée-Roy
 * @license MIT
 * @see https://github.com/ZmotriN/midi-audio-player
 */


// ---------------------------------------------------------------------------
// Catalog & preset types
// ---------------------------------------------------------------------------

/**
 * A single instrument preset entry from the WebAudioFont catalog.
 * Preset IDs are used to identify and load specific instrument sounds.
 *
 * @example
 * // A preset object returned by findPreset()
 * {
 *   id: "0000_FluidR3_GM_sf2_file",
 *   category: "Piano",
 *   instrument: "Acoustic Grand Piano",
 *   program: 1
 * }
 */
export interface PresetInfo {
    /** Unique identifier for this preset (matches the remote JSON filename, e.g. `"0000_FluidR3_GM_sf2_file"`). */
    id: string;
    /** The top-level category name (e.g. `"Piano"`, `"Strings"`, `"Percussion"`). */
    category: string;
    /** The instrument name within the category (e.g. `"Acoustic Grand Piano"`). */
    instrument: string;
    /** The General MIDI program number (1–128) this preset belongs to. `-1` indicates percussion (channel 10). */
    program: number;
}

/**
 * A single instrument entry within a catalog category.
 */
export interface CatalogInstrument {
    /** Instrument name (e.g. `"Acoustic Grand Piano"`). */
    name: string;
    /** General MIDI program number (1–128). `-1` for percussion. */
    program: number;
    /** All available presets (sound banks) for this instrument. */
    presets: PresetInfo[];
}

/**
 * A top-level category grouping multiple instruments.
 *
 * @example
 * { name: "Piano", instruments: [ ... ] }
 */
export interface CatalogCategory {
    /** Category name (e.g. `"Piano"`, `"Guitar"`, `"Synth Lead"`). */
    name: string;
    /** All instruments belonging to this category. */
    instruments: CatalogInstrument[];
}

/**
 * The full preset catalog fetched from the WebAudioFont endpoint.
 * Contains all available instruments and their sound bank presets.
 */
export interface Catalog {
    /** ISO 8601 timestamp of the last catalog update. Used internally to invalidate the IndexedDB cache. */
    updatedAt: string;
    /** All instrument categories available from the endpoint. */
    categories: CatalogCategory[];
}


// ---------------------------------------------------------------------------
// Song setup
// ---------------------------------------------------------------------------

/**
 * A serializable snapshot of the current song's channel configuration.
 * Can be saved and passed back to `load()` to restore the exact same
 * preset and volume settings for a given MIDI file.
 *
 * @example
 * const setup = await player.getSongSetup();
 * // Later, restore it:
 * await player.load('song.mid', setup);
 */
export interface SongSetup {
    /**
     * Maps each MIDI channel number (as a string key) to a preset ID.
     *
     * @example { "1": "0000_FluidR3_GM_sf2_file", "10": "12800_SoundBlasterOld_sf2" }
     */
    presets: Record<string, string>;
    /**
     * Maps each MIDI channel number (as a string key) to a volume multiplier in the `[0, 1]` range.
     *
     * @example { "1": 0.8, "2": 1.0, "10": 0.6 }
     */
    volumes: Record<string, number>;
}


// ---------------------------------------------------------------------------
// EQ
// ---------------------------------------------------------------------------

/**
 * A map of EQ band frequencies (in Hz) to their current gain values (in dB).
 * The 10 bands cover the full audible spectrum: `32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384`.
 *
 * @example
 * // Boost bass, cut mids
 * player.setEQ({ 32: 6, 64: 4, 128: 0, 256: -2, 512: -2, 1024: 0, 2048: 0, 4096: 0, 8192: 0, 16384: 0 });
 */
export type EQGains = Partial<Record<32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384, number>>;

/**
 * Named EQ presets available via `setEQPreset()`.
 *
 * | Preset       | Description                                       |
 * |--------------|---------------------------------------------------|
 * | `flat`       | All bands at 0 dB (default)                       |
 * | `bass`       | Boosted low frequencies                           |
 * | `treble`     | Boosted high frequencies                          |
 * | `vocal`      | Mid-range boost, suited for voice clarity         |
 * | `loudness`   | Loudness compensation curve (bass + treble boost) |
 * | `classical`  | Gentle wide curve for orchestral content          |
 * | `jazz`       | Warm low-end with slight high presence            |
 * | `electronic` | Enhanced bass and air frequencies                 |
 */
export type EQPresetName = 'flat' | 'bass' | 'treble' | 'vocal' | 'loudness' | 'classical' | 'jazz' | 'electronic';


// ---------------------------------------------------------------------------
// Constructor options
// ---------------------------------------------------------------------------

/**
 * Configuration options passed to the `MidiAudioPlayer` constructor.
 * All fields are optional; unspecified values fall back to their defaults.
 *
 * ---
 * **Custom preset endpoint**
 *
 * By default, presets are fetched from the official WebAudioFont CDN
 * (`https://webaudiofonts.github.io/presets/`). You can host your own presets
 * by deploying the [sf2-json template](https://github.com/WebAudioFonts/sf2-json)
 * and pointing `endpoint` to your own server.
 *
 * @example
 * const player = new MidiAudioPlayer({
 *   endpoint: 'https://my-cdn.example.com/presets/',
 *   volume: 0.8,
 *   reverb: 0.2,
 *   karaoke: true,
 *   eqPreset: 'jazz',
 *   preferred: ['FluidR3_GM'],
 *   presets: ['0000_FluidR3_GM_sf2_file'],
 * });
 */
export interface MidiAudioPlayerOptions {
    /**
     * Base URL of the WebAudioFont preset endpoint.
     * Must end with a trailing slash and expose a `catalog.json` file
     * along with individual preset JSON files.
     *
     * You can deploy your own endpoint using the sf2-json template:
     * @see https://github.com/WebAudioFonts/sf2-json
     *
     * @default "https://webaudiofonts.github.io/presets/"
     */
    endpoint?: string;

    /**
     * Master output volume, in the `[0, 1]` range. Applied on a logarithmic curve.
     * @default 0.6
     */
    volume?: number;

    /**
     * Convolution reverb wet level, in the `[0, 1]` range.
     * `0` disables reverb entirely; `1` is full wet signal.
     * @default 0.3
     */
    reverb?: number;

    /**
     * Whether to cache the preset catalog and downloaded presets in
     * `sessionStorage` and `IndexedDB` respectively.
     * Significantly reduces network requests on repeat visits.
     * @default true
     */
    localCache?: boolean;

    /**
     * When `true`, a random preset is selected for each MIDI program/channel
     * rather than the first available one. Useful for creative variation.
     * @default false
     */
    presetRandom?: boolean;

    /**
     * Enables karaoke mode. When active, the player parses MIDI text/lyric
     * events, generates timed HTML lyric frames, and emits `karaoke` events.
     * @default false
     */
    karaoke?: boolean;

    /**
     * Time offset (in seconds) to apply to karaoke lyric frames.
     * Positive values display lyrics earlier than the corresponding note.
     * @default 0
     */
    karaokeDelay?: number;

    /**
     * When `true`, automatically detects the vocal channel (the MIDI channel
     * whose notes align most closely with the lyric events) and mutes it.
     * Useful for sing-along applications.
     * @default false
     */
    muteExpression?: boolean;

    /**
     * Maximum number of characters per karaoke line before a line break is forced.
     * @default 48
     */
    maxCharPerLine?: number;

    /**
     * Initial EQ preset to apply on instantiation.
     * @see EQPresetName
     * @default "flat"
     */
    eqPreset?: EQPresetName;

    /**
     * Ordered list of preferred sound bank suffixes (e.g. `["FluidR3_GM", "Aspirin"]`).
     * When resolving a preset automatically or randomly, the player will favor
     * presets whose IDs end with one of these strings, in order.
     * @default []
     */
    preferred?: string[];

    /**
     * A list of preset IDs to pre-register in the program-to-preset map.
     * These presets will override automatic preset selection for the
     * corresponding General MIDI program number when a song is loaded.
     * @default []
     */
    presets?: string[];
}


// ---------------------------------------------------------------------------
// Event payloads
// ---------------------------------------------------------------------------

/**
 * Payload emitted with the `computed` event after a MIDI file is parsed
 * and analyzed but before audio presets are fully loaded.
 */
export interface ComputedEventData {
    /** Song title extracted from MIDI metadata, if present. */
    title: string;
    /** Whether the MIDI file contains parseable lyric/karaoke data. */
    karaoke: boolean;
    /** Current song tempo in BPM. */
    tempo: number;
    /** MIDI ticks-per-quarter-note (PPQ/division). */
    division: number;
    /** Total playback duration in seconds. */
    duration: number;
    /** Audio sample rate of the Web Audio context (typically 44100 or 48000 Hz). */
    sampleRate: number;
    /** Total number of MIDI ticks in the song. */
    totalTicks: number;
    /** Total number of MIDI events across all tracks. */
    totalEvents: number;
    /**
     * Map of active MIDI channel numbers to their General MIDI program numbers.
     * Channel 10 is always `-1` (percussion).
     *
     * @example { "1": 1, "2": 40, "10": -1 }
     */
    channels: Record<string, number>;
}

/**
 * Payload emitted with the `karaoke` event for each lyric frame.
 * The HTML content uses predictable CSS class names for easy styling.
 *
 * **CSS classes injected:**
 * - `.karaoke-playing` — the syllable currently being sung
 * - `.karaoke-played`  — syllables already passed
 * - `.karaoke-coming`  — upcoming syllables
 * - `.karaoke-clear`   — empty frame (silence / between paragraphs)
 * - `.karaoke-intro`   — emitted before the song starts or after stop
 * - `.karaoke-title`   — emitted when a title is detected in the MIDI metadata
 */
export interface KaraokeEventData {
    /** Frame type. `"lyric"` carries displayable text; others signal state transitions. */
    type: 'lyric' | 'clear' | 'intro' | 'title';
    /** The MIDI tick at which this frame should be displayed. */
    tick: number;
    /** HTML string ready to inject into a DOM element. */
    html: string;
    /** Only present when `type === "title"`. Raw title text (no HTML). */
    title?: string;
}

/**
 * Payload emitted with the `channelState` event whenever any channel
 * transitions between active (playing notes) and idle (silent).
 *
 * Keys are MIDI channel numbers as strings; values are `true` when the
 * channel has one or more active (sustained) notes, `false` otherwise.
 *
 * @example
 * player.on('channelState', (states) => {
 *   // { "1": true, "2": false, "10": true }
 * });
 */
export type ChannelStateData = Record<string, boolean>;


// ---------------------------------------------------------------------------
// Event map
// ---------------------------------------------------------------------------

/**
 * All events that can be subscribed to via `player.on(event, handler)`.
 */
export interface MidiAudioPlayerEvents {
    /**
     * Emitted for internal log messages throughout the loading and playback lifecycle.
     * Useful for debugging preset downloads, MIDI parsing, and playback state.
     *
     * @example
     * player.on('logs', (message) => console.log('[MidiPlayer]', message));
     */
    logs: (message: string) => void;

    /**
     * Emitted once the MIDI file has been parsed and analyzed (tick map, channels,
     * duration computed), but *before* audio presets finish downloading.
     * Use this event to update your UI with song metadata immediately.
     *
     * @example
     * player.on('computed', ({ title, duration, channels }) => {
     *   console.log(`"${title}" — ${duration.toFixed(1)}s`);
     * });
     */
    computed: (data: ComputedEventData) => void;

    /**
     * Emitted once all audio presets for the current song have finished
     * downloading and the player is fully ready to play.
     *
     * The payload is a map of MIDI program numbers to their resolved preset objects.
     *
     * @example
     * player.on('presetsLoaded', (instruments) => {
     *   console.log('Ready. Instruments loaded:', Object.keys(instruments).length);
     * });
     */
    presetsLoaded: (instruments: Record<string, object>) => void;

    /**
     * Emitted when playback reaches the end of the MIDI file.
     * No payload is provided.
     *
     * @example
     * player.on('endOfFile', () => player.stop());
     */
    endOfFile: () => void;

    /**
     * Emitted for each timed lyric frame when karaoke mode is enabled.
     * The payload contains an HTML string ready for direct DOM injection,
     * with CSS classes marking syllable states.
     *
     * @example
     * const lyricsEl = document.getElementById('lyrics');
     * player.on('karaoke', ({ html }) => { lyricsEl.innerHTML = html; });
     */
    karaoke: (data: KaraokeEventData) => void;

    /**
     * Emitted whenever any MIDI channel transitions between active (playing notes)
     * and idle (no active notes). Fires only when the state actually changes.
     *
     * Useful for animating per-channel indicators in a visualizer.
     *
     * @example
     * player.on('channelState', (states) => {
     *   Object.entries(states).forEach(([ch, active]) => {
     *     document.getElementById(`ch-${ch}`)?.classList.toggle('active', active);
     *   });
     * });
     */
    channelState: (data: ChannelStateData) => void;
}


// ---------------------------------------------------------------------------
// Main class
// ---------------------------------------------------------------------------

/**
 * # MidiAudioPlayer
 *
 * A full-featured MIDI playback engine for the browser.
 *
 * Extends the `midi-player-js` Player and wires it to a Web Audio signal chain
 * (EQ → compressor → convolution reverb → analyser → destination) with
 * WebAudioFont instrument presets served from a remote CDN (or your own endpoint).
 *
 * ---
 *
 * ## Quick start
 *
 * ```ts
 * import MidiAudioPlayer from 'midi-audio-player';
 *
 * const player = new MidiAudioPlayer({ volume: 0.7, reverb: 0.2 });
 *
 * player.on('computed', ({ title, duration }) => {
 *   console.log(`Loaded: "${title}" (${duration.toFixed(1)}s)`);
 * });
 *
 * player.on('endOfFile', () => player.stop());
 *
 * await player.play('https://example.com/song.mid');
 * ```
 *
 * ---
 *
 * ## Custom preset endpoint
 *
 * By default, presets are streamed from `https://webaudiofonts.github.io/presets/`.
 * You can self-host using the sf2-json deployment template:
 * @see https://github.com/WebAudioFonts/sf2-json
 *
 * ```ts
 * const player = new MidiAudioPlayer({ endpoint: 'https://my-cdn.example.com/presets/' });
 * ```
 */
declare class MidiAudioPlayer {

    // -----------------------------------------------------------------------
    // Static constants
    // -----------------------------------------------------------------------

    /** Default preset CDN endpoint URL. Overridable via `opts.endpoint`. */
    static readonly ENDPOINT: string;

    /**
     * Sentinel value (`-1`) used as the program number for the percussion channel (channel 10).
     * Percussion presets are identified by `program === MidiAudioPlayer.DEFAULT_PRESET`.
     */
    static readonly DEFAULT_PRESET: number;

    /** Reference gain constant applied to note velocity calculations. */
    static readonly REFERENCE_GAIN: number;

    /** The MIDI channel index (0-based internally) reserved for karaoke event injection. */
    static readonly KARAOKE_CHANNEL: number;


    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * Creates a new `MidiAudioPlayer` instance and initializes the Web Audio
     * signal chain (EQ → compressor/limiter → reverb → analyser → destination).
     *
     * Must be called in response to a user gesture (click, keydown, etc.) because
     * the Web Audio context requires user activation in modern browsers.
     *
     * @param opts - Optional configuration. All fields have sensible defaults.
     *
     * @example
     * const player = new MidiAudioPlayer({
     *   volume: 0.8,
     *   reverb: 0.25,
     *   eqPreset: 'classical',
     *   karaoke: true,
     *   preferred: ['FluidR3_GM'],
     * });
     */
    constructor(opts?: MidiAudioPlayerOptions);


    // -----------------------------------------------------------------------
    // Getters / Setters
    // -----------------------------------------------------------------------

    /**
     * Resolves and returns the full preset catalog.
     * Equivalent to calling `getCatalog()`.
     * @see getCatalog
     */
    get catalog(): Promise<Catalog>;

    /**
     * Returns the internal map of WebAudioFont player instances, keyed by MIDI channel number.
     * Each value is an active `WebAudioFontPlayer` instance managing a single channel.
     */
    get channels(): Record<string, object>;

    /**
     * Returns a snapshot of current channel activity states.
     * Keys are MIDI channel numbers; values are `true` when the channel
     * has one or more active (sustaining) notes.
     *
     * @example
     * const states = player.channelStates;
     * // { "1": true, "2": false, "10": false }
     */
    get channelStates(): Record<string, boolean>;

    /**
     * Gets the current master volume level (`[0, 1]`).
     */
    get volume(): number;

    /**
     * Sets the master output volume. Clamped to `[0, 1]`.
     * Applied with a logarithmic curve for perceptually linear control.
     */
    set volume(vol: number);

    /**
     * Returns the per-channel volume multipliers, keyed by MIDI channel number.
     * Default is `1.0` for all channels. Set via `setChannelVolume()`.
     */
    get volumes(): Record<string, number>;

    /**
     * Gets the current reverb wet level (`[0, 1]`).
     */
    get rever(): number;

    /**
     * Sets the convolution reverb wet mix level. Clamped to `[0, 1]`.
     * `0` = fully dry, `1` = fully wet.
     */
    set rever(rev: number);

    /**
     * Gets the `muteExpression` flag.
     * When `true`, the detected vocal channel is silenced during playback.
     */
    get muteExpression(): boolean;

    /**
     * Enables or disables vocal channel muting.
     * Effective only when `karaoke` option is active.
     */
    set muteExpression(val: boolean);

    /**
     * Returns the array of EQ band frequencies (in Hz) supported by the equalizer.
     * Always `[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384]`.
     */
    get eqFrequencies(): number[];

    /**
     * Returns the current EQ state as a frequency-to-gain map.
     * Equivalent to calling `getEQ()`.
     * @see getEQ
     */
    get eq(): EQGains;


    // -----------------------------------------------------------------------
    // EQ methods
    // -----------------------------------------------------------------------

    /**
     * Returns the current gain (in dB) for all 10 EQ bands.
     *
     * @returns A map of frequency → current gain value in dB.
     *
     * @example
     * const gains = player.getEQ();
     * console.log(gains[32]); // e.g. 6 (dB)
     */
    getEQ(): EQGains;

    /**
     * Sets one or more EQ band gains. Only the provided frequencies are updated;
     * bands not included in `gains` are left unchanged.
     *
     * Gain values are in dB, typically in the `-12` to `+12` range.
     *
     * @param gains - Partial map of frequency (Hz) → gain (dB).
     *
     * @example
     * // Boost bass, reduce high mids
     * player.setEQ({ 32: 6, 64: 4, 1024: -2, 2048: -3 });
     */
    setEQ(gains: EQGains): void;

    /**
     * Applies a named EQ preset, replacing all 10 band gains at once.
     *
     * @param name - A named preset. One of: `flat`, `bass`, `treble`, `vocal`,
     *               `loudness`, `classical`, `jazz`, `electronic`.
     *
     * @throws {Error} If `name` does not match a known preset.
     *
     * @example
     * player.setEQPreset('jazz');
     */
    setEQPreset(name: EQPresetName): void;

    /**
     * Overrides the volume multiplier for a specific MIDI channel.
     * Takes effect immediately and persists for the duration of the current song.
     *
     * @param channel - MIDI channel number (1–16; use `10` for percussion).
     * @param volume  - Volume multiplier in the `[0, 1]` range.
     *                  `0` fully silences the channel; `1` restores full level.
     *
     * @example
     * player.setChannelVolume(10, 0);   // Mute percussion
     * player.setChannelVolume(1, 0.5);  // Half volume on channel 1
     */
    setChannelVolume(channel: number, volume: number): void;


    // -----------------------------------------------------------------------
    // Preset / catalog methods
    // -----------------------------------------------------------------------

    /**
     * Searches the catalog for a preset by its string ID and returns full metadata.
     *
     * @param id - A preset ID string (e.g. `"0000_FluidR3_GM_sf2_file"`).
     * @returns The matching `PresetInfo` object, or `null` if not found.
     *
     * @example
     * const info = await player.findPreset('0000_FluidR3_GM_sf2_file');
     * // { id: '0000_...', category: 'Piano', instrument: 'Acoustic Grand Piano', program: 1 }
     */
    findPreset(id: string): Promise<PresetInfo | null>;

    /**
     * Fetches and returns the full WebAudioFont preset catalog.
     * Results are cached in `sessionStorage` (when `localCache` is enabled)
     * to avoid redundant network requests across page loads.
     *
     * @returns The catalog object containing all instrument categories and presets.
     *
     * @example
     * const catalog = await player.getCatalog();
     * console.log(catalog.categories.length); // e.g. 17
     */
    getCatalog(): Promise<Catalog>;

    /**
     * Returns all top-level instrument categories from the catalog.
     * Shorthand for `(await getCatalog()).categories`.
     *
     * @example
     * const categories = await player.getCategories();
     * categories.forEach(c => console.log(c.name));
     */
    getCategories(): Promise<CatalogCategory[]>;

    /**
     * Loads a preset onto a specific MIDI channel at runtime, replacing whatever
     * instrument was automatically assigned during `load()`.
     *
     * @param presetId - The preset ID string to load.
     * @param channel  - The target MIDI channel number.
     *
     * @throws {Error} If `presetId` does not exist in the catalog.
     *
     * @example
     * // Replace channel 1 with a Steinway piano preset
     * await player.loadPreset('0000_Steinway_sf2_file', 1);
     */
    loadPreset(presetId: string, channel: number): Promise<void>;


    // -----------------------------------------------------------------------
    // Song loading
    // -----------------------------------------------------------------------

    /**
     * Loads a MIDI file and prepares the player for playback.
     *
     * Accepts a URL string, an `ArrayBuffer`, or a Base64-encoded string.
     * If the MIDI file is malformed, an automatic repair pass is attempted before failing.
     *
     * An optional `setup` argument (a URL string or a pre-fetched `SongSetup` object)
     * can be provided to restore previously saved channel presets and volumes.
     *
     * This method:
     * 1. Stops current playback and clears the active note registry.
     * 2. Parses and optionally repairs the MIDI buffer.
     * 3. Resolves and downloads all required instrument presets.
     * 4. Trims leading/trailing silence.
     * 5. Generates karaoke frames (if `opts.karaoke` is `true`).
     * 6. Emits `computed` (early) and `presetsLoaded` (once audio is ready).
     *
     * @param content - The MIDI source: a URL string, an `ArrayBuffer`, or a Base64 string.
     * @param setup   - Optional. A `SongSetup` object or URL to a JSON file,
     *                  to restore preset/volume overrides.
     *
     * @example
     * // Load from URL with a saved setup
     * await player.load('https://example.com/song.mid', savedSetup);
     *
     * // Load from an ArrayBuffer (e.g. from a file input)
     * const buffer = await file.arrayBuffer();
     * await player.load(buffer);
     */
    load(content: string | ArrayBuffer, setup?: string | SongSetup): Promise<void>;

    /**
     * Returns a serializable snapshot of the current song's channel configuration,
     * including the active preset ID for each channel and per-channel volume levels.
     *
     * The returned object can be stored and passed back to `load()` to reproduce
     * the exact same instrument/volume mapping for the same MIDI file.
     *
     * @returns A `SongSetup` object with `presets` and `volumes` maps.
     *
     * @example
     * const setup = await player.getSongSetup();
     * localStorage.setItem('my-song-setup', JSON.stringify(setup));
     */
    getSongSetup(): Promise<SongSetup>;

    /**
     * Returns the list of preset IDs currently registered in the training preset map.
     * These are the presets that override automatic selection when a song is loaded.
     *
     * @example
     * const ids = await player.getTrainingPresets();
     * console.log(ids); // ['0000_FluidR3_GM_sf2_file', ...]
     */
    getTrainingPresets(): Promise<string[]>;


    // -----------------------------------------------------------------------
    // Playback control
    // -----------------------------------------------------------------------

    /**
     * Starts or resumes playback.
     *
     * If `content` is provided, the MIDI file is loaded first (equivalent to
     * calling `load(content)` then `play()`). Handles Web Audio context
     * resumption from suspended state automatically.
     *
     * @param content - Optional MIDI source to load before playing.
     * @returns `true` if playback started successfully, `false` if the Audio
     *          context could not be resumed (usually due to browser autoplay policy).
     *
     * @example
     * // Load and play in one call
     * await player.play('https://example.com/song.mid');
     *
     * // Resume after a pause
     * await player.play();
     */
    play(content?: string | ArrayBuffer | null): Promise<boolean>;

    /**
     * Pauses playback at the current position.
     * Kills the reverb tail and cancels all queued audio to prevent lingering sound.
     * Call `play()` to resume from the same position.
     *
     * @example
     * await player.pause();
     */
    pause(): Promise<void>;

    /**
     * Stops playback and resets the position to the beginning.
     * Kills the reverb tail, clears active notes, and (if karaoke mode is on)
     * emits an `intro` karaoke frame.
     *
     * @returns The player instance, for chaining.
     *
     * @example
     * await player.stop();
     */
    stop(): Promise<MidiAudioPlayer>;

    /**
     * Seeks to a specific position (in seconds) in the current song.
     * Works whether the player is playing or paused.
     * Resumes playback if it was active before the seek.
     *
     * @param seconds - Target position in seconds. Must be within `[0, songTime]`.
     * @returns The player instance, for chaining.
     *
     * @throws {string} The seconds value if it falls outside the valid range.
     *
     * @example
     * await player.skipToSeconds(30); // Jump to 0:30
     */
    skipToSeconds(seconds: number): Promise<MidiAudioPlayer>;


    // -----------------------------------------------------------------------
    // Metering & visualization
    // -----------------------------------------------------------------------

    /**
     * Returns the real-time normalized output amplitude as a value in `[0, 1]`.
     * Computed from the Web Audio `AnalyserNode`'s frequency data.
     *
     * Suitable for driving VU meters, level indicators, or animation loops.
     *
     * @example
     * function updateMeter() {
     *   const level = player.getRealTimeVolume();
     *   meterEl.style.width = `${level * 100}%`;
     *   requestAnimationFrame(updateMeter);
     * }
     * updateMeter();
     */
    getRealTimeVolume(): number;

    /**
     * Returns the remaining playback time in seconds (from current position to end).
     *
     * @example
     * const remaining = player.getSongTimeRemaining();
     * console.log(`${remaining.toFixed(1)}s remaining`);
     */
    getSongTimeRemaining(): number;

    /**
     * Generates an SVG waveform representation of the loaded MIDI file,
     * based on note velocities and channel expression/volume controllers.
     *
     * The returned SVG has the class `midiaudioplayer-waveform` and uses
     * a `<path>` element — no fill color is set by default, allowing full
     * CSS customization via `stroke` and `fill`.
     *
     * @param samples - Number of horizontal data points. Higher values produce
     *                  finer detail at the cost of processing time.
     *                  @default 1000
     * @returns An SVG string, or an empty string if no MIDI data is loaded.
     *
     * @example
     * const svg = await player.generateWaveformSVG(800);
     * document.getElementById('waveform').innerHTML = svg;
     */
    generateWaveformSVG(samples?: number): Promise<string>;


    // -----------------------------------------------------------------------
    // Event system
    // -----------------------------------------------------------------------

    /**
     * Registers an event handler for the specified player event.
     *
     * @param event   - The event name. See `MidiAudioPlayerEvents` for all events.
     * @param handler - The callback function. Signature varies per event.
     *
     * @example
     * player.on('endOfFile', () => console.log('Song finished'));
     * player.on('karaoke', ({ html }) => (lyricsEl.innerHTML = html));
     * player.on('channelState', (states) => console.log(states));
     */
    on<K extends keyof MidiAudioPlayerEvents>(event: K, handler: MidiAudioPlayerEvents[K]): void;


    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Closes all WebAudioFont player instances and shuts down the Web Audio context.
     * Call this when you are done with the player to release audio hardware resources.
     *
     * The instance cannot be used after this call. Create a new `MidiAudioPlayer`
     * if you need to resume playback.
     *
     * @example
     * await player.close();
     */
    close(): Promise<void>;
}

export default MidiAudioPlayer;
