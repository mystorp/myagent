(function(){
	var host = location.hostname;
	testPluginSetuped();
	window.addEventListener('load', initEvents);

	function $(s) { return document.querySelector(s); }
	function addHost() {
		chrome.sendMessage({cmd: 'add', host: host}, function(ret){
			console.log('添加主机 ' + host + (ret ? ' 成功！' : ' 失败！'));
		});
	}
	function removeHost() {
		chrome.sendMessage({cmd: 'remove', host: host}, function(ret){
			console.log('删除主机 ' + host + (ret ? ' 成功！' : ' 失败！'));
		});
	}
	function hidePopup() {}

	function testPluginSetuped() {
		chrome.runtime.sendMessage({cmd: 'has-setup'}, function(flag){
			if(flag) {
				showInfomation();
			} else {
				$('.setup-container').style.display = "block";
			}
		});
	}
	function showInfomation() {
		$('.setup-container').style.display = "none";
		$('.info-container').style.display = "block";
		chrome.runtime.sendMessage({cmd: 'query', host: host}, function(exists){
			var boxEl = $(exists ? '#info-box' : '#question-box');
			boxEl.style.display = "block";
		});
	}
	function showSetupForm() {
		$('.setup-container > .setup').style.marginLeft = "-300px";
	}
	function submitSetupForm() {
		var server = $('input[name=server]').value;
		var port = $('input[name=port]').value;
		chrome.runtime.sendMessage({cmd: 'setup', host: server, port: port}, function(flag){
			if(flag) {
				showInfomation();
			} else {
				console.log("无法验证此代理服务器");
			}
		});
	}
	function initEvents() {
		document.body.addEventListener('click', function(e){
			var anwser = e.target.id;
			if(!anwser) { return; }
			switch(anwser.substring('anwser-'.length)) {
				case 'yes': addHost(); break;
				case 'cancel': removeHost(); break;
				case 'setup': showSetupForm(); break;
				case 'submit': submitSetupForm(); break;
				case 'no':
				case 'skip-setup':
				case 'good': hidePopup(); break;
			}
		});
	}
})();