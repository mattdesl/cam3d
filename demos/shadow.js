var domready = require('domready');

var Camera = require('cam3d').Camera;
var PerspectiveCamera = require('cam3d').PerspectiveCamera;

var Vector3 = require('vecmath').Vector3;
var Vector4 = require('vecmath').Vector4;
var Matrix4 = require('vecmath').Matrix4;


function createPlane(x, y, z, size) {
    var xoff = x - size;
    var zoff = z - size;

    return [
        new Vector3(-xoff, y, -zoff),
        new Vector3(xoff, y, -zoff),
        new Vector3(xoff, y, zoff),
        new Vector3(-xoff, y, zoff)
    ];
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

    var rot = 0,
        shadowSize = 150;

    var tmp = new Vector3();
    var tmp4 = new Vector4();
    var transform = new Matrix4();

    var camera = new PerspectiveCamera(85 * Math.PI/180, width, height)
    camera.translate( tmp.set(0, -300, -300) );
    camera.lookAt( tmp.set(0, 0, 0) );
    camera.update();

    var plane = createPlane(0, 0, 0, shadowSize);

    requestAnimationFrame(render);

    var mouse = new Vector3(width/2, 0, 0);
    window.addEventListener("mousemove", function(ev) {
        mouse.x = ev.clientX;
        mouse.y = ev.clientY;
    }, true);

    function render() {
        requestAnimationFrame(render);

        context.clearRect(0, 0, width, height);

        rot += 0.01;

        //draws a simple grid of points for the ground
        context.globalAlpha = 0.85;
        context.beginPath();
        for (var i=0; i<plane.length; i++) {
            var p = plane[i];

            //here we're rotating the floor, not the camera!!
            transform.idt().rotateY(rot);

            tmp.copy(p).transformMat4(transform);

            camera.project(tmp, tmp);
            context.lineTo(tmp.x, tmp.y);
        }

        
        camera.project( tmp.set(0, 0, 0), tmp );
        var grd = context.createRadialGradient(tmp.x, tmp.y, 5, tmp.x, tmp.y, shadowSize);
        grd.addColorStop(1, "rgba(0,0,0,0.0)");
        grd.addColorStop(0, "black");

        context.fillStyle = grd;

        context.closePath();
        context.fill();
        // context.stroke();

    }
});