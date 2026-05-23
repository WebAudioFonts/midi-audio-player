import "./libraries/helpers";
import DNDZone from "./libraries/dndzone";
import programChooser from "./libraries/programchooser";




({

	song: '../../data/closer.mid',
	
	player: null,
	presets: {},
	programs: {},
	channels: {},

	btnPlay: null,
	btnPause: null,
	btnStop: null,
	
	ctrlControls: null,
	ctrlWaveform: null,
	ctrlPrograms: null,





	logs: null,


	opts: {
		volume: localStorage.getItem('waf_volume') || 0.7,
		reverb: 0.3,
		presetRandom: true,
		presetAuto: true,
		localCache: true,
		karaoke: true,
		// muteExpression: true,
		// preferred: ["JCLive", "LesPaul", "Chaos"],

	},
	

	init: async function() {

		console.log("test");

		await this.initUI();
		await this.initPlayer();

		const response = await fetch(this.song);
		const buffer = await response.arrayBuffer();
		await this.player.load(buffer);


	},


	initUI: async function() {
		this.logs = document.querySelector('.logs');
		this.btnPlay = document.querySelector('.btn.play');
		this.btnStop = document.querySelector('.btn.stop');
		this.btnPause = document.querySelector('.btn.pause');
		this.ctrlControls = document.querySelector('.controls');
		this.ctrlWaveform = document.querySelector('.waveform');
		this.ctrlPrograms = document.querySelector('.programs');
	},


	initPlayer: async function() {
		this.player = new MidiAudioPlayer(this.opts);
		this.player.on('logs', str => this.log(str));


	},


	freeze: function() {
		this.ctrlControls.classList.add('disabled');
		this.ctrlWaveform.classList.add('disabled');
		this.ctrlPrograms.classList.add('disabled');
	},

	unfreeze: function() {

		this.ctrlControls.classList.remove('disabled');
		this.ctrlWaveform.classList.remove('disabled');
		this.ctrlPrograms.classList.remove('disabled');

	},



	play: async function() {

		[this.btnPause, this.btnStop].forEach(btn => btn.classList.remove('active'));
		this.btnplay.classList.add('active');
		await this.player.play();
		log(this.player.getCurrentTick() ? "Resume" : "Play");

	},


	pause: async function() {},
	
	
	stop: async function() {},


	log: async function(str) {
		const now = new Date();
		const formatted = new Intl.DateTimeFormat('en-CA', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).format(now).replace(/,/g, '');
		await new Promise(requestAnimationFrame);
		if(this.logs.innerText) this.logs.innerText += "\n";
		this.logs.innerText += `[${formatted}] ${str}`;
		this.logs.scrollTop = this.logs.scrollHeight;
	},


}).init();





(async () => {
	// const song = ;



	// const logs = document.querySelector('.logs');
	// const btnplay = document.querySelector('.btn.play');
	// const btnstop = document.querySelector('.btn.stop');
	// const btnpause = document.querySelector('.btn.pause');

	// const presets = {};
	// const programs = {};
	// let channels = null;


	// const log = async (str) => {
	// 	const now = new Date();
	// 	const formatted = new Intl.DateTimeFormat('en-CA', {
	// 		hour: '2-digit',
	// 		minute: '2-digit',
	// 		second: '2-digit',
	// 		hour12: false
	// 	}).format(now).replace(/,/g, '');
	// 	if(logs.innerText) logs.innerText += "\n";
	// 	logs.innerText += `[${formatted}] ${str}`;
	// 	logs.scrollTop = logs.scrollHeight;
	// }


	const loadPrograms = async (channels, presets) => {
		presets = {};
		const parent = create('div', 'instruments');
		await Promise.all(Object.keys(channels).map(async channel => presets[channels[channel].preset.program] = await player.getProgramInstruments(channels[channel].preset.program)));
		await Promise.all(Object.keys(channels).map(async channel => {
			programs[channel] = new programChooser(parent, channel, presets[channels[channel].preset.program], channels[channel].preset.id);
		}));
		document.querySelector('section.programs').replaceChildren(parent);
	}


	// btnplay.addEventListener('click', async () => {
	// 	[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
	// 	btnplay.classList.add('active');
	// 	await player.play();
	// 	log(player.getCurrentTick() ? "Resume" : "Play");
	// });

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
	// const waveform = document.querySelector('.waveform');
	// const player = new MidiAudioPlayer({
	// 	volume: localStorage.getItem('waf_volume') || 0.7,
	// 	reverb: 0.3,
	// 	presetRandom: true,
	// 	presetAuto: true,
	// 	localCache: true,
	// 	karaoke: true,
	// 	// muteExpression: true,
	// 	preferred: ["JCLive", "LesPaul", "Chaos"],
	// });
	player.on('endOfFile', async () => {
		[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
		btnstop.classList.add('active');
		waveform.style.setProperty('--progress', `0%`);
		waveform.style.setProperty('--time', `"0:00"`);
		log("End of file");
	});
	player.on('computed', async (data) => {
		const svgCode = await player.generateWaveformSVG();
		requestAnimationFrame(() => {
			songInfos = data;
			document.querySelector('section > div.karaoke').style.setProperty('--title', `"${songInfos.title}"`);
			log("Generating waveform...");
			waveform.style.setProperty('--progress', `0%`);
			waveform.style.setProperty('--time', `"0:00"`);
			waveform.style.setProperty('--duration', `"${formatTime(songInfos.duration)}"`);
			document.querySelector('.waveform__container').innerHTML = svgCode;
		});
	});
	// player.on('logs', str => requestAnimationFrame(() => log(str)));
	player.on('karaoke', evt => {
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
		requestAnimationFrame(async () => {
		
		
		
			document.querySelector('.controls').classList.add('disabled');
			document.querySelector('.waveform').classList.add('disabled');
			document.querySelector('.programs').classList.add('disabled');
			try {
				log('File droped');
				if(player.isPlaying()) player.stop(true);
				const buffer = await file.arrayBuffer();
				channels = await player.load(buffer);


				[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
				btnstop.classList.add('active');
				waveform.style.setProperty('--progress', `0%`);
				waveform.style.setProperty('--time', `"0:00"`);

				document.querySelector('.controls').classList.remove('disabled');
				document.querySelector('.waveform').classList.remove('disabled');
				document.querySelector('.programs').classList.remove('disabled');

				[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
				btnplay.classList.add('active');

				queueMicrotask(async () => {
					await loadPrograms(channels, presets)
					await player.play();
					log('Autoplay');
				});
			} catch(e) {
				log('Error: Invalid file format');
			}
		
		
		});
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
	// queueMicrotask(() => loadPrograms(channels, presets));

	log("----------------------------------------");
	log("|  Drag & drop your .kar or .mid here  |");
	log("----------------------------------------");

	document.querySelector('.controls').classList.remove('disabled');
	document.querySelector('.waveform').classList.remove('disabled');
	document.querySelector('.programs').classList.remove('disabled');
});

