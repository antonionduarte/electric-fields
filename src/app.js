import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../libs/utils.js";
import { vec2, vec3, vec4, flatten, sizeof, radians  } from "../libs/MV.js"

/** 
 * @author Manuel Pereira - 57973
 * @author António Nunes Duarte - 58278
*/

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
let uLineLength;
let uFieldScale;

// Constants
const TABLE_WIDTH = 3.0;
const GRID_SPACING = 0.05;
const MAX_CHARGES = 20;

// HTML variables
const canvas = document.getElementById("gl-canvas");
const line_slider = document.getElementById("line-slider");
const field_slider = document.getElementById("field-slider");
const rotation_slider = document.getElementById("rotation-slider");
const sidebar = document.getElementById("sidebar");
const instructions = document.getElementById("instructions");
const close = document.getElementById("close");

// Others
let sidebarVisible = true;
let rotationMod = 1;

// Table variables
let table_height;
let tableVertices = [];

// Charge variables
let charges = []
let cVisible = true;

// Line length and field scaling
let lineLength = 1.0;
let fieldScaling = 1.0;

/**
 * Single-call setup function of all
 * 
 *
 * @param {*} shaders 
 */
function setup(shaders) {
	// Setup
	gl = setupWebGL(canvas);
	resizeCanvas();
	
	// Build programs
	program = buildProgramFromSources(gl, shaders["point-grid.vert"], shaders["point-grid.frag"]);
	chargeProgram = buildProgramFromSources(gl, shaders["charge.vert"], shaders["charge.frag"]);

	// Attrib locations
	vPosition = gl.getAttribLocation(program, "vPosition");
	vChargePosition = gl.getAttribLocation(chargeProgram, "vPosition");

	// Event listener setup
	eventListeners();

	// Uniform Locations
	uTableWidth = gl.getUniformLocation(program, "uTableWidth");
	uTableHeight = gl.getUniformLocation(program, "uTableHeight");
	uChargeAmount = gl.getUniformLocation(program, "uChargeAmount");
	uLineLength = gl.getUniformLocation(program, "uLineLength");
	uFieldScale = gl.getUniformLocation(program, "uFieldScale");
	uChargeTableWidth = gl.getUniformLocation(chargeProgram, "uTableWidth");
	uChargeTableHeight = gl.getUniformLocation(chargeProgram, "uTableHeight");

	// Create the table
	table_height = (TABLE_WIDTH / canvas.width) * canvas.height;

	let randX, randY;
	for (let x = - (GRID_SPACING / 2 + TABLE_WIDTH / 2); x <= TABLE_WIDTH / 2; x += GRID_SPACING) {
		for (let y = - (GRID_SPACING / 2 + table_height / 2); y <= table_height / 2; y += GRID_SPACING) {
			randX = (Math.random() - 0.5) * GRID_SPACING;
			randY = (Math.random() - 0.5) * GRID_SPACING;

			tableVertices.push(vec3(x + randX, y + randY, 1.0));
			tableVertices.push(vec3(x + randX, y + randY, 0.0));
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
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// Call animate for the first time
	animate();
}

/**
 * Function responsible for initializing all event listeners.
*/
function eventListeners() {
	window.addEventListener("resize", resizeCanvas);
	close.addEventListener("click", (event) => {
		instructions.style.display = "None";
	});
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
		switch (event.code) {
			case 'Space':
				cVisible = !cVisible;
				break;
			case 'Backspace':
				charges = [];
				break;
			case 'KeyU':
				toggleSidebar();
				break;
		}
	});

	// Sliders
	line_slider.oninput = () => {
		lineLength = line_slider.value;
	};
	field_slider.oninput = () => {
		fieldScaling = field_slider.value;
	};
	rotation_slider.oninput = () => {
		rotationMod = rotation_slider.value;
	};
}

/**
 * Function that toggles the sidebar visibility.
*/
function toggleSidebar() {
	sidebarVisible = !sidebarVisible;
	if (sidebarVisible) {
		sidebar.style.display = "block";
	} else {
		sidebar.style.display = "none";
	}
}

/**
 * Function that resizes the canvas correctly, by
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
 * Adds a new vec2 to the array of charges.
 * @param {float} x the x coordinate of the charge.
 * @param {float} y the y coordinate of the charge.
 * @param {boolean} shiftKey indicates if the shiftkey was pressed or not.
 */
function addCharge(x, y, shiftKey) {
	let chargeVal = shiftKey ? - 1.0 : 1.0;

	let newCharge = [vec3(x, y, chargeVal)];
	
	charges.push({x: x, y: y, charge: chargeVal});

	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, (charges.length - 1) * 2 * 4, flatten(newCharge));
}

/**
 * Function responsible for drawing the points or lines between two vertices.
 * @param {Array} uniforms array of uniforms and corresponding values (only simple uniform1f).
 * @param {WebGLBuffer} buffer the buffer to use.
 * @param {number} attribute the attribute to use.
 * @param {int} amount the amount of objects to draw.
 * @param {int} elemSize the size in bytes of each element to draw.
 * @param {number} glMode the glMode to draw with (could be gl.LINES, gl.POINTS etc...)
 * @param {int} stride the stride inside the buffer between each element.
 * @param {int} offset the offset inside the buffer before the start of the element.
*/
function drawPoints(uniforms, buffer, attribute, amount, elemSize, glMode, stride, offset) {    
	for (let i in uniforms) {
		let location = (uniforms[i])[0];
		let value = (uniforms[i])[1];
		gl.uniform1f(location, value);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(attribute);
	gl.vertexAttribPointer(attribute, elemSize, gl.FLOAT, false, stride, offset);
	gl.drawArrays(glMode, 0, amount)
	gl.disableVertexAttribArray(attribute);
}

/**
 * Function responsible for charge rotation around
 * the screen center.
 * 
 * Rotational speed is modified through the speed_mod field.
 */
function rotateCharges() {
	let newCharges = [];
	let rad = rotationMod * (Math.PI / 180.0),
		sin = Math.sin(rad),
		cos = Math.cos(rad);

	for (let i in charges) {
		let x = charges[i].x;
		let y = charges[i].y;
		let charge = charges[i].charge;

		// Rotated positions
		charges[i].x = (x * cos) - charge * (y * sin);
		charges[i].y = (charge * x * sin) + (y * cos);

		newCharges.push(vec3(charges[i].x, charges[i].y, charge))
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(newCharges));
}

/**
 * Function responsible of clearing the charges.
 */
function clearCharges() {
	charges = [];
	gl.bindBuffer(gl.ARRAY_BUFFER, chargeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 3 * 4 * MAX_CHARGES, gl.STATIC_DRAW);
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
		[uTableHeight, table_height],
		[uFieldScale, fieldScaling],
		[uLineLength, lineLength]
	];

	gl.uniform1i(uChargeAmount, charges.length);

	// Send the charge array into the table vertex shader
	for (let i = 0; i < charges.length; i++) {
		const uChargePosition = gl.getUniformLocation(program, "uChargePosition[" + i + "]");
		const charge = vec3(charges[i].x, charges[i].y, charges[i].charge);
		gl.uniform3fv(uChargePosition, flatten(charge));
	}
	
	drawPoints(uniforms, tableBuffer, vPosition, tableVertices.length, 3, gl.LINES, 0, 0);
	rotateCharges();

	// Draw the charges if they're supposed to be visible
	if (cVisible) {
		gl.useProgram(chargeProgram);

		uniforms = [[uChargeTableWidth, TABLE_WIDTH], [uChargeTableHeight, table_height]];
		drawPoints(uniforms, chargeBuffer, vChargePosition, charges.length, 3, gl.POINTS, 0, 0);
	}

	window.requestAnimationFrame(animate);
}

loadShadersFromURLS(["point-grid.vert", "point-grid.frag", "charge.vert", "charge.frag"]).then(shaders => setup(shaders));
