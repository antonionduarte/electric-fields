import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../../libs/utils.js";
import { vec2, flatten, vec4, sizeof } from "../../libs/MV.js"

/** @type {WebGLRenderingContext} */
var gl;
var program;
var chargeProgram;

// Buffers
var tableBuffer;
var chargeBuffer;

// GLSL Attributes 
let vPosition;
let vPointPosition;

// GLSL Uniforms
let uTableWidth;
let uTableHeight;
let uChargeTableWidth;
let uChargeTableHeight;

// Constants
const TABLE_WIDTH = 3.0;
const GRID_SPACING = 0.05;
const MAX_POINTS = 20;

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
	chargeProgram = buildProgramFromSources(gl, shaders["point_table.vert"], shaders["point_charge.frag"]);

	// Attrib locations
	vPosition = gl.getAttribLocation(program, "vPosition");
	vPointPosition = gl.getAttribLocation(chargeProgram, "vPosition");

	// Event listeners
	window.addEventListener("resize", resizeCanvas);
	canvas.addEventListener("click", (event) => {
    // Start by getting x and y coordinates inside the canvas element
    const x = (event.offsetX / canvas.width * TABLE_WIDTH) - TABLE_WIDTH / 2;
		const y = - ((event.offsetY / canvas.height * table_height) - table_height / 2);
		addPoint(x, y);
	});

	// Uniform Locations
	uTableWidth = gl.getUniformLocation(program, "uTableWidth");
	uTableHeight = gl.getUniformLocation(program, "uTableHeight");
	uChargeTableWidth = gl.getUniformLocation(chargeProgram, "uTableWidth");
	uChargeTableHeight = gl.getUniformLocation(chargeProgram, "uTableHeight");
	
	// Create the table
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;

	for (let x = - (GRID_SPACING / 2 + TABLE_WIDTH / 2); x <= TABLE_WIDTH / 2; x += GRID_SPACING) {
    for (let y = - (GRID_SPACING / 2 + table_height / 2); y <= table_height / 2; y += GRID_SPACING) {
			tableVertices.push(vec2(x, y));
    }
	}

	// Create the Buffers
	chargeBuffer = gl.createBuffer();
	tableBuffer = gl.createBuffer();

	// Fill in the buffer related to the points
	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 2 * 4 * MAX_POINTS, gl.STATIC_DRAW);

	// Fill in the buffer related to the table
	gl.bindBuffer(gl.ARRAY_BUFFER, tableBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(tableVertices), gl.STATIC_DRAW);

	// Setup the viewport and background color
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

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

function animate() {
	// Drawing
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Draw the table
	gl.useProgram(program);

	gl.uniform1f(uTableWidth, TABLE_WIDTH);
	gl.uniform1f(uTableHeight, table_height);

	gl.bindBuffer(gl.ARRAY_BUFFER, tableBuffer);
	gl.enableVertexAttribArray(vPosition);
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.POINTS, 0, tableVertices.length);
	gl.disableVertexAttribArray(vPosition);

	// Draw the points
	gl.useProgram(chargeProgram);

	gl.uniform1f(uChargeTableWidth, TABLE_WIDTH);
	gl.uniform1f(uChargeTableHeight, table_height);

	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.enableVertexAttribArray(vPointPosition);
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.POINTS, 0, charges.length);
	gl.disableVertexAttribArray(vPointPosition);

	window.requestAnimationFrame(animate);
}

loadShadersFromURLS(["point_table.vert", "point_table.frag", "point_charge.frag"]).then(shaders => setup(shaders));
