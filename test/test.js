var fix = require('../fixjs')
var util = require('util') 

fix.init('5.0SP2');
fix.setAppExtID(10);
var optionHeader = {
	  "115": 99
}
fix.setOptionHeaderFields(optionHeader)
var order = {};
order.msgtype = 'D';
order.ClOrdID = '000001';
order.Parties = [];

var party = {};
party.PartyID = '010100000001';
party.PartyIDSource = '5';
party.PartyRole = '5';
order.Parties.push(party);

party = {};
party.PartyID = '010100000002';
party.PartyIDSource = '5';
party.PartyRole = '5';
party.PtysSubGrp = [];

var item= {}
item.PartySubID = 'aa';
item.PartySubIDType = '15';
party.PtysSubGrp.push(item);

item= {}
item.PartySubID = 'aa';
item.PartySubIDType = '15';
party.PtysSubGrp.push(item);
order.Parties.push(party);

order.Instrument = {};
order.Instrument.SecurityID = '000776';
order.Instrument.SecurityIDSource = '102';
order.Side = '1';
order.OrderQtyData = {};
order.OrderQtyData.OrderQty = 10;
order.OrdType = '2';
order.Price=9.5;
order.TimeInForce = '0';

console.log("===================order======")
console.log(util.inspect(order, false, 6, false));
var str = fix.encode(order);
console.log("===================fix str======");
console.log(str);

var order2 = fix.decode(str);
console.log("===================decode order======");
console.log(util.inspect(order2, false, 6, false));

order = {}
order.msgtype = 'A';
order.Username = 'admin';
order.Password = 'admin';
order.RawDataLength = 3;
order.RawData = '123';
var str = fix.encode(order);
console.log(str);

console.log("===================start prof========");
var start = new Date().getTime();
for(var i = 0; i<5000; i++){
    str = fix.encode(order);
}
var end = new Date().getTime();
console.log("=====encode 5000 use "+ (end - start) + "ms");

start = new Date().getTime();
for(var i = 0; i<5000; i++){
    order2 = fix.decode(str);
}
end = new Date().getTime();
console.log("=====decode 5000 use "+ (end - start) + "ms");


order = {}
order.msgtype = 'A';
order.EncryptMethod = 0;
order.HeartBtInt = 0;
order.DefaultApplVerID = 'FIX5.0.SP2'
str = fix.encode(order);
console.log(str);
order = {}
order.msgtype = '3';
order.RefSeqNum = 0;
str = fix.encode(order);
console.log(str);
