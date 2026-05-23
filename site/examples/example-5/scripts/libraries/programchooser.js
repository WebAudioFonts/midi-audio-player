export default class programChooser {

	#parent = null;
	#channel = null;
	#presets = null;
	#selpreset = null;
	#light = null;
	#active = false;
	#currentAnimation = null;


	constructor(parent, channel, presets, selpreset) {
		this.#parent = parent;
		this.#channel = channel;
		this.#selpreset = selpreset;
		presets.forEach(preset => preset.name = `${preset.instrument} / ${preset.bank} #${preset.serie + 1}`);
		this.#presets = presets.sort((a, b) => a.name.localeCompare(b.name));;
		
		try {
			this.#create();

		}
		catch(e) {
			console.log(this.#presets);
		}
		
	}


	#create() {
		const container = create('div', 'instrument');
		const select = container.create('select');
		select.create('option', null, this.#presets[0].category, { disabled: true });
		this.#presets.forEach(preset => {
			select.create('option', null, preset.name, { value: preset.id });
		});
		select.value = this.#selpreset;

		container.create('div', 'program', `#${this.#channel}`);
		this.#light = container.create('div', 'light');
		requestAnimationFrame(() => {
			this.#parent.appendChild(container);
		});
		
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