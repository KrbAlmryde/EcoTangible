var width = window.innerWidth,
    height = window.innerHeight;

var scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000),
    renderer = new THREE.WebGLRenderer(),
    Tangibles = new THREE.Object3D(),
    controls;

var Terrain, FloodTerrain, Mosquitos

// var socket = io();
socket.on('arduino', function(data) {
    drawSwale();

})

socket.on('data', function(data) {
    console.log("got it thanks", data);
    socket.emit("got it thanks", {see: data});

})
function Start() {

    new Promise(function(resolve, reject) {

        d3.json("js/assets/blueIslandElevation.json", resolve);

    }).then(function(data){

        console.log("ON CREATE!", data);
        // if (err) console.error('Fuck something is wrong')

        renderer.setSize(width, height);
        renderer.setClearColor(rgbToHex(255, 255, 255))
        document.getElementById('webgl').appendChild(renderer.domElement);

        camera.position.set(0, -100, 30);
        controls = new THREE.TrackballControls(camera, renderer.domElement); {
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
        GenerateGeomHiRes(data);
    })
}


function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}


function drawSwale() {
    var material = new THREE.MeshLambertMaterial({
        color: rgbToHex(0, 250, 0),
        side: THREE.DoubleSide
    });
    var box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 4, 4, 4), material);
    box.position.set(30 - Math.random() * 60, 30 - Math.random() * 60, 0);
    plane.add(box);
}


function GenerateGeomHiRes(data) {

    var extents = d3.extent(data, d => +d.elevation);
    console.log(data, extents);

    var geometry = new THREE.PlaneGeometry(240, 240, 239, 239);
    console.log(geometry.vertices.length);
    for (var i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z = +data[i].elevation - +extents[0]; // this sets the minimum elevation to zero
    }

    // instantiate a loader
    var texture = new THREE.TextureLoader().load('js/assets/fullSizeBlueIsland.png');
    var material = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
    });
    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    render();
}


// =====================  UTILITY FUNCTIONS  =====================  \\

function rgbToHex(R, G, B) {
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}



function configureData(data, mdata) {
    console.log(data);
    data.forEach(function(d) {
        d.depth = +d.depth
        d.time = +d.time
        d.x = +d.x
        d.y = +d.y
        if (_('maxDepth') < d.depth)
            _('maxDepth', d.depth)
        if ( _('minDepth') > d.depth)
             _('minDepth' ,d.depth )
    })
    var nestByTime = d3.nest()
        .key(function(d) { return d.time })
        .entries(data)

    var matrix = nestByTime.map(function(dBt) {
        var nData = d3.range(23).map(function(d) { return d3.range(25) })

        dBt.values.forEach(function(d) { nData[+d.x][+d.y] = d })

        // dBt.values = nData;
        return nData; //dBt.values;
    })


    mdata.forEach(function(d) {
        matrix[ matrix.length - 1 ][+d.x][+d.y]['max'] = d.max
    })


    _("dataByTime", nestByTime)
    _('dataMatrix', matrix)
    console.log(_("dataByTime"));
    console.log("dataMatrix", _('dataMatrix').length, _('dataMatrix'));
}
