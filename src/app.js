import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../../libs/utils.js";
import { vec2, flatten, vec4, sizeof } from "../../libs/MV.js"

/** @type {WebGLRenderingContext} */
var gl;
var program;
var pointProgram;

// Buffers
var tableBuffer;
var pointBuffer;

// GLSL attributes and uniforms
let vPosition;
let vPointPosition;
let uTableWidth;
let uTableHeight;

// Constants
const TABLE_WIDTH = 3.0;
const GRID_SPACING = 0.05;
const MAX_POINTS = 20;

// HTML variables
const canvas = document.getElementById("gl-canvas");

// Table variables
let table_height;
let vertices = [];

// Point variables
let points = []

function setup(shaders) {
	// Setup
	gl = setupWebGL(canvas);
	resizeCanvas();
	
	// Build programs
	program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
	pointProgram = buildProgramFromSources(gl, shaders["shader.vert"], shaders["point.frag"]);

	// Attrib locations
	vPosition = gl.getAttribLocation(program, "vPosition");
	vPointPosition = gl.getAttribLocation(pointProgram, "vPosition");

	// Event listeners
	window.addEventListener("resize", resizeCanvas);
	canvas.addEventListener("click", (event) => {
    // Start by getting x and y coordinates inside the canvas element
    const x = (event.offsetX / canvas.width * TABLE_WIDTH) - TABLE_WIDTH / 2;
		const y = (event.offsetY / canvas.height * table_height) - table_height / 2;
		addPoint(x, y);
	});

	// Uniform Locations
	uTableWidth = gl.getUniformLocation(program, "uTableWidth");
	uTableHeight = gl.getUniformLocation(program, "uTableHeight");
	
	// Create the table
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;

	for (let x = - (GRID_SPACING / 2 + TABLE_WIDTH / 2); x <= TABLE_WIDTH / 2; x += GRID_SPACING) {
    for (let y = - (GRID_SPACING / 2 + table_height / 2); y <= table_height / 2; y += GRID_SPACING) {
			vertices.push(vec2(x, y));
    }
	}

	// Create the Buffers
	pointBuffer = gl.createBuffer();
	tableBuffer = gl.createBuffer();

	// Fill in the buffer related to the points
	gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 2 * 4 * MAX_POINTS, gl.STATIC_DRAW);

	// Fill in the buffer related to the table
	gl.bindBuffer(gl.ARRAY_BUFFER, tableBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

	// Setup the viewport and background color
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Call animate for the first time
	animate();
}

function addPoint(x, y) {
	let newPoint = [vec2(x, y)];
	points.push(vec2(x, y));
	console.log(points);

	gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, (points.length - 1) * 2 * 4, flatten(newPoint));
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

function animate() {
	// Drawing
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Draw the vertices
	gl.useProgram(program);

	gl.uniform1f(uTableWidth, TABLE_WIDTH);
	gl.uniform1f(uTableHeight, table_height);

	gl.bindBuffer(gl.ARRAY_BUFFER, tableBuffer);
	gl.enableVertexAttribArray(vPosition);
	gl.drawArrays(gl.POINTS, 0, vertices.length);
	gl.disableVertexAttribArray(vPosition);

	// Draw the points
	gl.useProgram(pointProgram);
	gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
	gl.vertexAttribPointer(vPointPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPointPosition);
	gl.drawArrays(gl.POINTS, 0, points.length);
	gl.disableVertexAttribArray(vPointPosition);

	window.requestAnimationFrame(animate);
}

loadShadersFromURLS(["shader.vert", "shader.frag", "point.frag"]).then(shaders => setup(shaders));
