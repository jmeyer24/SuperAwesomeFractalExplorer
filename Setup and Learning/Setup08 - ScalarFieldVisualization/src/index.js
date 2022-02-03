/*
    ********************************
    ********** Basic Setup *********
    ********************************
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

// defining the variables
// scene components
let canvas, context, camera, scene, renderer, directional_light, ambient_light, light_params;

// geometry/object components
let shaderMaterial;
// TODO: use the variables below while creating the grid
let rectSidelength = 1024; // 2**10;
let terrainWidth = 20;

// shader imports
import {vertShader} from './vertexShader_heightmap.vert.js';
import {fragShader} from './fragmentShader_heightmap.frag.js';


function init() {

    //webgl2 renderer
    canvas = document.createElement('canvas')
    context = canvas.getContext('webgl2', {antialias: true, alpha: true})
    renderer = new THREE.WebGLRenderer({canvas: canvas, context: context});
    // get and set window dimension for the renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    // add dom object(renderer) to the body section of the index.html
    document.body.appendChild(renderer.domElement);

    //creating the Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#878787')

    // adding rectSidelength camera PerspectiveCamera( fov, aspect, near, far)
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);

    // set the camera position x,y,z in the Scene
    camera.position.set(12, 3, 18);
    scene.add(camera)

    // adding directional light
    directional_light = new THREE.DirectionalLight('#efebd8', 1.0)
    directional_light.position.set(-1, 1, 1)
    camera.add(directional_light)

    // adding ambient light
    ambient_light = new THREE.AmbientLight('#efebd8', 0.3)
    camera.add(ambient_light)

    // add controls to the scene
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // add GUI menu instance
    const gui = new GUI({"width": 400});

    // generate menu items
    light_params = {
        "directional light - intensity": directional_light.intensity
    }

    // map functions to menu items
    // add input element for directional light intensity
    gui.add(light_params, 'directional light - intensity').onChange(function (intensity_val) {
        directional_light.intensity = intensity_val;
    })

    /*
        ********************************
        **** Geometries and Objects ****
        ********************************
    */


    let uniforms = {
        // TODO: load textures and set uniform variables
        heightmap: {value: new THREE.TextureLoader().load('assets/heightmap_flat.png')},
        colormap: {value: new THREE.TextureLoader().load('assets/1DColorscale_1.png')},
        scaleFactor: {value: 1.5},
        lightDir: {value: directional_light.position},
        diffSpecLightIntensity: {value: new THREE.Vector4(directional_light.intensity, directional_light.intensity, directional_light.intensity, directional_light.intensity)},
        ambientLightIntensity: {value: new THREE.Vector4(0.5, 0.5, 0.5, 1.0)},
    }

    shaderMaterial =
        new THREE.ShaderMaterial({
            vertexShader: vertShader,
            fragmentShader: fragShader,
            uniforms: uniforms,
            glslVersion: THREE.GLSL3
        });

    let vertices = [];
    let uvs = [];
    let geometry = new THREE.BufferGeometry();
    let indices = [];

    // TODO: calculate rectangular geometry with triangular faces
    // TODO: calculate uv coordinates
    // positions and uvs
    let frac = 1.0/rectSidelength;
    for (let i = frac; i <= 1.0; i = i + frac) {
        for (let j = frac; j <= 1.0; j = j + frac) {
            // let vertex = new THREE.Vector3((j-1/2.0) * terrainWidth,0,(i-1/2.0) * terrainWidth);
            // let uv = new THREE.Vector2(j,i);
            vertices.push((j-1/2.0) * terrainWidth,0,(i-1/2.0) * terrainWidth);
            uvs.push(i,j);
        }
    }
    // indices
    for (let i = 0; i < rectSidelength-1; i++) {
        for (let j = 0; j < rectSidelength-1; j++) {
            let k = i*rectSidelength + j;
            // let triangle1 = new THREE.Vector3(k,k+rectSidelength,k+1);
            // let triangle2 = new THREE.Vector3(k+1,k+rectSidelength,k+1+rectSidelength);
            indices.push(k,k+rectSidelength,k+1);
            indices.push(k+1,k+rectSidelength,k+1+rectSidelength);
        }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
    geometry.computeVertexNormals();

    let material =
        new THREE.ShaderMaterial({
            vertexShader: vertShader,
            fragmentShader: fragShader,
            uniforms: uniforms,
            glslVersion: THREE.GLSL3
        });

    // const material = new THREE.MeshBasicMaterial({wireframe: true});
    // let heightmap = new THREE.TextureLoader().load('assets/heightmap_flat.png');
    // const material = new THREE.MeshBasicMaterial({map: heightmap});
    const grid = new THREE.Mesh(geometry, material)
    scene.add(grid);

    // TODO: Bonus: add a water plane
    const waterGeometry = new THREE.PlaneGeometry( terrainWidth, terrainWidth );
    const waterMaterial = new THREE.MeshBasicMaterial( {color: 0x0060f2, transparent: true, opacity: 0.7} );
    const water = new THREE.Mesh( waterGeometry, waterMaterial );
    water.translateOnAxis(new THREE.Vector3(0, 1, 0), 0.4);
    water.setRotationFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2);
    scene.add( water );
}

/*
    ********************************
    *** Animation and Rendering ****
    ********************************
 */

// extendable render wrapper
function render(){
    shaderMaterial.uniforms.diffSpecLightIntensity.value.copy(new THREE.Vector4(directional_light.intensity,directional_light.intensity,directional_light.intensity, 1.0));
    renderer.render(scene, camera );
}

// animation function calling the renderer and introducing the rotation
function animate() {
    requestAnimationFrame( animate );
    render();

}

init();
animate();
