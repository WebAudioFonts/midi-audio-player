export default class EQBand {

	#parent = null;
	#rack = null;
	#freq = null;
	#value = 0;

	#input = null;
	#svg = null;
	#init = false;

	constructor(parent, freq, value = 0, rack = null) {
		this.#parent = parent;
		this.#rack = rack;
		this.#freq = freq;
		this.#value = value;
		this.#create();

	}


	#create() {
		const container = create('div', 'eqrack__bands__band');
		let svg = `<input type="range" class="eqrack__bands__band__input" min="-100" max="100" title="Volume" vertical>`;
		svg += `<svg viewBox="0 0 70 360">`;
		svg += `<rect x="0" y="0" width="70" height="360" rx="6" fill="#1e1a22" stroke="#322931" stroke-width="1"/>`;
		svg += `<line x1="35" y1="20" x2="35" y2="310" stroke="#322931" stroke-width="1.5" stroke-linecap="round"/>`;
		svg += `<line x1="29" y1="20"  x2="41" y2="20"  stroke="#322931" stroke-width="0.8"/>`;
		svg += `<line x1="29" y1="55"  x2="41" y2="55"  stroke="#322931" stroke-width="0.8"/>`;
		svg += `<line x1="29" y1="90"  x2="41" y2="90"  stroke="#322931" stroke-width="0.8"/>`;
		svg += `<line x1="27" y1="165" x2="43" y2="165" stroke="#322931" stroke-width="1.2"/>`;
		svg += `<line x1="29" y1="240" x2="41" y2="240" stroke="#322931" stroke-width="0.8"/>`;
		svg += `<line x1="29" y1="275" x2="41" y2="275" stroke="#322931" stroke-width="0.8"/>`;
		svg += `<line x1="29" y1="310" x2="41" y2="310" stroke="#322931" stroke-width="0.8"/>`;
		svg += `<text x="26" y="23"  font-family="'Courier New', monospace" font-size="8" text-anchor="end">+12</text>`;
		svg += `<text x="26" y="58"  font-family="'Courier New', monospace" font-size="8" text-anchor="end">+9</text>`;
		svg += `<text x="26" y="93"  font-family="'Courier New', monospace" font-size="8" text-anchor="end">+6</text>`;
		svg += `<text x="26" y="168" font-family="'Courier New', monospace" font-size="8" text-anchor="end">0</text>`;
		svg += `<text x="26" y="243" font-family="'Courier New', monospace" font-size="8" text-anchor="end">-6</text>`;
		svg += `<text x="26" y="278" font-family="'Courier New', monospace" font-size="8" text-anchor="end">-9</text>`;
		svg += `<text x="26" y="313" font-family="'Courier New', monospace" font-size="8" text-anchor="end">-12</text>`;
		svg += `<rect id="level" x="32" y="120" width="6" height="45" rx="2" opacity="0.4"/>`;
		svg += `<g id="handle" transform="translate(0, 120)">`;
		svg += `<rect x="7" y="-11" width="56" height="22" rx="4" fill="#2a2230" stroke-width="1.5"/>`;
		svg += `<line x1="20" y1="-4" x2="50" y2="-4" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`;
		svg += `<line x1="20" y1="0"  x2="50" y2="0" stroke-width="1.5" stroke-linecap="round"/>`;
		svg += `<line x1="20" y1="4"  x2="50" y2="4" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`;
		svg += `</g>`;
		svg += `<text id="freq" x="35" y="340" font-family="'Courier New', monospace" font-size="9" fill="#c87a6a" text-anchor="middle">${this.#freq} kHz</text>`;
		svg += `<rect x="1" y="1" width="68" height="358" rx="5" fill="none" stroke="#5a3a38" stroke-width="0.8" opacity="0.4"/>`;
		svg += `</svg>`;
		container.innerHTML = svg;

		this.#svg = container.querySelector('svg');
		this.#input = container.querySelector('input');
		this.#input.addEventListener('input', e => {
			this.#moveHandle(0 - this.#input.value);
			if(this.#init) this.#rack.setEQ(this.#freq, this.#valToDb(0 - this.#input.value));
			else this.#init = true;
		});

		this.setDb(this.#value);
		this.#parent.append(container);
	}


	#moveHandle(val) {
		const y = 165 + (val / -100) * 145;
		this.#svg.querySelector('#handle').setAttribute('transform', `translate(0, ${y})`);
		const level = this.#svg.querySelector('#level');
		if (val >= 0) {
			level.setAttribute('y', y);
			level.setAttribute('height', 165 - y);
		} else {
			level.setAttribute('y', 165);
			level.setAttribute('height', y - 165);
		}
	}


	#valToDb(val) {
		return val * 0.12;
	}


	#dbToVal(db) {
		return db / 0.12;
	}


	setDb(db, passive = false) {
		if(passive) this.#init = false;
		this.#value = db;
		this.#input.value = 0 - this.#dbToVal(db);
		this.#input.dispatchEvent(new Event('input', {bubbles: true, cancelable: false }));
	}


}