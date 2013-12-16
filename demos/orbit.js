var domready = require('domready');

var Camera = require('cam3d').Camera;
var PerspectiveCamera = require('cam3d').PerspectiveCamera;

var Vector3 = require('vecmath').Vector3;
var Vector4 = require('vecmath').Vector4;
var Matrix4 = require('vecmath').Matrix4;


function createRandomParticles(r, n) {
    var points = [];

    r = r||50;
    n = n||200;
    for (var i=0; i<n; i++) {
        points.push(new Vector3().random(r));
    }
    return points;
}

function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t;
}

function createGrid(x, y, z, size, numCells) {
    var xoff = x - size;
    var zoff = z - size;

    var points = [];
    for (var i=0; i<numCells; i++) {
        for (var j=0; j<numCells; j++) {
            var za = i/(numCells-1);
            var xa = j/(numCells-1);

            var nz = lerp(-zoff, zoff, za)
            var nx = lerp(-xoff, xoff, xa);

            points.push(new Vector3(nx, y, nz));
        }
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

    var rot = 0;
    var orbitRadius = 300,
        sphereRadius = 100,
        numPoints = 450,
        gridSize = 150;


    var tmp = new Vector3();
    var tmp4 = new Vector4();
    var transform = new Matrix4();
    var mousePos3D = new Vector3();

    var camera = new PerspectiveCamera(85 * Math.PI/180, width, height)
    camera.update();

    var points = createRandomParticles(sphereRadius, numPoints);
    var gridPoints = createGrid(0, sphereRadius, 0, gridSize, 10);

    requestAnimationFrame(render);

    var mouse = new Vector3(width/2, 0, 0);
    window.addEventListener("mousemove", function(ev) {
        mouse.x = ev.clientX;
        mouse.y = ev.clientY;
    }, true);

    function render() {
        requestAnimationFrame(render);

        context.clearRect(0, 0, width, height);

        var mouseXAmount = Math.min(1, Math.max(-1, mouse.x / width * 2 - 1));
        mousePos3D.x = mouseXAmount * gridSize;
        

        //radius to rotate around centre
        var r = orbitRadius;

        //orbit our camera a little around center 
        var x = Math.cos(rot) * r,
            z = Math.sin(rot) * r;

        camera.position.y = -100;
        camera.position.x = x;
        camera.position.z = z;

        rot += 0.01;

        //keep the camera looking at centre of world
        camera.lookAt(new Vector3(0, 0, 0));
        camera.up.set(0, 1, 0);

        //call update() to create the combined matrix
        camera.update();

        //draw our sphere of particles
        context.fillStyle = "white";
        for (var i=0; i<points.length; i++) {
            var p = points[i];
            //first we set it to identity, then translate by mouse position
            transform.idt().translate(mousePos3D);
            //now let's give our model some rotation..
            transform.rotateZ(rot * -0.5); 

            //get the new world point by projecting with our model transform
            tmp.copy(p).transformMat4(transform);

            //project the world point from 3D to 2D screen space
            camera.project(tmp, tmp4);
            
            //We can create a "fog" like in this tutorial:
            //http://www.ozone3d.net/tutorials/glsl_fog/p04.php
            
            //If the specified "out" param to project() has a fourth component,
            //it will store (1/clip.w) which is the same as gl_FragCoord.w.
            //So this is a lot like ( gl_FragCoord.z / gl_FragCoord.w )
            var c = ( orbitRadius+sphereRadius );
            var z = tmp4.z / tmp4.w; 
            context.globalAlpha = 1.0 - Math.max(0, Math.min(1, z / c));

            //Draw the point
            context.fillRect(tmp4.x-2.5, tmp4.y-2.5, 5, 5);
        }

        //draws a simple grid of points for the ground
        context.globalAlpha = 0.25; 
        var gridPointSize = 3.0;
        for (var i=0; i<gridPoints.length; i++) {
            var p = gridPoints[i];

            camera.project(p, tmp);
            context.fillRect(tmp.x-gridPointSize/2, tmp.y-gridPointSize/2, 
                            gridPointSize, gridPointSize);
        }
    }
});