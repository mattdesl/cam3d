//require our necessary modules...
//
require('raf.js');
var domready = require('domready');

var PerspectiveCamera = require('cam3d').PerspectiveCamera;
var Vector3 = require('vecmath').Vector3;
var Vector4 = require('vecmath').Vector4;
var Matrix4 = require('vecmath').Matrix4;

domready(function() {
    var width = 640;
    var height = 320;

    //create a new canvas
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.background = "gray";

    //add canvas to <body> and setup basic styles
    document.body.appendChild(canvas); 
    document.body.style.margin = "0";

    //start rendering
    requestAnimationFrame(render);

    //setup a camera with 85 degree FOV
    var camera = new PerspectiveCamera(85 * Math.PI/180, width, height);

    //move the camera back and update its matrices
    camera.position.z = 200;
    camera.update();

    //get 2D canvas context
    var context = canvas.getContext("2d");

    //random spherical particles
    var points = createRandomParticles(100, 100);

    //a vector which we will re-use
    var tmp = new Vector4();

    //creates a new identity matrix
    var transform = new Matrix4();

    //our render loop
    function render() {
        requestAnimationFrame(render);
        context.clearRect(0, 0, width, height);

        for (var i=0; i<points.length; i++) {
            var p = points[i];

            //rotate the transformation matrix around the Y axis a little..
            transform.rotateY(0.0001);

            //now let's transform the 3D position by our transformation matrix
            //this will give us a new position that has been slightly rotated by
            //our matrix.
            tmp.set(p).transformMat4(transform);   

            //project the 3D point into 2D space
            camera.project(tmp, tmp);

            //draw the particle with a fixed size
            var size = 3;
            context.fillRect(tmp.x-size/2, tmp.y-size/2, size, size);
        }
    }

    //a utility to create particles randomly in a spherical area
    // r - radius
    // n - number of points
    function createRandomParticles(r, n) {
        var points = [];
        for (var i=0; i<n; i++) {
            points.push(new Vector3().random(r));
        }
        return points;
    }
});