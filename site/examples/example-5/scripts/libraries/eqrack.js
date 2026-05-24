export default class EQRack {

	#parent = null;
	#frequencies = null;

	constructor(parent, frequencies, states = {}) {

		this.#parent = parent;
		this.#frequencies = frequencies;
		
		console.log(states);

		
	}


}