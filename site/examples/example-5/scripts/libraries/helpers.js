self.busy = async (promise) => {
	document.documentElement.classList.add('is-busy');
	const results = await Promise.allSettled(promise instanceof Array ? promise : [promise]);
	document.documentElement.classList.remove('is-busy');
	return promise instanceof Array ? results : results[0];
}

self.working = async (promise) => {
	document.documentElement.classList.add('is-working');	
	const results = await Promise.allSettled(promise instanceof Array ? promise : [promise]);
	document.documentElement.classList.remove('is-working');
	return promise instanceof Array ? results : results[0];
}

self.formatTime = (secondsFloat) => {
    const totalSeconds = Math.floor(secondsFloat);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

self.create = (tag, classname=null, content=null, attrs={}) => {
    const elm = document.createElement(tag);
    if(classname) elm.className = classname;
    if(content) elm.innerHTML = content;
	Object.entries(attrs).forEach(a => elm.setAttribute(a[0], a[1]));
    return elm;
};

self.escapeHTML = (str) => {
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


self.concatUint8Arrays = (arrays) => {
const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        
        // --- AJOUTEZ CE LOG ICI ---
        console.log(`Index ${i}: offset=${offset}, arr.length=${arr.length}, total=${totalLength}, somme=${offset + arr.length}`);
        // --------------------------

        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}


self.areUint8ArraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}


HTMLElement.prototype.create = function(tag, classname=null, content=null, attrs={}) {
    const elm = create(tag, classname, content, attrs);
    this.append(elm);
    return elm;
};