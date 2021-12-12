import * as THREE from 'three'
import * as dat from 'dat.gui'
import { sin, cos } from 'mathjs'
import { MandelbrotFrag } from "./mandelbrot.frag"
import { MandelbrotIterationChangeFrag } from "./mandelbrotIterationChange.frag"
import { KochsnowflakeFrag } from './kochsnowflake.frag';

let camera, scene, renderer, canvas;
let gl, kochLine;
let geometry, material, mesh;
let uniforms;

let aspect = window.innerWidth / window.innerHeight;
let zoom = 3.0;
const MIN_ZOOM = 3.0;
// TODO: const MAX_ZOOM
let offset = new THREE.Vector2(-2.0 * aspect, -1.5);

let gui = new dat.GUI({ width: 300 });
let parameters = {
	a: 1.01,
	b: 0.01,
	c: 0.01,
	d: 0.01,
	e: 0.01,
	f: 0.01
}
for (let key in parameters) {
	gui.add(parameters, key, -5.0, 5.0).onChange(updateUniforms);
}

// starting settings ========================================================

let inSettingMode = false;
let initialFractal = "mandelbrot"; // "kochsnowflake";
let maxIterations = 200;
// in onColorSelect it converts the color to the opposite?! -> Why?!
let fractalColor = "#2070DF"; // blue
//let fractalColor = "#1E0064"; // initial violet
//let fractalColor = "#66cc33"; // green
let colorIntensity = 10.0;
let mouseWheelPressed = false;
let changeColorScaleOnScroll = false;
let downKeys = {};
let colorScale = 240.0;

// html elements ============================================================

let id_maxIterations = document.getElementById("maxIterations");
let id_fractalSelector = document.getElementById("fractalSelector");
id_fractalSelector.value = initialFractal;
let id_bt_settings = document.getElementById("bt_settings");
let id_outerSettings = document.getElementById("outerSettings");
let id_colorSelector = document.getElementById("colorSelector");
//id_colorSelector.value = initialColor; // doesn't work with rgb colors it seems
let id_colorIntensity = document.getElementById("colorIntensity");
let id_changeColorScaleOnScroll = document.getElementById("changeColorScaleOnScroll");
let id_bt_load = document.getElementById("bt_load");
let id_bt_save = document.getElementById("bt_save");
canvas = document.querySelector('canvas.webgl');

// event listeners ============================================================

window.addEventListener('resize', windowResize, true);
canvas.addEventListener('wheel', scroll);
canvas.addEventListener('mousedown', (event) => { if (event.button == 1 || event.buttons == 4) { mouseWheelPressed = true; } });
canvas.addEventListener('mouseup', (event) => { if (event.button == 1 || event.buttons == 4) { mouseWheelPressed = false; } });
canvas.addEventListener('mousemove', onMouseWheelDrag);
document.addEventListener("keydown", onKeydown);
document.addEventListener('keyup', event => { downKeys[event.keyCode] = false; });
id_maxIterations.addEventListener("input", onMaxIterations);
// "input" instead of "change" and it goes on the fly even with the mouse
//window.addEventListener("load", onFractalSelect, false);
id_fractalSelector.addEventListener("change", onFractalSelect);
id_bt_settings.addEventListener("click", onClickSettingsMenu);
id_colorSelector.addEventListener("input", onColorSelect);
id_colorIntensity.addEventListener("input", onColorIntensity);
id_changeColorScaleOnScroll.addEventListener("change", function () { (this.checked) ? changeColorScaleOnScroll = true : changeColorScaleOnScroll = false; });

// Setup functions ==========================================================

function setup() {
	camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

	//assign earlier in the document to limit mouse wheel action to canvas
	//   canvas = document.querySelector('canvas.webgl');

	scene = new THREE.Scene();

	// removes the canvas???
	//  gl = document.getElementById("fractalCanvas").getContext("webgl");
	//  gl.clearColor(0.0,0.0,0.0,1.0);
	//  gl.clear(gl.COLOR_BUFFER_BIT);

	renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, precision: 'highp' });
	// renderer.setSize( window.innerWidth, window.innerHeight-2 );
	// let canvas = document.getElementById("canvas");
	renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
	document.body.appendChild(renderer.domElement);
}

function animate() {
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function init() {
	setup();

	uniforms = {
		res: { type: 'vec2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
		aspect: { type: 'float', value: aspect },
		zoom: { type: 'float', value: zoom },
		offset: { type: 'vec2', value: offset },
		parameterSet1: { type: 'vec3', value: new THREE.Vector3(parameters['a'], parameters['b'], parameters['c']) },
		parameterSet2: { type: 'vec3', value: new THREE.Vector3(parameters['d'], parameters['e'], parameters['f']) },
		iterations: { type: 'int', value: maxIterations },
		color: { type: 'vec3', value: fractalColor },
		colorScale: { type: 'float', value: colorScale }
	};
	geometry = new THREE.PlaneBufferGeometry(2, 2);
	material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		fragmentShader: KochsnowflakeFrag,
	});
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	animate();
}

// Event functions ================================================

function windowResize() {  // aspect intentionally not updated
	aspect = window.innerWidth / window.innerHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();
	renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
}

// function scroll(event) {
// 	let zoom_0 = zoom;
// 	// let continueZoom = false;

// 	// if ("wheelDeltaY" in event) {
// 	// 	console.log
// 	// 	if (event.wheelDeltaY > 0) { // zoom in
// 	// 		continueZoom = true;
// 	// 		// TODO: if max zoom is exceeded: continueZoom = false
// 	// 	} else { // zoom out 
// 	// 		if (zoom_0 >= MIN_ZOOM) {
// 	// 			continueZoom = true;
// 	// 		}
// 	//   	}
// 	// }
// 	//   else{ // no use for this part of the code??
// 	// 	zoom *= 1 + event.deltaY*0.01;
// 	// 	console.log("test: " + zoom);
// 	//   }

// 	if (continueZoom) {
// 		zoom *= 1 - event.wheelDeltaY * 0.0003;
// 		let space = zoom - zoom_0;
// 		let mouseX = event.clientX / window.innerWidth;
// 		let mouseY = 1 - event.clientY / window.innerHeight;
// 		offset = offset.add(new THREE.Vector2(-mouseX * space * aspect, -mouseY * space));

// 		uniforms['zoom']['value'] = zoom;
// 		uniforms['offset']['value'] = offset;
// 	} else {
// 		console.log("No further zooming out possible.");
// 	}
// }

function scroll(event) {
	let zoom_0 = zoom;
	if ("wheelDeltaY" in event) {  // chrome vs. firefox
		zoom *= 1 - event.wheelDeltaY * 0.0003;
		if (changeColorScaleOnScroll) {
			colorScale = (colorScale + 5) % 360.0;
			mesh.material.uniforms.colorScale.value = colorScale;
		}
		if (event.wheelDeltaY < 0) { // zoom out
			// maxIterations -= 1;

		} else { // zoom in
			// maxIterations += 2;
			console.log(maxIterations);
			mesh.material.uniforms.iterations.value = maxIterations;
		}
		//   uniforms['iterations']['value'] = maxIterations;

	} else {
		zoom *= 1 + event.deltaY * 0.01;
	}

	let space = zoom - zoom_0;
	let mouseX = event.clientX / window.innerWidth;
	let mouseY = 1 - event.clientY / window.innerHeight;
	offset = offset.add(new THREE.Vector2(-mouseX * space * aspect, -mouseY * space));

	uniforms['zoom']['value'] = zoom;
	uniforms['offset']['value'] = offset;
}

function onMouseWheelDrag(event) {

}

function updateUniforms() {
	uniforms['parameterSet1']['value'] = new THREE.Vector3(parameters['a'], parameters['b'], parameters['c']);
	uniforms['parameterSet2']['value'] = new THREE.Vector3(parameters['d'], parameters['e'], parameters['f']);
}

function onKeydown(event) {
	if (inSettingMode) { // when we are in settings mode
		switch (event.key) {
			case "Enter":
				event.preventDefault();
				break;
			case "Tab":
				id_bt_closeSettings.click();
				event.preventDefault();
				break;
			case "a":
				id_fractalSelector.focus();
				break;
			case "s":
				id_maxIterations.focus();
				break;
			case "d":
				id_colorIntensity.focus();
				break;
			case "f":
				id_colorSelector.click();
				break;
			case "u":
				id_bt_load.click();
				break;
			case "i":
				id_bt_save.click();
				break;
		}
	} else { // when we are in explorer mode
		switch (event.key) {
			case "Tab":
				id_bt_openSettings.click();
				event.preventDefault();
				break;
		}
	}
	movePOV(event.keyCode);
}

function movePOV(keyCode) {
	// independent of settings mode:
	let horizontalMovement = 0.0;
	let verticalMovement = 0.0;
	downKeys[event.keyCode] = true;

	if (downKeys[37]) {
		horizontalMovement -= 0.05;
		console.log("test");
	}
	if (downKeys[39]) {
		horizontalMovement += 0.05;
	}
	if (downKeys[40]) {
		verticalMovement -= 0.05;
	}
	if (downKeys[38]) {
		verticalMovement += 0.05;
	}
	offset = offset.add(new THREE.Vector2(horizontalMovement, verticalMovement));
}

function onMaxIterations() {
	maxIterations = parseFloat(id_maxIterations.value);
	mesh.material.uniforms.iterations.value = maxIterations;
}

function onFractalSelect() {
	switch (id_fractalSelector.value) {
		case "mandelbrot":
			console.log("mandelbrot (default) was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: MandelbrotFrag,
			});
			break;
		case "mandelbrotIterationChange":
			console.log("mandelbrot with changeable iterations was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: MandelbrotIterationChangeFrag,
			});
			scene.remove(kochLine);
			break;
		case "kochsnowflake":
			console.log("kochsnowflake was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: KochsnowflakeFrag,
			});

			// implement koch line with 2 starting points
			const kochGeometry = new THREE.BufferGeometry();

			let points = [];
			points.push(new THREE.Vector3(-0.5, 0, 0));
			points.push(new THREE.Vector3(0.5, 0, 0));
			//points.push( new THREE.Vector3( 0.0, 0.5, 0 ) );

			points = koch(points, 1);
			console.log("final points: \n", points);

			kochGeometry.setFromPoints(points);
			const kochMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
			kochLine = new THREE.Line(kochGeometry, kochMaterial);
			scene.add(kochLine);
			break;
		default:
			console.log("no fractal selected");
	}
}

function onClickSettingsMenu() {
	if (inSettingMode) {
		id_outerSettings.style.display = "none";
		inSettingMode = false;
	} else {
		id_outerSettings.style.display = "block";
		inSettingMode = true;
	}
}

function onColorSelect() {
	function convert(color) {
		// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
		// for the following ES6 function
		const hexToRGBArray = hex => hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16));

		color = hexToRGBArray(color);
		color = new THREE.Vector3(color[0], color[1], color[2]);
		color = color.divideScalar(255.0) // range 0 to 1
		let convert = new THREE.Vector3(1.0, 1.0, 1.0);
		convert.sub(color);
		color = convert;
		return color
	}

	fractalColor = convert(id_colorSelector.value);
	onColorChange();
}

function onColorIntensity() {
	colorIntensity = id_colorIntensity.value;
	onColorChange();
}

function onColorChange() { // both ColorSelect and ColorIntensity!!!
	let placeHolderColor = new THREE.Vector3();
	placeHolderColor.copy(fractalColor);
	placeHolderColor.multiplyScalar(colorIntensity);
	mesh.material.uniforms.color.value = placeHolderColor;
	placeHolderColor = null;
	console.log(fractalColor);
}


// download option preparation

//let link = document.createElement('a');
//link.href = document.getElementById("fractalCanvas");
//link.download = 'Snapshot.jpg';
//document.body.appendChild(link);
//link.click();
//document.body.removeChild(link);

// Kochsnowflake computation functions =======================================

function koch(points, depth) {
	// points is an array of THREE.Vector3 instances
	length = points.length - 1;
	for (let j = 0; j < length; j++) {
		let p1 = points[j];
		let p2 = points[j + 1];

		points = divideLine(p1, p2, depth, points);
		//console.log(points);
	}
	return points;
}

function triangulate(p1, p2) {
	let v1 = new THREE.Vector3();
	v1.subVectors(p2, p1);
	v1.z = 0.0;

	let v2 = new THREE.Vector3();
	v2.x = v1.x * Math.cos(60.0) - v1.y * Math.sin(60.0);
	v2.y = v1.x * Math.sin(60.0) + v1.y * Math.cos(60.0);
	v2.x += p2.x; //p1.x??
	v2.y += p2.y;
	v2.z = 0.0;

	return v2;
}

function divideLine(p1, p2, depth, points) {
	let v1 = new THREE.Vector3();
	let v2 = new THREE.Vector3();

	v1.lerpVectors(p1, p2, 1.0 / 3.0);
	v2.lerpVectors(p1, p2, 2.0 / 3.0);

	let v3 = triangulate(p1, p2);

	if (depth == 1) {
		let start = points.findIndex((element) => element == p1);
		let end = points.findIndex((element) => element == p2);
		points = points.slice(0, start + 1).concat([v1, v3, v2], points.slice(end));
		//console.log(points);
		return points;
	}

	divideLine(p1, v1, depth - 1, points);
	divideLine(v1, v2, depth - 1, points);
	divideLine(v2, v3, depth - 1, points);
	divideLine(v3, p2, depth - 1, points);
}

// Initialization ==========================================================

init();
onFractalSelect();
onMaxIterations();
id_colorSelector.value = fractalColor;
onColorSelect();
