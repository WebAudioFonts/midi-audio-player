# midi-audio-player

A lightweight JavaScript MIDI audio player built on top of the Web Audio API using WebAudioFont. This package enables playback of MIDI files directly in the browser with minimal setup and no heavy dependencies.

## Features

* MIDI file playback in modern browsers
* Built on the Web Audio API
* Uses WebAudioFont for preset rendering
* Lightweight and dependency-minimal
* Simple programmatic API
* Auto-repair corrupted midi files
* Trim silence at start and end
* Karaoke support
* Over 3000+ free instrument presets
* Possibility to have your own presets endpoint with sf2-json deployement template
* Convolution reverb
* 10 bands compressor
* 10 bands equalizer
* Per channel volume
* SVG Waveform
* Realtime amplitude analyzer
* FUll midi protocol support (pitchbend etc...)


## Installation

```bash
npm install midi-audio-player
```

## Usage

### Basic Example

```js
import MidiAudioPlayer from 'midi-audio-player';

const response = await fetch('/examples/data/iwillsurvive.mid');
const buffer = await response.arrayBuffer();

const player = new MidiAudioPlayer({
  preset: presetData,
  volume: 0.02,
  onEndFile: async () => await this.playNextSong()
});

player.play(buffer);
```

### Control Playback

```js
player.play();
player.pause();
player.stop();
```

### Working with AudioContext

Due to browser autoplay restrictions, you should ensure that your AudioContext is resumed after a user interaction.

## CLI

This package provides a CLI tool for downloading and converting WebAudioFont assets. You need to provide a WebAudioFont ID and the json file for the destination.

```bash
webaudiofont 0000_Chaos_sf2_file dest/preset.json
```

You can find presets here: [WebAudioFont](https://github.com/surikov/webaudiofont#catalog-of-instruments)

## Browser Compatibility

Requires a modern browser with support for:

* Web Audio API
* ES Modules

## Limitations

* First playback may be delayed if the AudioContext is not initialized properly
* Depends on WebAudioFont instrument quality and availability
* Not intended for high-fidelity or professional audio rendering


## License

[LICENCE](LICENSE)

## Author

Maxime Larrivée-Roy

## Repository

[https://github.com/ZmotriN/midi-audio-player](https://github.com/ZmotriN/midi-audio-player)

