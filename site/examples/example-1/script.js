(async () => {

	const song = 'https://zmotrin.github.io/midi-audio-player/data/iwillsurvive.mid';
	const btnplay = document.querySelector('.btn.play');
	const btnstop = document.querySelector('.btn.stop')
	const btnpause = document.querySelector('.btn.pause')
	const logs = document.querySelector('.logs');


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


	btnplay.addEventListener('click', () => {
		[btnpause, btnstop].forEach(btn => {
			btn.classList.remove('active');
		});
		btnplay.classList.add('active');
		player.play();
		log(player.getCurrentTick() ? "Resume" : "Play");
	});

	btnstop.addEventListener('click', () => {
		[btnpause, btnplay].forEach(btn => {
			btn.classList.remove('active');
		});
		btnstop.classList.add('active');
		player.stop();
		log("Stop");
	});

	btnpause.addEventListener('click', () => {
		if(!player.isPlaying()) return log("Not playing");
		[btnstop, btnplay].forEach(btn => {
			btn.classList.remove('active');
		});
		btnpause.classList.add('active');
		player.pause();
		log("Pause");
	});


	log("Initializing player...");
	const player = new MidiAudioPlayer();

	log("Download song...");
	const response = await fetch(song);
	
	log("Loading Buffer...");
	const buffer = await response.arrayBuffer();
	await player.load(buffer);

	log("Ready!");
})();

