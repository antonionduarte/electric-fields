/**
 * Author: António Nunes Duarte
 * Author: Manuel Pereira
 */

precision highp float;

void main() {
	float x = gl_PointCoord.x;
	float y = gl_PointCoord.y;

	if (0.25 <= pow(x - 0.5, 2.0) + pow(y - 0.5, 2.0)) {
		discard;
	}

	gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}	
