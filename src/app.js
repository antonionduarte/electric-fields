import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../libs/utils.js";
import { vec2, vec3, vec4, flatten, sizeof } from "../libs/MV.js"

/** @type {WebGLRenderingContext} */
var gl;
var program;
var chargeProgram;

var chargeTheta = 0;

// Buffers
var tableBuffer;
var chargeBuffer;

// GLSL Attributes 
let vPosition;
let vPointPosition;

// GLSL Uniforms
let uTableWidth;
let uTableHeight;

let uChargeWidth;
let uChargeHeight;
let uChargeTheta;

// Constants
const TABLE_WIDTH = 3.0;
const GRID_SPACING = 0.05;
const MAX_POINTS = 20;
const CHARGE_SPEED_MOD = 0.025;

// HTML variables
const canvas = document.getElementById("gl-canvas");

// Table variables
let table_height;
let tableVertices = [];

// Point variables
let charges = []

function setup(shaders) {
	// Setup
	gl = setupWebGL(canvas);
	resizeCanvas();
	
	// Build programs
	program = buildProgramFromSources(gl, shaders["point_table.vert"], shaders["point_table.frag"]);
	chargeProgram = buildProgramFromSources(gl, shaders["point_charge.vert"], shaders["point_charge.frag"]);

	// Attrib locations
	vPosition = gl.getAttribLocation(program, "vPosition");
	vPointPosition = gl.getAttribLocation(chargeProgram, "vPosition");

	// Event listeners
	window.addEventListener("resize", resizeCanvas);
	canvas.addEventListener("click", (event) => {
    // Start by getting x and y coordinates inside the canvas element
    const x = (event.offsetX / canvas.width * TABLE_WIDTH) - TABLE_WIDTH / 2;
		const y = - ((event.offsetY / canvas.height * table_height) - table_height / 2);

		if (charges.length + 1 <= 20) {
			addPoint(x, y);
		} else {
			alert("Charge limit exceeded");
		}
	});

	// Uniform Locations
	uTableWidth = gl.getUniformLocation(program, "uTableWidth");
	uTableHeight = gl.getUniformLocation(program, "uTableHeight");
	uChargeWidth = gl.getUniformLocation(chargeProgram, "uTableWidth");
	uChargeHeight = gl.getUniformLocation(chargeProgram, "uTableHeight");
	uChargeTheta = gl.getUniformLocation(chargeProgram, "uTheta");
	
	// Create the table
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;

	for (let x = - (GRID_SPACING / 2 + TABLE_WIDTH / 2); x <= TABLE_WIDTH / 2; x += GRID_SPACING) {
    for (let y = - (GRID_SPACING / 2 + table_height / 2); y <= table_height / 2; y += GRID_SPACING) {
			tableVertices.push(vec3(x, y, 1.0));
			tableVertices.push(vec3(x, y, 0.0));
    }
	}

	// Create the Buffers
	chargeBuffer = gl.createBuffer();
	tableBuffer = gl.createBuffer();

	// Fill in the buffer related to the points
	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 3 * 4 * MAX_POINTS, gl.STATIC_DRAW);

	// Fill in the buffer related to the table
	gl.bindBuffer(gl.ARRAY_BUFFER, tableBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(tableVertices), gl.STATIC_DRAW);

	// Setup the viewport and background color
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	console.log(tableVertices.length);

	// Call animate for the first time
	animate();
}

function addPoint(x, y) {
	let newPoint = [vec2(x, y)];
	charges.push(vec2(x, y));
	//console.log(charges);

	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, (charges.length - 1) * 2 * 4, flatten(newPoint));
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

function drawPoints(uniforms, buffer, attribute, srcData, vecSize, glMode) {    
    for (let i in uniforms) {
        let location = (uniforms[i])[0];
        let value = (uniforms[i])[1];
        gl.uniform1f(location, value);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.enableVertexAttribArray(attribute);
		gl.vertexAttribPointer(attribute, vecSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(glMode, 0, srcData.length)
		gl.disableVertexAttribArray(attribute);
}

function animate() {
	// Drawing
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	chargeTheta += 1 * CHARGE_SPEED_MOD;

	// Draw the table
	gl.useProgram(program);

	let uniforms = [[uTableWidth, TABLE_WIDTH], [uTableHeight, table_height]];
	drawPoints(uniforms, tableBuffer, vPosition, tableVertices, 3, gl.LINES);

	// Draw the points
	gl.useProgram(chargeProgram);

	uniforms = [[uChargeWidth, TABLE_WIDTH], 
						  [uChargeHeight, table_height], 
						  [uChargeTheta, chargeTheta]
	];
	drawPoints(uniforms, chargeBuffer, vPointPosition, charges, 2, gl.POINTS);

	window.requestAnimationFrame(animate);
}

loadShadersFromURLS(["point_table.vert", "point_table.frag", "point_charge.vert", "point_charge.frag"]).then(shaders => setup(shaders));
