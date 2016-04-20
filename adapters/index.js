var http = require('http');
var https = require('https');
var urllib = require('url');
var qs = require('querystring');
var fs = require('fs');

var utils = require('../utils');
var config = require('../config');
var hostmgt = require('../hostmgt');
var adapterCache = loadAllAdapters();

exports.getAdapterNames = getAdapterNames;
exports.getAdapterFor = getAdapterFor;


function _loadAdapter(file) {
	var obj = require('./' + file);
	if(!obj.hasOwnProperty('requestHandler')) {
		obj.requestHandler = defaultRequestHandler;
	}
	if(!obj.hasOwnProperty('connectHandler')) {
		obj.connectHandler = defaultConnectHandler;
	}
	obj.excludes = utils.ensureArray(obj.excludes) || [];
	obj.includes = utils.ensureArray(obj.includes) || [];
	return obj;
}

function loadAllAdapters() {
	var files = fs.readdirSync(__dirname);
	var excludes = ['index.js'];
	var extre = /\.js(?:on)?$/i;
	var cache = {};
	if(!config.debug) {
		excludes.push('local.json');
	}
	files.filter(function(file){
		var include = true, name;
		if(!extre.test(file)) { return; }
		excludes.forEach(function(f){
			if(f === file) {
				include = false;
				return false;
			}
		});
		if(include) {
			name = file.replace(extre, '');
			utils.debug('find adapter: ' + name);
			cache[name] = _loadAdapter(file);
			utils.debug('load adapter: ' + name);
		}
	});
	utils.debug('all adapters were laoded!');
	return cache;
}

function getAdapterFor(host) {
	var k, adapter, ret = [], gfwProtected;
	gfwProtected = hostmgt.hasHost(host);
	for(k in adapterCache) {
		if(!adapterCache.hasOwnProperty(k)) {
			continue;
		}
		adapter = adapterCache[k];
		ret.push([adapter, getPriority(adapter, host, gfwProtected)]);
	}
	ret.sort(function(a, b){
		return b[1] - a[1];
	});
	// 返回优先级最高的 adapter
	return ret[0][0];
}

function getPriority(adapter, host, gfwProtected) {
	var i, len, hit, arr;
	// 是否翻墙标志不一致，直接返回
	if(adapter.gfwProtected !== gfwProtected) {
		return -1;
	}
	hit = false;
	arr = adapter.excludes;
	for(i=0,len=arr;i<len;i++) {
		if(arr[i].indexOf(host) > -1) {
			hit = true;
			break;
		}
	}
	if(hit) {
		return 0;
	}
	arr = adapter.includes;
	for(i=0,len=arr;i<len;i++) {
		if(arr[i].indexOf(host) > -1) {
			hit = true;
			break;
		}
	}
	return hit ? 10 : 1;
}

function getAdapterNames() {
	return Object.keys(adapterCache);
}


function defaultRequestHandler(browserRequest, browserResponse, options, params) {
	var adapter = this, serverOptions = clone(adapter.server);
	var mod = serverOptions.protocol === "http:" ? http : https;
	serverOptions.path = appendArgs(serverOptions.path, params);
	var requestObj = mod.request(serverOptions, function(response){
		browserResponse.writeHead(response.statusCode, response.headers);
		response.pipe(browserResponse);
	});
	requestObj.on('error', function(e){
		browserResponse.writeHead(500);
		browserResponse.end("adapter error");
	});
	requestObj.write(JSON.stringify(options));
	requestObj.write('\r\n');
	browserRequest.pipe(requestObj);
}

function defaultConnectHandler(browserRequest, browserSocket, params) {
	var adapter = this, serverOptions = clone(adapter.server);
	var mod = serverOptions.protocol === "http:" ? http : https;
	serverOptions.path = appendArgs(serverOptions.path, params);
	var requestObj = mod.request(serverOptions, function(response){
		response.pipe(browserSocket);
		// response.pipe(process.stdout);
	});
	requestObj.on('error', function(e){
		console.error(e.message);
		console.log(e.stack);
		browserSocket.destroy();
	});
	// 发送请求数据
	browserSocket.pipe(requestObj);
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