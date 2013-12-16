var Class = require('klasse');

var util = require('./vecutil');

var Vector3 = require('vecmath').Vector3;
var Vector4 = require('vecmath').Vector4;
var Matrix4 = require('vecmath').Matrix4;

var tmpVec3 = new Vector3();
var tmpVec4 = new Vector4();



/** 
 * Abstract base class for cameras to implement.
 * @class Camera
 * @abstract
 */
var Camera = new Class({
	
    initialize: function() {
        this.direction = new Vector3(0, 0, -1);
        this.up = new Vector3(0, 1, 0);
        this.position = new Vector3();
        
        this.projection = new Matrix4();
        this.view = new Matrix4();
        this.combined = new Matrix4();
        this.invProjectionView = new Matrix4();

        this.near = 1;
        this.far = 100;

        this.ray = {
            origin: new Vector3(),
            direction: new Vector3()
        };

        this.viewportWidth = 0;
        this.viewportHeight = 0;
    },

    translate: function(vec) {
        this.position.x += vec.x;
        this.position.y += vec.y;
        this.position.z += vec.z;
    },

    lookAt: function(vec) {
        var dir = this.direction,
            up = this.up;

        dir.copy(vec).sub(this.position).normalize();

        //calculate right vector
        tmpVec3.copy(dir).cross(up).normalize();

        //calculate up vector
        up.copy(tmpVec3).cross(dir).normalize();
    },

    rotate: function(radians, axis) {
        util.rotate( this.direction, axis, radians );
        util.rotate( this.up, axis, radians );
    },

    rotateAround: function(point, radians, axis) {
        tmpVec.copy(point).sub(this.position);
        this.translate( tmpVec );
        this.rotate( radians, axis );
        this.translate( tmpVec.negate() );
    },

    project: function(vec, out) {
        //TODO: support viewport XY
        var viewportWidth = this.viewportWidth,
            viewportHeight = this.viewportHeight,
            n = Camera.NEAR_RANGE,
            f = Camera.FAR_RANGE;

        // for useful Z and W values we should do the usual steps...
        //    clip space -> NDC -> window coords

        //implicit 1.0 for w component
        tmpVec4.set(vec.x, vec.y, vec.z, 1.0);
        
        //transform into clip space
        tmpVec4.transformMat4( this.combined );
        
        //now into NDC
        tmpVec4.x = tmpVec4.x / tmpVec4.w;
        tmpVec4.y = tmpVec4.y / tmpVec4.w;
        tmpVec4.z = tmpVec4.z / tmpVec4.w;
        
        //and finally into window coordinates
        out.x = viewportWidth/2 * tmpVec4.x + (0 + viewportWidth/2);
        out.y = viewportHeight/2 * tmpVec4.y + (0 + viewportHeight/2);
        out.z = (f-n)/2 * tmpVec4.z + (f+n)/2;

        //if the out vector has a fourth component, we also store (1/clip.w)
        //same idea as gl_FragCoord.w
        if (out.w === 0 || out.w)
            out.w = 1/tmpVec4.w;
        
        return out;
    },

    unproject: function(vec, out) {
        var viewport = tmpVec4.set(0, 0, this.viewportWidth, this.viewportHeight);
        return out.copy(vec).unproject( viewport, this.invProjectionView );
    },

    getPickRay: function(x, y) {
        var origin = this.ray.origin.set(x, y, 0),
            direction = this.ray.direction.set(x, y, 1),
            viewport = tmpVec4.set(0, 0, this.viewportWidth, this.viewportHeight),
            mtx = this.invProjectionView;

        origin.unproject(viewport, mtx);
        direction.unproject(viewport, mtx);

        direction.sub(origin).normalize();
        return this.ray;
    },

    update: function() {
        //left empty for subclasses
    }
});

Camera.FAR_RANGE = 1.0;
Camera.NEAR_RANGE = 0.0;

// Regarding method overloading. It introduces a slow-down,
// but presumably this is negligible compared to the benefit of convenience.
// Besides, this is a high-level API!
// http://jsperf.com/arguments-length-perf

module.exports = Camera;


