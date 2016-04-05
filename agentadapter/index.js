var http = require('http');
var https = require('https');
var urllib = require('url');
var qs = require('querystring');

var adapterCache = {};

exports.getAdapter = getAdapter;
exports.parseHeader = parseHeader;

function getAdapter(adapter) {
	if(adapterCache.hasOwnProperty(adapter)) {
		return adapterCache[adapter];
	} else {
		var obj = require('./' + adapter);
		if(!obj.hasOwnProperty('requestHandler')) {
			obj.requestHandler = defaultRequestHandler;
		}
		if(!obj.hasOwnProperty('connectHandler')) {
			obj.connectHandler = defaultConnectHandler;
		}
		adapterCache[adapter] = obj;
		return obj;
	}
}

function parseHeader(reader, callback) {
	var resp = {headers: {}}, bytes = [], endIndex;
	var endCount = 0;
	reader.on('data', onData);
	reader.on('end', onEnd);
	function onData(chunk) {
		var i = 0, len = chunk.length;
		var endstr = "\r\n", j = endIndex || 0;
		for(;i<len;i++) {
			if(chunk[i] === endstr.charAt(j)) {
				j++;
			} else {
				j = 0;
				endCount = 0;
				bytes.push(chunk[i]);
			}
			if(j === endstr.length) {
				if(bytes.length > 0) {
					parseLine(new Buffer(bytes).toString());
					bytes = [];
				}
				endCount++;
			}
			if(endCount === 2) {
				reader.unshift(chunk.slice(i + 1));
				reader.removeListener('data', onData);
				reader.removeListener('end', onEnd);
				callback(null, resp);
			}
		}
		endIndex = j;
	}
	function onEnd() {
		reader.removeListener('data', onData);
		reader.removeListener('end', onEnd);
		if(bytes.length > 0) {
			reader.unshift(new Buffer(bytes));
		}
		callback(null, {statusCode: 200, header: {}});
	}
	function parseLine(s) {
		var parts;
		console.log('parse header line:', s);
		if(s.indexOf('HTTP/') === 0) {
			parts = s.split(' ');
			resp.httpVersion = parts[0];
			resp.statusCode = parseInt(parts[1]);
			resp.statusMessage = parts[2];
		} else {
			parts = s.split(': ');
			resp.headers[parts[0]] = parts[1];
		}
	}
}

function defaultRequestHandler(originRequest, originResponse, options, params) {
	var adapter = this, serverOptions = clone(adapter.server);
	var mod = serverOptions.protocol === "http:" ? http : https;
	serverOptions.path = appendArgs(serverOptions.path, params);
	var requestObj = mod.request(serverOptions, function(response){
		originResponse.writeHead(response.statusCode, response.headers);
		response.pipe(originResponse);
	});
	requestObj.on('error', function(e){
		originResponse.writeHead(500);
		originResponse.end("adapter error");
	});
	requestObj.write(JSON.stringify(options));
	requestObj.write('\r\n');
	originRequest.pipe(requestObj);
}

function defaultConnectHandler(originRequest, originSocket, params) {
	var adapter = this, serverOptions = clone(adapter.server);
	var mod = serverOptions.protocol === "http:" ? http : https;
	serverOptions.path = appendArgs(serverOptions.path, params);
	var requestObj = mod.request(serverOptions, function(response){
		// 最终响应数据一字不漏的返回给浏览器
		console.log('server responsed');
		response.pipe(originSocket);
	});
	requestObj.on('error', function(e){
		console.error(e.message);
		console.log(e.stack);
		originSocket.destroy();
	});
	// 发送请求数据
	originSocket.pipe(requestObj);
}

function appendArgs(url, query) {
	var parts = urllib.parse(url, true), k;
	for(k in parts.query) {
		query.hasOwnProperty(k) || (query[k] = parts.query[k]);
	}
	return parts.pathname + '?' + qs.stringify(query);
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}