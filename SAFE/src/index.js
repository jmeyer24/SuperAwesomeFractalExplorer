import * as THREE from 'three'
import * as dat from 'dat.gui'
import { MandelbrotFrag } from "./mandelbrot.frag"
import { MandelbrotIterationChangeFrag } from "./mandelbrotIterationChange.frag"
import { KochsnowflakeFrag } from './kochsnowflake.frag';
import { Test1Frag } from './test1.frag';
import { Test2Frag } from './test2.frag';

let camera, scene, renderer, canvas;
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

// we start with the settings closed
let inSettingMode = false;

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
    fragmentShader: MandelbrotFrag, // Test1Frag,
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

  renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: false, precision:'highp' } );
  // renderer.setSize( window.innerWidth, window.innerHeight-2 );
  // var canvas = document.getElementById("canvas");
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  document.body.appendChild( renderer.domElement );
}

// events ================================================

function windowResize() {  //aspect intentionally not updated
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


/* Settings */

// when selecting a fractal, change the material shaders to the respective ones

var fractalSelector = document.getElementById("fractalSelector");
fractalSelector.addEventListener("change", onFractalSelect);

function onFractalSelect(event) {
	switch(fractalSelector.value){
		case "mandelbrot":
			console.log("mandelbrot (default) was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: MandelbrotFrag, // green
			});break;
		case "mandelbrotIterationChange":
			console.log("mandelbrot with changeable iterations was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: MandelbrotIterationChangeFrag, // green
			});break;
		case "kochsnowflake":
			console.log("kochsnowflake was selected");
			mesh.material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				fragmentShader: KochsnowflakeFrag, // blue
			});
			break;
		default:
			console.log("no fractal selected");
	}
}

let maxIterationSelect = document.getElementById("maxIterations");
maxIterationSelect.addEventListener("change", onMaxIterationSelect);

function onMaxIterationSelect(event) {
//  console.log(maxIterationSelect.value);
  maxIteration = maxIterationSelect.value;
  mesh.material.uniforms.maxIteration.value = maxIteration;
}

// opening and closing the settings panel with clicks or button "Tab"
// top/down for fractal selection, left/right for iteration selection

// list
// Tab: open/close Settings window
// in Settings:
// ------------
// top/down: change fractal
// left/right: change iteration
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
			case "f": // "ArrowUp"
				$('#fractalSelector').focus();
				break;
			//case "ArrowDown":
			//	$('#fractalSelector').focus();
			//	break;
			case "d": // "ArrowLeft"
				$('#maxIterations').focus();
				break;
			case "r":
				//$('#bt_load').focus();
				document.querySelector("#bt_load").click();
				break;
			//case "ArrowRight":
			//	$('#maxIterations').focus();
			//	break;
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

>>>>>>> playground-2
