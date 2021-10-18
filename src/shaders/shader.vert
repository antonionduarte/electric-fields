precision highp float;

attribute vec4 vPosition;

uniform float uTableWidth;
uniform float uTableHeight;

void main() {
	gl_Position = vec4(vPosition.x / (uTableWidth / 2.0), vPosition.y / (uTableHeight / 2.0), 0, 1);
	gl_PointSize = 4.0;
}