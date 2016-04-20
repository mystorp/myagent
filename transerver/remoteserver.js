/**
 * 这个文件用于 tonicdev 作为代理接口
 * 需要代理的时候发送 post 请求到此接口
 * post 格式为：
 *     |    JSON    |
 *     |   boundry  |
 *     | post请求体 |
 * JSON 表示原始请求信息，需要封装为可直接供 http.request 调用的格式
 * [boundry] 表示原始请求信息和请求体的分界串
 * [post请求体] 表示原始请求的请求体
 * post 请求的时候需要同时加上 query 参数 boundry 指示响应内容中响应信息和响应内容的分界串
 * 举例：
 *   https://tonicdev.io/aaronzhang/570140c376f90a11000927ab/branches/master?boundry=fdsakfjweiofdska;fkjdsf
 */
var urllib = require('url');
var net = require('net');
var http = require('http');
var https = require('https');

var DEBUG_PORT = 4000;

exports.tonicEndpoint = onRequest;
if(module === require.main) {
	main();
}

function requestHandler(originRequest, originResponse) {
	var prevIndex, dataflow = [];
	var options;
	originRequest.on('data', onData);
	originRequest.on('end', onEnd);
	function onData(chunk) {
		var i = 0, len = chunk.length, find = false;
		var bstr = "\r\n", j = prevIndex || 0;
		for(;i<len;i++) {
			if(chunk[i] === bstr.charAt(j)) {
				j++;
			} else {
				j = 0;
			}
			if(j === bstr.length) {
				find = true;
				break;
			}
		}
		dataflow.push(chunk);
		if(find) {
			chunk = Buffer.concat(dataflow);
			options = JSON.parse(chunk.slice(0, i - j + 1).toString());
			originRequest.unshift(chunk.slice(i + 1));
			originRequest.removeListener('data', onData);
			originRequest.removeListener('end', onEnd);
			forward();
		}
		prevIndex = j;
	}

	function onEnd() {
		var chunk = Buffer.concat(dataflow);
		originRequest.removeListener('data', onData);
		originRequest.removeListener('end', onEnd);
		try {
			options = JSON.parse(chunk.toString());
			forward();
		} catch(e) {
			originResponse.writeHead(500, e.message);
		}
	}

	function forward() {
		var mod = options.protocol === "http:" ? http: https;
		var req = mod.request(options, function(resp){
			originResponse.writeHead(resp.statusCode, resp.headers);
			resp.pipe(originResponse);
		});
		req.on('error', function(e){
			originResponse.writeHead(500, e.message);
			originResponse.end();
		});
		originRequest.pipe(req);
	}
}

function connectHandler(originRequest, originResponse, params) {
	var socket = net.connect(parseInt(params.port), params.host);
	socket.on('timeout', function(){
		originResponse.writeHead(500);
		originResponse.end("forward server timeout");
	});
	socket.on('error', function(e){
		originResponse.writeHead(500);
		originResponse.end('forward server error:' + e.message);
	});
	originRequest.pipe(socket);
	socket.pipe(originResponse);
}
/*
 * 代理接口，图示：
 *    ===================================
 *                 [  浏览器  ]
 *               /              \
 *    ====== request ========== response ======
 *             |                   |
 *    =========|===================|=====
 *             |[原始代理服务器 ]  |
 *    ====== request ========== response ==========
 *             |                   |
 *    =========|===================|======
 *             | [中转服务器 ]     |
 *    =========|===================|=====
 *          request -------->   response
 * 从类型上来说，代理请求有两种：request, connect
 * request 又需要根据 request.method 分类，也就是有无请求体
 *   有请求体 - 把请求体直接发送给目标 server
 *   无请求体 - 
 * connect 从代码上可以认为和 POST 类似
 *
 * 从数据传输角度来说，上层节点（就是原始代理服务器）在请求初将原始请求包装后发送给中转服务器，中转服务器发送请求后，一字不漏的目标请求返还给原始代理服务器，原始代理服务器再一字不漏的返还给原始请求
 */
function onRequest(originRequest, originResponse) {
	if(originRequest.method !== "POST") {
		originResponse.writeHead(405);
		return originResponse.end('method not allowed');
	}
	var parts = urllib.parse(originRequest.url, true);
	var params = {host: parts.query.host, port: parts.query.port};
	if(/^yes|on|1|ok|true$/.test(parts.query.header)) {
		requestHandler(originRequest, originResponse, params);
	} else {
		connectHandler(originRequest, originResponse, params);
	}
}


function main() {
	var mode = process.argv[2];
	// 仅有此参数的情况才启动服务器
	if(mode === "local") {
		http.createServer(onRequest).listen(DEBUG_PORT);
		console.log('tonic debug server started at: http://127.0.0.1:' + DEBUG_PORT);
	}
}
