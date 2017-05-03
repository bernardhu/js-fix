var fixBase = require('./fixBase.js')
var moment = require('moment')
moment().zone(8);
var util = require('util') 
var path = require('path')

var fields = null;
var messages = null;
var components = null;
var reverseFields = null;
var kFieldSeparator = String.fromCharCode(1);

var default_sender = "client"
var default_recv = "broker"
var default_appid = -1
var send_seq = 1
var beginString = ""
var sesstionBeginString = "8=FIXT.1.1"

var headerFields ={
    "8" : true,
    "9" : true,
    "35": true,
    "49": true,
    "56": true,
    "34": true,
    "52": true,
    "1156": true
}

var tailFields ={
    "93": true,
    "89": true,
    "10": true
}
var optionHeaderFields = {
	  "115": 0
}

function setSender(sender){
    default_sender = sender;
};

function setRecv(recv){
    default_recv = recv;
};

function setAppExtID(appid) {
    default_appid = appid;
}

function setOptionHeaderFields(m) {
    optionHeaderFields = m;
}

function clearOptionHeaderFields() {
	  optionHeaderFields = {}
}

function init(version){
    if(version == '5.0'){
        fixBase.init(path.resolve(__dirname, '../resources/FIX50.xml'))
        fixBase.init(path.resolve(__dirname, '../resources/FIXT11.xml'))
        beginString = '8=FIX.5.0'
    }else if(version == '5.0SP2'){
        fixBase.init(path.resolve(__dirname, '../resources/FIX50SP2.xml'))
        fixBase.init(path.resolve(__dirname, '../resources/FIXT11.xml'))
        beginString = '8=FIX.5.0SP2'
    }
    
    fields = fixBase.getFields();
    messages = fixBase.getMessages();
    components = fixBase.getComponents();
    reverseFields = fixBase.getReverseFields();
    return true
}

function encodeHeader(obj, seq){
    var header = [];

    header.push('35=' + obj.msgtype);
    header.push('52=' + moment().format('YYYYMMDD-HH:mm:ss.SSS'));
    header.push('49=' + default_sender);
    header.push('56=' + default_recv);
    header.push('34=' + seq);
    
    for(var key in optionHeaderFields){  
        header.push(key+'=' + optionHeaderFields[key]); 
    }   
    
    if(default_appid != -1){
    	  header.push('1156=' + default_appid);
    }

    return header.join(kFieldSeparator);
}

function decodeHeader(array){
    var msgtype = "";
    var len = 0;
    for(var i =0; i < array.length; i++){
        var field = array[i];
        var split = field.split("=");
        
        if(split[0] == "35")
            msgtype = split[1];

        if(headerFields[split[0]]== undefined){
            break
        }else{
            len++;
        }
    }

    for(; len>0;len--){
        array.shift();
    }
    return msgtype;
}

function encodeBody(obj){
    var msgType = obj.msgtype;
    var messageTemplate = messages[msgType];
    var body = [];
    
    if(messageTemplate == null){
        return null;
    }

    var _fields = messageTemplate.fields;
    for(var i = 0; i < _fields.length; i ++){
        var desc = _fields[i];
        if(desc[1] == 1){//field
            var field = fields[desc[0]];
            if(obj[desc[0]] != undefined){
                body.push(field.number + "=" + obj[desc[0]]);
            }
        }else if(desc[1] == 3){//component
            encodeCom(obj[desc[0]], body, desc[0])
        }else if(desc[1] == 2){//group
            encodeGroup(obj[desc[0]], body, desc[0])
        }
    }

    return body.join(kFieldSeparator);
}

function decodeGrp(array, len, name){
    var obj = [];
    var com = components[name];
    if(com == undefined)
        throw "decodeGrp unknown grp " + name;

    var decodeMap = com.decodeFields;
    for(var i = 0; i < len; i++){
        var grp = {};
        var item = array[0];
        var fname = item[0];
        var mark = {};

        while(mark[fname] == undefined){
            item = array[0];
            mark[item[0]] = true;

            var entry = decodeMap[item[0]];
            if(entry != undefined){
                array.shift();
                fname = array[0][0];
                if(entry.length == 2){
                    grp[entry[0]] = item[1];
                }else if(entry.length == 1){//com
                    if(grp[entry[2]] == undefined){
                        grp[entry[2]] = {};
                    }
                }else if(entry[1] == 2){
                    var l = Number(item[1]);
                    grp[entry[2]] = decodeGrp(array, l, entry[2]);
                }
            }else{
                break;
            }
        }
        obj.push(grp);
    }

    return obj;
}

function decodeBody(msgtype, array){
    var obj = {};

    var messageTemplate = messages[msgtype];
    if(messageTemplate == undefined)
        return null;

    var decodeMap = messageTemplate.decodeFields;
    while(array.length > 0){
        var item = array[0];
        array.shift();
        if(tailFields[item[0]]== true){
        }else{
            var desc = decodeMap[item[0]];
            if(desc == undefined){
                //console.log("unresolved field "+ item);
                continue;
            }

            if(desc.length == 2){
                obj[desc[0]] = item[1];
            }else if(desc[1] == 1){//com
                if(obj[desc[2]] == undefined){
                    obj[desc[2]] = {}
                }
                obj[desc[2]][desc[0]] = item[1];
            }else if(desc[1] == 2){//group
                var len = Number(item[1]);
                obj[desc[2]] = decodeGrp(array, len, desc[2]);
            }

        }
    }
    return obj;
}

function encodeCom(obj, body, name){
    if(obj == undefined)
        return;

    var comTemplate = components[name];
    if(comTemplate == null){
        return;
    }

    var _fields = comTemplate.fields;
    for(var i = 0; i < _fields.length; i ++){
        var desc = _fields[i];
        var name = desc[0];
        var field = fields[name];
        if(desc[1] == 1){//field
            if(obj[name] != undefined)
                body.push(field.number + "=" + obj[name]);
        }else if(desc[1] == 3){//component
            encodeCom(obj[name], body, name);
        }else if(desc[1] == 2){//group
            encodeGroup(obj[name], body, name);
        }
    }

}

function isAdminMsg(t){
    if((t == "0") || (t == "1") || (t == "2") || (t == "3")|| (t == "4")|| (t == "5") || (t == "A"))
        return true;
    return false;
}


function encodeGroup(obj, body, name){
    if(obj == undefined)
        return;

    var comTemplate = components[name];
    if(comTemplate == null){
        return;
    }

    var len = obj.length;
    if(len  == 0)
        return;

    var field = fields[comTemplate.name];
    body.push(field.number + "=" + len);

    for(var idx = 0; idx< len; idx ++){
        var _fields = comTemplate.fields;
        for(var i = 0; i < _fields.length; i ++){
            var desc = _fields[i];
            var name = desc[0];
            var field = fields[name];
            if(desc[1] == 1){//field
                if(obj[idx][name] != undefined)
                    body.push(field.number + "=" + obj[idx][name]);
            }else if(desc[1] == 3){//component
                encodeCom(obj[idx][name], body, name);
            }else if(desc[1] == 2){//group
                encodeGroup(obj[idx][name], body, name);
            }
        }
    }

}

function encodeTail(str){
    return str + '10=' + checksum(str) + kFieldSeparator
}

function encode(obj){
    var header = encodeHeader(obj, send_seq);
    var body = encodeBody(obj);
    send_seq++;

    var out = [];
    if(isAdminMsg(obj.msgtype)){
        out.push(sesstionBeginString);
    }else{
        out.push(beginString);
    }
    
    out.push('9='+ (header.length + body.length + 2));
    out.push(header);
    out.push(body);

    var outmsg = out.join(kFieldSeparator);
    outmsg += kFieldSeparator;

    return encodeTail(outmsg);
}

function decode(str){
    var array = [];
    var split = str.split(kFieldSeparator);
    
    var msgtype = decodeHeader(split);
    for(var i = 0; i < split.length; i ++){
        var item = split[i].split("=");
        array.push(item);
    }
    //console.log(array);
    //console.log(msgtype);

    return decodeBody(msgtype, array);
}


function getMsgType(str){
    var array = [];
    var split = str.split(kFieldSeparator);
    
    var msgtype = decodeHeader(split);
    //console.log(array);
    //console.log(msgtype);

    return msgtype;
}

function checksum(str) {
    var chksm = 0;
    for (var i = 0; i < str.length; ++i) {
        chksm += str.charCodeAt(i);
    }

    chksm = chksm % 256;

    var checksumstr = '';
    if (chksm < 10) {
        checksumstr = '00' + (chksm + '');
    } else if (chksm >= 10 && chksm < 100) {
        checksumstr = '0' + (chksm + '');
    } else {
        checksumstr = '' + (chksm + '');
    }

    return checksumstr;
};

exports.init = function(version) {
    return init(version);
};

exports.encode = function(obj) {
    return encode(obj);
};

exports.decode = function(str) {
    return decode(str);
};

exports.getMsgType = function(str) {
    return getMsgType(str);
};

exports.setSender = function(val) {
    setSender(val);
};

exports.setRecv = function(val) {
    setRecv(val);
};

exports.setAppExtID = function(val) {
    setAppExtID(val);
};

exports.setOptionHeaderFields = function(val) {
    setOptionHeaderFields(val);
};

exports.clearOptionHeaderFields = function(val) {
    clearOptionHeaderFields(val);
};
