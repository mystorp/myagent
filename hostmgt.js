var config = require('./config');
var fs = require('fs');
var path = require('path');

var adapters = require('./adapters');

var HOST_FILE = path.join(__dirname, 'hosts');
var host_cache = init();

exports.addHost = addHost;
exports.hasHost = hasHost;
exports.updateHost = updateHost;
exports.removeHost = removeHost;
exports.listHost = listHost;
exports.getAdapterFor = getAdapterFor;

function init() {
	var hostsfile = fs.readFileSync(HOST_FILE, 'utf-8');
	var outhosts = {};
	hostsfile.split('\n').forEach(function(h){
		h = h.trim();
		outhosts[h] = 1;
	});
	return outhosts;
}

function save() {
	var list = Object.keys(host_cache);
	list.sort();
	fs.writeFile(HOST_FILE, list.join('\n'));
}

function addHost(host) {
	if(!host_cache.hasOwnProperty(host)) {
		host_cache[host] = 1;
		save();
	}
}

function hasHost(host) {
	return host_cache.hasOwnProperty(host);
}

function updateHost(host) {
	//
}

function removeHost(host) {
	if(host_cache.hasOwnProperty(host)) {
		delete host_cache[host];
		save();
	}
}

function listHost() {
	return Object.keys(host_cache);
}

function getAdapterFor(host) {
	//
}