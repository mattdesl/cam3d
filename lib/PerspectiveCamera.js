var Class = require('klasse');

var vec3 = require('gl-matrix').vec3;
var vec4 = require('gl-matrix').vec4;
var mat4 = require('gl-matrix').mat4;

var Camera = require('./Camera');

//Unify temp vectors between Camera + PerspectiveCamera + OrthographicCamera ?
var tmpVec = vec3.create();

var PerspectiveCamera = new Class({

	Extends: Camera,

	initialize: function(fieldOfView, viewportWidth, viewportHeight) {
		Camera.call(this);
		vec4.set(this.viewport, 0, 0, viewportWidth, viewportHeight);
		this.fieldOfView = fieldOfView;
	},

	update: function() {
		var aspect = this.viewport[2] / this.viewport[3];

		//create a perspective matrix for our camera
		mat4.perspective(this.projection, 
						 this.fieldOfView * Math.PI/180,
						 aspect, Math.abs(this.near), Math.abs(this.far));

		

		//build the view matrix 
		var tmp = vec3.add(tmpVec, this.position, this.direction);

		mat4.lookAt(this.view, this.position, tmp, this.up);

		//projection * view matrix
		mat4.multiply(this.combined, this.projection, this.view);

		//invert combined matrix, used for unproject
		mat4.invert(this.invProjectionView, this.combined);
	}
});

module.exports = PerspectiveCamera;