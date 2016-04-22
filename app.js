var THREE = require("three");
var serialport = require("serialport"),
    SerialPort = require("serialport").SerialPort;

var port = "/dev/cu.usbmodem1411";

console.log("my port is", port);

var sp = new SerialPort(port, {
    baudrate: 9600,
    parser: serialport.parsers.readline("\n")
})

sp.on('open', function(){ console.log("THE PORT IS OPEN!!!") });
sp.on('data', function(d) { console.log(d); });
sp.on('close', function() { console.log("Shutting Down");  });
sp.on('error', function() { console.log("Fuck there was an error"); });

