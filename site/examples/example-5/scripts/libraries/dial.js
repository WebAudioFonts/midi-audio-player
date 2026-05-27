export default class Dial {

	#parent = null;
	#className = null;
	#callback = null;
	#wrapper = null;
	#dial = null;
	#dragging = false;
	#startY = 0;
	#startT = 0;
	#t = 0;


	constructor(parent, className, t, callback) {
		this.#parent = parent;
		this.#className = className; 
		this.#callback = callback;
		this.#create();
		this.#setT(t, true);
	}


	#create() {
		this.#wrapper = create('div', `dial-wrapper ${this.#className}`);
		this.#dial = this.#wrapper.create('div', 'dial');
		this.#dial.create('div', 'dial-track');
		// this.#dial.create('div', 'dial-dot');
		this.#dial.addEventListener('mousedown', e => this.#mousedown(e));
		this.#dial.addEventListener('touchstart', e => this.#touchstart(e), { passive: false });
		window.addEventListener('mousemove', e => this.#mousemove(e));
		window.addEventListener('mouseup', e => this.#mouseup(e));
		window.addEventListener('touchmove', e => this.#touchmove(e), { passive: false });
		window.addEventListener('touchend', () => { this.#dragging = false; });
		this.#parent.append(this.#wrapper);
	}


	#setT(val, skipclb = false) {
		this.#t = Math.max(0, Math.min(1, val));
		this.#wrapper.style.setProperty('--dial-t', this.#t);
		if(!skipclb) this.#callback(this.#t);
	}


	#mousedown(e) {
		this.#dragging = true;
		this.#startY = e.clientY;
		this.#startT = this.#t;
		this.#dial.style.cursor = 'grabbing';
		// document.documentElement.style.cursor = 'grabbing';
		e.preventDefault();
	}


	#touchstart(e) {
		this.#dragging = true;
		this.#startY = e.touches[0].clientY;
		this.#startT = this.#t;
		e.preventDefault();
	}

	
	#mousemove(e) {
		if (!this.#dragging) return;
		const dy = e.clientY - this.#startY;
		this.#setT(this.#startT - dy / 180);
	}


	#mouseup(e) {
		this.#dragging = false;
		this.#dial.style.cursor = 'ns-resize';
		// document.documentElement.style.cursor = 'ns-resize';
	}


	#touchmove(e) {
		if (!this.#dragging) return;
		const dy = e.touches[0].clientY - this.#startY;
		this.#setT(this.#startT - dy / 180);
	}

}