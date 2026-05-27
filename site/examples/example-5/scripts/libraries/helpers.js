/******************************************************
 *                    Create Element                  *
 ******************************************************/
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


/******************************************************
 *             Body lock while working/busy           *
 ******************************************************/
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


/******************************************************
 *                 Format Time HH:ii:ss               *
 ******************************************************/
self.formatTime = (secondsFloat) => {
    const totalSeconds = Math.floor(secondsFloat);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


/******************************************************
 *                Escape HTML characters              *
 ******************************************************/
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


/******************************************************
 *               DOMDocument async loaded             *
 ******************************************************/
self.documentReady = function(clb = null) {
	return new Promise((res) => {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", async () => {
				if(clb) res(clb());
				else res(true);
			}, { once: true });
		} else {
			if(clb) res(clb());
			else res(true);
			res();
		}
	});
}


/******************************************************
 *                Download JSON Object                *
 ******************************************************/
self.downloadJsonObject = (obj, filename) => {
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, "\t"));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


