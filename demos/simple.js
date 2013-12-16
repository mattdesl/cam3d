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

domready(function() {
    var width = 500;
    var height = 500;

	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
    canvas.style.background = "gray";

	document.body.appendChild(canvas);

    var context = canvas.getContext("2d");

    var sphereRadius = 100,
        numPoints = 450;


    var tmp = new Vector3();
    var tmp4 = new Vector4();
    var transform = new Matrix4();
    var mousePos3D = new Vector3();

    var camera = new PerspectiveCamera(85 * Math.PI/180, width, height)
    camera.translate(new Vector3(0, 0, 100));
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
        // camera.position.y = z*0.5;

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
            camera.project(tmp, tmp);
            
            //Draw the point at center.
            context.fillRect(tmp4.x-2.5, tmp4.y-2.5, 5, 5);
        }
    }
});