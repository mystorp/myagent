(function(){
	var config = (function(storage){
		var key = 'proxy-server', cfg;
		storage.get(key, function(o){
			cfg = o[key] || {}
		});
		return {
			getServer: function(){
				return cfg.host || null;
			},
			getPort: function(){
				return cfg.port || null;
			},
			setServer: function(host){
				cfg.host = host;
				save();
			},
			setPort: function(port){
				save();
			}
		};
		function save() {
			var o = {};
			o[key] = cfg;
			storage.set(o);
		}
	})(chrome.storage.local);
	var proxy_server_available = false;

	chrome.runtime.onMessage.addListener(function(msg, sender, callback){
		switch(msg.cmd) {
			case 'setup': break;
			case 'query': break;
			case 'add': break;
			case 'remove': break;
		}
	});
	isProxyServerStart(function(start){
		proxy_server_available = start;
		if(start) {
			onProxyServerStart();
		} else {
			waitProxyServerStart();
		}
	});
	function onProxyServerStart() {}
	function waitProxyServerStart() {}
	function isProxyServerStart() {}
})();