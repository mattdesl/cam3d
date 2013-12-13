var domready = require('domready');
var util = require('cam3d').vecutil;
var Camera = require('cam3d').Camera;
var PerspectiveCamera = require('cam3d').PerspectiveCamera;

var vec3 = require('gl-matrix').vec3;
var mat4 = require('gl-matrix').mat4;
var vec4 = require('gl-matrix').vec4;

function createRandomParticles(r, n) {
    var points = [];

    r = r||50;
    n = n||200;
    for (var i=0; i<n; i++) {
        var phi = Math.random() * Math.PI*2;
        var costheta = Math.random() * 2 - 1;

        var theta = Math.acos(costheta);
        

        var x = r * Math.sin(theta) * Math.cos(phi);
        var y = r * Math.sin(theta) * Math.sin(phi);
        var z = r * Math.cos(theta);

        points.push(vec3.fromValues(x, y, z));
    }
    return points;
}


domready(function() {
    var width = 500;
    var height = 500;

	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
    canvas.style.background = "gray";


	document.body.appendChild(canvas);

    var context = canvas.getContext("2d");

    var mat = mat4.create();
    var tmp = vec3.create();
    var tmp4 = vec4.create();

    var camera = new PerspectiveCamera(65, width, height)
    camera.translate([0, 0, 100]);
    camera.update();

    // console.log(camera.direction, camera.up);


    

    var rot = 0;
    var orbitRadius = 300,
        sphereRadius = 100,
        numPoints = 350;


    var points = createRandomParticles(sphereRadius, numPoints);

    requestAnimationFrame(render);

    var mouse = vec3.create();
    window.addEventListener("mousemove", function(ev) {
        mouse[0] = ev.clientX;
        mouse[1] = ev.clientY;
        // console.log(mouse);
    }, true);

    function render() {
        requestAnimationFrame(render);

        context.clearRect(0, 0, width, height);


        //radius to rotate around centre
        var r = orbitRadius;

        //orbit the camera around the center on XZ plane
        var x = Math.cos(rot) * r,
            z = Math.sin(rot) * r;

        camera.position[0] = x;
        camera.position[2] = z;
        
        rot += 0.01;

        //keep the camera looking at centre of world
        camera.lookAt([0, 0, 0]);

        //call update() to create the combined matrix
        camera.update();


        context.fillStyle = "white";
        for (var i=0; i<points.length; i++) {
            var p = points[i];

            camera.project(p, tmp4);
            
            //We can create a "fog" like in this tutorial:
            //http://www.ozone3d.net/tutorials/glsl_fog/p04.php
            
            //If project's "out" param has a fourth component,
            //it will store (1/clip.w) which is the same as gl_FragCoord.w.
            //So this is a lot like ( gl_FragCoord.z / gl_FragCoord.w )
            var c = ( orbitRadius+sphereRadius );
            var z = tmp4[2] / tmp4[3]; 
            context.globalAlpha = 1.0 - Math.max(0, Math.min(1, z / c));

            //Draw the point at center.
            context.fillRect(tmp4[0]-2.5, tmp4[1]-2.5, 5, 5);
        }
    }
});