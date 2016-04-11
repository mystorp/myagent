var config = require('./config');

var currentDebugLevel = config.debug === true ? 0 : config.debug;
if(typeof currentDebugLevel !== "number") {
	currentDebugLevel = 0;
}

exports.debug = debug;
exports.ensureArray = ensureArray;

function debug(level, msg) {
	if(typeof level === "string") {
		msg = level;
		level = 0;
	}
	if(level >= currentDebugLevel) {
		console.log(msg);
	}
}

// 使用分隔符定义的数组
const stringifyarrayre = /,\s+/;
function ensureArray(s) {
	var parts, i, len;
	if(typeof s !== "string") {
		return s;
	}
	if(stringifyarrayre.test(s)) {
		parts = s.split(stringifyarrayre);
	} else {
		parts = [s];
	}
	for(;i<len;i++) {
		parts[i] = parts[i].trim();
	}
	return parts;
}
/* 之前写的，暂时用不上 */
function parseHeader(reader, callback) {
	var resp = {headers: {}}, bytes = [], endIndex;
	var endCount = 0;
	reader.on('data', onData);
	reader.on('end', onEnd);
	function onData(chunk) {
		var i = 0, len = chunk.length;
		var endstr = "\r\n", j = endIndex || 0;
		for(;i<len;i++) {
			if(chunk[i] === endstr.charAt(j)) {
				j++;
			} else {
				j = 0;
				endCount = 0;
				bytes.push(chunk[i]);
			}
			if(j === endstr.length) {
				if(bytes.length > 0) {
					parseLine(new Buffer(bytes).toString());
					bytes = [];
				}
				endCount++;
			}
			if(endCount === 2) {
				reader.unshift(chunk.slice(i + 1));
				reader.removeListener('data', onData);
				reader.removeListener('end', onEnd);
				callback(null, resp);
			}
		}
		endIndex = j;
	}
	function onEnd() {
		reader.removeListener('data', onData);
		reader.removeListener('end', onEnd);
		if(bytes.length > 0) {
			reader.unshift(new Buffer(bytes));
		}
		callback(null, {statusCode: 200, header: {}});
	}
	function parseLine(s) {
		var parts;
		console.log('parse header line:', s);
		if(s.indexOf('HTTP/') === 0) {
			parts = s.split(' ');
			resp.httpVersion = parts[0];
			resp.statusCode = parseInt(parts[1]);
			resp.statusMessage = parts[2];
		} else {
			parts = s.split(': ');
			resp.headers[parts[0]] = parts[1];
		}
	}
}

/* 之前写的，暂时用不上 */
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