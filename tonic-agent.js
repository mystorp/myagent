const url = require('url');
const fs = require('fs');

const PORT = 3000;

var agentAdapter = require('./agentadapter');

if(module === require.main) {
  startProxyServer();
}

// 简单代理请求
function doRequest(browserRequest, browserResponse) {
  if(browserRequest.url.indexOf('http') !== 0) {
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
function serilizeHttpHeader(request) {
  var buf = [], k, headers;
  var parts = url.parse(request.url);
  buf.push(request.method + " " + parts.path + " HTTP/" + request.httpVersion + "\r\n");
  headers = request.headers;
  for(k in headers) {
    if(headers.hasOwnProperty(k)) {
      // 所有以 proxy- 为前缀的头都去掉
      buf.push(normalize(k.replace('proxy-', '')) + ': ' + headers[k] + "\r\n");
    }
  }
  buf.push("\r\n");
  return buf.join('');
  function normalize(key) {
    var parts = key.split('-');
    parts.forEach(function(v, i, a){
      a[i] = v.charAt(0).toUpperCase() + v.substring(1);
    });
    return parts.join('-');
  }
}

var hosts = require('./hosts');
function getAdapterFor(host) {
  var h, adapters, ret, find = false;
  host = host.split('.');
  host = host[host.length - 2] + '.' + host[host.length - 1];
  for(h in hosts) {
    if(h.indexOf(host) > -1) {
      find = true;
      break;
    }
  }
  if(find) {
    adapters = hosts[h];
  }
  if(!adapters) {
    adapters = "direct";
  }
  console.log('load adapter', adapters, "for", host);
  ret = agentAdapter.getAdapter(adapters);
  return ret;
}


function startProxyServer() {
  var server = require('http').createServer();
  server.on('request', doRequest);
  server.on('connect', doConnect);
  server.listen(PORT);
  console.log("proxy server started at: http://127.0.0.1:" + PORT);
}
