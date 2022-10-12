# node-superfetch
[![Downloads](https://img.shields.io/npm/dt/node-superfetch.svg?maxAge=3600)](https://www.npmjs.com/package/node-superfetch)
[![Version](https://img.shields.io/npm/v/node-superfetch.svg?maxAge=3600)](https://www.npmjs.com/package/node-superfetch)

node-superfetch is a tiny little wrapper for Node.js' fetch API that makes it
look like you are using [superagent](https://www.npmjs.com/package/superagent).

## Basic Usage
```js
const request = require('node-superfetch');

try {
	const { body } = await request.get('https://registry.npmjs.com/node-superfetch');
	console.log(body);
} catch (err) {
	console.error(err);
}
```
Usage is basically that of superagent or snekfetch, and implements the same HTTP
methods, as well as functions like `query` (sets query parameters), `set` (sets
headers), `send` (for adding POST data and such), `attach` (for sending
FormData), `redirects` (for setting the allowed number of redirects), and
`agent` (for setting the HTTP agent). `end` is also supported for callbacks.

Additionally, you can also use the `noResultData` option to get everything
except the actual result data of the request. This is essentially doing the
request without calling any methods to parse the result data.

```js
const { headers, url } = await request.get('https://registry.npmjs.com/node-superfetch', { noResultData: true });
console.log(url); // should log https://registry.npmjs.com/node-superfetch
```
