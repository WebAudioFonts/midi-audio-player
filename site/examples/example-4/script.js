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



async function busy(promise) {
	document.documentElement.classList.add('is-busy');	
	const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
	document.documentElement.classList.remove('is-busy');
	return typeof promise == 'array' ? results : results[0];
}


async function working(promise) {
	document.documentElement.classList.add('is-working');	
	const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
	document.documentElement.classList.remove('is-working');
	return typeof promise == 'array' ? results : results[0];
}


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


function escapeHTML(str) {
	return str.replace(/[&<>"']/g, function (m) {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		}[m];
	});
}


class programChooser {

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
		this.#presets = presets.sort((a, b) => a.name.localeCompare(b.name));;
		try {
			this.#create();
		}
		catch(e) {
			console.log(this.#presets);
		}
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



(async () => {
	const song = '../../data/closer.mid';



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
		await new Promise(requestAnimationFrame);
		if(logs.innerText) logs.innerText += "\n";
		logs.innerText += `[${formatted}] ${str}`;
		logs.scrollTop = logs.scrollHeight;
	}


	const loadPrograms = async (channels, presets, presetCallback) => {
		presets = {};
		const parent = create('div', 'instruments');
		await Promise.all(Object.keys(channels).map(async channel => presets[channels[channel].preset.program] = await player.getProgramInstruments(channels[channel].preset.program)));
		await Promise.all(Object.keys(channels).map(async channel => {
			programs[channel] = new programChooser(parent, channel, presets[channels[channel].preset.program], channels[channel].preset.id);
			programs[channel].presetCallback = presetCallback;
		}));
		await new Promise(requestAnimationFrame);
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
		// muteExpression: true,
		preferred: ["JCLive", "LesPaul", "Chaos"],
	});
	player.on('endOfFile', async () => {
		await new Promise(requestAnimationFrame);
		[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
		btnstop.classList.add('active');
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);
		log("End of file");
	});
	player.on('computed', async (data) => {
		const svgCode = await player.generateWaveformSVG();
		await new Promise(requestAnimationFrame);
		songInfos = data;
		document.querySelector('section > div.karaoke').style.setProperty('--title', `"${songInfos.title}"`);
		log("Generating waveform...");
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);
		waveform.style.setProperty('--duration', `"${formatTime(songInfos.duration)}"`);
		document.querySelector('.waveform__container').innerHTML = svgCode;
	});
	player.on('presetsLoaded', async () => {
		await new Promise(requestAnimationFrame);
		[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
		btnstop.classList.add('active');
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);

		document.querySelector('.controls').classList.remove('disabled');
		document.querySelector('.waveform').classList.remove('disabled');
		document.querySelector('.programs').classList.remove('disabled');

		[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
		btnplay.classList.add('active');

		await loadPrograms(channels, presets, (preset, channel) => {
			busy(player.loadPreset(preset, channel));
		});
		await player.play();
		log('Autoplay');

		log("----------------------------------------");
		log("|  Drag & drop your .kar or .mid here  |");
		log("----------------------------------------");


	});
	player.on('logs', str => log(str));
	player.on('karaoke',async evt => {
		await new Promise(requestAnimationFrame);
		if(evt.type == 'title') return;
		else document.querySelector('section > div.karaoke').innerHTML = `<p>${evt.html}</p>`;
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
		// console.log(player.getCurrentTick());
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
			await busy((async () => {
				const buffer = await file.arrayBuffer();
				channels = await player.load(buffer);
			})());

		} catch(e) {
			console.error(e);
			log(`Error: ${e}`);
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
		await new Promise(requestAnimationFrame);
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
	}, 50);

	log("Downloading song...");
	const response = await fetch(song);
	const buffer = await response.arrayBuffer();
	channels = await player.load(buffer);	

})();

