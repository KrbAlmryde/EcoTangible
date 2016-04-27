var width = window.innerWidth,
    height = window.innerHeight;

var scene, camera, renderer, controls;
var Tangibles, Terrain, FloodPlane, Mosquitos,
    FillGuage;

var timeIndex = 0, extents;
// var socket = io();

socket.on('nestByTime', function(data) {
    console.log('nestByTime', data);
})

socket.on('arduino', function(data) {
    drawSwale(data);

})

socket.on('data', function(data) {
    console.log("MatrixByTime", data);
    socket.emit("got it thanks", {
        see: data
    });
})


// socket.on('timeSliceData', function(incoming) {
//     // console.log("got the data @ time", incoming.time, incoming.data);
//     var baseZ = 0;
//     for (var i = 0; i < FloodPlane.geometry.vertices.length; i++) {
//         baseZ = Terrain.geometry.vertices[i].z;
//         FloodPlane.geometry.vertices[i].z = baseZ + incoming.data[i] - 0.5;
//     }
//     FloodPlane.geometry.verticesNeedUpdate = true;
//     render();
// })


function Start() {
    var p = d3.select("#demo p")
    FillGuage = loadLiquidFillGauge(10 );

    d3.select('#add').on('click', function() {
        timeIndex += 1;
        DrawMosquitos(50);
        timeIndex = timeIndex > 24 ? 24 : timeIndex;
        p.text('Time Point is ' + timeIndex);
        socket.emit('byTimeIndex', timeIndex);
    })

    d3.select('#subtract').on('click', function() {
        timeIndex -= 1;
        timeIndex = timeIndex < 0 ? 0 : timeIndex;
        p.text('Time Point is ' + timeIndex);
        socket.emit('byTimeIndex', timeIndex);
    })


    new Promise(function(resolve, reject) {

        d3.json("js/assets/blueIslandElevation.json", resolve);

    }).then(function(data) {

        console.log("ON CREATE!", data);

        scene = new THREE.Scene();
        Tangibles = new THREE.Object3D(),
        Mosquitos = new THREE.Object3D(),

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
        scene.add(Tangibles, Mosquitos);
        DrawTerrain(data);
    })
}


function render() {
    controls.update();
    UpdateMosquitoes();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}


function drawSwale(data) {
    console.log(data);
    var x = +data.split(' ')[0],
        y = +data.split(' ')[1],
        id = +data.split(' ')[2],
        color = rgbToHex(0, 250, 0);

    if (id === 0)
        color = rgbToHex(180, 10, 10);
    else if (id === 1)
        color = rgbToHex(10, 180, 10);
    else if (id === 2)
        color = rgbToHex(10, 10, 180);

    if (! Tangibles.getObjectByName( data ) ) {
            var material = new THREE.MeshLambertMaterial({
                color: color,
                side: THREE.DoubleSide
            });
            var box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4, 1, 1, 1), material);
            box.position.set(x, y, id);
            box.name = data;

            Tangibles.add(box);
    }}


function DrawTerrain(data) {

    extents = d3.extent(data, d => +d.elevation);
    console.log(data, extents);

    var geometry = new THREE.PlaneGeometry(60, 60, 239, 239);
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
    Terrain = new THREE.Mesh(geometry, material);

    // DrawFloodPlane(Terrain.geometry.clone());

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

    for (var i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z -= 0.01; // this sets the minimum elevation to zero
    }
    var texture = new THREE.TextureLoader().load('js/assets/water.jpg');
    var material = new THREE.MeshBasicMaterial({
        opacity: 0.03,
        color: 0x0044f
    });
    FloodPlane = new THREE.Mesh(geometry, material);
    scene.add(FloodPlane)
    render();

} // End of DrawFloodPlane


function DrawMosquitos(mosquitoes) {
    mosquitoes = mosquitoes || 50;

    var geometry = new THREE.Geometry();
    for (var i = 0; i < mosquitoes; i++) {
        var vertex = new THREE.Vector3();
            vertex.x += Math.random() * 60 - 30;
            vertex.y += Math.random() * 60 - 30;
            vertex.z += Math.random() * 10;
            vertex.v = new THREE.Vector3( 0, 0, -Math.random() ); // velocity!

        geometry.vertices.push(vertex);
    }

    var sprite = new THREE.TextureLoader().load('js/assets/mosquitto.png');
    var material = new THREE.PointsMaterial( { size: 1, map: sprite, transparent: true } );

    var particles = new THREE.Points(geometry, material);
    particles.sortParticles = true;
    Mosquitos.add(particles);
}



function UpdateMosquitoes() {
    for (var i = 0; i < Mosquitos.children.length; i++) {
        var particles = Mosquitos.children[i];
        for (var p = 0; p < particles.geometry.vertices.length; p++) {
            var mosquito = particles.geometry.vertices[p];
            // console.log(mosquito);
            if ( (mosquito.z < 0) || (mosquito.z > 10))
                mosquito.z = 10;
            if ( (mosquito.x < -30) || (mosquito.x > 30))
                mosquito.x = 0;
            if ( (mosquito.y < -30) || (mosquito.y > 30))
                mosquito.y = 0;

            mosquito.v.x += Math.random() * .05 - .025;
            mosquito.v.y += Math.random() * .05 - .025;
            mosquito.v.z += Math.random() * .05 - .025;
            mosquito.add( mosquito.v );
            console.log(mosquito);
        }
        particles.geometry.verticesNeedUpdate = true;
    }
}


// =====================  UTILITY FUNCTIONS  =====================  \\

function rgbToHex(R, G, B) {
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + toHex(R) + toHex(G) + toHex(B)
}




// ====================== Bullshit ================================= \\
function liquidFillGaugeDefaultSettings() {
    return {
        minValue: 0, // The gauge minimum value.
        maxValue: 100, // The gauge maximum value.
        circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
        circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
        circleColor: "#178BCA", // The color of the outer circle.
        waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
        waveCount: 3, // The number of full waves per width of the wave circle.
        waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
        waveAnimateTime: 2000, // The amount of time in milliseconds for a full wave to enter the wave circle.
        waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
        waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
        waveAnimate: true, // Controls if the wave scrolls or is static.
        waveColor: "#178BCA", // The color of the fill wave.
        waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
        textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
        textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
        valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
        displayPercent: true, // If true, a % symbol is displayed after the value.
        textColor: "#045681", // The color of the value text when the wave does not overlap it.
        waveTextColor: "#A4DBf8" // The color of the value text when the wave overlaps it.
    };
}


var widthf = 100,
    heightf = 100


// var thing = loadLiquidFillGauge(0);


function loadLiquidFillGauge(value) {
    var elementId = "#fillgauge1"
    var gauge = d3.select(elementId);
    var config = liquidFillGaugeDefaultSettings();
    var radius = Math.min(widthf, heightf) / 2;
    console.log(radius);
    var locationX = widthf / 2 - radius;
    var locationY = heightf / 2 - radius;
    var fillPercent = value / 72; //Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;


    gauge.append("linearGradient")
        .attr('id', 'depth-gradient')
        // .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', "0%").attr('y1', "100%")
        .attr('x2', "0%").attr('y2', "0%")
    .selectAll('stop')
        .data([
            {offset:'20%', color:'white'},
            {offset:'50%', color:'green'},
            {offset:'80%', color:'cyan'},
            {offset:'95%', color:'blue'}
        ])
    .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });

    getFillPercentImage(value)
    // console.log(fillPercent + "value = "+value);

    console.log();
    gauge.append("image")
        .attr("width", widthf * 0.8)
        .attr("height", heightf * .8)
        .attr('transform', 'translate(' + widthf * .1 + ',' + 20 + ')')
        .attr("xlink:href", getFillPercentImage(value)) //
    console.log(locationY + " " + locationX)

    var waveHeightScale;
    if (config.waveHeightScaling) {
        waveHeightScale = d3.scale.linear()
            .range([0, config.waveHeight, 0])
            .domain([0, 50, 100]);
    } else {
        waveHeightScale = d3.scale.linear()
            .range([config.waveHeight, config.waveHeight])
            .domain([0, 100]);
    }

    var textPixels = (config.textSize * radius / 2);
    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
    var percentText = config.displayPercent ? "%" : "";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

    var waveLength = fillCircleRadius * 2 / config.waveCount;
    var waveClipCount = 1 + config.waveCount;
    var waveClipWidth = waveLength * waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    var textRounder = function(value) {
        return Math.round(value);
    };
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function(value) {
            return parseFloat(value).toFixed(1);
        };
    }
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function(value) {
            return parseFloat(value).toFixed(2);
        };
    }

    // Data for building the clip wave area.
    var data = [];
    for (var i = 0; i <= 40 * waveClipCount; i++) {
        data.push({
            x: i / (40 * waveClipCount),
            y: (i / (40))
        });
    }

    // Scales for drawing the outer circle.
    var gaugeCircleX = d3.scale.linear().range([0, 2 * Math.PI]).domain([0, 1]);
    var gaugeCircleY = d3.scale.linear().range([0, radius]).domain([0, radius]);

    // Scales for controlling the size of the clipping path.
    var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
    var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);

    // Scales for controlling the position of the clipping path.
    var waveRiseScale = d3.scale.linear()
        // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
        // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
        // circle at 100%.
        .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
        .domain([0, 1]);
    var waveAnimateScale = d3.scale.linear()
        .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
        .domain([0, 1]);

    // Scale for controlling the position of the text within the gauge.
    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin + fillCircleRadius * 2, (fillCircleMargin + textPixels * 0.7)])
        .domain([0, 1]);

    // Center the gauge within the parent SVG.
    var gaugeGroup = gauge.append("g")
        .attr('transform', 'translate(' + locationX + ',' + locationY + ')');

    // gaugeGroup.append("rect")
    //     .attr('x', 10)
    //     .attr('y', 10)
    //     .attr('width', 500)
    //     .attr('height', 500)
    //     .attr('transform','translate('+locationX+','+locationY+')')
    //     .style('stroke', '2px')
    //     .style('fill-opacity', 0)
    // Draw the outer circle.
    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius - circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform', 'translate(' + radius + ',' + radius + ')');

    // Text where the wave does not overlap.
    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "sinkText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .style('fill-opacity', 0.4)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // The clipping wave area.
    var clipArea = d3.svg.area()
        .x(function(d) {
            return waveScaleX(d.x);
        })
        .y0(function(d) {
            return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
        })
        .y1(function(d) {
            return (fillCircleRadius * 2 + waveHeight);
        });
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);

    // The inner circle with the clipping wave attached.
    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(#clipWave" + elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", "url(#depth-gradient)")
        .style("fill-opacity", 0.5);

    // Text where the wave does overlap.
    var text2 = fillCircleGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "sinkText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // Make the value count up.
    if (config.valueCountUp) {
        var textTween = function() {
            var i = d3.interpolate(this.textContent, textFinalValue);
            return function(t) {
                this.textContent = textRounder(i(t)) + percentText;
            }
        };
        text1.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
        text2.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (config.waveRise) {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
            .each("start", function() {
                wave.attr('transform', 'translate(1,0)');
            }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
    } else {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
    }

    if (config.waveAnimate) animateWave();

    function animateWave() {
        wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
        wave.transition()
            .duration(config.waveAnimateTime * (1 - wave.attr('T')))
            .ease('linear')
            .attr('transform', 'translate(' + waveAnimateScale(1) + ',0)')
            .attr('T', 1)
            .each('end', function() {
                wave.attr('T', 0);
                animateWave(config.waveAnimateTime);
            });
    }

    function getFillPercentImage(value) {
        var fillPercent = value / 100;
        var key = Math.floor(Math.random() * 4 + 1);

        console.log(fillPercent + "value = " + value);

        if (fillPercent <= 0.1)
            return "js/assets/smile" + key + ".jpg";
        else if (fillPercent > 0.1)
            return "js/assets/sad" + key + ".jpg";
    }

    function GaugeUpdater() {
        this.update = function(value) {
            console.log("update!", value);
            var fillPercent = value / 72;
            d3.select("image").attr("xlink:href", getFillPercentImage(value))
            var newFinalValue = parseFloat(value).toFixed(2);
            var textRounderUpdater = function(value) {
                return Math.round(value);
            };
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function(value) {
                    return parseFloat(value).toFixed(1);
                };
            }
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function(value) {
                    return parseFloat(value).toFixed(2);
                };
            }

            var textTween = function() {
                var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
                return function(t) {
                    this.textContent = textRounderUpdater(i(t)) + percentText;
                }
            };

            text1.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);
            text2.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);

            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;
            var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
            var waveRiseScale = d3.scale.linear()
                // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
                // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
                // circle at 100%.
                .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
                .domain([0, 1]);
            var newHeight = waveRiseScale(fillPercent);
            var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
            var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);
            var newClipArea;
            if (config.waveHeightScaling) {
                newClipArea = d3.svg.area()
                    .x(function(d) {
                        return waveScaleX(d.x);
                    })
                    .y0(function(d) {
                        return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
                    })
                    .y1(function(d) {
                        return (fillCircleRadius * 2 + waveHeight);
                    });
            } else {
                newClipArea = clipArea;
            }
            // debugger

            var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
            wave.transition()
                .duration(0)
                .transition()
                .duration(config.waveAnimate ? (config.waveAnimateTime * (1 - wave.attr('T'))) : (config.waveRiseTime))
                .ease('linear')
                .attr('d', newClipArea)
                .attr('transform', 'translate(' + newWavePosition + ',0)')
                .attr('T', '1')
                .each("end", function() {
                    if (config.waveAnimate) {
                        wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)');
                        animateWave(config.waveAnimateTime);
                    }
                });
            waveGroup.transition()
                .duration(config.waveRiseTime)
                .attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')')
        }
    }

    return new GaugeUpdater();
}
