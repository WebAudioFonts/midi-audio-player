import "./libraries/helpers";
import DNDZone from "./libraries/dndzone";
import DBMeter from "./libraries/dbmeter";
import Slider from "./libraries/slider";
import Timeline from "./libraries/timeline";
import ProgramChooser from "./libraries/programchooser";


({

	song: '../../data/closer.mid',
	firstPlay: true,

	player: null,
	presets: {},
	programs: {},
	channels: {},
	info: { duration: 0 },


	btnPlay: null,
	btnPause: null,
	btnStop: null,

	ctrlControls: null,
	ctrlVolume: null,
	ctrlWaveform: null,
	ctrlMeter: null,
	ctrlKaraoke: null,
	ctrlPrograms: null,
	

	timeline: null,
	dbmeter: null,
	volslider: null,
	dndzone: null,

	worker: null,





	logs: null,


	opts: {
		volume: localStorage.getItem('waf_volume') || 0.7,
		reverb: 0.3,
		// presetRandom: true,
		presetAuto: true,
		localCache: true,
		karaoke: true,
		// muteExpression: true,
		// preferred: ["JCLive", "LesPaul", "Chaos"],

	},


	init: async function() {
		this.log("Initializing player...");
		await this.initUI();
		await this.initPlayer();
		await this.startWorker();

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
		this.ctrlMeter = document.querySelector('.meter');
		this.ctrlVolume = document.querySelector('.dbvol');
		this.ctrlKaraoke = document.querySelector('.karaoke');
		this.ctrlPrograms = document.querySelector('.programs');

		this.btnPlay.addEventListener('click', async () => await this.play());
		this.btnPause.addEventListener('click', async () => await this.pause());
		this.btnStop.addEventListener('click', async () => await this.stop());

		this.volslider = new Slider(this.ctrlVolume, this.opts.volume, vol => this.setVolume(vol));
		this.timeline = new Timeline(this.ctrlWaveform, sec => this.skipTo(sec));
		this.dbmeter = new DBMeter(this.ctrlMeter);
		this.dndzone = new DNDZone(document.querySelector('.dnd'), { onFileDrop: file => this.drop(file) });
	},


	initPlayer: async function() {
		this.player = new MidiAudioPlayer(this.opts);
		this.player.on('logs', str => this.log(str));
		this.player.on('computed', (data) => this.computed(data));
		this.player.on('presetsLoaded', instruments => this.presetLoaded(instruments));
		this.player.on('endOfFile', () => this.endOfFile());
		this.player.on('karaoke', evt => this.karaoke(evt));
		this.player.on('channelState', async channels => {
			Object.keys(channels).map(async channel => this.programs[channel].setActive(channels[channel]));
		});
	},


	freeze: function() {
		document.documentElement.classList.add('is-busy');
		this.ctrlControls.classList.add('disabled');
		this.ctrlWaveform.classList.add('disabled');
		this.ctrlPrograms.classList.add('disabled');
	},


	unfreeze: function() {
		this.ctrlPrograms.classList.remove('disabled');
		this.ctrlWaveform.classList.remove('disabled');
		this.ctrlControls.classList.remove('disabled');
		document.documentElement.classList.remove('is-busy');
	},


	play: async function() {
		[this.btnPause, this.btnStop].forEach(btn => btn.classList.remove('active'));
		this.btnPlay.classList.add('active');
		await this.player.play();
		this.log(this.player.getCurrentTick() ? "Resume" : "Play");

	},


	pause: async function() {
		if(!this.player.isPlaying()) return log("Not playing");
		[this.btnStop, this.btnPlay].forEach(btn => btn.classList.remove('active'));
		this.btnPause.classList.add('active');
		this.player.pause();
		this.log("Pause");
	},


	stop: async function() {
		[this.btnPause, this.btnPlay].forEach(btn => btn.classList.remove('active'));
		this.btnStop.classList.add('active');
		this.player.stop();
		this.timeline.reset();
		this.log("Stop");

	},


	setVolume: function(vol) {
		this.player.volume = vol;
		localStorage.setItem(`waf_volume`, this.player.volume);
	},


	skipTo: async function(sec) {
		await this.player.skipToSeconds(sec);
		if(!this.player.isPlaying()) this.play();
	},


	loadPrograms: async function(presetCallback) {
		this.presets = {};
		this.programs = {};
		const channels = this.player.channels;
		const parent = create('div', 'instruments');
		await Promise.all(Object.keys(channels).map(async channel => this.presets[channels[channel].preset.program] = await this.player.getProgramInstruments(channels[channel].preset.program)));
		await Promise.all(Object.keys(channels).map(async channel => {
			this.programs[channel] = new ProgramChooser(parent, channel, this.presets[channels[channel].preset.program], channels[channel].preset.id);
			this.programs[channel].presetCallback = presetCallback;
		}));
		await new Promise(requestAnimationFrame);
		this.ctrlPrograms.replaceChildren(parent);
	},


	startWorker: async function() {
		this.worker = setInterval(async () => {
			const tick = this.player.getCurrentTick();
			if(tick) {
				const time = (this.info.duration - this.player.getSongTimeRemaining()).toFixed(3);
				const vol = await this.player.getRealTimeVolume();
				await this.timeline.update(time);
				await this.dbmeter.update(vol);
			}
		}, 50);
	},


	computed: async function(data) {
		this.info = data;
		this.log("Generating waveform...");
		const svgCode = await this.player.generateWaveformSVG();
		this.timeline.load(svgCode, this.info.duration);
		this.ctrlKaraoke.style.setProperty('--title', `"${this.info.title}"`);
	},


	presetLoaded: async function(instruments) {
		await this.loadPrograms((preset, channel) => busy(this.player.loadPreset(preset, channel)));
		if(!this.firstPlay) {
			this.play();
			this.log('Autoplay');
		} else this.firstPlay = false;
		this.log("----------------------------------------");
		this.log("|  Drag & drop your .kar or .mid here  |");
		this.log("----------------------------------------");
		this.unfreeze();
	},


	endOfFile: async function() {
		await new Promise(requestAnimationFrame);
		[this.btnPause, this.btnPlay].forEach(btn => btn.classList.remove('active'));
		this.btnStop.classList.add('active');
		this.timeline.reset();
		this.log("End of file");
	},


	karaoke: async function(evt) {
		await new Promise(requestAnimationFrame);
		if(evt.type == 'title') return;
		else this.ctrlKaraoke.innerHTML = `<p>${evt.html}</p>`;
	},


	drop: async function(file) {
		if(!['mid', 'midi', 'kar'].includes(file.name.split('.').pop()?.toLowerCase()) || !file.size || file.size > 5242880) {
			this.log('Error: Invalid file format.');
			return;
		}
		this.freeze();
		try {
			this.log('File droped');
			if(this.player.isPlaying()) this.player.stop(true);
			const buffer = await file.arrayBuffer();
			await this.player.load(buffer);
		} catch(e) {
			console.error(e);
			this.log(`Error: ${e}`);
			this.unfreeze();
		}
	},


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

