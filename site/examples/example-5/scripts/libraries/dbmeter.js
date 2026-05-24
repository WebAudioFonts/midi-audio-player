export default class DBMeter {

	#parent = null;
	#lastvol = 0;


	constructor(parent) {
		this.#parent = parent;

		this.#create();
	}


	async #create() {
		let svg = `<svg viewBox="0 0 40 400"><rect class="meter__background" width="40" height="400" rx="2"/><rect class="meter__inner" width="28" height="380" x="6" y="10" rx="1"/><g class="meter__bands">`;
		for(let i = 20; i <= 40; i += 10) svg += `<rect class="meter__band" width="24" height="4" x="8" y="${i}" rx="1"/>`;
		for(let i = 55; i <= 85; i += 10) svg += `<rect class="meter__band" width="24" height="4" x="8" y="${i}" rx="1"/>`;
		for(let i = 100; i <= 380; i += 10) svg += `<rect class="meter__band" width="24" height="4" x="8" y="${i}" rx="1"/>`;
		svg += `</g></svg>`;
		await new Promise(requestAnimationFrame);
		this.#parent.innerHTML = svg;
	}


	async update(vol) {
		const indic = Math.ceil(vol * 36);
		if(indic == this.#lastvol) return;

		this.#parent.querySelectorAll(`.meter__band:nth-last-child(-n + ${indic})`).forEach(async elm => elm.style.opacity = 1);
		this.#parent.querySelectorAll(`.meter__band:nth-last-child(n + ${indic + 1})`).forEach(async elm => elm.style.opacity = 0.3);


		this.#lastvol = indic;
	}



}