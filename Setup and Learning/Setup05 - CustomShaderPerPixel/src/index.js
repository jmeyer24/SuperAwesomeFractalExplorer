/*
    ********************************
    ********** Basic Setup *********
    ********************************
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

//load shaders

// cube
import {vertShader_cube} from "./vertShader_cube.vert";
import {fragShader_cube} from "./fragShader_cube.frag";
// sphere 1
import {vertShader_sphere_perVertex} from "./vertShader_sphere_perVertex.vert";
import {fragShader_sphere_perVertex} from "./fragShader_sphere_perVertex.frag";
// sphere 2
import {vertShader_sphere_perPixel} from './vertShader_sphere_perPixel.vert.js';
import {fragShader_sphere_perPixel} from './fragShader_sphere_perPixel.frag.js';


// defining the variables
let canvas, context, camera, scene, renderer, directional_light, ambient_light;
let material_cube, material_sphere_perVertex, material_sphere_perPixel, baseColor_sphere_perVertex, baseColor_sphere_perPixel;
let radius_sphere_perVertex, widthSegments_sphere_perVertex, heightSegments_sphere_perVertex, radius_sphere_perPixel, widthSegments_sphere_perPixel, heightSegments_sphere_perPixel;
let mesh_sphere_perVertex, mesh_sphere_perPixel

function init() {
    //webgl2 renderer
    canvas = document.createElement('canvas')
    context = canvas.getContext('webgl2', {antialias: true, alpha: false})
    renderer = new THREE.WebGLRenderer({canvas: canvas, context: context});
    // get and set window dimension for the renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    // add dom object(renderer) to the body section of the index.html
    document.body.appendChild(renderer.domElement);

    //creating the Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x636363)

    // adding directional light
    directional_light = new THREE.DirectionalLight('#efebd8', 1.1)
    //directional_light.position.set(-1.0,2.0,1.0)
    scene.add(directional_light)

    // adding ambient light
    ambient_light = new THREE.AmbientLight('#efebd8', 0.2)
    scene.add(ambient_light)

    // adding a camera PerspectiveCamera( fov, aspect, near, far)
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);

    // set the camera position x,y,z in the Scene
    camera.position.set(0, 0, 1);

    // add controls to the scene
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // sphere base colors
    baseColor_sphere_perVertex = new THREE.Color(0.8, 0.1, 0.1);
    baseColor_sphere_perPixel = new THREE.Color(0.8, 0.1, 0.1);

    radius_sphere_perVertex = 0.2;
    widthSegments_sphere_perVertex = 14;
    heightSegments_sphere_perVertex = 7;

    radius_sphere_perPixel = 0.2;
    widthSegments_sphere_perPixel = 14;
    heightSegments_sphere_perPixel = 7;

    /*
        ********************************
        **** Geometries and objects ****
        ********************************
     */


    /* *****************
     *** CUBE OBJECT ***
     ***************** */

    // create cube geometry
    let length_cube = 0.4;
    let center_cube = new THREE.Vector3(-0.5, 0.0, 0.0);
    let geometry_cube = new THREE.BoxBufferGeometry(length_cube, length_cube, length_cube);
    // cube uniforms
    let uniforms_cube = {
        boxLength: {value: new THREE.Vector3(length_cube, length_cube, length_cube)}
    }
    // cube material
    material_cube =
        new THREE.ShaderMaterial({
            vertexShader: vertShader_cube,
            fragmentShader: fragShader_cube,
            uniforms: uniforms_cube,
            glslVersion: THREE.GLSL3
        });

    // cube object
    let mesh_cube = new THREE.Mesh(geometry_cube, material_cube);
    mesh_cube.position.copy(center_cube)
    scene.add(mesh_cube);

    /* ***********************************
     **** SPHERE 1 per vertex shading ****
     *********************************** */

    // sphere per vertex geometry
    let center_sphere_perVertex = new THREE.Vector3(0.0, 0.0, 0.0);
    let geometry_sphere_vertex =
        new THREE.SphereBufferGeometry(radius_sphere_perVertex, widthSegments_sphere_perVertex, heightSegments_sphere_perVertex);

    // sphere vertex uniforms
    let uniforms_sphere_perVertex = {
        lightDir: {value: directional_light.position},
        sphereCenter: {value: center_sphere_perVertex},
        sphereShininess: {value: 10.0},
        specularColor: {value: new THREE.Vector4(directional_light.color.r, directional_light.color.g, directional_light.color.b, 1.0)},
        diffuseColor: {value: new THREE.Vector4(baseColor_sphere_perVertex.r, baseColor_sphere_perVertex.g, baseColor_sphere_perVertex.b, 1.0)},
        ambientColor: {value: new THREE.Vector4(baseColor_sphere_perVertex.r, baseColor_sphere_perVertex.g, baseColor_sphere_perVertex.b, 1.0)},
        diffSpecLightIntensity: {value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0)},
        ambientLightIntensity: {value: new THREE.Vector4(0.2, 0.2, 0.2, 1.0)},
    }

    material_sphere_perVertex =
        new THREE.ShaderMaterial({
            vertexShader: vertShader_sphere_perVertex,
            fragmentShader: fragShader_sphere_perVertex,
            uniforms: uniforms_sphere_perVertex,
            glslVersion: THREE.GLSL3
        });

    mesh_sphere_perVertex = new THREE.Mesh(geometry_sphere_vertex, material_sphere_perVertex);
    mesh_sphere_perVertex.position.copy(center_sphere_perVertex)
    scene.add(mesh_sphere_perVertex);


    /* ***********************************
     **** SPHERE 2 per pixel shading ****
     *********************************** */
    // just the already imported shaders
    // vertShader_sphere_perPixel;
    // fragShader_sphere_perPixel;

    let center_sphere_perPixel = new THREE.Vector3(0.5, 0.0, 0.0);
    let geometry_sphere_perPixel =
        new THREE.SphereBufferGeometry(radius_sphere_perPixel, widthSegments_sphere_perPixel, heightSegments_sphere_perPixel);

    let uniforms_sphere_perPixel = {
        lightDir: {value: directional_light.position},
        sphereCenter: {value: center_sphere_perPixel},
        sphereShininess: {value: 10.0},
        specularColor: {value: new THREE.Vector4(directional_light.color.r, directional_light.color.g, directional_light.color.b, 1.0)},
        diffuseColor: {value: new THREE.Vector4(baseColor_sphere_perPixel.r, baseColor_sphere_perPixel.g, baseColor_sphere_perPixel.b, 1.0)},
        ambientColor: {value: new THREE.Vector4(baseColor_sphere_perPixel.r, baseColor_sphere_perPixel.g, baseColor_sphere_perPixel.b, 1.0)},
        diffSpecLightIntensity: {value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0)},
        ambientLightIntensity: {value: new THREE.Vector4(0.2, 0.2, 0.2, 1.0)},
    }


    material_sphere_perPixel =
        // TODO: change MeshBasicMaterial to a material for the sphere that can use custom shaders
        //       set glslVersion to 'glslVersion: THREE.GLSL3'
        new THREE.ShaderMaterial({
            vertexShader: vertShader_sphere_perPixel,
            fragmentShader: fragShader_sphere_perPixel,
            uniforms: uniforms_sphere_perPixel,
            glslVersion: THREE.GLSL3,
        })

    // create mesh for the phong shaded sphere
    mesh_sphere_perPixel = new THREE.Mesh(geometry_sphere_perPixel, material_sphere_perPixel);
    mesh_sphere_perPixel.position.copy(center_sphere_perPixel)
    scene.add(mesh_sphere_perPixel);
}


/*
    ********************************
    *** Animation and Rendering ****
    ********************************
 */

// extendable render wrapper
function render(){
    renderer.render(scene, camera);
}

// animation function calling the renderer
function animate() {
    requestAnimationFrame( animate );
    render();
}

init()
animate()
