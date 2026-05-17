const formatTime = (secondsFloat) => {
    const totalSeconds = Math.floor(secondsFloat);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
const create = (tag, classname=null, content=null, attrs={}) => {
    const elm = document.createElement(tag);
    if(classname) elm.className = classname;
    if(content) elm.innerHTML = content;
	Object.entries(attrs).forEach(a => elm.setAttribute(a[0], a[1]));
    return elm;
};
HTMLElement.prototype.create = function(tag, classname=null, content=null, attrs={}) {
    const elm = create(tag, classname, content, attrs);
    this.append(elm);
    return elm;
};



class DNDZone {

	container = null;
	opts = { onFileDrop: null };

	constructor(container, opts = {}) {
		this.opts = { ...this.opts, ...opts };
		if(typeof container != 'string') this.container = container;
		else this.container = document.querySelector(container);
		this.container.addEventListener('dragover',  e => e.preventDefault());
		this.container.addEventListener('dragenter', e => this.dragEnter(e));
		this.container.addEventListener('dragleave', e => this.dragLeave(e));
		this.container.addEventListener('drop',      e => this.drop(e));
	}

	dragEnter(e) {
		e.preventDefault();
		this.container.classList.add('dragover');
	}

	dragLeave(e) {
		this.container.classList.remove('dragover');
	}

	async drop(e) {
		e.preventDefault();
		const files = e.dataTransfer.files;
		this.container.classList.remove('dragover');
		if (files.length > 0) await this.opts.onFileDrop?.(e.dataTransfer.files[0]);
	}

}



class programChooser {

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
		this.#create();
	}


	#create() {
		const container = create('div', 'instrument');
		const select = container.create('select');
		select.create('option', null, this.#presets[0].category, { disabled: true });
		this.#presets.forEach(preset => {
			select.create('option', null, preset.name, { value: preset.id });
		});
		select.value = this.#selpreset;
		// console.log();

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



(async () => {
	const song = '../../data/closer.mid';
	// const song = '../../data/screw.kar';



	const logs = document.querySelector('.logs');
	const btnplay = document.querySelector('.btn.play');
	const btnstop = document.querySelector('.btn.stop');
	const btnpause = document.querySelector('.btn.pause');

	const presets = {};
	const programs = {};
	let channels = null;


	const log = async (str) => {
		const now = new Date();
		const formatted = new Intl.DateTimeFormat('en-CA', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).format(now).replace(/,/g, '');
		if(logs.innerText) logs.innerText += "\n";
		logs.innerText += `[${formatted}] ${str}`;
		logs.scrollTop = logs.scrollHeight;
	}


	const loadPrograms = async (channels, presets) => {
		presets = {};
		const parent = create('div', 'instruments');
		await Promise.all(Object.keys(channels).map(async channel => presets[channels[channel].preset.program] = await player.getProgramInstruments(channels[channel].preset.program)));
		Object.keys(channels).map(channel => {
			programs[channel] = new programChooser(parent, channel, presets[channels[channel].preset.program], channels[channel].preset.id);
		});
		document.querySelector('section.programs').replaceChildren(parent);
	}


	btnplay.addEventListener('click', async () => {
		[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
		btnplay.classList.add('active');
		await player.play();
		log(player.getCurrentTick() ? "Resume" : "Play");
	});

	btnstop.addEventListener('click', () => {
		[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
		btnstop.classList.add('active');
		player.stop();
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);
		log("Stop");
	});

	btnpause.addEventListener('click', () => {
		if(!player.isPlaying()) return log("Not playing");
		[btnstop, btnplay].forEach(btn => btn.classList.remove('active'));
		btnpause.classList.add('active');
		player.pause();
		log("Pause");
	});


	log("Initializing player...");
	let songInfos = null;
	const waveform = document.querySelector('.waveform');
	const player = new MidiAudioPlayer({
		volume: localStorage.getItem('waf_volume') || 0.7,
		reverb: 0.3,
		presetRandom: true,
		presetAuto: true,
		localCache: true,
		karaoke: true,
		muteExpression: false,
		trimSilences: true,
		preferred: ["JCLive", "LesPaul", "Chaos"],
		// presets: { [-1]: '12805_Chaos' }
	});
	player.on('endOfFile', async () => {
		[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
		btnstop.classList.add('active');
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);
		log("End of file");
	});
	player.on('fileLoaded', async (data) => {
		songInfos = data;
		// console.log(songInfos);
		log("Generating waveform...");
		const svgCode = await player.generateWaveformSVG();
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);
		waveform.style.setProperty('--duration', `"${formatTime(songInfos.duration)}"`);
		document.querySelector('.waveform__container').innerHTML = svgCode;
		// console.log(await player.extractLyrics());
	});
	player.on('logs', str => log(str));
	player.on('karaoke', evt => {
		document.querySelector('section > div.karaoke').innerHTML = `<p>${evt.html}</p>`;
	});
	player.on('channelState', async channels => {
		Object.keys(channels).map(async channel => programs[channel].setActive(channels[channel]));
	});
	document.querySelector('.waveform__click').addEventListener('click', async event => {
		const rect = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const ratio = x / rect.width;
		const finalRatio = Math.max(0, Math.min(1, ratio));
		await player.skipToSeconds(songInfos.duration * finalRatio);
		[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
		btnplay.classList.add('active');
		player.play();
	});

	new DNDZone(document.querySelector('.dnd'), { onFileDrop: async file => {
		if(!['mid', 'midi', 'kar'].includes(file.name.split('.').pop()?.toLowerCase()) || !file.size || file.size > 5242880) {
			log('Error: Invalid file format.');
			return;
		}
		document.querySelector('.controls').classList.add('disabled');
		document.querySelector('.waveform').classList.add('disabled');
		document.querySelector('.programs').classList.add('disabled');
		try {
			log('File droped');
			if(player.isPlaying()) player.stop(true);
			const buffer = await file.arrayBuffer();
			channels = await player.load(buffer);

			await loadPrograms(channels, presets);


			[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
			btnstop.classList.add('active');
			waveform.style.setProperty('--progress', `0%`);
			waveform.style.setProperty('--time', `"0:00"`);

			document.querySelector('.controls').classList.remove('disabled');
			document.querySelector('.waveform').classList.remove('disabled');
			document.querySelector('.programs').classList.remove('disabled');

			[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
			btnplay.classList.add('active');
			player.play();


			log('Automatic play');
		} catch(e) {
			log('Error: Invalid file format');
		}
	}});


	const input = document.querySelector('.dbvol__input');
	const svg = document.querySelector('.dbvol__svg');
	input.value = 100 - (player.volume * 100);
	input.addEventListener('input', (e) => {
		const val = 100 - parseFloat(e.target.value);
		const railTop = 20;
		const railBottom = 365;
		const travelDistance = railBottom - railTop;
		const newY = railBottom - (val / 100 * travelDistance);
		svg.style.setProperty('--y', newY + 'px');
		player.volume = val / 100;
		localStorage.setItem(`waf_volume`, player.volume);
	});
	input.dispatchEvent(new Event('input', {bubbles: true, cancelable: false }));


	let lasttime = 0;
	let lastmeter = 0;
	let lastprogress = '0:00';
	setInterval(async () => {
		requestAnimationFrame(async () => {
			const tick = player.getCurrentTick();
			if(tick) {
				const time = (songInfos.duration - player.getSongTimeRemaining()).toFixed(3);
				if(time != lasttime) {
					waveform.style.setProperty('--progress', `${time / songInfos.duration * 100}%`);
					const progress = formatTime(time);
					if(progress != lastprogress){
						waveform.style.setProperty('--time', `"${progress}"`);
						lastprogress = progress;
					}
					lasttime = time;
				}
			}

			const vol = await player.getRealTimeVolume();
			const indic = Math.ceil(vol * 36);
			if(indic == lastmeter) return;
			document.querySelectorAll(`.meter svg .meter__bands > .meter__band:nth-last-child(-n + ${indic})`).forEach(async elm => elm.style.opacity = 1);
			document.querySelectorAll(`.meter svg .meter__bands > .meter__band:nth-last-child(n + ${indic + 1})`).forEach(async elm => elm.style.opacity = 0.3);
			lastmeter = indic;
		});
	}, 50);



	log("Downloading song...");
	const response = await fetch(song);
	const buffer = await response.arrayBuffer();
	channels = await player.load(buffer);
	await loadPrograms(channels, presets);


	
	// log("----------------------------------------");
	// log("██████╗ ███████╗ █████╗ ██████╗ ██╗   ██╗");
	// log("██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝");
	// log("██████╔╝█████╗  ███████║██║  ██║ ╚████╔╝");
	// log("██╔══██╗██╔══╝  ██╔══██║██║  ██║  ╚██╔╝");
	// log("██║  ██║███████╗██║  ██║██████╔╝   ██║");
	// log("╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝");
	log("----------------------------------------");
	log("      Drag & drop your files here");
	log("----------------------------------------");



	document.querySelector('.controls').classList.remove('disabled');
	document.querySelector('.waveform').classList.remove('disabled');
	document.querySelector('.programs').classList.remove('disabled');
})();

