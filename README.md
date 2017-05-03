js-fix is a library for encoding and decoding FIX protocol in pure JS.
Currently only tested on FIX5.0 & FIX5.0SP2.

## Usage

Pls see below
### Init
   first you need to choose which version the codec run, simply 5.0 stand for Fix5.0 protocol, and 5.0SP2 stand for Fix5.0SP2 protocol.
   eg: init Fix5.0SP2
   var fix = require('fixjs')
   fix.init('5.0SP2')
### Encoding
    first you need to init the FIX object, like: 
    
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

    console.log("===================order======")
    console.log(util.inspect(order, false, 6, false));
    var str = fix.encode(order);
    console.log("===================fix str======");
    console.log(str);

### Decoding

    Con't to encoding, just one code line

    var order2 = fix.decode(str);                      
    console.log("===================decode order======"
    console.log(util.inspect(order2, false, 6, false));


## Installation

    npm install gf-fixjs

## License

MIT.

