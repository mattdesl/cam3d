


/*
Vectors: Typed Arrays vs Objects

*/


var vec3 = require('gl-matrix').vec3;
var quat = require('gl-matrix').quat;
var mat4 = require('gl-matrix').mat4;


var tmpVec3 = vec3.create();
var tmpMat = mat4.create();
var tmpQuat = quat.create();

function Vec3(x, y, z) {
	this.x = x||0;
	this.y = y||0;
    this.z = z||0;
};

Vec3.prototype.transformQuat = function(q) {
    var x = this.x, y = this.y, z = this.z,
        qx = q.x, qy = q.y, qz = q.z, qw = q.w,

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
};

Vec3.prototype.transformQuat2 = function(q) {
    tmpVec3[0] = this.x;
    tmpVec3[1] = this.y;
    tmpVec3[2] = this.z;
    tmpQuat[0] = q.x;
    tmpQuat[1] = q.y;
    tmpQuat[2] = q.z;
    tmpQuat[3] = q.w;
    vec3.transformQuat(tmpVec3, tmpVec3, tmpQuat);
    this.x = tmpVec3[0];
    this.y = tmpVec3[1];
    this.z = tmpVec3[2];
    return this;
};

Vec3.prototype.transformMat4 = function(m) {
    tmpVec3[0] = this.x;
    tmpVec3[1] = this.y;
    tmpVec3[2] = this.z;
    vec3.transformMat4(tmpVec3, tmpVec3, m);
    this.x = tmpVec3[0];
    this.y = tmpVec3[1];
    this.z = tmpVec3[2];
    return this;
};

Vec3.prototype.normalize = function() {
    var x = this.x,
        y = this.y,
        z = this.z;
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        this.x = x * len;
        this.y = y * len;
        this.z = z * len;
    }
    return this;
};

Vec3.prototype.normalize2 = function() {
    tmpVec3[0] = this.x;
    tmpVec3[1] = this.y;
    tmpVec3[2] = this.z;
    vec3.normalize(tmpVec3, tmpVec3);
    this.x = tmpVec3[0];
    this.y = tmpVec3[1];
    this.z = tmpVec3[2];
    return this;
};

Vec3.prototype.add = function(o) {
    this.x += o.x;
    this.y += o.y;
    this.z += o.z;
    return this;
};

function Quat(x,y,z,w) {
    this.x = x||0;
    this.y = y||0;
    this.z = z||0;
    this.w = w||0;
};


///// tests
var o_quat = new Quat(0.5, 0, -10, 3);
var o_vec = new Vec3(5, 10, -25);
var o_vec2 = new Vec3(-10, 50, 25);

var gl_quat = quat.fromValues(0.5, 0, -10, 3);
var gl_vec = vec3.fromValues(5, 10, -25);
var gl_vec2 = vec3.fromValues(-10, 50, 25);

//use typed arrays for matrices in both apis
var mat = mat4.create();

//object approach
o_quat.x = Math.random();
o_vec.z = Math.random();
o_vec.transformQuat( o_quat );
o_vec.transformMat4( mat );
o_vec.normalize().add(o_vec2);
o_vec.x += 2;

//typed array approach
o_quat[0] = Math.random();
o_vec[2] = Math.random();
vec3.transformQuat( gl_vec, gl_vec, gl_quat );
vec3.transformMat4( gl_vec, gl_vec, mat );
vec3.normalize( gl_vec, gl_vec )
vec3.add( gl_vec, gl_vec, gl_vec2 );
gl_vec[0] += 2;



//object approach, wrapping vec3 instead of inlining some complex funcs
o_quat.x = Math.random();
o_vec.z = Math.random();
o_vec.transformQuat2( o_quat );
o_vec.transformMat4( mat );
o_vec.normalize2().add(o_vec2);
o_vec.x += 2;