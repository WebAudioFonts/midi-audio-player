# midi-audio-player

A lightweight MIDI audio player for modern browsers built on top of [MidiPlayerJS](https://grimmdude.com/MidiPlayerJS/docs/) and WebAudioFont.

`midi-audio-player` combines real-time MIDI parsing, browser audio synthesis, playlist management, and utility helpers into a single modern ES module package.

Designed for:

* Browser games
* Interactive music applications
* MIDI playback tools
* Creative coding
* Web-based DAWs and sequencers
* Lightweight audio experiences

---

## Features

* Real MIDI file playback in the browser
* Built on the Web Audio API
* General MIDI instrument support via WebAudioFont
* Lightweight dependency footprint
* Playlist and queue support
* Looping and autoplay
* MIDI event access
* Tempo manipulation
* Track muting and soloing
* Seeking and skipping
* Works with local files, URLs, ArrayBuffers and Base64
* Modern ESM architecture
* Compatible with bundlers and vanilla browser environments

---

## Installation

### npm

```bash
npm install midi-audio-player
```

---

## Quick Start

```js
import MidiAudioPlayer from 'midi-audio-player';

const player = new MidiAudioPlayer();

await player.load('/music/song.mid');

player.play();
```

---

# Basic Usage

## Load and Play

```js
import MidiAudioPlayer from 'midi-audio-player';

const player = new MidiAudioPlayer({
  volume: 0.7,
  loop: false,
  autoplay: false
});

await player.load('/music/song.mid');

player.play();
```

---

## Playlist Example

```js
const playlist = [
  '/music/song1.mid',
  '/music/song2.mid',
  '/music/song3.mid'
];

const player = new MidiAudioPlayer({
  playlist,
  autoplay: true,
  loopPlaylist: true
});
```

---

## Automatically Play the Next Song

```js
const player = new MidiAudioPlayer({
  onEndFile: async () => {
    await player.playNextSong();
  }
});
```

---

## Load From an ArrayBuffer

```js
const response = await fetch('/music/song.mid');
const buffer = await response.arrayBuffer();

await player.loadArrayBuffer(buffer);

player.play();
```

---

## Load From Base64

```js
await player.loadBase64(base64MidiString);

player.play();
```

---

# Browser Usage

```html
<script type="module">
import MidiAudioPlayer from 'https://cdn.jsdelivr.net/npm/midi-audio-player/dist/index.js';

const player = new MidiAudioPlayer();

await player.load('./song.mid');

player.play();
</script>
```

---

# AudioContext Unlocking

Modern browsers require user interaction before audio playback can begin.

You should unlock the `AudioContext` after a user gesture:

```js
document.addEventListener('click', async () => {
  await player.unlockAudioContext();
}, { once: true });
```

---

# API

## Constructor

```js
const player = new MidiAudioPlayer(options);
```

### Options

| Option       | Type     | Default | Description                  |
| ------------ | -------- | ------- | ---------------------------- |
| volume       | number   | 1       | Master volume                |
| autoplay     | boolean  | false   | Automatically start playback |
| loop         | boolean  | false   | Loop current song            |
| playlist     | array    | []      | Playlist of MIDI files       |
| loopPlaylist | boolean  | false   | Loop the playlist            |
| onEndFile    | function | null    | Callback when playback ends  |

---

# Core Methods

## Playback

### play()

```js
player.play();
```

Starts playback.

---

### pause()

```js
player.pause();
```

Pauses playback.

---

### stop()

```js
player.stop();
```

Stops playback and resets the position.

---

### resume()

```js
player.resume();
```

Resumes playback after pausing.

---

## Loading

### load(url)

```js
await player.load('/music/song.mid');
```

Loads a MIDI file from a URL.

---

### loadArrayBuffer(buffer)

```js
await player.loadArrayBuffer(buffer);
```

Loads a MIDI file from an ArrayBuffer.

---

### loadBase64(base64)

```js
await player.loadBase64(base64);
```

Loads a MIDI file from a Base64 string.

---

# Playlist Methods

## playNextSong()

```js
await player.playNextSong();
```

Loads and plays the next track in the playlist.

---

## playPreviousSong()

```js
await player.playPreviousSong();
```

Loads and plays the previous track.

---

## setPlaylist()

```js
player.setPlaylist([
  '/music/song1.mid',
  '/music/song2.mid'
]);
```

Sets the playlist.

---

# Inherited MidiPlayerJS API

`MidiAudioPlayer` extends the `Player` class from [MidiPlayerJS](https://grimmdude.com/MidiPlayerJS/docs/).

All native `MidiPlayerJS` methods, properties and events remain available.

---

## Event Handling

### midiEvent

Triggered for every MIDI event.

```js
player.on('midiEvent', event => {
  console.log(event);
});
```

---

### endOfFile

Triggered when playback reaches the end of the file.

```js
player.on('endOfFile', () => {
  console.log('Playback complete');
});
```

---

### playing

Triggered continuously during playback.

```js
player.on('playing', data => {
  console.log(data);
});
```

---

# Advanced MidiPlayerJS Methods

## skipToTick()

```js
player.skipToTick(10000);
```

Seek to a specific MIDI tick.

---

## skipToPercent()

```js
player.skipToPercent(50);
```

Seek to a percentage position in the song.

---

## getSongTime()

```js
const seconds = player.getSongTime();
```

Returns total song duration in seconds.

---

## getSongTimeRemaining()

```js
const remaining = player.getSongTimeRemaining();
```

Returns remaining playback time.

---

## setTempo()

```js
player.setTempo(140);
```

Overrides the MIDI tempo.

---

## enableTrack()

```js
player.enableTrack(1);
```

Enables playback for a track.

---

## disableTrack()

```js
player.disableTrack(2);
```

Disables playback for a track.

---

## getCurrentTick()

```js
const tick = player.getCurrentTick();
```

Returns the current playback tick.

---

## getCurrentTime()

```js
const time = player.getCurrentTime();
```

Returns the current playback time in seconds.

---

# MIDI Event Example

```js
player.on('midiEvent', event => {
  if (event.name === 'Note on') {
    console.log(
      'Note:',
      event.noteName,
      'Velocity:',
      event.velocity
    );
  }
});
```

---

# Architecture

`midi-audio-player` combines:

* [MidiPlayerJS](https://grimmdude.com/MidiPlayerJS/docs/) for MIDI parsing and timing
* [WebAudioFont](https://github.com/surikov/webaudiofont) for instrument rendering
* Web Audio API for browser audio playback

---

# Compatibility

Supports all modern browsers with Web Audio API support:

* Chrome
* Edge
* Firefox
* Safari
* Mobile Safari
* Chrome for Android

---

# License

MIT

---

# Links

* [GitHub Repository](https://github.com/ZmotriN/midi-audio-player)
* [Live Demo](https://zmotrin.github.io/midi-audio-player/)
* [MidiPlayerJS Documentation](https://grimmdude.com/MidiPlayerJS/docs/)
