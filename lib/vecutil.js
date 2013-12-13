
var mat4 = require('gl-matrix').mat4;
var vec4 = require('gl-matrix').vec4;
var quat = require('gl-matrix').quat;
var vec3 = require('gl-matrix').vec3;

var tmpMat4 = mat4.create();
var tmpQuat = quat.create();
var tmpVec3 = vec3.create();
var tmpVec4 = vec4.create();

var util = {};

/**
 * Unproject a 2D point into 3D space.
 * @param  {vec3} out               [description]
 * @param  {vec3} vec               [description]
 * @param  {vec4} viewport          [description]
 * @param  {mat4} invProjectionView [description]
 * @return {vec3}                   [description]
 */
util.unproject = function(out, vec, viewport, invProjectionView) {
    var viewX = viewport[0],
        viewY = viewport[1],
        viewWidth = viewport[2],
        viewHeight = viewport[3];
    
    var x = vec[0], 
        y = vec[1],
        z = vec[2];

    x = x - viewX;
    y = viewHeight - y - 1;
    y = y - viewY;

    out[0] = (2 * x) / viewWidth - 1;
    out[1] = (2 * y) / viewHeight - 1;
    out[2] = 2 * z - 1;

    return util.prj(out, out, invProjectionView);
};

/**
 * vec3.prj - multiply by matrix with W divide.
 * 
 * @param {vec3} 
 * @param {vec3}
 * @return {vec3} [description]
 */
util.prj = function(out, vec, m) {
    var x = vec[0],
        y = vec[1],
        z = vec[2],
        a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3],
        a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
        a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11],
        a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

    var l_w = 1 / (x * a03 + y * a13 + z * a23 + a33);

    out[0] = (x * a00 + y * a10 + z * a20 + a30) * l_w; 
    out[1] = (x * a01 + y * a11 + z * a21 + a31) * l_w; 
    out[2] = (x * a02 + y * a12 + z * a22 + a32) * l_w;
    return out;
};






util.prj2 = function(out, vec, m) {
    vec4.set(tmpVec4, vec[0], vec[1], vec[2], 1);

    vec3.transformMat4(tmpVec4, tmpVec4, m);
    out[0] = tmpVec4[0] / tmpVec4[3];
    out[1] = tmpVec4[1] / tmpVec4[3];
    out[2] = tmpVec4[2] / tmpVec4[3];
    return out;
};

/**
 * vec3.rotate - rotates a vector by axis angle.
 *
 * This is the same as transforming a point by an 
 * axis-angle quaternion, but it has higher precision.
 * 
 * @param  {vec3} out     [description]
 * @param  {vec3} vec     [description]
 * @param  {vec3} axis    [description]
 * @param  {float} radians [description]
 * @return {vec3}         [description]
 */
util.rotate = function(out, vec, axis, radians) {
    //set the quaternion to our axis angle
    quat.setAxisAngle( tmpQuat, axis, radians );

    //create a rotation matrix from the axis angle
    tmpVec3[0] = tmpVec3[1] = tmpVec3[2] = 0;
    mat4.fromRotationTranslation( tmpMat4, tmpQuat, tmpVec3 );

    //multiply our vector by the rotation matrix
    return vec3.transformMat4( out, vec, tmpMat4 );
};


// ///// TODO: wrappers - yes or no? probably not.
// util.wrap = {
// };
// util.wrap.vec2 = function(x, y) {
//     this.items = vec2.fromValues(x||0, y||0);
// };
// util.wrap.vec3 = function(x, y, z) {
//     this.items = vec3.fromValues(x||0, y||0, z||0);
// };
// util.wrap.vec4 = function(x, y, z, w) {
//     this.items = vec4.fromValues(x||0, y||0, z||0, w||0);
// };

module.exports = util;