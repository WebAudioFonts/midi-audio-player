import EQBand from "./eqband";

export default class EQRack {

	#presets = ['flat', 'bass', 'treble', 'vocal', 'loudness', 'classical', 'jazz', 'electronic'];

	#parent = null;
	#player = null;
	#bands = {};

	constructor(parent, player) {
		this.#parent = parent;
		this.#player = player;
		this.#create();
	}


	#create() {
		const presets = create('div', 'eqrack__presets');
		this.#presets.forEach(p => {
			const preset = presets.create('div', 'eqrack__presets__preset', p.charAt(0).toUpperCase() + p.slice(1));
			preset.addEventListener('click', () => {
				this.#player.setEQPreset(p);
				const EQ = this.#player.getEQ();
				Object.keys(EQ).forEach(freq => this.#bands[freq].setDb(EQ[freq], true));
			});
		});
		const bands = create('div', 'eqrack__bands');
		const eqs = this.#player.eq;
		Object.keys(eqs).forEach(freq => this.#bands[freq] = new EQBand(bands, freq, eqs[freq], this));
		this.#parent.replaceChildren(presets, bands);
	}


	setEQ(freq, db) {
		this.#player.setEQ({ [freq]: db });
	}

}