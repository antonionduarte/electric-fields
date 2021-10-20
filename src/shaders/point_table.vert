#define TWOPI 6.28318530718
#define COULOMB 8987551792
#define MAX_CHARGES 20

precision highp float;

const float scale = 0.00000000001;
const float maxSize = 0.25; 

uniform float uTableWidth;
uniform float uTableHeight;
uniform vec3 uChargePosition[MAX_CHARGES];
uniform int uChargeAmount;

attribute vec3 vPosition;

varying vec4 aColor;

/* Converts angle to hue; returns RGB
/ colors corresponding to (angle mod TWOPI):
/ 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
*/
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
  
	int chargeCounter = uChargeAmount;
  // calculate the forces for this vector
  if (vPosition.z == 1.0) {
    // TODO: do stuff here
    float xF;
		float yF;

    // provavelmente fazer cálculos para cada carga?
		if (uChargeAmount > 0) {
			for (int i = 0; i < MAX_CHARGES; i++) {
				if (i >= uChargeAmount) break;

				float xC = uChargePosition[i].x;
				float yC = uChargePosition[i].y;

				vec2 vec = vec2(xC, yC) - vec2(vPosition.x, vPosition.y);
				
				float dist = sqrt((vec.x * vec.x) + (vec.y * vec.y));

				if (dist > maxSize) {
					vec2 vecN = normalize(vec);
					vec = maxSize * vecN;
				}

				xF = vPosition.x + vec.x;
				yF = vPosition.y + vec.y;
			}

			gl_Position = vec4(xF, yF, 0, 1) / positionModifier;
		} 
		else {
			gl_Position = vec4(vPosition.x, vPosition.y, 0, 1) / positionModifier;
		}

		aColor = colorize(vec2(xF, yF));
  }

	if (vPosition.z == 0.0) {
  	gl_Position = vec4(vPosition.x, vPosition.y, 0, 1) / positionModifier; 
  	aColor = vec4(0.0, 0.0, 0.0, 1.0); 
	}

	gl_PointSize = 4.0;
}
