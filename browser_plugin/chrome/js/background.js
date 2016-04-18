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
			// cache all fq hosts
		} else {
			console.log("尚未配置代理服务器");
		}
	});

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
				monitorEvents();
			} else {
				console.log('没有获取到需要翻墙的主机列表 ');
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
		ajax({
			method: 'POST',
			url: url,
			success: callback,
			error: callback,
			dataType: 'json'
		});
	}
	function monitorEvents() {
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
			method: 'POST',
			url: url,
			data: 'host=' + host,
			success: callback,
			error: callback,
			dataType: 'json'
		});
	}
	function doRemoveHost(host) {
		var url = 'http://' + config.server() + ':' + config.port() + '/host/remove';
		ajax({
			method: 'POST',
			url: url,
			data: 'host=' + host,
			success: callback,
			error: callback,
			dataType: 'json'
		});
	}
})();