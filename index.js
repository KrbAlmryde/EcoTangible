var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    // A doubt, unsure if this is going to work...
    sParser = require("serialport").parsers,
    SerialPort = require("serialport").SerialPort,

    // configure our ports
    iport = process.env.PORT || 5000,
    port = "/dev/cu.usbmodem1411" // "/dev/tty.usbmodem1411"



//============== Setting up the Server
app.get('/', function(req, res) {
    console.log("get request from homepage");
    // res.send('GET: Hello, World!');
    res.sendFile(__dirname + '/public/index.html');
});

app.get(/^(.+)$/, function(req, res) {
    res.sendFile(__dirname + '/public/' + req.params[0]);
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something done gone'n broke yo");
});

server.listen(iport, function(){
    console.log('Listening on ' + iport);
});


// //============== Listening for connection from Arduino...
console.log("my serialport is", port);

var sp = new SerialPort(port, {
    baudrate: 9600,
    parser: sParser.readline("\n")
});


sp.on('open', function(){ console.log("THE PORT IS OPEN!!!") });
sp.on('close', function() { console.log("Shutting Down");  });
sp.on('error', function() { console.log("Fuck there was an error"); });

sp.on('data', function(data) {
    if (data.length > 2){
        console.log(data);
        io.emit('arduino', data)
    }
});

