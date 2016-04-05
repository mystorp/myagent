const url = require('url');

const PORT = 3000;

var agentAdapter;

if(module === require.main) {
  main();
}

function main() {
  var adapter = process.argv[2];
  if(!adapter) {
    console.error("no adapter\nstop ...");
    return;
  }
  agentAdapter = require('./agentadapter').getAdapter(adapter);
  startProxyServer();
}

// 简单代理请求
function doRequest(originRequest, originResponse) {
  var parts = url.parse(originRequest.url);
  var params = {header: 'on'};
  var options = {
    protocol: parts.protocol,
    hostname: parts.hostname,
    port: parts.port ? parts.port : parts.protocol === "http:" ? 80 : 443,
    path: parts.path,
    method: originRequest.method,
    headers: filterHeader(originRequest)
  };
  params.host = options.hostname;
  params.port = options.port;
  agentAdapter.requestHandler(originRequest, originResponse, options, params);
}

// 隧道代理请求
function doConnect(req, socket, head){
  var parts = url.parse('http://' + req.url);
  var options = {
    host: parts.hostname,
    port: parts.port
  };
  agentAdapter.connectHandler(req, socket, options);
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


function startProxyServer() {
  var server = require('http').createServer();
  server.on('request', doRequest);
  server.on('connect', doConnect);
  server.listen(PORT);
  console.log("proxy server started at: http://127.0.0.1:" + PORT);
}
