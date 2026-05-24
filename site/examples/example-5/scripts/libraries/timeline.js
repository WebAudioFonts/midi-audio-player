export default class Timeline {

	#parent = null;
	#callback = null;
	#duration = null;
	#container = null;
	#progress = null;
	#pointer = null;
	#click = null;

	#lasttime = 0;
	#lastmeter = 0;
	#lastprogress = 0;

	constructor(parent, callback) {
		this.#parent = parent;
		this.#callback = callback;
		this.#container = this.#parent.create('div', 'waveform__container');
		this.#progress = this.#parent.create('div', 'waveform__progress');
		this.#pointer = this.#progress.create('div', 'waveform__pointer')
		this.#click = this.#parent.create('div', 'waveform__click');
		this.#click.addEventListener('click', async evt => {
			const rect = evt.currentTarget.getBoundingClientRect();
			const x = evt.clientX - rect.left;
			const ratio = x / rect.width;
			const finalRatio = Math.max(0, Math.min(1, ratio));
			await this.#callback(this.#duration * finalRatio);
		});
	}


	async load(svg, duration) {
		this.#duration = duration;
		this.#container.innerHTML = svg;
		await this.reset();
	}


	async reset() {
		await new Promise(requestAnimationFrame);
		this.#parent.style.setProperty('--duration', `"${formatTime(this.#duration)}"`);
		this.#parent.style.setProperty('--progress', `0%`);
		this.#parent.style.setProperty('--time', `"0:00"`);
	}


	async update(time) {
		if(time != this.#lasttime) {
			const progress = (time / this.#duration * 100).toFixed(1);
			if(progress != this.#lastprogress) {
				await new Promise(requestAnimationFrame);
				this.#parent.style.setProperty('--progress', `${progress}%`);
				this.#parent.style.setProperty('--time', `"${formatTime(time)}"`);
				this.#lastprogress = progress;
			}
			this.#lasttime = time;
		}
	}

	



}