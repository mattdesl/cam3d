## cam3d

cam3d is a small module for working with 3D in WebGL, DOM, or 2D Canvas. It will be the basis for higher-level APIs down the road, but also stands on its own if you need basic 3D effects or low-level control over your scenegraph (e.g. working with Canvas gradients, clipping, etc).


### code snippet

```js
var cam = new PerspectiveCamera(fieldOfView, viewportWidth, viewportHeight);


cam.position.set(10, 50, -100); //change camera position
cam.lookAt(0, 0, 0); //Look at (0, 0, 0) origin
cam.up.set(0, 1, 0); //Adjust up-vector
cam.update(); //update matrices

... for WebGL ....
	//upload the Float32Array
	gl.uniformMatrix4fv(location, false, cam.projection.val); 

... for Canvas ...
	//project the 3D position into a 2D screen-space position
	cam.project( position, outVec );

	//draw something at that location
	context.fillRect(outVec.x, outVec.y, 10, 10);
```

### docs

See [the wiki](wiki) for now.

### live examples

Click the images to see the demos.

[![Image](http://i.imgur.com/PaATBuK.png Window)](http://mattdesl.github.io/cam3d/release/window.html)  
<sub>a rotating 3D window with snow outside -- [source code](demos/window.js)</sub>


[![Image](http://i.imgur.com/2svBxYp.png Window)](http://mattdesl.github.io/cam3d/release/simple.html)  
<sub>spinning 3D particles -- [source code](demos/simple.js))</sub>







