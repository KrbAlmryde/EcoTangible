var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    // A doubt, unsure if this is going to work...
    sParser = require("serialport").parsers,
    SerialPort = require("serialport").SerialPort,

    Promise = require('promise'),
    d3 = require('d3'),
    // configure our ports
    iport = process.env.PORT || 5000,
    port = "/dev/cu.usbmodem1411" // "/dev/tty.usbmodem1411"



//  ============== Setting up the Server
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// Exract need to regenerate the Elevation data
app.get('/test', function(req, res) {
    res.sendFile(__dirname + '/public/test.html');
});

// not sure what this does
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



//  ============== Listening for connection from Arduino...
console.log("my serialport is", port);

var sp = new SerialPort(port, {
    baudrate: 9600,
    parser: sParser.readline("\n")
});


sp.on('open', function(){ console.log("THE PORT IS OPEN!!!") });
sp.on('close', function() { console.log("Shutting Down");  });
sp.on('error', function() { console.log("Failed to connect to Serial Port", port); });

sp.on('data', function(data) {
    if (data.length > 2){
        console.log(data);
        io.emit('arduino', data)
    }
});





// ================  Data management functions  ==============
//  Idea here is to do all the data processing on the server side,
//  then just serve it up as needed or when specifically requested
//  rather than store it all on the browser...

var FloodLevelsByTime,
    MatrixByTime;  // Really just Depth by time...

var maxDepth = minDepth = 0;

var x_Scale = d3.scale.linear().domain([0,240]).range([0,24]),
    y_scale = d3.scale.linear().domain([0,240]).range([0,24]);




new Promise( readTSV('data/standingWater.tsv') ).then( handleResult )



// =================== BEGIN FUNCTION DEFINTIONS ================

function readTSV() {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: A simple file reader
     *
     *
     *    Input: Expects a String
     *
     *   Output: returns a function with a resolve, reject parameters,
     *           yeidling a promise
     *
     *------------------------------------------------------------------------*/

    return function (resolve, reject) {
        fs.readFile('data/standingWater.tsv', 'utf8', function (err, data) {
            if (err) reject(data);
            resolve(data);
        });
    }

} // End of readTSV


function handleResult(result) {
    console.log('result is' , typeof result);
    var data = d3.tsv.parse(result, function(d){

        if (maxDepth < +d.depth)
            maxDepth = +d.depth
        if ( minDepth > +d.depth)
             minDepth = +d.depth
        return {
            depth: +d.depth,
            time: +d.time,
            x: +d.x,
            y: +d.y
        }
    })
    console.log('data is', typeof data);

    var FloodLevelsByTime = d3.nest()            // [ {key '#', values: '[ {depth: #, },* ]'}]
        .key(function(d) { return d.time })
        .entries(data)

    var MatrixByTime = FloodLevelsByTime.map(function(dBt) {
        var nData = d3.range(23).map(function(d) { return d3.range(25) })

        dBt.values.forEach(function(d) { nData[+d.x][+d.y] = d })
        // console.log(nData);
        // dBt.values = nData;
        return nData; //dBt.values;
    })

    io.on('connection', function(socket){
        socket.emit("data", MatrixByTime)
        socket.on('got it thanks', function() {
            console.log('cool');
        })
    })
}