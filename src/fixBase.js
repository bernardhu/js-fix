var sax = require('sax')
var fs = require('fs')
//var path = require('path')
//var xmlFile = path.resolve(__dirname, '../resources/FIX50.xml')
var util = require('util')

var headers = {}
var messages = {}
var tailer = {}
var fields = {}
var reverseFields = {}
var components = {}

var curMessage = {}
var curComponent = {}
var curField = {}
var curGroup = {}

//fs.readFile(xmlFile, function (er, d) {
//    if (er) throw er
//    var xmlstr = d.toString('utf8')
function init(xmlFile){
    var xmlstr = fs.readFileSync(xmlFile,'utf-8');
    var parser = sax.parser(true)

    var products = []
    var product = null
    var currentTag = null
    var depth = 0

    var major = ""
    var minor = ""
    var block = ""
    var map = null

    parser.onclosetag = function (tagName) {
        depth = depth -1;

        if(depth == 1){
            block = ""
        }else if(depth == 2){
            if(block == "messages"){
                var out = util.inspect(curMessage, false, 4, true)
                //console.log(out)
            }else if(block == "components"){
                var out = util.inspect(curComponent, false, 4, false)
                //console.log(out)
            }else if(block == "fields"){
                var out = util.inspect(curField, false, 4, true)
                //console.log(out)
            }
            curMessage = null
            curComponent = null
            curField = null
        }else if(depth == 3){
            curGroup = null
        }
    }

    parser.onopentag = function (tag) {
        //console.log("onopentag")
        //console.log(tag)
        depth = depth + 1

        if(depth == 1){
            major = tag.major;
            minor = tag.minor;
        } else if(depth == 2){
            block = tag.name;
            if(block == "header"){
                map = headers
            }else if(block == "messages"){
                map = messages
            }else if(block == "tailer"){
                map = tailer
            }else if(block == "components"){
                map = components
            }else if(block == "fields"){
                map = fields
            }
        } else if(depth == 3){
            var name = tag.attributes.name;
            if(block == "messages"){
                map[tag.attributes.msgtype] = {}
                curMessage = map[tag.attributes.msgtype]
                curMessage.msgtype = tag.attributes.msgtype
                curMessage.fields = []
            } else if(block == "components"){
                map[tag.attributes.name] = {}
                curComponent = map[tag.attributes.name]
                curComponent.name = tag.attributes.name
                curComponent.fields = []
                curComponent.isGroup = false
            } else if(block == "fields"){
                map[tag.attributes.name] = {}
                curField = map[tag.attributes.name]
                curField.name = tag.attributes.name
                curField.type = tag.attributes.type
                curField.number = tag.attributes.number
                reverseFields[tag.attributes.number] = curField
            }
        } else if(depth == 4){
            var name = tag.attributes.name;
            if(block == "messages"){
                if(tag.name == "field"){
                    curMessage.fields.push([name, 1])
                }else if(tag.name == "group"){
                    //curGroup = {}
                    //curGroup.name = name
                    //curGroup.fields = []
                    //curMessage.fields.push([curGroup, 2])
                }else if(tag.name == "component"){
                    curMessage.fields.push([name,3])
                }
            } else if(block == "components"){
                if(tag.name == "field"){
                    curComponent.fields.push([name,1])
                }else if(tag.name == "group"){
                    curGroup = []
                    curComponent.name = name
                    curComponent.fields = curGroup
                    curComponent.isGroup = true
                }else if(tag.name == "component"){ 
                    curComponent.fields.push([name,3])  
                }
            }
        } else if(depth == 5){
            var name = tag.attributes.name;
            if(curGroup){
                if(tag.name == "field"){
                    curGroup.push([name,1])
                }else{
                    curGroup.push([name,3])
                }
            }
        }
    }

    parser.ontext = function (text) {
    }

    function addGrpField(decodeFields, name){
        var com = components[name];
        var _field = fields[com.name];

        decodeFields[_field.number] = [com.name, 2, name]
    }
    
    function addComField(decodeFields, name){
        var com = components[name];
        for(var i = 0 ; i < com.fields.length; i++){
            var item = com.fields[i];
            if(item[1] == 1){
                var num = fields[item[0]].number;
                decodeFields[num] = [item[0],1, name];
            }else if(item[1] == 2){//group
                addGrpField(decodeFields, item[0]);
            }
        }
    }
    
    parser.onend = function () {
        for(var key in messages){
            var _fields = messages[key].fields;
            for(var i = 0 ; i < _fields.length; i++){
                var field = _fields[i];
                if(field[1] == 3){//com
                    var name = field[0];
                    var comp = components[name];
                    if(comp.isGroup == true){
                        field[1] = 2;//set to group
                    }
                }
            }
            
            var decodeFields = {}
            messages[key].decodeFields = decodeFields;
            for(var i = 0 ; i < _fields.length; i++){
                var item = _fields[i];
                if(item[1] == 1){
                    var num = fields[item[0]].number;
                    decodeFields[num] = [item[0],1];
                }else if(item[1] == 2){//group
                    addGrpField(decodeFields, item[0]);
                }else if(item[1] == 3){//com
                    addComField(decodeFields, item[0]);
                }
            }
        }
        
        for(var key in components){
            var _fields = components[key].fields;
            for(var i = 0 ; i < _fields.length; i++){
                var field = _fields[i];
                if(field[1] == 3){//com
                    var name = field[0];
                    var comp = components[name];
                    if(comp.isGroup == true){
                        field[1] = 2;//set to group
                    }
                }
            }
        }
        
        for(var key in components){
            var _fields = components[key].fields;
            var decodeFields = {}
            components[key].decodeFields = decodeFields;
            for(var i = 0 ; i < _fields.length; i++){
                var item = _fields[i];
                if(item[1] == 1){
                    var num = fields[item[0]].number;
                    decodeFields[num] = [item[0],1];
                }else if(item[1] == 2){//group
                    addGrpField(decodeFields, item[0]);
                }else if(item[1] == 3){//com
                    addComField(decodeFields, item[0]);
                }
            }
        }

        var out = util.inspect(messages['D'], false, 3, false)
        //console.log(out)
        out = util.inspect(fields, false, 3, false)
        //console.log(out)
        out = util.inspect(components['Parties'], false, 6, false)
        //console.log(out)
    }

    parser.write(xmlstr).end()
    return true
}
    
exports.init = function(xmlFile) {
    return init(xmlFile);
};    

exports.getMessages = function() {
    return messages;
};

exports.getComponents = function() {
    return components;
};

exports.getFields = function() {
    return fields;
};

exports.getReverseFields = function() {
    return reverseFields;
};
