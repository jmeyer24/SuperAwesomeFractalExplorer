import * as THREE from 'three'
import * as dat from 'dat.gui'
import {MandelbrotFrag} from "./mandelbrot.frag"
import { KochsnowflakeFrag } from './kochsnowflake.frag';
import { Test1Frag } from './test1.frag';
import { Test2Frag } from './test2.frag';

let camera, scene, renderer;
let geometry, material, mesh;
let uniforms;
let selectedFractal;

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
    parameterSet2: {type:'vec3', value: new THREE.Vector3(parameters['d'], parameters['e'], parameters['f'])}
  };
  geometry = new THREE.PlaneBufferGeometry(2, 2);
  // material = getShader();
  // material = new THREE.ShaderMaterial({
  //   uniforms: uniforms,
  //   fragmentShader: MandelbrotFrag,
  // });
  // material = new THREE.ShaderMaterial({
  //   uniforms: uniforms,
  //   fragmentShader: Test1Frag,
  // // });
  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: Test1Frag,
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

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer( { antialias: false, precision:'highp' } );
  renderer.setSize( window.innerWidth, window.innerHeight-2 );
  document.body.appendChild( renderer.domElement );
}

// events ================================================

function windowResize() {  //aspect intentionally not updated
  aspect = window.innerWidth / window.innerHeight;
  camera.aspect =  aspect;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight-2);
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

window.addEventListener('resize', windowResize, false);
document.addEventListener('wheel', scroll);

var fractalSelector = document.getElementById("fractalSelector");
fractalSelector.addEventListener("change", onFractalSelect);

function onFractalSelect(event) {
  if (fractalSelector.value == "kochsnowflake") {
    console.log("kochsnowflake was selected");
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: KochsnowflakeFrag, // blue
      });
  } else if (fractalSelector.value == "mandelbrot") {
    console.log("mandelbrot (default) was selected");
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbrotFrag, // green
      });
  } else {
    console.log("test");
  }
}

var testbt = document.getElementById("testbt");
testbt.addEventListener("click", onBtClick, false);

function onBtClick(event) {
  mesh.material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: Test1Frag
  });
}
