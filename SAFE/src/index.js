import * as THREE from 'three'
import * as dat from 'dat.gui'
import { sin, cos} from 'mathjs'
import { MandelbrotFrag } from "./mandelbrot.frag"
import { MandelbrotIterationChangeFrag } from "./mandelbrotIterationChange.frag"
import { KochsnowflakeFrag } from './kochsnowflake.frag';
//import { Test1Frag } from './test1.frag';
//import { Test2Frag } from './test2.frag';

let camera, scene, renderer, canvas;
let gl;
let geometry, material, mesh;
let kochGeometry, kochMaterial, kochMesh;
let uniforms;

let aspect = window.innerWidth / window.innerHeight;
let zoom = 4.0;
let offset = new THREE.Vector2(-2.0*aspect, -2.0);

let gui = new dat.GUI({width: 300});
let parameters = {
  a: 1.01,
  b: 0.01,
  c: 0.01,
  d: 0.01,
  e: 0.01,
  f: 0.01
}
for (let key in parameters){
  gui.add(parameters, key, -5.0, 5.0).onChange(updateUniforms);
}

// starting settings ========================================================

let inSettingMode = false;
let initialFractal = "kochsnowflake"; // "mandelbrot";
let iterations = 200;
// in onColorSelect it converts the color to the opposite?! -> Why?!
let fractalColor = "#2070DF"; // blue
//let fractalColor = "#1E0064"; // initial violet
//let fractalColor = "#66cc33"; // green
let colorIntensity = 10.0;

// html elements ============================================================

let id_iterations = document.getElementById("iterations");
let id_fractalSelector = document.getElementById("fractalSelector");
id_fractalSelector.value = initialFractal;
let id_bt_closeSettings = document.getElementById("bt_closeSettings");
let id_bt_openSettings = document.getElementById("bt_openSettings");
let id_outerSettings = document.getElementById("outerSettings");
let id_colorSelector = document.getElementById("colorSelector");
//id_colorSelector.value = initialColor; // doesn't work with rgb colors it seems
let id_colorIntensity = document.getElementById("colorIntensity");
let id_bt_load = document.getElementById("bt_load");
let id_bt_save = document.getElementById("bt_save");

// event listeners ============================================================

window.addEventListener('resize', windowResize, true);
document.addEventListener('wheel', scroll);
document.addEventListener("keydown", onKeydown);
id_iterations.addEventListener("input", onIterations); 
// "input" instead of "change" and it goes on the fly even with the mouse
//window.addEventListener("load", onFractalSelect, false);
id_fractalSelector.addEventListener("change", onFractalSelect);
id_bt_openSettings.addEventListener("click", onOpenSettings);
id_bt_closeSettings.addEventListener("click", onCloseSettings);
id_colorSelector.addEventListener("input", onColorSelect);
id_colorIntensity.addEventListener("input", onColorIntensity);

// Setup functions ==========================================================

function setup(){
  camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1);

  canvas = document.querySelector('canvas.webgl');

  scene = new THREE.Scene();

// removes the canvas???
//  gl = document.getElementById("fractalCanvas").getContext("webgl");
//  gl.clearColor(0.0,0.0,0.0,1.0);
//  gl.clear(gl.COLOR_BUFFER_BIT);

  renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: false, precision:'highp' } );
  // renderer.setSize( window.innerWidth, window.innerHeight-2 );
  // let canvas = document.getElementById("canvas");
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  document.body.appendChild( renderer.domElement );
}

function animate(){
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function init() {
  setup();

  uniforms = {
    res: {type: 'vec2', value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
    aspect: {type: 'float', value: aspect},
    zoom: {type:'float', value: zoom},
    offset: {type:'vec2', value: offset},
    parameterSet1: {type:'vec3', value: new THREE.Vector3(parameters['a'], parameters['b'], parameters['c'])},
    parameterSet2: {type:'vec3', value: new THREE.Vector3(parameters['d'], parameters['e'], parameters['f'])},
    iterations: {type: 'int', value: iterations},
    color: {type: 'vec3', value: fractalColor}
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
  camera.aspect =  aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
}

function scroll(event){
  let zoom_0 = zoom;
  if ("wheelDeltaY" in event){  // chrome vs. firefox
    zoom *= 1 - event.wheelDeltaY*0.0003;
  } else{
    zoom *= 1 + event.deltaY*0.01;
  }

  let space = zoom - zoom_0;
  let mouseX = event.clientX / window.innerWidth;
  let mouseY = 1-event.clientY / window.innerHeight;
  offset = offset.add(new THREE.Vector2(-mouseX*space*aspect, -mouseY*space));

  uniforms['zoom']['value'] = zoom;
  uniforms['offset']['value'] = offset;
}

function updateUniforms(){
  uniforms['parameterSet1']['value'] = new THREE.Vector3(parameters['a'], parameters['b'], parameters['c']);
  uniforms['parameterSet2']['value'] = new THREE.Vector3(parameters['d'], parameters['e'], parameters['f']);
}

function onKeydown(event){
	if(inSettingMode){ // when we are in settings mode
		switch(event.key) {
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
				id_iterations.focus();
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
		switch(event.key){
			case "Tab":
				id_bt_openSettings.click();
				event.preventDefault();
				break;
		}
	}
}

function onIterations() {
  iterations = id_iterations.value;
  mesh.material.uniforms.iterations.value = iterations;
}

function onFractalSelect() {
	switch(id_fractalSelector.value){
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
			scene.remove(kochMesh);
			break;
		case "kochsnowflake":
			console.log("kochsnowflake was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: KochsnowflakeFrag,
			});

			// implement koch line with 2 starting points
			kochGeometry = new THREE.BufferGeometry();
			let points = [];

			// koch line
			points.push( new THREE.Vector3(0.5,0.0,0.0));
			points.push( new THREE.Vector3(-0.5,0.0,0.0));
			// koch snowflake (starting as a triangle)
			//let rad = Math.PI/2.0;
			//points.push( new THREE.Vector3( 0.5 * Math.cos(rad), 0.5 * Math.sin(rad), 0.0 ));
			//rad = 7.0*Math.PI/6.0;
			//points.push( new THREE.Vector3( 0.5 * Math.cos(rad), 0.5 * Math.sin(rad), 0.0 ));
			//rad = 11.0*Math.PI/6.0;
			//points.push( new THREE.Vector3( 0.5 * Math.cos(rad), 0.5 * Math.sin(rad), 0.0 ));
			//rad = Math.PI/2.0;
			//points.push( new THREE.Vector3( 0.5 * Math.cos(rad), 0.5 * Math.sin(rad), 0.0 ));

			// call kochSnowflake(), a recursive function to compute the snowflake points
			// with the initial depth of 1, e.g. only one spike
			iterations = 5; // change it interactively, not higher than 6
			points = kochSnowflake(points, iterations);
			//console.log("final points: \n",points);

			kochGeometry.setFromPoints( points );
			kochMaterial = new THREE.LineBasicMaterial( {color: 0x0000ff} );
			kochMesh = new THREE.Line( kochGeometry, kochMaterial );
			scene.add(kochMesh);
			break;
		default:
			console.log("no fractal selected");
	}
}

function onOpenSettings() {
	id_outerSettings.style.display = "block";
	id_bt_openSettings.style.display = "none";
	inSettingMode= !inSettingMode;
}

function onCloseSettings() {
	id_outerSettings.style.display = "none";
	id_bt_openSettings.style.display = "block";
	inSettingMode = !inSettingMode;
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
		color =  convert;
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
	//console.log(fractalColor);
}


// download option preparation

//let link = document.createElement('a');
//link.href = document.getElementById("fractalCanvas");
//link.download = 'Snapshot.jpg';
//document.body.appendChild(link);
//link.click();
//document.body.removeChild(link);

// Kochsnowflake computation functions =======================================

function kochSnowflake(points, depth){
	// we do at least one iteration
	if(depth<1){
		return points;
	}
	// points is an array of THREE.Vector3 instances
	let numLines = points.length-1;
	let currIdx = 0;
	for(let j=0; j<numLines; j++){ // +x as we insert recursively
		currIdx = j*Math.pow(4,depth)
		//console.log(currIdx);
		//console.log(points);
		let p1 = points[currIdx];
		let p2 = points[currIdx+1];

		points = kochLine(p1, p2, depth, points);
	}
	return points;
}

function kochLine(p1, p2, depth, points){
	// divide the line between p1 and p2 into 4 lines representing a spike
	// depth is giving the current recursive depth of the splitting while
	// points is the array of points in the final snowflake
	let v1 = new THREE.Vector3();
	let v3 = new THREE.Vector3();

	v1.lerpVectors(p1, p2, 1.0/3.0);
	v3.lerpVectors(p1, p2, 2.0/3.0);

	let v2 = triangulate(v1, v3);

	//console.log(depth);
	//console.log("before: ",points);
	//console.log(p1,p2);
	let start = points.findIndex((element) => element == p1);
	points = points.slice(0,start+1).concat([v1,v2,v3], points.slice(start+1));
	//console.log("after: ",points);

	if(depth == 1){
		return points;
	}

	//console.log("outside");
	points = kochLine(p1, v1, depth-1, points);
	//console.log("\nafter first\n");
	//console.log(points);
	points = kochLine(v1, v2, depth-1, points);
	//console.log("\nafter second\n");
	//console.log(points);
	points = kochLine(v2, v3, depth-1, points);
	//console.log("\nafter third\n");
	//console.log(points);
	points = kochLine(v3, p2, depth-1, points);
	//console.log("\nafter fourth\n");
	//console.log(points);
	
	return points;
}

function triangulate(p1, p2){
	let v1 = new THREE.Vector3();
	v1.subVectors(p2, p1);

	let v2 = new THREE.Vector3();
	let rad = -Math.PI/3.0;
	v2.x = v1.x * Math.cos(rad) - v1.y * Math.sin(rad);
	v2.y = v1.x * Math.sin(rad) + v1.y * Math.cos(rad);
	v2.x += p1.x;
	v2.y += p1.y;

	return v2;
}

// Initialization ==========================================================

init();
onFractalSelect();
onIterations();
id_colorSelector.value = fractalColor;
onColorSelect();
