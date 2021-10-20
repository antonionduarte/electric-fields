import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../libs/utils.js";
import { vec2, vec3, vec4, flatten, sizeof, radians  } from "../libs/MV.js"

/** @type {WebGLRenderingContext} */
var gl;
var program;
var chargeProgram;

// Buffers
var tableBuffer;
var chargeBuffer;

// GLSL Attributes 
let vPosition;
let vChargePosition;

// GLSL Uniforms
let uTableWidth;
let uTableHeight;
let uChargeTableWidth;
let uChargeTableHeight;
let uChargeAmount;

// Constants
const TABLE_WIDTH = 3.0;
const GRID_SPACING = 0.05;
const MAX_CHARGES = 20;
const ROTATION_MOD = 1.5;

// HTML variables
const canvas = document.getElementById("gl-canvas");

// Table variables
let table_height;
let tableVertices = [];

// Charge variables
let charges = []
let cVisible = true;

function setup(shaders) {
	// Setup
	gl = setupWebGL(canvas);
	resizeCanvas();
	
	// Build programs
	program = buildProgramFromSources(gl, shaders["point_table.vert"], shaders["point_table.frag"]);
	chargeProgram = buildProgramFromSources(gl, shaders["point_charge.vert"], shaders["point_charge.frag"]);

	// Attrib locations
	vPosition = gl.getAttribLocation(program, "vPosition");
	vChargePosition = gl.getAttribLocation(chargeProgram, "vPosition");

	// Event listeners
	window.addEventListener("resize", resizeCanvas);
	canvas.addEventListener("click", (event) => {
		// Start by getting x and y coordinates inside the canvas element
		const x = (event.offsetX / canvas.width * TABLE_WIDTH) - TABLE_WIDTH / 2;
		const y = - ((event.offsetY / canvas.height * table_height) - table_height / 2);

		if (charges.length + 1 <= MAX_CHARGES) {
			addCharge(x, y, event.shiftKey);
		} else {
			alert("Charge limit exceeded");
		}
	});
	window.addEventListener("keydown", (event) => {
		if(event.code == 'Space') {
			cVisible = !cVisible;
		}
	})

	// Uniform Locations
	uTableWidth = gl.getUniformLocation(program, "uTableWidth");
	uTableHeight = gl.getUniformLocation(program, "uTableHeight");
	uChargeAmount = gl.getUniformLocation(program, "uChargeAmount");
	uChargeTableWidth = gl.getUniformLocation(chargeProgram, "uTableWidth");
	uChargeTableHeight = gl.getUniformLocation(chargeProgram, "uTableHeight");

	// Create the table
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;

	let rand;
	for (let x = - (GRID_SPACING / 2 + TABLE_WIDTH / 2); x <= TABLE_WIDTH / 2; x += GRID_SPACING) {
		for (let y = - (GRID_SPACING / 2 + table_height / 2); y <= table_height / 2; y += GRID_SPACING) {
			rand = (Math.random() - 0.5) * GRID_SPACING;

			tableVertices.push(vec3(x + rand, y + rand, 1.0));
			tableVertices.push(vec3(x + rand, y + rand, 0.0));
		}
	}

	// Create the Buffers
	chargeBuffer = gl.createBuffer();
	tableBuffer = gl.createBuffer();

	// Fill in the buffer related to the points
	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 3 * 4 * MAX_CHARGES, gl.STATIC_DRAW);

	// Fill in the buffer related to the table
	gl.bindBuffer(gl.ARRAY_BUFFER, tableBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(tableVertices), gl.STATIC_DRAW);

	// Setup the viewport and background color
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Call animate for the first time
	animate();
}

/**
 * Adds a new vec2 to the array of charges.
 * @param {float} x the x coordinate of the charge.
 * @param {float} y the y coordinate of the charge.
 * @param {boolean} shiftKey indicates if the shiftkey was pressed or not
 */
function addCharge(x, y, shiftKey) {
	let newCharge = [vec2(x, y)];
	
	charges.push({x: x, y: y, charge: shiftKey ? - 1.0 : 1.0});

	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, (charges.length - 1) * 2 * 4, flatten(newCharge));
}

/**
 * Functions that resizes the canvas correctly, by
 * updating the width of the canvas, the height of the canvas,
 * the height of the table and resetting the gl viewport with those new values.
 */
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

/**
 * Function responsible for drawing the points or lines between two vertices.
 * @param {Array} uniforms
 * @param {} buffer
 * @param {} attribute
 * @param {int} amount
 * @param {int} vecSize
 * @param {} glMode
 * @param {int} stride
 * @param {int} offset
*/
function drawPoints(uniforms, buffer, attribute, amount, vecSize, glMode, stride, offset) {    
	for (let i in uniforms) {
		let location = (uniforms[i])[0];
		let value = (uniforms[i])[1];
		gl.uniform1f(location, value);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(attribute);
	gl.vertexAttribPointer(attribute, vecSize, gl.FLOAT, false, stride, offset);
	gl.drawArrays(glMode, 0, amount)
	gl.disableVertexAttribArray(attribute);
}

/*
 * Rotates the charges,
 * by changing their coordinates,
 * around the center of the table in a circular motion.
*/
function rotateCharges() {
	let newCharges = [];
	let rad = ROTATION_MOD * (Math.PI / 180.0),
		s = Math.sin(rad),
		c = Math.cos(rad);

	for (let i in charges) {
		let x = charges[i].x;
		let y = charges[i].y;
		let charge = charges[i].charge;

		// Rotated positions
		charges[i].x = (x * c) - charge * (y * s);
		charges[i].y = (charge * x * s) + (y * c);

		newCharges.push(vec2(charges[i].x, charges[i].y))
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(newCharges));
}

/*
 * Functions that runs on every frame and draws 
 * the appropriate elements on the appropriate positions.
*/
function animate() {
	// Drawing
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Draw the table
	gl.useProgram(program);

	let uniforms = [
		[uTableWidth, TABLE_WIDTH], 
		[uTableHeight, table_height]
	];

	gl.uniform1i(uChargeAmount, charges.length);

	for (let i = 0; i < charges.length; i++) {
		const uChargePosition = gl.getUniformLocation(program, "uChargePosition[" + i + "]");
		const charge = vec3(charges[i].x, charges[i].y, charges[i].charge);
		gl.uniform3fv(uChargePosition, flatten(charge));
	}
	
	drawPoints(uniforms, tableBuffer, vPosition, tableVertices.length, 3, gl.LINES, 0, 0);

	rotateCharges();

	if(cVisible) {
		// Draw the charges
		gl.useProgram(chargeProgram);

		uniforms = [[uChargeTableWidth, TABLE_WIDTH], [uChargeTableHeight, table_height]];
		drawPoints(uniforms, chargeBuffer, vChargePosition, charges.length, 2, gl.POINTS, 0, 0);
	}
	window.requestAnimationFrame(animate);
}

loadShadersFromURLS(["point_table.vert", "point_table.frag", "point_charge.vert", "point_charge.frag"]).then(shaders => setup(shaders));
