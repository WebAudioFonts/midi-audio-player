self.create = (tag, classname=null, content=null, attrs={}) => {
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


(async () => {




	const song = 'https://zmotrin.github.io/midi-audio-player/data/iwillsurvive.mid';
	const btnplay = document.querySelector('.btn.play');
	const btnstop = document.querySelector('.btn.stop')
	const btnpause = document.querySelector('.btn.pause')

	const logs = document.querySelector('.logs');

	const instruments = {};
	instruments[MidiAudioPlayer.PIANO] = document.querySelector('#channel-piano');
	instruments[MidiAudioPlayer.BASS] = document.querySelector('#channel-bass');
	instruments[MidiAudioPlayer.STRINGS] = document.querySelector('#channel-strings');
	instruments[MidiAudioPlayer.GUITAR] = document.querySelector('#channel-guitar');
	instruments[MidiAudioPlayer.DRUM] = document.querySelector('#channel-drum');
	await Promise.all(Object.keys(instruments).map(async i => instruments[i].create('option', null, 'Default', { value: -1 })));

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
		[btnpause, btnstop].forEach(btn => btn.classList.remove('active'));
		btnplay.classList.add('active');
		player.play();
		log(player.getCurrentTick() ? "Resume" : "Play");
	});

	btnstop.addEventListener('click', () => {
		[btnpause, btnplay].forEach(btn => btn.classList.remove('active'));
		btnstop.classList.add('active');
		player.stop();
		log("Stop");
	});

	btnpause.addEventListener('click', () => {
		if(!player.isPlaying()) return log("Not playing");
		[btnstop, btnplay].forEach(btn => btn.classList.remove('active'));
		btnpause.classList.add('active');
		player.pause();
		log("Pause");
	});

	const channels = {
        [MidiAudioPlayer.PIANO]:   true,
        [MidiAudioPlayer.BASS]:    true,
        [MidiAudioPlayer.STRINGS]: true,
        [MidiAudioPlayer.GUITAR]:  true,
        [MidiAudioPlayer.DRUM]:    true,
	};
	Object.keys(channels).forEach(channel => {
		channels[channel] = localStorage.getItem(`waf_active_${channel}`) === "false" ? false : true;
	});




	// log("Loading preset...");
	// const preset =
// console.log(channels);

	log("Initializing player...");
	const player = new MidiAudioPlayer({
		activeChannels: channels,
		onEndFile: async () => {
			[btnpause, btnplay].forEach(btn => {
				btn.classList.remove('active');
			});
			btnstop.classList.add('active');
			log("End of file");
		}
	});


	document.querySelectorAll('.channels input[type="checkbox"').forEach(async elm => {
		const channel = {
			"active-piano":   MidiAudioPlayer.PIANO,
			"active-bass":    MidiAudioPlayer.BASS,
			"active-strings": MidiAudioPlayer.STRINGS,
			"active-guitar":  MidiAudioPlayer.GUITAR,
			"active-drum":    MidiAudioPlayer.DRUM,
		}[elm.id];
		elm.checked = channels[channel];
		elm.addEventListener('change', () => {
			localStorage.setItem(`waf_active_${channel}`, elm.checked ? 'true' : 'false');
			player.setActiveChannel(channel, elm.checked);
		});
	});


	log("Loading catalog...");
	const categories = await player.getCategories();
	await Promise.all(categories.map(async category => {
		instruments[category.channel].create('option', null, category.name, { disabled: true });
		category.instruments.map(async inst => {
			const presets = inst.presets.sort((a, b) => a.bank.localeCompare(b.bank));
			presets.forEach(pre => instruments[category.channel].create('option', null, `${inst.name} ${pre.bank} #${pre.serie + 1}`, { value: pre.id }));
		});
	}));

	Object.keys(instruments).forEach(i => {
		const sel = instruments[i];
		const channel = {
			"channel-piano":   MidiAudioPlayer.PIANO,
			"channel-bass":    MidiAudioPlayer.BASS,
			"channel-strings": MidiAudioPlayer.STRINGS,
			"channel-guitar":  MidiAudioPlayer.GUITAR,
			"channel-drum":    MidiAudioPlayer.DRUM,
		}[sel.id];
		// elm.selected = channels[channel];
		sel.addEventListener('change', async () => {
			log(`Load preset: ${sel.options[sel.selectedIndex].text}`);
			localStorage.setItem(`waf_preset_${channel}`, sel.options[sel.selectedIndex].text);
			// // console.log(channel);
			await player.loadPreset(sel.value);
		});
	});



	log("Download song...");
	const response = await fetch(song);

	log("Loading Buffer...");
	const buffer = await response.arrayBuffer();
	await player.load(buffer);

	log("Ready!");


})();

