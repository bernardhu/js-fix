var fix = require('../fixjs')
var util = require('util') 

fix.init('5.0SP2')
var order = {};
order.msgtype = '8';
order.ClOrdID = '000001';
order.Parties = [];

var party = {};
party.PartyID = '010100000001';
party.PartyIDSource = '5';
party.PartyRole = '5';
order.Parties.push(party);

order.ExecID = '000001';
order.OrdStatus = 'N';
order.Instrument = {};
order.Instrument.SecurityID = '000776';
order.Instrument.SecurityIDSource = '102';
order.Side = '1';
order.OrderQtyData = {};
order.OrderQtyData.OrderQty = 20;
order.OrdType = '2';
order.Price=9.5;
order.TimeInForce = '0';

order.LastPx = '5.7';
order.LastQty = 10;
order.CumQty = 10;
order.LeavesQty = 10;

console.log("===================exec======")
console.log(util.inspect(order, false, 6, false));
var str = fix.encode(order);
console.log("===================fix str======");
console.log(str);

order2 = fix.decode(str);
console.log("===================decode exec======");
console.log(util.inspect(order2, false, 6, false));

//cancel request
order = {};
order.msgtype = 'F';
order.ClOrdID = '000001';
order.Side = '1';
order.Instrument = {};
order.Instrument.SecurityID = '000776';
order.Instrument.SecurityIDSource = '102';
order.OrderQtyData = {};
order.OrderQtyData.OrderQty = 20;
order.OrigClOrdID = '000001';

order.Parties = [];
party = {};
party.PartyID = '010100000001';
party.PartyIDSource = '5';
party.PartyRole = '5';
order.Parties.push(party);



console.log("===================cancel======")
console.log(util.inspect(order, false, 6, false));
var str = fix.encode(order);
console.log("===================fix str======");
console.log(str);

order2 = fix.decode(str);
console.log("===================decode exec======");
console.log(util.inspect(order2, false, 6, false));


//cancel reject
order = {};
order.msgtype = '9';
order.ClOrdID = '000001';
order.OrigClOrdID = '000001';
order.OrdStatus = 'N';
order.CxlRejReason = '';
order.Instrument = {};
order.Instrument.SecurityID = '000776';
order.Instrument.SecurityIDSource = '102';

console.log("===================cancel reject======")
console.log(util.inspect(order, false, 6, false));
var str = fix.encode(order);
console.log("===================fix str======");
console.log(str);

order2 = fix.decode(str);
console.log("===================decode exec======");
console.log(util.inspect(order2, false, 6, false));

