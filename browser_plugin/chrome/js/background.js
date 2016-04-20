/**
 * chrome 插件的背景页逻辑：
 * 1. 加载配置
 *       |-- 还没有配置数据 --> 不做任何操作
 *       |-- 已经有配置数据 -->
 *                            |-- 如果能连通代理服务器，就设置代理
 *                            |-- 不做任何操作
 * 2. 监听事件
 *       |-- 插件自定义事件
 *       |-- 监听 tab 变化事件，动态调整 popup
 */
(function(){
	var config;
	var hostsCache = {};

	loadConfig(function(config){
		var host = config.server();
		var port = config.port();
		if(host && port) {
			ping(host, port, function(data){
				if(data && data.status === true) {
					cache_hosts();
				}
			});
			if(config.proxy() === true) {
				chrome.proxy.settings.clear({});
				config.proxy(false);
			}
		} else {
			console.log("no proxy set");
		}
	});
	monitorEvents();

	function loadConfig(callback) {
		var key = 'proxy-server';
		chrome.storage.local.get(key, function(o){
			var cfg = o[key] || {};
			config = {
				server: function(host){
					if(typeof host === "undefined") {
						return cfg.host || null;
					} else {
						cfg.host = host;
						saveConfig(key, cfg);
					}
				},
				port: function(port){
					if(typeof port === "undefined") {
						return cfg.port || null;
					} else {
						cfg.port = port;
						saveConfig(key, cfg);
					}
				},
				proxy: function(flag){
					if(typeof flag === "undefined") {
						return cfg.flag || null;
					} else {
						cfg.flag = flag;
						saveConfig(key, cfg);
					}
				}
			};
			callback && callback(config);
		});
	}
	function cache_hosts() {
		var url = 'http://' + config.server() + ':' + config.port() + '/host/list';
		ajax.getJSON(url, function(data){
			if(Array.isArray(data)) {
				data.forEach(function(host){
					hostsCache[host] = 1;
				});
				applyProxy();
			} else {
				console.log('cache hosts failure');
				setTimeout(cache_hosts, 1000);
			}
		});
	}
	function saveConfig(k, v) {
		var o = {};
		o[k] = v;
		chrome.storage.local.set(o);
	}
	function ping(host, port, callback) {
		var url = 'http://' + host + ':' + port + '/ping';
		var timer = setInterval(function(){
			ajax({
				url: url,
				success: onResponse,
				error: onResponse,
				dataType: 'json'
			});
		}, 1000);
		function onResponse(data) {
			if(data && data.status === true) {
				clearInterval(timer);
			}
			callback && callback(data);
		}
	}
	function monitorEvents() {
		// plugin custom events
		chrome.runtime.onMessage.addListener(function(msg, sender, callback){
			var async = false;
			switch(msg.cmd) {
				case 'has-setup': callback(config.server() && config.port()); break;
				case 'query': callback(hostsCache.hasOwnProperty(msg.host)); break;
				case 'add': doAddHost(msg.host, callback); async = true; break;
				case 'remove': doRemoveHost(msg.host, callback); async = true; break;
				case 'setup': doSetup(msg.host, msg.port, callback); async = true; break;
			}
			return async;
		});
		// tabs events
		var activeTabId;
		chrome.tabs.onActivated.addListener(function(info){
			activeTabId = info.tabId;
			chrome.tabs.get(info.tabId, function(tab){
				tab.url && updateLabel(tab.url);
			});
		});
		chrome.tabs.onUpdated.addListener(function(tabId, changes){
			if(tabId === activeTabId && changes.url) {
				updateLabel(changes.url);
			}
		});
	}
	function updateLabel(url) {
		if(!/^(?:https?|ftp)/.test(url)) {
			return chrome.browserAction.disable();
		}
		chrome.browserAction.enable();
	}
	function applyProxy() {
		var url = 'http://' + config.server() + ':' + config.port() + '/proxy.pac';
		chrome.proxy.settings.set({
			value: {
				mode: "pac_script",
				pacScript: {url: url}
			}
		});
		chrome.proxy.onProxyError.addListener(function(e){
			console.log(e);
		});
		config.proxy(true);
	}
	function doSetup(host, port, callback) {
		ping(host, port, function(data){
			if(data && data.status === true) {
				config.server(host);
				config.port(port);
				callback(true);
				cache_hosts();
			} else {
				callback(false);
			}
		});
	}
	function doAddHost(host, callback) {
		var url = 'http://' + config.server() + ':' + config.port() + '/host/add';
		ajax({
			type: 'POST',
			url: url,
			data: 'host=' + host,
			success: callback,
			error: callback,
			dataType: 'json'
		});
		hostsCache[host] = 1;
	}
	function doRemoveHost(host, callback) {
		var url = 'http://' + config.server() + ':' + config.port() + '/host/remove';
		ajax({
			type: 'POST',
			url: url,
			data: 'host=' + host,
			success: callback,
			error: callback,
			dataType: 'json'
		});
		delete hostsCache[host];
	}
})();