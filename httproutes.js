/**
 * 这个文件提供直接访问代理服务器时的一些接口
 */
const qs = require('querystring');
const url = require('url');

const config = require('./config');
const hostmgt = require('./hostmgt');
const adapters = require('./adapters');
const utils = require('./utils');

const routes = {
	'/ping': function(req, resp){
		resp.setHeader('Content-Type', 'text/json');
		resp.end(JSON.stringify({status: true}));
	},
	'/host/remove': function(req, resp){
		utils.getPostBody(req, function(e, buf){
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

var proxy_pac = (function(){
	return 'function FindProxyForURL(){ return "PROXY ' + config.host + ':' + config.port + '";}';
})();