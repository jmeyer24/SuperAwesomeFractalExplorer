import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import Stats from 'three/examples/jsm/libs/stats.module'
import './styles/app.css'

// TODO: import your render-functions from renderer.js
import { atoms_as_spheres, connections_as_lines, connections_as_cylinders } from './renderers'

import { parse_pdb } from './pdb_parser'
import { clean } from './utility'

/***************************
 **** BASIC HTML SETUP *****
 ***************************/

const container = document.createElement('div');
document.body.appendChild( container );

/***************************
 **** BASIC SCENE SETUP ****
 ***************************/

let atom_data = {
    atom_list : [],
    connection_list: [],
    tmpFactorMinMax:[],
    temp_factor_mean: 0
}

/* SCENE */
let scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // 0x000000

/* CAMERA */
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );

// set the camera position x,y,z in the Scene
camera.position.set(0,0,6);
scene.add(camera)

// adding directional light
let directional_light = new THREE.DirectionalLight('#efebd8', 1.0)
directional_light.position.set(1,1,0)
camera.add( directional_light )

// adding ambient light
let ambient_light = new THREE.AmbientLight('#efebd8', 0.3)
camera.add( ambient_light )

/* RENDERER */
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize( window.innerWidth,window.innerHeight );
container.appendChild( renderer.domElement );

/* CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

/* STATS */
const stats = new Stats();
container.appendChild(stats.dom)



/***************************
 ***** BASE FUNCTIONS ******
 ***************************/

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

/* ADD FUNCTION TO EVENT LISTENER*/
window.addEventListener( 'resize', onWindowResize, false );

function animate() {
        requestAnimationFrame( animate );
        controls.update();
        renderer.render(scene, camera );
        stats.update();
}

/* RENDER HANDLING */
function initialize_objects(){
    clean(scene);
    // TODO: call your render-functions
    atoms_as_spheres(scene,atom_data);
    // connections_as_lines(scene,atom_data);
    connections_as_cylinders(scene,atom_data);
}


/***************************
 ******** READ FILE ********
 ***************************/
document.getElementById('input').onchange = function(){
    parse_pdb(initialize_objects, atom_data);
};
animate();
