var width = window.innerWidth,
    height = window.innerHeight;

var scene, camera, renderer, controls;
var Tangibles, Terrain, FloodPlane, Mosquitos

// var socket = io();

socket.on('nestByTime', function(data) {
    console.log('nestByTime', data);
})



socket.on('arduino', function(data) {
    drawSwale();

})

socket.on('data', function(data) {
    console.log("MatrixByTime", data);
    socket.emit("got it thanks", {see: data});
})

socket.on('nestByTime', function(data) {
    console.log('nestByTime', data);
})





function Start() {

    new Promise(function(resolve, reject) {

        d3.json("js/assets/blueIslandElevation.json", resolve);

    }).then(function(data){

        console.log("ON CREATE!", data);

        scene = new THREE.Scene();
        Tangibles = new THREE.Object3D(),

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(rgbToHex(255, 255, 255))
        document.getElementById('webgl').appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
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
        DrawTerrain(data);
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
    Terrain.add(box);
}


function DrawTerrain(data) {

    var extents = d3.extent(data, d => +d.elevation);
    console.log(data, extents);

    var geometry = new THREE.PlaneGeometry(240, 240, 239, 239);
    console.log(geometry.vertices.length);

    for (var i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z = +data[i].elevation - +extents[0]; // this sets the minimum elevation to zero
    }

    DrawFloodPlane( geometry.clone() );

    // instantiate a loader
    var texture = new THREE.TextureLoader().load('js/assets/fullSizeBlueIsland.png');
    var material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
    Terrain = new THREE.Mesh(geometry, material);
    scene.add(Terrain);

    render();
}



function DrawFloodPlane(geometry) {
    /*------------------------------------------------------------------------*
     *
     *  Purpose: Generates a geometry layer
     *
     *
     *    Input: geometry - THREE.Geometry object with existing verticies
     *
     *   Output: none
     *
     *------------------------------------------------------------------------*/

    var texture = new THREE.TextureLoader().load('js/assets/water.jpg');
    var material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide, color: 0x0044f });
    var FloodPlane = new THREE.Mesh(geometry, material);
    scene.add(FloodPlane)
    render();

} // End of DrawFloodPlane


// =====================  UTILITY FUNCTIONS  =====================  \\

function rgbToHex(R, G, B) {
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}
