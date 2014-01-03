//This is a small demo of a window in 3D space, showing some snow falling outside.

//Require our requestAnimationFrame polyfill and domready utility
require('raf.js');
var domready = require('domready');

//Require the cam3d and vecmath utilities
var Vector3 = require('vecmath').Vector3;
var PerspectiveCamera = require('cam3d').PerspectiveCamera;

var stats = require('stats');

/*
    Our window mesh is really just some arrays of points 
    which we'll use to draw a path with the canvas.

    "vertices" are the four corner points in 3D
    "veritcalBar" are the two points which define the vertical window bar
    "horizontalBar" are the two points which define the horizontal window bar
 */
function WindowMesh(x, y, z, sizeX, sizeY) {
    //default values
    sizeX = sizeX || 100;
    sizeY = sizeY || 50;
    x = x || 0;
    y = y || 0;
    z = z || 0;

    var xoff = x - sizeX/2;
    var yoff = y - sizeY/2;

    //the half extent of our Window in x and y
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    //the four points that make up our Window
    this.vertices = [
        new Vector3(-xoff, -yoff, z),
        new Vector3(xoff, -yoff, z),
        new Vector3(xoff, yoff, z),
        new Vector3(-xoff, yoff, z)
    ];

    //Now we want to determine the mid-point of each edge of our window
    //We can use Vector3's lerp() function for convenience
    
    var len = this.vertices.length;
    var midpoints = new Array(len);
    for (var i=0; i<len; i++) {
        //clones the vector
        var v = new Vector3( this.vertices[i] );

        //midpoint between this vertex and the next, wrapping around to index zero
        var nextVert = (i + 1) % len;

        //interpolate between the two with 50% alpha, i.e. at middle
        v.lerp( this.vertices[nextVert], 0.5 );

        midpoints[i] = v;
    }

    //these will be the two sets of points which we use to draw the inside of the window
    this.verticalBar = [ midpoints[0], midpoints[2] ];
    this.horizontalBar = [ midpoints[1], midpoints[3] ];
}


domready(function() {
    var width = window.innerWidth, 
        height = window.innerHeight;

    //create a new canvas
    var canvas = document.createElement("canvas");

    //add canvas to <body> and setup basic styles
    document.body.appendChild(canvas); 
    document.body.style.margin = "0";
    document.body.style.background = "#6c1f1e";
    document.body.style.overflow = "hidden";

    //get 2D canvas context
    var context = canvas.getContext("2d");

    //setup the backing store ratio
    var ratio = setupRetina(width, height);

    //create a new camera with a field of view of 85 degrees
    var FOV = 75 * (Math.PI/180); //convert to radians 
    var camera = new PerspectiveCamera(FOV, width, height);
    var cameraRadius = 200;

    //we use a temporary vector object to reduce allocations in the main loop
    var tmp = new Vector3();
    var tmp2 = new Vector3();
    var rotation = 0;
    

    var noGradient = getParameterByName("noGradient") === "true";

    //our Window mesh, which will be the basis for our window
    var windowMesh = new WindowMesh(0, 0, 0, 75, 100);

    //create N number of particles, randomized to a spherical area with a radius of 50 units
    var snow = [];
    var N = 80, 
        snowRadius = 100, 
        snowY = -150,
        snowZ = -50;
        
    //we're also going to offset the snow a little in the Y and Z direction
    tmp.set(0, snowY, snowZ); 
    for (var i=0; i<N; i++) {
        snow.push(new Vector3().random(snowRadius).add(tmp));
    }

    var snowImage = new Image();
    snowImage.onload = render;
    snowImage.src = "img/snow2.png";


    var fps = stats.create();
    fps.style.position = "absolute";
    fps.style.top = "0";
    fps.style.left = "0";
    //uncomment to show FPS counter
    // document.body.appendChild(fps);


    var isOrientationEnabled = false,
        isOrientationFlipped = false;
    var alpha = 0,
        beta = 0,
        gamma = 0;

    if (window.addEventListener) {
        window.addEventListener("resize", function() {
            width = window.innerWidth;
            height = window.innerHeight;
            setupRetina(width, height);
        }, false);

        //We use a hackish user-agent detection to ignore laptops with accelerometers.
        if (window.DeviceOrientationEvent && isMobileUserAgent()) {
            //setup orientation-based camera movement
            cameraRadius = 180; //shrink the orbit a bit for mobile
            isOrientationEnabled = true;
            isOrientationFlipped = Math.abs(~~window.orientation) === 90;

            //iOS 7 has a nasty issue where changing to landscape
            //triggers a resize event with inccorect innerWidth/innerHeight.
            //The device orientation change seems to be triggered after,
            //with the correct values.
            window.addEventListener("orientationchange", function() {
                width = window.innerWidth;
                height = window.innerHeight;
                setupRetina(width, height);

                isOrientationFlipped = Math.abs(~~window.orientation) === 90;
            }, false);


            window.addEventListener("deviceorientation", function(ev) {
                var toRad = Math.PI/180;

                alpha = ev.alpha * toRad;
                beta = ev.beta * toRad;
                gamma = ev.gamma * toRad;

                if (isOrientationFlipped) {
                    var t = beta;
                    beta = gamma;
                    gamma = t;
                }

                // console.log(alpha, beta, gamma);
            }, false);
        }
    }

    //setup initial camera lookAt
    orbitCamera();    

    //render loop...
    function render() {
        stats.begin();

        requestAnimationFrame(render);

        //we can adjust how large we want the 3D window to appear like so..
        var camWidth = 650 / ratio,
            camHeight = 500 / ratio;
        camera.setViewport(camWidth, camHeight);

        if (isOrientationEnabled) {
            orientCamera(alpha, beta, gamma);
        } else {
            orbitCamera();
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
                
        if (!noGradient) {
            //background gradient
            var mx = width/2, my = height/2;
            var bgGradient = context.createRadialGradient(mx, my, 0, mx, my, width);
            bgGradient.addColorStop(0, "#6c1f1e");
            bgGradient.addColorStop(1, "#351312");
            context.fillStyle = bgGradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        var tx = (window.innerWidth-camWidth)/2, 
            ty = (window.innerHeight-camHeight)/2;
        context.translate(tx, ty);

        drawExterior(context);
        drawWindowBars(context);
        drawWindowOutline(context);
        drawLightShaft(context);

        context.translate(-tx, -ty);

        stats.end(fps);
    }


    function orientCamera(alpha, beta, gamma) {
        //cap the min/max rotation and offset it so it feels natural
        beta = Math.max(-Math.PI/2, Math.min(beta, Math.PI*0.3));
        beta -= Math.PI/4;

        gamma = Math.max(-Math.PI/4, Math.min(gamma, Math.PI/4));
        gamma += Math.PI/2;

        var y = Math.sin(beta) * cameraRadius,
            x = Math.cos(gamma) * cameraRadius,
            z = Math.sin(gamma) * cameraRadius;

        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;
        

        camera.lookAt(0, 0, 0);
        camera.up.set(0, 1, 0);
        camera.update();
    }

    function orbitCamera() {
        //orbit our camera a little around center 
        var hr = Math.sin(rotation) * 0.75 + Math.PI/2

        var x = (Math.cos(hr)) * cameraRadius,
            z = (Math.sin(hr)) * cameraRadius;

        camera.position.y = -100;
        camera.position.x = x;
        camera.position.z = z;

        rotation += 0.005;

        //keep the camera looking at centre of world
        camera.lookAt(0, 0, 0);
        camera.up.set(0, 1, 0); 

        //call update() to create the combined matrix
        camera.update(); 
    }

    function drawWindowOutline(context) {
        context.strokeStyle = "#eeecea";
        context.lineWidth = 5 / ratio;
        context.lineJoin = 'round';

        //draws a set of vertices as a path
        drawMesh(context, windowMesh.vertices);
        //outline of our window
        context.stroke();
    }

    function drawWindowBars(context) {
        //inside bars of our window...        
        context.strokeStyle = "#eeecea";
        context.lineWidth = 3 / ratio;

        drawMesh(context, windowMesh.horizontalBar);
        context.stroke();
        drawMesh(context, windowMesh.verticalBar);
        context.stroke();
    }

    //Here is where we draw the snow and gradient exterior
    function drawExterior(context) {
        //It's good to save/restore whenever you use clip()
        context.save();

        //Draw our window as a canvas path.. we will fill it with a gradient fill
        drawMesh(context, windowMesh.vertices);
        
        //To give a slight 3D feel to the gradient fill, we will project
        //a 3D point "outside" of our window into 2D space
        tmp2.set(0, -20, -40); //where the light will be outside of the window
        tmp.set( windowMesh.verticalBar[1] ).add(tmp2);

        //get 2D coordinates of the light
        camera.project( tmp, tmp );


        if (!noGradient) {
            //now we create the radial gradient fill
            var stretch = 80 / ratio;
            var size = 100 / ratio;

            var radial = context.createRadialGradient(tmp.x, tmp.y, 0, tmp.x, tmp.y+stretch, size);
            radial.addColorStop(0, "white");
            radial.addColorStop(1, "#516783");
            context.fillStyle = radial;

            //fill the exterior scene
            context.fill();
        }
        
        // Clip the window shape so that we can draw our snow as if it's outside
        context.clip();
        drawSnow(context);

        // now restore our clipping region !!
        context.restore();
    }

    function drawSnow(context) {
        var w = snowImage.width,
            h = snowImage.height;

        context.fillStyle = "white";
        for (var i=0; i<snow.length; i++) {
            var s = snow[i];

            //make the snow fall
            s.y += 1;


            //if it's fallen too far, reset above window with new random position
            if (s.y > snowRadius) {
                s.random(snowRadius);
                s.y = snowY + snowRadius;
                s.z = snowZ;
            }

            tmp.set(s);
    
            //here we make the snow "flurry" a little by adjusting its
            //X and Y values
            var speed = i % 50; 
            var dist = i % 3; 
            tmp.x += Math.sin(rotation*speed*0.25)*(5*dist);
            tmp.z += Math.sin(rotation*speed*0.15)*(2*dist);
            
            //vary the size of the particles; in total this gives us 3 different sizes
            var particleSize = (i % 3) * 0.15;

            //make them fade away in size and opacity
            var size = w * (1.0 - Math.max(0, s.y / snowRadius/2)) * particleSize;
            context.globalAlpha = 1.0 - Math.max(0, s.y / snowRadius);

            //now project the snow particle into 2D space
            camera.project(tmp, tmp);
            context.drawImage(snowImage, tmp.x-size/2, tmp.y-size/2, size, size);
        }

        //reset alpha to 1.0
        context.globalAlpha = 1.0;
    }

    //A utility to draw a set of vertices as if it's a canvas path
    function drawMesh(context, vertices) {
        context.beginPath();
        for (var i=0; i<vertices.length; i++) {
            var vert = vertices[i];

            //project the vertex into 2D screen space, storing in tmp
            camera.project(vert, tmp);

            //place the line
            context.lineTo(tmp.x, tmp.y);
        }
        context.closePath();
    }

    function drawLightShaft(context) {
        // TODO: at some point I should add some faux volumetric lighting
        
    }

    function setupRetina(width, height) {
        var devicePixelRatio = window.devicePixelRatio || 1,
            backingStoreRatio = context.webkitBackingStorePixelRatio ||
                                context.mozBackingStorePixelRatio ||
                                context.msBackingStorePixelRatio ||
                                context.oBackingStorePixelRatio ||
                                context.backingStorePixelRatio || 1,
            ratio = devicePixelRatio / backingStoreRatio;

        canvas.width = width;
        canvas.height = height;
        if (devicePixelRatio !== backingStoreRatio) {
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            context.scale(ratio, ratio);
        }
        return ratio;
    }

    //Some older Android devices just can't handle gradient fills... so
    //you can disable them with url?noGradient=true
    //http://stackoverflow.com/a/5158301
    function getParameterByName(name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    //This is poor practice. Unfortunately, if we don't ignore device orientation
    //for laptops, the demo will just look like a jittery/buggy experience. Most of
    //these users won't even realize their computer has an accelerometer. 
    function isMobileUserAgent() {
      return ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );  
    }
});