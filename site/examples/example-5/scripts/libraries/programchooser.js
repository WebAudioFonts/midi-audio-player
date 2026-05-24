export default class ProgramChooser {

	#parent = null;
	#channel = null;
	#presets = null;
	#selpreset = null;
	#light = null;
	#active = false;
	#currentAnimation = null;
	#select = null;
	#presetCallback = null;


	constructor(parent, channel, presets, selpreset) {
		this.#parent = parent;
		this.#channel = channel;
		this.#selpreset = selpreset;
		presets.forEach(preset => preset.name = `${preset.instrument} / ${preset.bank} #${preset.serie + 1}`);
		this.#presets = presets.sort((a, b) => a.name.localeCompare(b.name));
		this.#create();
	}

	set presetCallback(val) {
		this.#presetCallback = val;
	}


	#create() {
		const container = create('div', 'instrument');
		this.#select = container.create('select');
		this.#select.create('option', null, this.#presets[0].category, { disabled: true });
		this.#presets.forEach(preset => {
			this.#select.create('option', null, escapeHTML(preset.name), { value: preset.id });
		});
		this.#select.value = this.#selpreset;
		this.#select.addEventListener('change', () => {
			if(typeof this.#presetCallback === 'function') this.#presetCallback(this.#select.value, this.#channel);
		});
		container.create('div', 'program', `#${this.#channel}`);
		this.#light = container.create('div', 'light');
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