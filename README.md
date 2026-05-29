![logo](https://webaudiofonts.com/images/logo.svg)

# midi-audio-player

**Real MIDI playback in the browser — powered by Web Audio API and WebAudioFont.**

No server. No heavy runtime. Just load a `.mid` or `.kar` file and play it — with reverb, a 10-band EQ, per-channel volume control, karaoke support, and over 3,000 instrument presets.

```ts
const player = new MidiAudioPlayer({ volume: 0.8, reverb: 0.2, eqPreset: 'jazz' });
player.on('endOfFile', () => playAnotherSong());
await player.play('https://example.com/song.mid');
```

---

## Features

- Full General MIDI playback via WebAudioFont instrument presets
- 3,000+ free instrument presets — piano, strings, brass, synths, drums, and more
- Convolution reverb with adjustable wet/dry mix
- 10-band parametric EQ with named presets
- Per-channel volume control
- Karaoke mode — parses MIDI text/lyric events and emits timed HTML frames
- Vocal channel auto-detection and muting
- Auto-repair for corrupted MIDI files
- Leading/trailing silence trimming
- SVG waveform generation
- Real-time amplitude metering
- Full MIDI protocol support (pitch bend, controllers, program change, etc.)
- Works with URLs, `ArrayBuffer`, and Base64 input
- IndexedDB preset cache — presets are only downloaded once
- Bring your own preset endpoint (self-hosted sf2-json deployment)
- ESM-native, compatible with bundlers and vanilla browser environments

---

## Installation

```bash
npm install midi-audio-player
```

Or via CDN (UMD):

```html
<script src="https://cdn.jsdelivr.net/npm/midi-audio-player/dist/midi-audio-player.min.js"></script>
```

---

## Quick Start

```ts
import MidiAudioPlayer from 'midi-audio-player';

const player = new MidiAudioPlayer({
    volume: 0.7,
    reverb: 0.25,
});

player.on('computed', ({ title, duration }) => {
    console.log(`"${title}" — ${duration.toFixed(1)}s`);
});

player.on('presetsLoaded', () => {
    console.log('All instruments ready.');
});

player.on('endOfFile', () => player.stop());

await player.play('https://example.com/song.mid');
```

> **Note:** `MidiAudioPlayer` must be instantiated in response to a user gesture (click, keydown, etc.), as browsers require user activation before creating a `Web Audio` context.

---

## API Reference

### `new MidiAudioPlayer(opts?)`

Creates a new player instance and initializes the full Web Audio signal chain.

| Option | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | `"https://webaudiofonts.github.io/presets/"` | Base URL of the preset endpoint. Must expose `catalog.json` and individual preset JSON files. [See custom endpoint](#custom-preset-endpoint). |
| `volume` | `number` | `0.6` | Master output volume `[0, 1]`. Applied with a logarithmic curve. |
| `reverb` | `number` | `0.3` | Convolution reverb wet level `[0, 1]`. `0` = dry, `1` = full wet. |
| `localCache` | `boolean` | `true` | Cache the catalog in `sessionStorage` and presets in `IndexedDB`. |
| `presetRandom` | `boolean` | `false` | Pick a random preset for each MIDI program instead of the first available. |
| `karaoke` | `boolean` | `false` | Enable karaoke mode. Parses MIDI lyric events and emits timed HTML frames. |
| `karaokeDelay` | `number` | `0` | Advance karaoke frames by this many seconds (lyrics appear earlier). |
| `muteExpression` | `boolean` | `false` | Auto-detect and mute the vocal channel. Requires `karaoke: true`. |
| `maxCharPerLine` | `number` | `48` | Max characters per karaoke line before forcing a line break. |
| `eqPreset` | `EQPresetName` | `"flat"` | EQ preset applied on instantiation. |
| `preferred` | `string[]` | `[]` | Ordered list of preferred sound bank suffixes (e.g. `["FluidR3_GM"]`). |
| `presets` | `string[]` | `[]` | Preset IDs to pre-register in the program map, overriding auto-selection. |

---

### Getters / Setters

| Property | Type | Description |
|---|---|---|
| `volume` | `number` (get/set) | Master output volume `[0, 1]`. |
| `reverb` | `number` (get/set) | Reverb wet mix `[0, 1]`. |
| `muteExpression` | `boolean` (get/set) | Enable/disable vocal channel muting. |
| `eq` | `EQGains` (get) | Current EQ band gains as a frequency → dB map. |
| `eqFrequencies` | `number[]` (get) | The 10 fixed EQ frequencies: `[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384]`. |
| `channels` | `Record<string, object>` (get) | Active `WebAudioFontPlayer` instances, keyed by MIDI channel number. |
| `channelStates` | `Record<string, boolean>` (get) | Snapshot of which channels are currently playing notes. |
| `catalog` | `Promise<Catalog>` (get) | Resolves the full preset catalog. Equivalent to `getCatalog()`. |

---

### EQ

#### `getEQ() → EQGains`

Returns the current gain (in dB) for all 10 EQ bands.

```ts
const gains = player.getEQ();
console.log(gains[32]); // e.g. 6
```

#### `setEQ(gains: EQGains) → void`

Updates one or more EQ bands. Unspecified bands are unchanged.

```ts
player.setEQ({ 32: 6, 64: 4, 1024: -2 });
```

#### `setEQPreset(name: EQPresetName) → void`

Applies a named EQ preset across all 10 bands.

Available presets: `flat`, `bass`, `treble`, `vocal`, `loudness`, `classical`, `jazz`, `electronic`.

```ts
player.setEQPreset('classical');
```

#### `setChannelVolume(channel: number, volume: number) → void`

Overrides the volume multiplier for a specific MIDI channel. Takes effect immediately.

```ts
player.setChannelVolume(10, 0);    // Mute drums
player.setChannelVolume(1, 0.5);   // Half volume on channel 1
```

---

### Preset Catalog

#### `getCatalog() → Promise<Catalog>`

Downloads and returns the full WebAudioFont preset catalog. Cached in `sessionStorage` after the first fetch.

```ts
const catalog = await player.getCatalog();
console.log(catalog.categories.length);
```

#### `getCategories() → Promise<CatalogCategory[]>`

Returns all top-level instrument categories from the catalog.

```ts
const categories = await player.getCategories();
categories.forEach(c => console.log(c.name));
```

#### `findPreset(id: string) → Promise<PresetInfo | null>`

Finds a preset by its string ID and returns its full metadata, including `category`, `instrument`, and `program`.

```ts
const info = await player.findPreset('0000_FluidR3');
// { id: '0000_...', category: 'Piano', instrument: 'Acoustic Grand Piano', program: 1 }
```

#### `loadPreset(presetId: string, channel: number) → Promise<void>`

Replaces the instrument on a specific MIDI channel at runtime.

```ts
await player.loadPreset('0000_Steinway', 1);
```

---

### Song Loading

#### `load(content, setup?) → Promise<void>`

Loads a MIDI file and prepares the audio engine for playback.

**`content`** accepts:
- A URL string — fetched automatically
- An `ArrayBuffer` — e.g. from a `<input type="file">`
- A Base64-encoded MIDI string

**`setup`** (optional) accepts a `SongSetup` object or a URL to a JSON file,
to restore previously saved preset/volume overrides.

The loading sequence is:
1. Stop current playback and clear note registry
2. Parse and repair the MIDI buffer if necessary
3. Resolve and download all required instrument presets
4. Trim leading and trailing silence
5. Generate karaoke frames (if enabled)
6. Emit `computed` early, then `presetsLoaded` when audio is fully ready

```ts
// From URL
await player.load('https://example.com/song.mid');

// From file input
const buffer = await file.arrayBuffer();
await player.load(buffer);

// With a saved setup
await player.load('song.mid', savedSetup);
```

#### `getSongSetup() → Promise<SongSetup>`

Returns a serializable snapshot of the current channel configuration (active preset IDs + per-channel volumes).
Save and pass back to `load()` to reproduce the same instrument mapping.

```ts
const setup = await player.getSongSetup();
localStorage.setItem('setup', JSON.stringify(setup));

// Later:
await player.load('song.mid', JSON.parse(localStorage.getItem('setup')));
```

#### `getTrainingPresets() → Promise<string[]>`

Returns the preset IDs currently registered in the internal program-to-preset override map.

---

### Playback Control

#### `play(content?) → Promise<boolean>`

Starts or resumes playback. If `content` is provided, loads it first.

Returns `true` on success, `false` if the Web Audio context could not be resumed (browser autoplay restriction).

```ts
await player.play();                                  // Resume
await player.play('https://example.com/song.mid');    // Load and play
```

#### `pause() → Promise<void>`

Pauses at the current position. Kills the reverb tail. Resume with `play()`.

#### `stop() → Promise<MidiAudioPlayer>`

Stops playback and resets to the beginning. Returns the player instance for chaining.

#### `skipToSeconds(seconds: number) → Promise<MidiAudioPlayer>`

Seeks to the specified position in seconds. Works during playback and while paused.
Resumes playback automatically if it was active.

```ts
await player.skipToSeconds(45.0);
```

---

### Metering & Visualization

#### `getRealTimeVolume() → number`

Returns the current normalized output amplitude `[0, 1]`, computed from the `AnalyserNode`.
Useful for driving VU meters or visualizers in a `requestAnimationFrame` loop.

```ts
function tick() {
    meter.style.width = `${player.getRealTimeVolume() * 100}%`;
    requestAnimationFrame(tick);
}
tick();
```

#### `getSongTimeRemaining() → number`

Returns the remaining playback time in seconds.

#### `generateWaveformSVG(samples?) → Promise<string>`

Generates an SVG waveform for the currently loaded song, based on note velocities
and expression/volume controller events.

The returned `<svg>` element has the class `midiaudioplayer-waveform`. Its `<path>` carries no default stroke or fill — apply via CSS.

```ts
const svg = await player.generateWaveformSVG(800);
document.getElementById('waveform').innerHTML = svg;
```

```css
.midiaudioplayer-waveform path {
    stroke: #6ee7b7;
    stroke-width: 1.5;
    fill: rgba(110, 231, 183, 0.15);
}
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `samples` | `number` | `1000` | Number of horizontal data points. Higher = finer detail. |

---

### Lifecycle

#### `close() → Promise<void>`

Closes all channel players and the Web Audio context, releasing hardware resources.
The instance cannot be reused after this call.

---

### Events — `player.on(event, handler)`

#### `logs`

Emitted throughout the loading and playback lifecycle with internal status messages.

```ts
player.on('logs', (message) => console.log('[midi]', message));
```

#### `computed`

Emitted after MIDI parsing completes, before presets finish downloading.
Use this to update your UI with song metadata immediately.

```ts
player.on('computed', ({ title, duration, channels, karaoke }) => {
    titleEl.textContent = title || 'Untitled';
    durationEl.textContent = `${duration.toFixed(1)}s`;
});
```

**Payload:**

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Song title from MIDI metadata, or empty string. |
| `karaoke` | `boolean` | Whether the file contains parseable lyric data. |
| `tempo` | `number` | Initial tempo in BPM. |
| `division` | `number` | Ticks per quarter-note (PPQ). |
| `duration` | `number` | Total duration in seconds. |
| `sampleRate` | `number` | Web Audio context sample rate. |
| `totalTicks` | `number` | Total MIDI ticks in the song. |
| `totalEvents` | `number` | Total MIDI events across all tracks. |
| `channels` | `Record<string, number>` | Map of channel number → GM program number. |

#### `presetsLoaded`

Emitted once all instrument presets have been downloaded and the player is fully ready.

```ts
player.on('presetsLoaded', () => playButton.disabled = false);
```

#### `endOfFile`

Emitted when playback reaches the end of the MIDI file.

```ts
player.on('endOfFile', () => playNextSong());
```

#### `karaoke`

Emitted for each timed lyric frame when karaoke mode is enabled.
Inject `html` directly into a DOM element. The HTML uses predictable CSS classes:

| Class | Description |
|---|---|
| `.karaoke-playing` | Syllable currently being sung |
| `.karaoke-played` | Syllables already past |
| `.karaoke-coming` | Upcoming syllables |
| `.karaoke-clear` | Empty frame — silence between paragraphs |
| `.karaoke-intro` | Emitted before song start or after `stop()` |
| `.karaoke-title` | Emitted when a title is detected in the MIDI metadata |

```ts
const lyricsEl = document.getElementById('lyrics');
player.on('karaoke', ({ html }) => { lyricsEl.innerHTML = html; });
```

**Payload:**

| Field | Type | Description |
|---|---|---|
| `type` | `'lyric' \| 'clear' \| 'intro' \| 'title'` | Frame type. |
| `tick` | `number` | MIDI tick at which this frame should appear. |
| `html` | `string` | HTML string ready for DOM injection. |
| `title` | `string?` | Present only when `type === "title"`. |

#### `channelState`

Emitted whenever any MIDI channel transitions between active (sustaining notes) and idle.
Fires only on actual state changes.

```ts
player.on('channelState', (states) => {
    // { "1": true, "2": false, "10": true }
    Object.entries(states).forEach(([ch, active]) => {
        document.getElementById(`ch-${ch}`)?.classList.toggle('active', active);
    });
});
```

---

## Custom Preset Endpoint

By default, presets are served from the official WebAudioFont CDN.
If you want to self-host — to reduce latency, restrict the available preset set,
or curate your own instrument library — you can deploy the
[sf2-json template](https://github.com/WebAudioFonts/sf2-json) and
point the player at your own server:

```ts
const player = new MidiAudioPlayer({
    endpoint: 'https://my-cdn.example.com/presets/',
});
```

The endpoint must expose:
- `catalog.json` — the full instrument catalog
- `{presetId}.json` — one file per preset

---

## Browser Compatibility

Requires a modern browser with:
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (optional, for preset caching)

---

## License

[MIT](LICENSE)

## Author

Maxime Larrivée-Roy

## Repository

[https://github.com/WebAudioFonts/midi-audio-player](https://github.com/WebAudioFonts/midi-audio-player)
