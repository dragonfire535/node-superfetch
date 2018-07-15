const fetch = require('node-fetch');
const FormData = require('form-data');
const querystring = require('querystring');
const { METHODS } = require('http');
const { version } = require('./package');

class Request {
	constructor(options) {
		if (!options.url) throw new Error('The "url" option is required.');
		this.url = options.url;
		this.method = options.method ? options.method.toUpperCase() : 'GET';
		if (!METHODS.includes(this.method)) throw new Error(`The method "${this.method}" is not supported.`);
		this.queryParams = options.query || {};
		this.headers = options.headers || {};
		this.body = options.body || null;
		this.redirectCount = typeof options.redirects !== 'undefined' ? options.redirects : 20;
	}

	async _request() {
		const queryParams = querystring.stringify(this.queryParams);
		const response = await fetch(`${this.url}${queryParams ? `?${queryParams}` : ''}`, {
			method: this.method,
			headers: this.headers,
			follow: this.redirectCount,
			body: this.body
		});
		const raw = await response.buffer();
		const headers = {};
		for (const [header, value] of response.headers.entries()) headers[header] = value;
		const res = {
			status: response.status,
			statusText: response.statusText,
			headers,
			url: response.url,
			ok: response.ok,
			raw,
			get text() {
				return raw.toString();
			},
			get body() {
				if (/application\/json/gi.test(headers['content-type'])) {
					try {
						return JSON.parse(raw.toString());
					} catch (err) {
						return raw.toString();
					}
				} else {
					return raw;
				}
			}
		};
		if (!response.ok) {
			const err = new Error(`${res.status} ${res.statusText}`);
			Object.assign(err, res);
			throw err;
		}
		return res;
	}

	then(resolver, rejector) {
		return this._request().then(resolver).catch(rejector);
	}

	catch(rejector) {
		return this.then(null, rejector);
	}

	end(cb) {
		return this.then(
			response => cb ? cb(null, response) : response,
			err => cb ? cb(err, err.status ? err : null) : err
		);
	}

	query(queryOrName, value) {
		if (typeof queryOrName === 'object' && !value) {
			for (const [param, val] of Object.entries(queryOrName)) this.queryParams[param] = val;
		} else if (typeof queryOrName === 'string' && value) {
			this.queryParams[queryOrName] = value;
		} else {
			throw new TypeError('The "query" parameter must be either an object or a query field.');
		}
		return this;
	}

	set(headersOrName, value) {
		if (typeof headersOrName === 'object' && !value) {
			for (const [header, val] of Object.entries(headersOrName)) this.headers[header] = val;
		} else if (typeof headersOrName === 'string' && value) {
			this.headers[headersOrName] = value;
		} else {
			throw new TypeError('The "headers" parameter must be either an object or a header field.');
		}
		return this;
	}

	attach(...args) {
		if (!this.body || !(this.body instanceof FormData)) this.body = new FormData();
		if (typeof args[0] === 'object') {
			for (const [key, val] of Object.entries(args[0])) this.attach(key, val);
		} else {
			this.body.append(...args);
		}
		return this;
	}

	send(body, raw = false) {
		if (body instanceof FormData) raw = true;
		if (!raw && body !== null && typeof body === 'object') {
			const header = this.headers['content-type'];
			if (header) {
				if (/application\/json/gi.test(header)) body = JSON.stringify(body);
			} else {
				this.set('content-type', 'application/json');
				body = JSON.stringify(body);
			}
		}
		this.body = body;
		return this;
	}

	redirects(amount) {
		if (typeof amount !== 'number') throw new TypeError('The "amount" parameter must be a number.');
		this.redirectCount = amount;
		return this;
	}
}

for (const method of METHODS) {
	if (!/^[A-Z$_]+$/gi.test(method)) continue;
	Request[method.toLowerCase()] = (url, options) => new Request({ url, method, ...options });
}

Request.version = version;

module.exports = Request;
