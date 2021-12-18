/*
 ********************************
 ********** Basic Setup *********
 ********************************
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

//load shaders
// cube
import { vertShader_cube } from "./vertShader_cube.vert.js";
import { fragShader_cube } from "./fragShader_cube.frag.js";
// sphere 1
import { vertShader_sphere_perVertex } from "./vertShader_sphere_perVertex.vert.js";
import { fragShader_sphere_perVertex } from "./fragShader_sphere_perVertex.frag.js";

// defining the variables
let canvas, context, camera, scene, renderer, directional_light, ambient_light;
let material_cube, material_sphere_perVertex, baseColor_sphere_perVertex;
let radius_sphere_perVertex,
  widthSegments_sphere_perVertex,
  heightSegments_sphere_perVertex;
let mesh_sphere_perVertex;

function init() {
  //webgl2 renderer
  canvas = document.createElement("canvas");
  context = canvas.getContext("webgl2", { antialias: true, alpha: false });
  renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context });
  // get and set window dimension for the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  // add dom object(renderer) to the body section of the index.html
  document.body.appendChild(renderer.domElement);

  //creating the Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x636363);

  // adding directional light
  directional_light = new THREE.DirectionalLight("#efebd8", 1.1);
  //directional_light.position.set(-1.0,2.0,1.0)
  scene.add(directional_light);

  // adding ambient light
  ambient_light = new THREE.AmbientLight("#efebd8", 0.2);
  scene.add(ambient_light);

  // adding a camera PerspectiveCamera( fov, aspect, near, far)
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    10
  );

  // set the camera position x,y,z in the Scene
  camera.position.set(0, 0, 1);

  // add controls to the scene
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // add GUI menu instance
  const gui = new GUI({ width: 400 });

  // sphere base colors
  baseColor_sphere_perVertex = new THREE.Color(0.8, 0.1, 0.1);

  radius_sphere_perVertex = 0.2;
  widthSegments_sphere_perVertex = 14;
  heightSegments_sphere_perVertex = 7;

  // generate menu items
  let scene_params = {
    // TODO BONUS: add parameters to gui menu
    // "sphere size": radius_sphere_perVertex,
    "width segments": widthSegments_sphere_perVertex,
    "height segments": heightSegments_sphere_perVertex,
  };

  // TODO BONUS: add functionality to gui entries
  // map functions to menu items
  // add size of sphere
  // gui.add( scene_params, "sphere size").min(0.01).max(0.5).step(0.01).onChange(function ( number ) {
  //     radius_sphere_perVertex = number;
  // })
  // add number width segments
  gui
    .add(scene_params, "width segments")
    .min(1)
    .max(50)
    .step(1)
    .onChange(function (number) {
      widthSegments_sphere_perVertex = number;
    });
  // add number height segments
  gui
    .add(scene_params, "height segments")
    .min(1)
    .max(50)
    .step(1)
    .onChange(function (number) {
      heightSegments_sphere_perVertex = number;
    });

  /*
   ********************************
   **** Geometries and objects ****
   ********************************
   */

  /*******************
   *** CUBE OBJECT ***
   *******************/

  // create cube geometry
  let length_cube = 0.4;
  let center_cube = new THREE.Vector3(-0.5, 0.0, 0.0);
  let geometry_cube = new THREE.BoxBufferGeometry(
    length_cube,
    length_cube,
    length_cube
  );
  // cube uniforms
  let uniforms_cube = {
    boxLength: {
      value: new THREE.Vector3(length_cube, length_cube, length_cube),
    },
  };
  // cube material
  material_cube =
    // TODO: change MeshBasicMaterial to a material for the cube that can use custom shaders
    //       set glslVersion to 'glslVersion: THREE.GLSL3'
    new THREE.ShaderMaterial({
      vertexShader: vertShader_cube,
      fragmentShader: fragShader_cube,
      uniforms: uniforms_cube,
      glslVersion: THREE.GLSL3,
    });
  // cube object
  let mesh_cube = new THREE.Mesh(geometry_cube, material_cube);
  mesh_cube.position.copy(center_cube);
  scene.add(mesh_cube);

  /***********************
   **** SPHERE OBJECT ****
   ***********************/

  // sphere per vertex geometry
  let center_sphere_perVertex = new THREE.Vector3(0.0, 0.0, 0.0);
  let geometry_sphere_vertex = new THREE.SphereBufferGeometry(
    radius_sphere_perVertex,
    widthSegments_sphere_perVertex,
    heightSegments_sphere_perVertex
  );

  // sphere vertex uniforms
  let uniforms_sphere_perVertex = {
    lightDir: { value: directional_light.position },
    sphereCenter: { value: center_sphere_perVertex },
    sphereShininess: { value: 10.0 },
    specularColor: {
      value: new THREE.Vector4(
        directional_light.color.r,
        directional_light.color.g,
        directional_light.color.b,
        1.0
      ),
    },
    diffuseColor: {
      value: new THREE.Vector4(
        baseColor_sphere_perVertex.r,
        baseColor_sphere_perVertex.g,
        baseColor_sphere_perVertex.b,
        1.0
      ),
    },
    ambientColor: {
      value: new THREE.Vector4(
        baseColor_sphere_perVertex.r,
        baseColor_sphere_perVertex.g,
        baseColor_sphere_perVertex.b,
        1.0
      ),
    },
    diffSpecLightIntensity: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
    ambientLightIntensity: { value: new THREE.Vector4(0.2, 0.2, 0.2, 1.0) },
  };

  material_sphere_perVertex =
    // TODO: change MeshBasicMaterial to a material for the sphere that can use custom shaders
    //       and set glslVersion to 'glslVersion: THREE.GLSL3'
    new THREE.ShaderMaterial({
      vertexShader: vertShader_sphere_perVertex,
      fragmentShader: fragShader_sphere_perVertex,
      uniforms: uniforms_sphere_perVertex,
      glslVersion: THREE.GLSL3,
    });

  mesh_sphere_perVertex = new THREE.Mesh(
    geometry_sphere_vertex,
    material_sphere_perVertex
  );
  mesh_sphere_perVertex.position.copy(center_sphere_perVertex);
  scene.add(mesh_sphere_perVertex);
}

/*
 ********************************
 *** Animation and Rendering ****
 ********************************
 */

// extendable render wrapper
function render() {
  // TODO: apply parameters and color chosen in the gui to the different uniforms of the spheres!
  let geometry_sphere_vertex = new THREE.SphereBufferGeometry(
    radius_sphere_perVertex,
    widthSegments_sphere_perVertex,
    heightSegments_sphere_perVertex
  );
  updateGeometry(mesh_sphere_perVertex, geometry_sphere_vertex);
  renderer.render(scene, camera);
}

// animation function calling the renderer and introducing the rotation
function animate() {
  requestAnimationFrame(animate);
  render();
}
function updateGeometry(mesh, geometry) {
  // adapted from https://github.com/mrdoob/three.js/blob/dev/docs/scenes/geometry-browser.html
  if (geometry.isGeometry) {
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);
  }
  mesh.geometry.dispose();
  mesh.geometry = geometry;
}

init();
animate();
