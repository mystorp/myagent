const url = require('url');
const fs = require('fs');
const net = require('net');

const config = require('config');

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
		// TODO:
		// 这种方式，需要把服务器设置为 http 服务器
		// 为了方便浏览器插件使用，需要添加如下接口
		//  - 查询 adapter
		//  - 查询 hosts.json
		//  - 设置某 host 的 adapter
		browserResponse.writeHead(403);
		browserResponse.end("error");
		return;
	}
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

