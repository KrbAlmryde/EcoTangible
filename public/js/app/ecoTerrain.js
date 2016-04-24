// Google Elevation API Key:  AIzaSyA8swzI1El9SXlLfXMo1XJoEshaQBGoB64
                           // AIzaSyAPsJFH5YgPEBjxTexw2ufMBFYB5jfg2EU
                           // AIzaSyDzeKhQHXoLBjBL_wsqXZUooDLtXtKt9i0
// d3.zip(d3.range(41.674152, 41.676779,0.00001),d3.range(-87.673544, -87.676848, -0.00000009)).length

var queue = d3_queue.queue()
var width  = window.innerWidth,
    height = window.innerHeight;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
var controls;
var outData = [];



function Start(){
    queue
        .defer(d3.tsv, "js/assets/baseElevation.tsv")
        .await(OnCreate)
}

function OnCreate(err, data){
    console.log("ON CREATE!");
    if (err) console.error('Fuck something is wrong')

    ConfigComponents();
    GenerateGeom(data);
}

function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

var ZipedPaths, index = 0, interval;

function initMap() {
    // Our coordinates
    var TopToBottomLeft = [
         {lat: 41.676846, lng: -87.676885},  // Top Left
         {lat: 41.675923, lng: -87.676884},  // Middle Left
         {lat: 41.674976, lng: -87.676843},  // Middle Left1
         {lat: 41.674065, lng: -87.676813}   // Bottom Left
    ]

    var TopToBottomRight = [
        {lat: 41.676888, lng: -87.673560},
        {lat: 41.675482, lng: -87.673530},
        {lat: 41.674635, lng: -87.673501},
        {lat: 41.674130, lng: -87.673497}
    ]

    // // Dont actually want or need a map
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: TopToBottomRight[1],
        mapTypeId: 'terrain'
    });

    // Create an ElevationService.
    var elevator = new google.maps.ElevationService;

    new google.maps.Polyline({
        path: TopToBottomRight,
        strokeColor: '#0000CC',
        opacity: 0.4,
        map: map
    });

    new google.maps.Polyline({
        path: TopToBottomLeft,
        strokeColor: '#CC0000',
        opacity: 0.4,
        map: map
    });
    // Generate the path, using the Elevation service.
    // GeneratePathElevation(TopToBottomLeft, elevator);

    elevator.getElevationAlongPath(
        { 'path': TopToBottomLeft, 'samples': 250 },
        function(result1, status) {
            console.log("status:", status, result1.length, result1);

            elevator.getElevationAlongPath(
                { 'path': TopToBottomRight, 'samples': 250 },
                function(result2, status2) {
                    console.log("status2:", status2, result2.length, result2);

                    ZipedPaths = d3.zip(result1, result2)
                                  .map(function(P){
                                    return   [ { lat: P[0].location.lat(),
                                               lng: P[0].location.lng()
                                             },
                                             { lat: P[1].location.lat(),
                                               lng: P[1].location.lng()
                                             },
                                            ]
                                  })
                    index = 0;
                    console.log("zip results: ", ZipedPaths);

                    interval = setInterval(function() { makeQuery(elevator, ZipedPaths) }, 2000)
            })
    });
}


function makeQuery(elevator, paths) {
        console.log(index, paths[index]);
        var path = paths[index++]

        elevator.getElevationAlongPath(
            { 'path': path, 'samples': 250 },
            function(final, status3) {
                console.log(final, status3);
                outData.push(final)
        })

        if (index >= paths.length){
            clearInterval(interval)
            exportResults();
        }
}


function exportResults(){
    var merged = d3.merge(outData)
                    .map(function(m) {
                        return {
                            elevation: m.elevation,
                            lat: m.location.lat(),
                            lng: m.location.lng()
                        }
                    })
    attachDownload("blueIslandElevation.json", merged);
}


function GeneratePathElevation(path, elevator) {
    var TopToBottomLeft = [
         {lng: 41.676810, lat: -87.676861},  // Top Left
         {lng: 41.675914, lat: -87.676830},  // Middle Left
         {lng: 41.675001, lat: -87.676788},  // Middle Left1
         {lng: 41.674097, lat: -87.676799}   // Bottom Left
    ]

    var TopToBottomRight = [
        {lat: 41.676876, lng: -87.673588},
        {lat: 41.675970, lng: -87.673568},
        {lat: 41.675065, lng: -87.673556},
        {lat: 41.674155, lng: -87.673524}
    ]


  // Create a PathElevationRequest object using this array.
  // Ask for 250 samples along that path.
  // Initiate the path request.
  elevator.getElevationAlongPath({
    'path': path,
    'samples': 250
  }, function(elevations, status) {
        console.log(elevations.length, elevations);
        elevations.map(function(P) {
            console.log("P.lng , top: ", P.location.lng(), top, P.location.lng() === top);
            console.log("\tP.lat , left: ", P.location.lat(), left, P.location.lat() === left);
            console.log("\tP.lat , right: ", P.location.lat(), right, P.location.lat() === right);
            console.log("P.lng , bottom: ", P.location.lng(), bottom, P.location.lng() === bottom, '\n');
            return [
                        {lng: P.location.lng(), lat: left},
                        {lng: P.location.lng(), lat: right}
                    ]
        })
        console.log("status:", status, "\nelevations:", elevations);
  });
}



function ConfigComponents() {
    renderer.setSize(width, height);
    renderer.setClearColor(rgbToHex(255,255,255))
    document.getElementById('webgl').appendChild(renderer.domElement);

    camera.position.set(0, -100, 30);
    controls = new THREE.TrackballControls(camera); {
        controls.rotateSpeed = 4.0;
        controls.zoomSpeed = 1.5;
        controls.panSpeed = 1.0;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = false;
        controls.dynamicDampingFactor = 0.3;

        controls.keys = [65, 83, 68];
        // controls.enabled = true;
    }

    scene.add(new THREE.AmbientLight(0xeeeeee));
}


function GenerateGeom(data) {
    var flattend = dataPrep(data)
    console.log(flattend);

    var geometry = new THREE.PlaneGeometry(60, 60, 23, 23);
    console.log(geometry.vertices.length);
    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
        geometry.vertices[i].z = flattend[i];
        console.log(geometry.vertices[i].z);
    }

    // instantiate a loader
    var texture = new THREE.TextureLoader().load('js/assets/fullSizeBlueIsland.png');
    var material = new THREE.MeshPhongMaterial({ map: texture });
    var plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    render();

}

function dataPrep(data) {
    var dataArray = d3.range(0, 24).map(function(d) { return new Array(24) })
    var flattend = new Array(24*24);
    // console.log(d3.extent(data, d => +d.x ));  // missing an entire row
    // console.log(d3.extent(data, d => +d.y ));
    data.forEach(function(d) {
        // console.log(+d.x, +d.y, +d.elevation);
        dataArray[+d.x][+d.y] = +d.elevation * 0.04;
    })

    var i = 0;
    d3.range(0,24).forEach(function(x) {
        d3.range(0,24).forEach(function(y) {

            flattend[i] = dataArray[x][y] ? dataArray[x][y] : 200 * 0.04;
            // flattend[i] ? flattend[i] : 200.00
            console.log(x,y, flattend[i] )
            i ++
        })
    })

    return flattend;
}


function attachDownload(filename, data) {
    var json = JSON.stringify(data),
        blob = new Blob([json], {type: "application/json"}),
        url = URL.createObjectURL(blob);

    d3.select('#download')
        .append('a')
      .attr('download', filename)
      .attr('href', url)
      .text(filename)
        .append('br')
}

function rgbToHex(R,G,B){
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}
