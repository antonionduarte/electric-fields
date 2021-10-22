#define TWOPI 6.28318530718
#define COULOMB 8987551792.3
#define MAX_CHARGES 20

precision highp float;

const float scale = 0.000000000007;
const float maxSize = 0.15; 

uniform float uTableWidth;
uniform float uTableHeight;
uniform vec3 uChargePosition[MAX_CHARGES];
uniform int uChargeAmount;

uniform float uLineLength;
uniform float uFieldScale;

attribute vec3 vPosition;

varying vec4 fColor;

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
	float finalScale = scale * uFieldScale;
	float finalLength = maxSize * uLineLength;	
	vec4 positionModifier = vec4(uTableWidth / 2.0, uTableHeight / 2.0, 1.0, 1.0);

	// If it's one of the points that are "allowed" to move
	if (vPosition.z == 1.0) {
		// If there are charges present on the field.
		if (uChargeAmount > 0) {
			vec2 vec;

			for (int i = 0; i < MAX_CHARGES; i++) {
				if (i >= uChargeAmount) break;

				float xC = uChargePosition[i].x;
				float yC = uChargePosition[i].y;
				float charge = uChargePosition[i].z;

				float force = - (COULOMB * (charge / pow(distance(vec2(xC, yC), vPosition.xy), 2.0))) * finalScale;
		
				vec += (vec2(xC, yC) - vec2(vPosition.x, vPosition.y)) * force;
			}

			// Limit the size of the lines
			if (length(vec) > finalLength) {
				vec2 vecN = normalize(vec);
				vec = finalLength * vecN;
			}

			float xF = vPosition.x + vec.x;
			float yF = vPosition.y + vec.y;
			
			fColor = colorize(vec);

			gl_Position = vec4(xF, yF, 1.0, 1.0) / positionModifier;
		}
	}

	// If it's one of the points that aren't "allowed" to move
	else {
		gl_Position = vec4(vPosition.x, vPosition.y, 1.0, 1.0) / positionModifier; 
		fColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
}
