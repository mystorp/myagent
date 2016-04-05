const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');

// 传统请求代理
var proxy = http.createServer(function(req, resp) {
  var mod, reqobj;
  var parts = url.parse(req.url);
  var headers = req.headers;
  if(headers.hasOwnProperty('proxy-connection')) {
    headers['connection'] = headers['proxy-connection'];
    delete headers['proxy-connection'];
  }
  var options = {
    method: req.method,
    host: parts.host,
    path: parts.path,
    port: parts.port,
    headers: req.headers
  };
  mod = parts.protocol === "https:" ? https : http;
  reqobj = mod.request(options, function(rresp){
    resp.writeHead(rresp.statusCode, rresp.headers);
    rresp.pipe(resp);
  });
  reqobj.on('error', function(e){
    resp.end(e.stack);
  });
  reqobj.end();
});

// 隧道请求代理
proxy.on('connect', function(req, cltSocket, head) {
  // connect to an origin server
  var srvUrl = url.parse('http://' + req.url);
  var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, function() {
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    srvSocket.write(head);
    srvSocket.pipe(cltSocket);
    cltSocket.pipe(srvSocket);
    srvSocket.on('error', function(e){
      srvSocket.end(e.stack);
    }).on('timeout', function(){
      srvSocket.end('timeout')
    });
  });
});

// now that proxy is running
proxy.listen(1337);
console.log('proxy server started!');