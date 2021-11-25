import * as THREE from 'three'
import * as dat from 'dat.gui'
import { sin, cos} from 'mathjs'
import { MandelbrotFrag } from "./mandelbrot.frag"
import { MandelbrotIterationChangeFrag } from "./mandelbrotIterationChange.frag"
import { KochsnowflakeFrag } from './kochsnowflake.frag';
//import { Test1Frag } from './test1.frag';
//import { Test2Frag } from './test2.frag';

let camera, scene, renderer, canvas;
let gl, kochLine;
let geometry, material, mesh;
let uniforms;
let maxIteration = 200;

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

// we start with the settings menu closed
let inSettingMode = false;
//let initialFractal = "kochsnowflake";
let initialFractal = "mandelbrot";

init();

// ===============================================

function init() {
  setup();

  uniforms = {
    res: {type: 'vec2', value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
    aspect: {type: 'float', value: aspect},
    zoom: {type:'float', value: zoom},
    offset: {type:'vec2', value: offset},
    parameterSet1: {type:'vec3', value: new THREE.Vector3(parameters['a'], parameters['b'], parameters['c'])},
    parameterSet2: {type:'vec3', value: new THREE.Vector3(parameters['d'], parameters['e'], parameters['f'])},
    maxIteration: {type: 'int', value: maxIteration}
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

function animate(){
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Setup ================================================

function setup(){
  camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1);

  canvas = document.querySelector('canvas.webgl');

  scene = new THREE.Scene();

// removes the canvas???
//  gl = document.getElementById("fractalCanvas").getContext("webgl");
//  gl.clearColor(0.0,0.0,0.0,1.0);
//  gl.clear(gl.COLOR_BUFFER_BIT);

  renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: false, precision:'highp' } );// canvas: canvas
  // renderer.setSize( window.innerWidth, window.innerHeight-2 );
  // let canvas = document.getElementById("canvas");
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  document.body.appendChild( renderer.domElement );
}

// events ================================================

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

window.addEventListener('resize', windowResize, true);
document.addEventListener('wheel', scroll);

// settings ================================================

// download option preparation

//let link = document.createElement('a');
//link.href = document.getElementById("fractalCanvas");
//link.download = 'Snapshot.jpg';
//document.body.appendChild(link);
//link.click();
//document.body.removeChild(link);

// when selecting a fractal, change the material shaders to the respective ones

let fractalSelector = document.getElementById("fractalSelector");
fractalSelector.value = initialFractal;
fractalSelector.addEventListener("change", onFractalSelect);

function onFractalSelect(event) {
	switch(fractalSelector.value){
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
			points.push( new THREE.Vector3( -0.5, 0, 0 ) );
			points.push( new THREE.Vector3( 0.5, 0, 0 ) );
			//points.push( new THREE.Vector3( 0.0, 0.5, 0 ) );

			points = koch(points, 1);
			console.log("final points: \n",points);

			kochGeometry.setFromPoints( points );
			const kochMaterial = new THREE.LineBasicMaterial( {color: 0x0000ff} );
			kochLine = new THREE.Line( kochGeometry, kochMaterial );
			scene.add(kochLine);
			break;
		default:
			console.log("no fractal selected");
	}
}

onFractalSelect();

// the functions for the kochsnowflake computation

function koch(points, depth){
	// points is an array of THREE.Vector3 instances
	length = points.length-1;
	for(let j=0; j<length; j++){
		let p1 = points[j];
		let p2 = points[j+1];

		points = divideLine(p1, p2, depth, points);
		console.log(points);
	}
	return points;
}

function triangulate(p1, p2){
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

function divideLine(p1, p2, depth, points){
	let v1 = new THREE.Vector3();
	let v2 = new THREE.Vector3();

	v1.lerpVectors(p1, p2, 1.0/3.0);
	v2.lerpVectors(p1, p2, 2.0/3.0);

	let v3 = triangulate(p1, p2);

	if(depth == 1){
		let start = points.findIndex((element) => element == p1);
		let end = points.findIndex((element) => element == p2);
		points = points.slice(0,start+1).concat([v1,v3,v2], points.slice(end));
		console.log(points);
		return points;
	}

	divideLine(p1, v1, depth-1, points);
	divideLine(v1, v2, depth-1, points);
	divideLine(v2, v3, depth-1, points);
	divideLine(v3, p2, depth-1, points);
}

// other stuff

let maxIterationSelect = document.getElementById("maxIterations");
maxIterationSelect.addEventListener("change", onMaxIterationSelect);

function onMaxIterationSelect(event) {
  maxIteration = maxIterationSelect.value;
  mesh.material.uniforms.maxIteration.value = maxIteration;
}

// list of keystroke events
//
// Tab: open/close Settings window
//
// in Settings:
// ------------
// f: focus fractal
// d: focus iteration slide
// r: reload explorer
//
// in Explorer:
// ------------
//
document.addEventListener("keydown", event => {
	if(inSettingMode){ // when we are in settings mode
		switch(event.key) {
			case "Enter":
				event.preventDefault();
				break;
			case "Tab":
				document.querySelector("#bt_closeSettings").click();
				event.preventDefault();
				break;
			case "f":
				$('#fractalSelector').focus();
				break;
			case "d":
				$('#maxIterations').focus();
				break;
			case "r":
				document.querySelector("#bt_load").click();
				break;
			case "s":
				link.click()
				break;
	}
	} else { // when we are in explorer mode
		switch(event.key){
			case "Tab":
				document.querySelector("#bt_openSettings").click();
				event.preventDefault();
				break;
		}
	}
});

document.getElementById("bt_closeSettings").addEventListener("click", closeSettings);
document.getElementById("bt_openSettings").addEventListener("click", openSettings);

function openSettings() {
    document.getElementById("settings-outer").style.display = "block";
    document.getElementById("bt_openSettings").style.display = "none";
	inSettingMode= !inSettingMode;
}

function closeSettings() {
    document.getElementById("settings-outer").style.display = "none";
    document.getElementById("bt_openSettings").style.display = "block";
	inSettingMode = !inSettingMode;
}
