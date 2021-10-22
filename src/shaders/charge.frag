precision highp float;

varying float fCharge;

void main() {
	float x = gl_PointCoord.x;
	float y = gl_PointCoord.y;

	//Shapes point into sphere.
	if (0.25 <= pow(x - 0.5, 2.0) + pow(y - 0.5, 2.0)) discard;
	

	if (0.15 >= pow(x - 0.5, 2.0) && 0.010 >= pow(y - 0.5, 2.0)) discard; 


	if (fCharge == 1.0) {
		if (0.15 >=  pow(y - 0.5, 2.0) && 0.010 >= pow(x - 0.5, 2.0)) discard;
		
		gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
	} 
	else {
		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	}
}	
