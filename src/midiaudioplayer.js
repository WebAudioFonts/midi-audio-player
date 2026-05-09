import MidiPlayer from 'midi-player-js';
import WebAudioFontPlayer from "./webaudiofontplayer";
import DefaultPreset from "./presets/defaultpreset.json";


class MidiAudioPlayer extends MidiPlayer.Player {

	#audioCtx = null;
	#audioPlayer = null;
	#activeNotes = null;

	#opts = {
		preset: DefaultPreset,
        volume: 0.012,
		onEndFile: null
	};


	constructor(opts = {}) {
        super(event => this.#handleMidiPipeline(event));
		this.#opts = { ...this.#opts, ...opts };
        this.#activeNotes = new Map();
		this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		this.#audioPlayer = new WebAudioFontPlayer(this.#audioCtx, this.#opts.preset);
        this.on('endOfFile', async () => {
			await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 1)));
			await this.#endOfFile();
        });
	}


	async play(content = null) {
		if(content) await this.#load(content);
        await this.#audioCtx.resume();
		await super.play();
	}
    

	async pause() {
        await super.pause();
        await this.#clearActiveNotes();
        await this.#audioPlayer.cancelQueue();
	}

	
    async stop() {
        await super.stop();
        await this.#clearActiveNotes();
        await this.#audioPlayer.cancelQueue();
	}


	async #endOfFile() {
		if(typeof this.#opts.onEndFile == 'function') await this.#opts.onEndFile();
	}


    async #handleMidiPipeline(event) {
        if (event.name !== 'Note on' && event.name !== 'Note off') return;
        if (!this.isPlaying()) return;
        if (event.noteNumber === undefined) return;

        const now = this.#audioCtx.currentTime;

        switch (event.name) {
            case 'Note on':
                if (event.velocity > 0 && event.velocity <= 127) {
                    this.#stopNotePipe(event.noteNumber);
                    const vol = (event.velocity / 127) * this.#opts.volume;
                    const envelope = this.#audioPlayer.queueWaveTable(0, event.noteNumber, 2, vol);
                    this.#activeNotes.set(event.noteNumber, envelope);
                } else {
                    this.#stopNotePipe(event.noteNumber);
                }
                break;

            case 'Note off':
                this.#stopNotePipe(event.noteNumber);
                break;
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


	async #load(content) {
		if(this.isPlaying()) this.stop();
		this.#clearActiveNotes();
		await this.loadArrayBuffer(content);
	}

}

export { MidiAudioPlayer };