/**
 * 这个文件提供直接访问代理服务器时的一些接口
 */
var qs = require('querystring');
var url = require('url');
var net = require('net');

var config = require('./config');
var hostmgt = require('./hostmgt');
var adapters = require('./adapters');
var utils = require('./utils');

var routes = {
	'/ping': function(req, resp){
		resp.setHeader('Content-Type', 'text/json');
		resp.end(JSON.stringify({status: true}));
	},
	'/host/remove': function(req, resp){
		utils.getPostBody(req, function(e, buf){
			utils.debug('remove host: ' + buf.toString());
			var body = toQuery(buf);
			if(body.host) {
				hostmgt.removeHost(body.host);
			}
			resp.setHeader('Content-Type', 'text/json');
			resp.end(JSON.stringify({status: true}));
		});
	},
	'/host/add': function(req, resp){
		utils.getPostBody(req, function(e, buf){
			utils.debug('add host: ' + buf.toString());
			var body = toQuery(buf);
			if(body.host) {
				hostmgt.addHost(body.host);
			}
			resp.setHeader('Content-Type', 'text/json');
			resp.end(JSON.stringify({status: true}));
		});
	},
	'/host/list': function(req, resp){
		resp.setHeader('Content-Type', 'text/json');
		resp.end(JSON.stringify(hostmgt.listHost()));
	},
	'/adapter/list': function(req, resp){
		resp.setHeader('Content-Type', 'text/json');
		resp.end(JSON.stringify(adapters.getAdapterNames()));
	},
	'/proxy.pac': function(req, resp){
		resp.setHeader('Content-Type', 'application/x-ns-proxy-autoconfig');
		resp.end(proxy_pac);
	}
};

exports.onRequest = onRequest;

function onRequest(req, resp) {
	var parts = url.parse(req.url, true);
	var router = parts.pathname.toLowerCase();
	req.query = parts.query;
	if(routes.hasOwnProperty(router)) {
		try {
			routes[router](req, resp);
		} catch(e) {
			resp.writeHead(500);
			resp.end(e.message);
		}
	} else {
		resp.writeHead(404);
		resp.end("Page Not Found");
	}
}

function toQuery(buf) {
	return buf ? qs.parse(buf.toString()) : {};
}

function normalizeHost(host) {
	if(!net.isIP(host)) {
		host = host.split('.');
		host = host[host.length - 2] + '.' + host[host.length - 1];
	}
	return host;
}

var proxy_pac = (function(){
	function FindProxyForURL(url, host) {
		var locals = ["127.0.0.1", "localhost", "::1"];
		var i = 0, len = locals.length;
		for(;i<len;i++) {
			if(locals[i] === host) {
				return "DIRECT";
			}
		}
		return "PROXY {addr}";
	}
	return FindProxyForURL.toString().replace('{addr}', config.host + ':' + config.port);
})();