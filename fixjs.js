var codec = require('./src/codec');

exports.init = function(version) {
    return codec.init(version);
};

exports.encode = function(obj) {
    return codec.encode(obj);
};

exports.decode = function(str) {
    return codec.decode(str);
};

exports.getMsgType = function(str) {
    return codec.getMsgType(str);
};

exports.setSender = function(sender) {
    codec.setSender(sender);
};

exports.setRecv = function(recv) {
    codec.setRecv(recv);
};

exports.setAppExtID = function(appid) {
    codec.setAppExtID(appid);
};

exports.setOptionHeaderFields = function(val) {
    codec.setOptionHeaderFields(val);
};

exports.clearOptionHeaderFields = function(val) {
    codec.clearOptionHeaderFields(val);
};
