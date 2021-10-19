precision highp float;

attribute vec4 vPosition;

uniform float uTableWidth;
uniform float uTableHeight;

uniform float uTheta;

void main() {
	float s = sin(uTheta);
	float c = cos(uTheta);

	gl_PointSize = 4.0;

	gl_Position.x = -s * (vPosition.y / (uTableWidth / 2.0)) + c * (vPosition.x / (uTableHeight / 2.0));
	gl_Position.y = s * (vPosition.x / (uTableWidth / 2.0)) + c * (vPosition.y / (uTableHeight / 2.0));
	gl_Position.zw = vec2(1.0, 1.0);
}
