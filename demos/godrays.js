//RAF
!function(n){for(var e=0,a=["webkit","moz"],t=n.requestAnimationFrame,i=n.cancelAnimationFrame,m=a.length;--m>=0&&!t;)t=n[a[m]+"RequestAnimationFrame"],i=n[a[m]+"CancelAnimationFrame"];t&&i||(t=function(n){var a=Date.now(),t=Math.max(e+16,a);return setTimeout(function(){n(e=t)},t-a)},i=clearTimeout),n.requestAnimationFrame=t,n.cancelAnimationFrame=i}(window);

var domready = require('domready');

var Camera = require('cam3d').Camera;
var PerspectiveCamera = require('cam3d').PerspectiveCamera;

var Vector2 = require('vecmath').Vector2;
var Vector3 = require('vecmath').Vector3;
var Vector4 = require('vecmath').Vector4;
var Matrix4 = require('vecmath').Matrix4;

var ImageBuffer = require('imagebuffer');

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
    var width = 400;
    var height = 500;

    var bufferWidth = width/4;
    var bufferHeight = height/4;

	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
    canvas.style.background = "#000";

	document.body.appendChild(canvas);

    var context = canvas.getContext("2d");

    var buffer = document.createElement("canvas");
    buffer.width = bufferWidth;
    buffer.height = bufferHeight;
    buffer.style.background = "#aaa";
    var bufferCtx = buffer.getContext("2d");

    var rot = 0,
        shadowSize = 150,
        windowSize = 100,
        orbitRadius = 400;

    var tmp = new Vector3();
    var tmp4 = new Vector4();
    var transform = new Matrix4();

    var camera = new PerspectiveCamera(95 * Math.PI/180, bufferWidth, bufferHeight)
    
    var windowMesh = createPlane(0, 0, 0, windowSize);

    //our window transform
    //make it rotated upright
    transform.idt().rotateX(Math.PI/2);


    var pointLight = new Vector3(-100, -300, -300);
    var lightColor = "#fff";
    var lightSizeFactor = 0.10;
    var tmpPos2D = new Vector2();

    requestAnimationFrame(render);

    var mouse = new Vector3(width/2, 0, 0);
    window.addEventListener("mousemove", function(ev) {
        mouse.x = ev.clientX;
        mouse.y = ev.clientY;
    }, true);

    window.addEventListener("touchmove", function(ev) {
        ev.preventDefault();
        mouse.x = ev.changedTouches[0].clientX;
        mouse.y = ev.changedTouches[0].clientY;
    }, true);

    function meshLineTo(context, pos) {
        tmp.set(pos).transformMat4(transform);
        camera.project(tmp, tmp);
        context.lineTo(tmp.x, tmp.y);
    }

    function drawLight(context, lsize) {
        camera.project(pointLight, tmp);

        context.fillStyle = lightColor;
        context.beginPath();
        context.arc(tmp.x, tmp.y, lsize, 0, Math.PI*2, false)
        context.fill();
        return tmp;
    }

    function drawWindowInner(context) {
        context.lineWidth = 4;
        context.strokeStyle = "#131313";
                
        context.beginPath();

        //get midpoint A
        tmp.set( windowMesh[0] ).lerp( windowMesh[1], 0.5 );
        meshLineTo(context,tmp);

        //to midpoint B
        tmp.set( windowMesh[3] ).lerp( windowMesh[2], 0.5 );
        meshLineTo(context, tmp);

        context.stroke();

        //reset path
        context.beginPath();

        //now do the same for horizontal bar
        tmp.set( windowMesh[0] ).lerp( windowMesh[3], 0.5 );
        meshLineTo(context,tmp);

        tmp.set( windowMesh[1] ).lerp( windowMesh[2], 0.5 );
        meshLineTo(context,tmp);

        context.stroke();  
    }

    function renderWindow(context, vw, vh, showLight, showInner) {
        //draws a simple grid of points for the ground
        context.fillStyle = "black";
        context.strokeStyle = "#131313";
        context.globalAlpha = 1.0; 
        context.lineWidth = 1;
        var winPointSize = 10.0;

        camera.setViewport(vw, vh);
        camera.update();

        //save clipping region
        context.save();
        
        //draw the window edges for clipping
        context.beginPath();
        for (var i=0; i<windowMesh.length; i++) {
            var p = windowMesh[i];
            meshLineTo( context, p );
        }
        context.closePath();
        context.clip();
        context.fillStyle = "#585f70";
        context.fill();

        //draw our light and window occluder
        if (showLight) {
            var res = drawLight(context, lightSizeFactor * vw);
            tmpPos2D.set(res);
        }

        if (showInner)
            drawWindowInner(context); 

        context.restore(); //restore clipping region
    }

    function renderToBuffer(context) {
        var w = bufferWidth,
            h = bufferHeight;
        context.clearRect(0, 0, w, h);


        
        renderWindow(context, w, h, true);

        var imageData = context.getImageData(0, 0, w, h);
        
        var buffer = new ImageBuffer(imageData);
        var pixels = buffer.pixels;

        //util to create a lightweight object -- { r:0, g:0, b:0, a:0 }
        var color = ImageBuffer.createColor();
        color.r = 1.0;
        color.a = 1.0;
        color.b = 1.0;

        var NUM_SAMPLES = 30;
        var density = 1, weight = 5, decay = 0.99;
        var exposure = 0.008;

        for (var i=0; i<w*h; i++) {
            //floors the x and y to positive numbers, using bitwise shift
            var y = (i / w) >> 0;
            var x = (i - w*y) >> 0;

            var tx = (x/w);
            var ty = ((h-y)/h);


            var dtx = tx - (tmpPos2D.x/w);
            var dty = ty - ((h-tmpPos2D.y)/h);
            dtx *= 1 / NUM_SAMPLES * density;
            dty *= 1 / NUM_SAMPLES * density;
            var illuDecay = 1;

            var r=0,g=0,b=0,a=1;
            for (var j=0; j<NUM_SAMPLES; j++) {
                tx -= dtx;
                ty -= dty;

                var px = ~~(tx * w);
                var py = ~~(ty * h);
                var p = px + (py * w);

                //sample from pixel pos
                if (p < 0 || p > (w*h))
                    continue;
                
                var rgba = pixels[p];
                ImageBuffer.unpackPixel( rgba, color );

                color.r = color.r/255 * illuDecay * weight;
                color.g = color.g/255 * illuDecay * weight;
                color.b = color.b/255 * illuDecay * weight;
                color.a = color.a/255 * illuDecay * weight;

                r += color.r;
                g += color.g;
                b += color.b;

                illuDecay *= decay;
            }

            r = ~~(r*exposure*255);
            g = ~~(g*exposure*255);
            b = ~~(b*exposure*255);

            r = r > 255 ? 255 : r;
            g = g > 255 ? 255 : g;
            b = b > 255 ? 255 : b;


            buffer.setPixel(i, r, g, b, 255);
        }
        
        context.putImageData(imageData, 0, 0);
    }

    function render() {
        requestAnimationFrame(render);

        context.clearRect(0, 0, width, height);

        var mouseXAmount = -Math.min(1, Math.max(-1, mouse.x / width * 2 - 1));
        var mouseYAmount = -Math.min(1, Math.max(-1, mouse.y / height * 2 - 1));
        pointLight.x = mouseXAmount * 200;
        pointLight.z = mouseYAmount * -300;

        //radius to rotate around centre
        var r = orbitRadius;

        //orbit our camera a little around center 
        var hr = Math.sin(rot) * 0.75 + Math.PI/2;

        var x = (Math.cos(hr)) * r,
            z = (Math.sin(hr)) * r;

        camera.position.y = 200;
        camera.position.x = x;
        camera.position.z = z;

        rot += 0.005;

        //keep the camera looking at centre of world
        camera.lookAt(new Vector3(0, 0, 0));
        camera.up.set(0, 1, 0);

        //call update() to create the combined matrix
        camera.update();    

        context.globalCompositeOperation = 'source-over';
        renderWindow(context, width, height, false, false);
        renderToBuffer(bufferCtx);
        
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = 0.75;

        context.drawImage(buffer, 0, 0, width, height);
        context.globalCompositeOperation = 'source-over';
        
        camera.setViewport(width, height);
        camera.update();

        context.globalAlpha = 0.55;
        drawWindowInner(context);

        // renderWindow(context, width, height, false, true, false);

        

    }
});