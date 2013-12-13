var Class = require('klasse');

var vec3 = require('gl-matrix').vec3;
var vec4 = require('gl-matrix').vec4;
var mat4 = require('gl-matrix').mat4;
var util = require('./vecutil');

var tmpVec4 = vec4.create();
var tmpVec = vec3.create();

/** 
 * Abstract base class for cameras to implement.
 * @class Camera
 * @abstract
 */
var Camera = new Class({
	
    initialize: function() {
        this.direction = vec3.fromValues(0, 0, -1);
        this.up = vec3.fromValues(0, 1, 0);
        this.position = vec3.create();
        
        this.projection = mat4.create();
        this.view = mat4.create();
        this.combined = mat4.create();
        this.invProjectionView = mat4.create();

        this.near = 1;
        this.far = 100;

        this.ray = {
            origin: vec3.create(),
            direction: vec3.create()
        };

        this.viewport = vec4.create();
    },

    translate: function(vec) {
        this.position[0] += vec[0];
        this.position[1] += vec[1];
        this.position[2] += vec[2];
    },

    lookAt: function(vec) {
        var dir = this.direction,
            up = this.up;

        vec3.copy(dir, vec);
        vec3.sub(dir, dir, this.position);
        vec3.normalize(dir, dir);

        //normalize the up vector
        //calculate right vector (cross dir & up)
        vec3.copy(tmpVec, dir);
        vec3.cross(tmpVec, tmpVec, up);
        vec3.normalize(tmpVec, tmpVec);

        //calculate up vector (cross right & dir)
        vec3.copy(up, tmpVec);
        vec3.cross(up, up, dir);
        vec3.normalize(up, up);
    },

    rotate: function(radians, axis) {
        util.rotate( this.direction, this.direction, axis, radians );
        util.rotate( this.up, this.up, axis, radians );
    },

    rotateAround: function(point, radians, axis) {
        vec3.sub(tmpVec, point, this.position);
        this.translate(tmpVec);
        this.rotate(radians, axis);
        this.translate( vec3.set(tmpVec, -tmpVec[0], -tmpVec[1], -tmpVec[2]) );
    },

    project: function(vec, out) {
        var viewportX = this.viewport[0],
            viewportY = this.viewport[1],
            viewportWidth = this.viewport[2],
            viewportHeight = this.viewport[3],
            n = Camera.NEAR_RANGE,
            f = Camera.FAR_RANGE;

        // if we just need x and y we can project like so:
        // util.prj( out, vec, this.combined );
        // out[0] = viewportWidth * (out[0] + 1) / 2 + viewportX;
        // out[1] = viewportHeight * (out[1] + 1) / 2 + viewportY;
        // out[2] = (out[2] + 1) / 2;
        
        // but for a nicer Z value we should do the usual steps...
        //    clip space -> NDC -> window coords

        //implicit 1.0 for w component
        var tmp = vec4.set(tmpVec4, vec[0], vec[1], vec[2], 1.0);

        //transform into clip space
        vec4.transformMat4( tmp, tmp, this.combined );
        
        //now into NDC
        tmp[0] = tmp[0]/tmp[3];
        tmp[1] = tmp[1]/tmp[3];
        tmp[2] = tmp[2]/tmp[3];
        
        //and finally into window coordinates
        out[0] = viewportWidth/2 * tmp[0] + (0 + viewportWidth/2);
        out[1] = viewportHeight/2 * tmp[1] + (0 + viewportHeight/2);
        out[2] = (f-n)/2 * tmp[2] + (f+n)/2;

        //if the out vector has a fourth component, we also store (1/clip.w)
        //same idea as gl_FragCoord.w
        if (out.length >= 4)
            out[3] = 1/tmp[3];

        
        return out;
    },

    unproject: function(vec, out) {
        return util.unproject(out, vec, this.viewport, this.invProjectionView);
    },

    getPickRay: function(x, y) {
        var origin = this.ray.origin,
            direction = this.ray.direction,
            viewport = this.viewport,
            mtx = this.invProjectionView;

        util.unproject( origin, origin, viewport, mtx );
        util.unproject( direction, direction, viewport, mtx );

        vec3.sub(direction, direction, origin);
        vec3.normalize(direction, direction);

        return this.ray;
    },

    update: function() {
        //left empty for subclasses
    }
});

Camera.FAR_RANGE = 1.0;
Camera.NEAR_RANGE = 0.0;

// Regarding method overloading. It would be nice but it does introduce
// a slow down. 
// http://jsperf.com/arguments-length-perf

/// TWO BIG QUESTIONS:
///   1.  should we overload methods? 
///             only reason not to might be a premature optimization. gotta benchmark
///             also we should "use strict" if we are going to parse args
///   2.  should we use { x, y, z } or [ x, y, z ] for vectors?
///             seems like arrays are best for compatibility with gl-matrix
///             very annoying
///             
/// 
/// BATSHIT CRAZY IDEA:
/// 
///     brfs transform for array accessor:
///         vec:x === vec[0]
///         vec:y === vec[1]
///         vec:z === vec[2] 
///         vec:w === vec[3]
/// 
/// 
module.exports = Camera;


