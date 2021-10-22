precision highp float;

attribute vec4 vPosition;

uniform float uTableWidth;
uniform float uTableHeight;

varying float fCharge;


void main() {
	gl_PointSize = 20.0;

	gl_Position.x = (vPosition.x / (uTableWidth / 2.0));
	gl_Position.y = (vPosition.y / (uTableHeight / 2.0));
	gl_Position.zw = vec2(1.0, 1.0);
	
	fCharge = vPosition.z;
}
