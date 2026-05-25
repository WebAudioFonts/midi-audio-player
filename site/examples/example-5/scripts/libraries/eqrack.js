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
				console.log(p);
			});

		});

		const bands = create('div', 'eqrack__bands');
		const eqs = this.#player.eq;
		Object.keys(eqs).forEach(freq => {
			// console.log(freq);
			this.#bands[freq] = new EQBand(bands, freq, eqs[freq]);


		});


		this.#parent.replaceChildren(presets, bands);
	}


}