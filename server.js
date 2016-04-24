    // Server things
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),

    // Serial Port related stuffs
    SerialPort = require("serialport").SerialPort,
    sParser = require("serialport").parsers,

    // File loading and management stuff
    d3 = require('d3'),
    Promise = require('promise'),
    fs = require('fs'),

    // configure our ports
    iport = process.env.PORT || 5000,
    port = "/dev/cu.usbmodem1411" // "/dev/tty.usbmodem1411"



//  ============== Setting up the Server ===============

function ServerSetup() {
    /*------------------------------------------------------------------------*
     *
     *  Purpose:
     *
     *
     *    Input:
     *
     *   Output: none
     *
     *------------------------------------------------------------------------*/

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

    server.listen(iport, function() {
        console.log('Listening on ' + iport);
    });

} // End of ServerSetup



ServerSetup();


//  ============== Listening for connection from Arduino...

function ArduinoSetup() {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: Opens connection to serial port with Arduino
     *
     *
     *    Input: none
     *
     *   Output: none
     *
     *------------------------------------------------------------------------*/

    console.log("my serialport is", port);

    var sp = new SerialPort(port, {
        baudrate: 9600,
        parser: sParser.readline("\n")
    });


    sp.on('open', function() {
        console.log("THE PORT IS OPEN!!!")
    });
    sp.on('close', function() {
        console.log("Shutting Down");
    });
    sp.on('error', function() {
        console.log("Failed to connect to Serial Port", port);
    });

    sp.on('data', function(data) {
        if (data.length > 2) {
            console.log(data);
            io.emit('arduino', data)
        }
    });


} // End of ArduinoSetup

ArduinoSetup()



// ================  DATA MANAGEMENT FUNCTIONS  ==============
//  Idea here is to do all the data processing on the server side,
//  then just serve it up as needed or when specifically requested
//  rather than store it all on the browser...

function readFile(filename) {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: A simple file reader
     *
     *
     *    Input: filename - String: Qualified filename
     *
     *   Output: returns a function with a resolve, reject parameters,
     *           yeidling a promise
     *
     *------------------------------------------------------------------------*/

    return function(resolve, reject) {
        fs.readFile(filename, 'utf8', function(err, data) {
            if (err) reject(data);
            resolve(data);
        });
    }

} // End of readFile


function processDataResults(results) {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: Processes tab-seperated string data into an Array of objects
     *           Prepares data to be sent to the client
     *
     *    Input: A string
     *
     *   Output: None
     *
     *------------------------------------------------------------------------*/

    console.log('result is', typeof results[0], typeof results[1]);

    var FloodLevelsByTime,
        MatrixByTime, // Really just Depth by time...
        maxDepth = minDepth = 0;

    var data = d3.tsv.parse(results[0], function(d) {
        if (maxDepth < +d.depth)
            maxDepth = +d.depth;
        if (minDepth > +d.depth)
            minDepth = +d.depth;
        return {
            depth: +d.depth,
            time: +d.time,
            x: +d.x,
            y: +d.y
        }
    })


    var elevation = JSON.parse(results[1]);
    var FloodLevelsByTime = d3.nest() // [ {key '#', values: '[ {depth: #, },* ]'}]
        .key(function(d) {
            return d.time
        })
        .entries(data)

    console.log("FloodLevelsByTime", FloodLevelsByTime.length);

    var MatrixByTime = FloodLevelsByTime.map(function(dBt, i) {
        // console.log("dbT", dBt.key, dBt.values.length, i+1);
        var nData = d3.range(24).map(function(d) {
            return d3.range(25)
        })

        dBt.values.forEach(function(d) {
            nData[+d.x][+d.y] = d
        })
        nData[23] = d3.range(25).map(function(d) { return {depth:0} })
        nData[24] = d3.range(25).map(function(d) { return {depth:0} })
        // console.log(nData);
        // dBt.values = nData;
        return nData; //dBt.values;
    })



    handleClientRequest(elevation, FloodLevelsByTime, MatrixByTime)

} // End of processDataResultsData


function handleClientRequest(elevation, nested, matrix) {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: Handles client requests for data.
     *
     *
     *    Input: Takes an object containing the standing water data
     *
     *   Output: none
     *
     *------------------------------------------------------------------------*/


    // console.log("handleClientRequest", elevation, nested, matrix);
    var scale = d3.scale.linear().domain([0, 240]).range([0, 24])


    var scaleXY = function(index) {
        var y = Math.floor( scale( Math.floor(index/240) ) );
        var x = Math.floor(scale( index%240 ));
        return {x:x, y:y}

    }

    io.on('connection', function(socket) {
        socket.emit("onCreate", "Yo");

        socket.on('byTimeIndex', function(time) {
            console.log('server: time index received', time);
            var tSlice = d3.range(240*240).map(function(index) {

                var xy = scaleXY(index);

                // console.log('we at', index, xy, matrix[time][xy.x][xy.y] );
                var value = matrix[time][xy.x][xy.y].depth * 0.0033;
                return value ? value: 0;
            })
            socket.emit('timeSliceData', {time: time, data: tSlice});

        })

    })


} // End of asd


function computerXYCoords(index, resolution) {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: computer the x/y coordiantes in terrain space?
     *
     *
     *    Input: index value
     *
     *   Output: none
     *
     *------------------------------------------------------------------------*/
    var y = Math.floor(index/resolution);
    var x = index%resolution;
    return [x, y]
} // End of computerXYCoords


// =================== START OF MAIN ================

var deferred = [
    new Promise(readFile('data/standingWater.tsv')),
    new Promise(readFile('data/blueIslandElevation.json'))
]

Promise.all(deferred).then(processDataResults) ;
