import Dial from "./dial";

export default class ProgramChooser {

	#parent = null;
	#channel = null;
	#presets = null;
	#selpreset = null;
	#volume = null;
	#isVocal = false;
	#light = null;
	#active = false;
	#currentAnimation = null;
	#select = null;
	#presetCallback = null;
	#volumeCallback = null;
	#program = null;
	#dial = null;


	constructor(parent, channel, program, presets, selpreset, volume, isVocal) {
		this.#parent = parent;
		this.#channel = channel;
		this.#program = program;
		this.#selpreset = selpreset;
		this.#volume = volume;
		this.#isVocal = isVocal;
		presets.forEach(preset => {
			const match = preset.id.match(/^([0-9]{3})([0-9]+)_(.*)$/);
			preset.label = `${preset.name} / ${match[3]} #${+match[2] + 1}`;
		});
		this.#presets = presets.sort((a, b) => a.label.localeCompare(b.label));
		this.#create();
	}

	set presetCallback(val) { this.#presetCallback = val; }
	set volumeCallback(val) { this.#volumeCallback = val; }


	#create() {
		const container = create('div', 'instrument');
		this.#select = container.create('select');
		this.#select.create('option', null, this.#presets[0].instrument, { disabled: true });
		this.#presets.forEach(preset => {
			this.#select.create('option', null, escapeHTML(preset.label), { value: preset.id });
		});
		this.#select.value = this.#selpreset;
		this.#select.addEventListener('change', () => {
			if(typeof this.#presetCallback === 'function') this.#presetCallback(this.#select.value, this.#channel);
		});
		container.create('div', 'program' + (this.#isVocal ? ' vocal' : ''), `#${this.#channel}`);
		container.create('div', `inst gm-${(Math.floor(this.#program / 8) + 1).toString().padStart(2, '0')}`);
		this.#light = container.create('div', 'light');
		this.#dial = new Dial(container, 'instrument', this.#volume * 0.6, val => {
			if(typeof this.#volumeCallback === 'function') this.#volumeCallback((val / 0.6), this.#channel);
		});
		this.#parent.appendChild(container);
	}


	setActive(active) {
		if (active && !this.#active) {
			this.#active = true;
			if (this.#currentAnimation) this.#currentAnimation.cancel();
			this.#currentAnimation = this.#light.animate(
				[{ '--light-opacity': 0 }, { '--light-opacity': 1 }],
				{ duration: 5, easing: 'ease-out', fill: 'forwards' }
			);
		} else if (!active && this.#active) {
			this.#active = false;
			if (this.#currentAnimation) this.#currentAnimation.cancel();
			this.#currentAnimation = this.#light.animate(
				[{ '--light-opacity': 1 }, { '--light-opacity': 0 }],
				{ duration: 250, easing: 'ease-in', fill: 'forwards' }
			);
		}
	}

}