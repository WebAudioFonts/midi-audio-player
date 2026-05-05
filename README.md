# midi-audio-player

A lightweight JavaScript MIDI audio player built on top of the Web Audio API using WebAudioFont. This package enables playback of MIDI files directly in the browser with minimal setup and no heavy dependencies.

## Features

* MIDI file playback in modern browsers
* Built on the Web Audio API
* Uses WebAudioFont for instrument rendering
* Lightweight and dependency-minimal
* Simple programmatic API
* CLI tool for instrument/font handling

## Installation

```bash
npm install midi-audio-player
```

## Usage

### Basic Example

```js
import MidiAudioPlayer from 'midi-audio-player';

const player = new MidiAudioPlayer({
	volume: 0.02,
	instrument: instrumentData,
	onEndFile: async () => await this.playNextSong()
});

await player.play('binarycontent');
```

### Control Playback

```js
player.play();
player.pause();
player.stop();
```

### Working with AudioContext

Due to browser autoplay restrictions, you should ensure that your AudioContext is resumed after a user interaction:

## CLI

This package provides a CLI tool for downloading and converting WebAudioFont assets. You need to provide a WebAudioFont ID dans the json file for the destination.

```bash
webaudiofont 0000_Chaos_sf2_file dest/instrument.json
```

You can find instruments here: [WebAudioFont](https://github.com/surikov/webaudiofont#catalog-of-instruments)

## Browser Compatibility

Requires a modern browser with support for:

* Web Audio API
* ES Modules

## Limitations

* First playback may be delayed if the AudioContext is not initialized properly
* Depends on WebAudioFont instrument quality and availability
* Not intended for high-fidelity or professional audio rendering


## License

[LICENCE](LICENCE)

## Author

Maxime Larrivée-Roy

## Repository

[https://github.com/ZmotriN/midi-audio-player](https://github.com/ZmotriN/midi-audio-player)

---

If you want, I can also tailor it more toward your Phaser/game use case or add a section comparing it with other MIDI solutions (which can be useful positioning-wise).
