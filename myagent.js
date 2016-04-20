var url = require('url');
var fs = require('fs');
var net = require('net');

var config = require('./config');
var httpRoutes = require('./httproutes');
var agentAdapter = require('./adapters');

if(module === require.main) {
	startProxyServer();
}

function startProxyServer() {
	var server = require('http').createServer();
	server.on('request', doRequest);
	server.on('connect', doConnect);
	server.listen(config.port, config.host);
	console.log("proxy server started at: http://127.0.0.1:" + config.port);
}

// 简单代理请求
function doRequest(browserRequest, browserResponse) {
	if(browserRequest.url.indexOf('/') === 0) {
		httpRoutes.onRequest(browserRequest, browserResponse);
		return;
	}
	console.log('request:', browserRequest.url);
	var parts = url.parse(browserRequest.url);
	var params = {header: 'on'};
	var options = {
		protocol: parts.protocol,
		hostname: parts.hostname,
		port: parts.port ? parts.port : parts.protocol === "http:" ? 80 : 443,
		path: parts.path,
		method: browserRequest.method,
		headers: filterHeader(browserRequest)
	};
	params.host = options.hostname;
	params.port = options.port;
	var adapter = getAdapterFor(options.hostname);
	adapter.requestHandler(browserRequest, browserResponse, options, params);
}

// 隧道代理请求
function doConnect(req, socket, head){
	console.log('connect:', req.url);
	var parts = url.parse('http://' + req.url);
	var options = {
		host: parts.hostname,
		port: parts.port
	};
	var adapter = getAdapterFor(parts.hostname);
	adapter.connectHandler(req, socket, options);
	socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
	socket.write(head);
}

function filterHeader(request) {
	var ret = {}, h, o = request.headers;
	for(h in o) {
		if(o.hasOwnProperty(h)) {
			ret[h.replace('proxy-', '')] = o[h];
		}
	}
	return ret;
}


function getAdapterFor(host) {
	var adapters, ret, find = false;
	// 所有多级域名转换为一级域名
	if(!net.isIP(host)) {
		host = host.split('.');
		host = host[host.length - 2] + '.' + host[host.length - 1];
	}
	
	return agentAdapter.getAdapterFor(host);
}

