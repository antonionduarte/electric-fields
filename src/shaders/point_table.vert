#define TWOPI 6.28318530718

precision highp float;

uniform float uTableWidth;
uniform float uTableHeight;

attribute vec3 vPosition;

varying vec4 aColor;

// convert angle to hue; returns RGB
// colors corresponding to (angle mod TWOPI):
// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
vec3 angle_to_hue(float angle) {
  angle /= TWOPI;
  return clamp((abs(fract(angle + vec3(3.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f) {
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.0);
}

void main() {
  vec4 positionModifier = vec4(uTableWidth / 2.0, uTableHeight / 2.0, 1.0, 1.0);
  //if (vPosition.z == 1.0) {
	//  gl_Position = vec4(vPosition.x, vPosition.y, 0.0, 1.0) / positionModifier;
  //} else {
	//  gl_Position = vec4(vPosition.x / (uTableWidth / 2.0) + 0.02, (vPosition.y / (uTableHeight / 2.0)) + 0.02, 0, 1);
  //}
	gl_Position = vec4(vPosition.x, vPosition.y, 0, 1) / positionModifier; 
	gl_PointSize = 4.0;
  aColor = colorize(vec2(vPosition.x, vPosition.y));
}
