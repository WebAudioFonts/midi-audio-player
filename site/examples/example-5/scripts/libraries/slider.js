export default class Slider {

	#parent = null;
	#volume = null;
	#callback = null;

	#input = null;
	#svg = null;


	constructor(parent, volume = 0.7, callback = null) {
		this.#parent = parent;
		this.#volume = volume;
		this.#callback = callback;
		this.#create();
	}
	

	async #create() {
		let svg = `<input type="range" class="dbvol__input" min="0" max="100" title="Volume" vertical>`;
		svg += `<svg viewBox="0 0 40 400" class="dbvol__svg" style="--y: 180px;"><rect class="dbvol__background" width="40" height="400" rx="4" /><rect class="dbvol__inner" width="4" height="360" x="18" y="20" rx="2" /><g class="dbvol__slider"><rect width="30" height="15" x="5" fill="#333" rx="2" /><path fill="#444" d="M5 2h30v11H5z" /><path d="M5 7h30v1H5z" /><path fill-opacity=".3" d="M5 15h30v3H5z" /></g><path stroke="#444" d="M32 20h4m-4 180h4m-4 180h4" /></svg>`;
		await new Promise(requestAnimationFrame);
		this.#parent.innerHTML = svg;
		this.#input = this.#parent.querySelector('.dbvol__input');
		this.#svg = this.#parent.querySelector('.dbvol__svg');
		this.#input.value = 100 - (this.#volume * 100);
		this.#input.addEventListener('input', (e) => {
			const val = 100 - parseFloat(e.target.value);
			const railTop = 20;
			const railBottom = 365;
			const travelDistance = railBottom - railTop;
			const newY = railBottom - (val / 100 * travelDistance);
			this.#svg.style.setProperty('--y', newY + 'px');
			this.#callback(val / 100);
		});
		this.#input.dispatchEvent(new Event('input', {bubbles: true, cancelable: false }));
	}





} 