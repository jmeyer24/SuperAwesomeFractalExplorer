// utilities
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { sin, cos } from "mathjs";

// fractal shaders
import { MandelbrotFrag } from "./fractalShaders/mandelbrot.frag";
import { MandelbrotIterationChangeFrag } from "./fractalShaders/mandelbrotIterationChange.frag";
import { KochsnowflakeFrag } from "./fractalShaders/kochsnowflake.frag";
import { JuliaSetFrag } from "./fractalShaders/juliaset.frag";
import { MandelbulbFrag } from "./fractalShaders/mandelbulb.frag";
import { MandelbulbFractallabFrag } from "./fractalShaders/mandelbulb.fractallab.frag";
import { IsoFrag } from "./fractalShaders/isoShader.frag";

// other
import { VaryingVert } from "./other/varying.vert";
import { SpriteVert } from "./other/sprite.vert";
import { SpriteFrag } from "./other/sprite.frag";

const shaders = [
  "mandelbrot",
  "mandelbrotIterationChange",
  "kochsnowflake",
  "juliaset",
  "mandelbulb",
  // "mandelbulbFractallab",
  // "iso",
];

let camera, controls;
let gui, guiMandelbrot, guiJuliaSet;
let scene, renderer, canvas, context;
let geometry, material, mesh;
let uniforms;

let aspect = window.innerWidth / window.innerHeight;
// let offset = new THREE.Vector2(-2.0 * aspect, -1.5);
let offset = new THREE.Vector2();
let zoom = 1.8;
// TODO: apply zoom updating for resolution resetting on-the-fly
const MIN_ZOOM = 3.0;
const MAX_ZOOM = Number.MAX_VALUE;
let mouseDown = false;
let mouseOrigin = {x: 0.0, y: 0.0};
// TODO: initialize resolution 3d for 3D fractals like mandelbulb
// https://stackoverflow.com/questions/48384564/webgl-glsl-time-variable-similar-to-shadertoy
// const timeLocation = context.getUniformLocation(program, "time");
// context.uniform1f(timeLocation, someTimeValue);

// starting settings ========================================================

let requestDownload = false;
let inSettingMode = false;
let previousFractal = "";
const initialFractal = "kochsnowflake"; // "mandelbrot"; // "mandelbulb"; // "juliaset"; // "kochsnowflake"; // "mandelbrot";
const iterations = 200;
const maxKochsnowflakeIterations = 20;
// let fractalColor = "#2070DF"; // blue
// let fractalColor = "#1E0064"; // initial violet
// let fractalColor = "#66cc33"; // green
let fractalColor = "#CC3333"; // red
let colorIntensity = 10.0;
let changeColorScaleOnScroll = false;
let colorScale = 240.0;

// html elements ==============================================================

let id_outerSettings = document.getElementById("outerSettings");
let id_bt_load = document.getElementById("bt_load");
let id_body = document.getElementById("body");

// html elements with event listeners =========================================

let id_iterations = document.getElementById("iterations");
id_iterations.value = iterations / 4.0;
id_iterations.addEventListener("input", onIterations);

let id_fractalSelector = document.getElementById("fractalSelector");
// add all shaders to the selector
for (let idx in shaders) {
  let option = document.createElement("option");
  option.value = shaders[idx];
  option.innerHTML = shaders[idx];
  id_fractalSelector.appendChild(option);
}
id_fractalSelector.value = initialFractal;
id_fractalSelector.addEventListener("change", onFractalSelect);

let id_bt_settings = document.getElementById("bt_settings");
id_bt_settings.addEventListener("click", onClickSettingsMenu);

let id_colorSelector = document.getElementById("colorSelector");
id_colorSelector.value = fractalColor;
id_colorSelector.addEventListener("input", onColorSelect);

let id_colorIntensity = document.getElementById("colorIntensity");
id_colorIntensity.addEventListener("input", onColorIntensity);

let id_changeColorScaleOnScroll = document.getElementById(
  "changeColorScaleOnScroll"
);
id_changeColorScaleOnScroll.addEventListener(
  "change",
  onScrollChangeColorScale
);

let id_bt_download = document.getElementById("bt_download");
id_bt_download.addEventListener("click", onDownload);

let id_notificationWindow = document.getElementById("notification-window");
let id_notification = document.getElementById("notification");
let id_btnCloseNotification = document.getElementById("btn_closeNotification");
id_btnCloseNotification.addEventListener("click", onCloseNotifcationWindow);

// other event listeners ======================================================

window.addEventListener("resize", windowResize, true);
document.addEventListener("keydown", onKeydown);
document.addEventListener("mousedown", onMouseDown);
document.addEventListener("mouseup", onMouseUp);
document.addEventListener("mousemove", onMouseMove);
document.addEventListener("wheel", onScroll);

// initialization ============================================================

function init() {
  /*
   * setup renderer
   */

  //webgl2 renderer
  canvas = document.querySelector("canvas");
  context = canvas.getContext("webgl2", { antialias: true, alpha: false });
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    context: context,
    antialias: false,
    precision: "highp",
  });
  // get and set window dimension for the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  // add dom object (renderer) to the body section of the index.html
  // on this the renderer draws
  document.body.appendChild(renderer.domElement);

  /*
   * setup camera and controls
   */

  // adding a camera PerspectiveCamera( fov, aspect, near, far) for 3D
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );

  // set the camera position x,y,z in the scene
  // TODO: this setup puts us in front of the mandelbulb at the start
  camera.position.set(0, 0.5, 2.5);

  // add controls to the camera
  // TODO: can we change this, so the offset and the position of the shader is controlled, not the mesh or the scene?
  // const controls = new OrbitControls(
  //   camera,
  //   document.getElementsByClassName("webgl")
  // );
  controls = new OrbitControls(camera, renderer.domElement);
  // TODO: use this function to toggle between 2D and 3D?!
  // controls.enableRotate = false;
  //TODO: rotate per default?
  controls.autoRotate = true;
  // TODO: enable/disable damping effect on controls
  controls.enableDamping = true;
  // the previous 2 options need controls.update() in animate() call!
  // controls.update();
  // doesn't work with keys?!
  // controls.keyPanSpeed = 100.0;

  /*
   * setup GUI
   */

  gui = new GUI({ width: 200 });
  gui.close();
  guiMandelbrot = gui.addFolder("Mandelbrot");
  guiMandelbrot.close();
  guiJuliaSet = gui.addFolder("Julia Set");
  guiJuliaSet.close();

  // mandelbrot parameters
  let parameters = {
    a: 1.0,
    b: 0.0,
    c: 0.0,
    d: 0.0,
    e: 0.0,
    f: 0.0,
  };
  for (let key in parameters) {
    guiMandelbrot.add(parameters, key, -5.0, 5.0).onChange(function () {
      uniforms.parameterSet1.value = new THREE.Vector3(
        parameters.a,
        parameters.b,
        parameters.c
      );
      uniforms.parameterSet2.value = new THREE.Vector3(
        parameters.d,
        parameters.e,
        parameters.f
      );
    });
  }

  // juliaset parameters
  let parametersJulia = {
    real: -0.8,
    imaginary: 0.156,
  };
  for (let key in parametersJulia) {
    guiJuliaSet
      .add(parametersJulia, key, -1.0, 1.0, 0.01)
      .onChange(function () {
        uniforms.parametersJulia.value = new THREE.Vector2(
          parametersJulia.real,
          parametersJulia.imaginary
        );
      });
  }

  /*
   * setup the scene with a plane, a box and a grid
   */

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x636363);

  material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });

  // geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  geometry = new THREE.PlaneGeometry(50, 50);
  // TODO: merge multiple geometries?
  // geometry.mergeBufferGeometries(new THREE.PlaneGeometry(1, 1));
  mesh = new THREE.Mesh(geometry, material);

  // set image plane in front of the camera
  scene.add(camera);
  camera.add(mesh);
  mesh.position.set(0, 0, -7.5);

  // add axis for visible camera control
  // TODO: enable grid helper for 3D rotation check
  // const gridHelper = new THREE.GridHelper(50, 50);
  // scene.add(gridHelper);

  /*
   * setup shader uniforms
   */

  uniforms = {
    res: {
      type: "vec2",
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    aspect: { type: "float", value: aspect },
    zoom: { type: "float", value: zoom },
    offset: { type: "vec2", value: offset },
    parameterSet1: {
      type: "vec3",
      value: new THREE.Vector3(parameters.a, parameters.b, parameters.c),
    },
    parameterSet2: {
      type: "vec3",
      value: new THREE.Vector3(parameters.d, parameters.e, parameters.f),
    },
    parametersJulia: {
      type: "vec2",
      value: new THREE.Vector2(parametersJulia.real, parametersJulia.imaginary),
    },
    // startC: { type: "vec2", value: new THREE.Vector2(-0.835, -0.2321) }, // -0.8, 0.156) },
    iterations: { type: "int", value: iterations },
    // type "c" for color
    // https://stackoverflow.com/questions/32660646/three-js-define-uniforms-for-fragment-shader
    color: { type: "c", value: fractalColor },
    colorIntensity: { type: "float", value: colorIntensity },
    colorScale: { type: "float", value: colorScale },
    trapR: { type: "float", value: 1e20 },
    time: { type: "double", value: Date.now() },
    // cameraPosition: { type: "vec3", value: camera.position },
    cameraRotation: { type: "vec3", value: camera.rotation },
  };

  /*
   * initialize setup
   */

  onFractalSelect();
  onIterations();
  onColorSelect();
  onScrollChangeColorScale();
}

function animate() {
  uniforms.time = Date.now();
  requestAnimationFrame(animate);
  // TODO: rotate per default?
  controls.update();
  // console.log(camera.position);
  // console.log(camera.rotation);
  render();
}

function render() {
  // TODO:
  // we might we able to not insert any object in the scene but apply the material to the whole scene with only a sprite?!?!
  // scene.overrideMaterial = mesh.material;

  renderer.render(scene, camera);

  if (requestDownload) {
    download();
    requestDownload = false;
  }
}

// Event functions ================================================

function windowResize() {
  // aspect intentionally not updated -> ?
  aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
}

function onKeydown(event) {
  if (inSettingMode) {
    // when we are in settings mode
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        break;
      case "Tab":
        id_bt_settings.click();
        event.preventDefault();
        break;
      case "a":
        id_fractalSelector.focus();
        id_fractalSelector.selectedIndex++;
        onFractalSelect();
        break;
      case "A":
        id_fractalSelector.focus();
        id_fractalSelector.selectedIndex--;
        onFractalSelect(event.key);
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
      case "g":
        id_changeColorScaleOnScroll.click();
        break;
      case "u":
        // this input is of type "submit", so it reloads the page when confirmed
        id_bt_load.click();
        break;
      case "i":
        // this input is of type "button", so it doesn't reload but triggers onDownload()
        id_bt_download.click();
        break;
      case "c":
        if (gui.closed) {
          gui.open();
        } else {
          gui.close();
        }
    }
  } else {
    // when we are in explorer mode
    // movement for onMovePOV
    let horizontalMovement = 0.0;
    let verticalMovement = 0.0;
    switch (event.key) {
      case "Tab":
        id_bt_settings.click();
        event.preventDefault();
        break;
      // case "ArrowLeft":
      //   // case "h":
      //   event.preventDefault(); // that toggles the controls
      //   horizontalMovement -= 0.05;
      //   break;
      // case "ArrowUp":
      //   // case "k":
      //   verticalMovement += 0.05;
      //   break;
      // case "ArrowRight":
      //   // case "l":
      //   horizontalMovement += 0.05;
      //   break;
      // case "ArrowDown":
      //   // case "j":
      //   verticalMovement -= 0.05;
      //   break;
      // TODO: clear redundancy of key "c"!
      case "c":
        if (gui.closed) {
          gui.open();
        } else {
          gui.close();
        }
    }
    // offset.add(new THREE.Vector2(horizontalMovement, verticalMovement));
    // TODO: this is important, so that mandelbulb does behave correctly!!!
    offset = controls.position;
  }
}

function onIterations() {
  uniforms.iterations.value = id_iterations.value;
  id_iterations.nextElementSibling.value = id_iterations.value;
}

function onChangeFromToKoch(curFrac, preFrac) {
  let exponent = 0.0;
  let max = iterations;
  let min = 1.0;
  // TODO: less iterations for mandelbulb as well?
  if (preFrac == "kochsnowflake" || preFrac == "mandelbulb") {
    exponent = 1.0;
    if (id_iterations.value == 0.0) {
      id_iterations.value = 1.0;
    }
    id_iterations.max = max;
  } else if (curFrac == "kochsnowflake" || curFrac == "mandelbulb") {
    exponent = -1.0;
    max = maxKochsnowflakeIterations;
    min = 0.0;
  }
  id_iterations.value = Math.round(
    id_iterations.value *
      Math.pow(iterations / maxKochsnowflakeIterations, exponent)
  );
  id_iterations.max = max;
  id_iterations.min = min;
  onIterations();
}

function onScrollChangeColorScale() {
  changeColorScaleOnScroll = id_changeColorScaleOnScroll.checked ? true : false;
}

function onFractalSelect(key = "") {
  onChangeFromToKoch(id_fractalSelector.value, previousFractal);
  previousFractal = id_fractalSelector.value;
  switch (id_fractalSelector.value) {
    case "mandelbrot":
      // mesh.visible = true;
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbrotFrag,
        side: THREE.DoubleSide,
      });
      // controls.enableRotate = false;
      gui.close();
      break;

    case "mandelbrotIterationChange":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbrotIterationChangeFrag,
        side: THREE.DoubleSide,
      });
      gui.open();
      guiMandelbrot.open();
      guiJuliaSet.close();
      break;

    case "kochsnowflake":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        // display the shader on the plane how?
        // vertexShader: VaryingVert,
        fragmentShader: KochsnowflakeFrag,
        side: THREE.DoubleSide,
      });
      gui.close();
      break;

    case "juliaset":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: JuliaSetFrag,
        side: THREE.DoubleSide,
      });
      gui.open();
      guiMandelbrot.close();
      guiJuliaSet.open();
      break;

    case "mandelbulb":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbulbFrag,
        side: THREE.DoubleSide,
      });
      gui.close();
      break;

    case "mandelbulbFractallab":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbulbFractallabFrag,
        side: THREE.DoubleSide,
      });
      gui.close();
      break;

    case "iso":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: IsoFrag,
        side: THREE.DoubleSide,
      });
      gui.close();
      break;

    default:
      if (key == "A") {
        id_fractalSelector.selectedIndex = id_fractalSelector.length - 1;
      } else {
        id_fractalSelector.selectedIndex = 0;
      }
      onFractalSelect();
  }
}

function onClickSettingsMenu() {
  if (inSettingMode) {
    id_outerSettings.style.display = "none";
  } else {
    id_outerSettings.style.display = "block";
  }
  inSettingMode = !inSettingMode;
}

function onColorSelect() {
  fractalColor = new THREE.Color(id_colorSelector.value);
  uniforms.color.value = fractalColor;
}

function onColorIntensity() {
  colorIntensity = id_colorIntensity.value;
  uniforms.colorIntensity.value = colorIntensity;
}

function onMouseDown() {
  mouseDown = true;
}

function onMouseUp() {
  mouseDown = false
}

function onMouseMove() {
  if (mouseDown) {
    
  }
}

function onScroll(event) {
  if (id_fractalSelector.value == "mandelbulb") return;
  let tempZoom = zoom;
  if ("wheelDeltaY" in event) {
    zoom *= 1 - event.wheelDeltaY * 0.0003;
  } else {
    zoom *= 1 + event.wheelDeltaY * 0.01;
  }
  if (zoom > 3) {
    showNotificationWidnow("You reached the minimal zoom");
    zoom = 2.9;
  } else if (zoom < 0.5) {
    showNotificationWidnow("You reached the maximal zoom");
    zoom = 0.6;
  } else {
    uniforms['zoom']['value'] = zoom;
  }
}

function showNotificationWidnow(msg) {
  id_notificationWindow.style.display = "block";
  id_notification.innerHTML = msg;
  setTimeout(function() {
    onCloseNotifcationWindow();
  }, 3000);
}

function onCloseNotifcationWindow() {
  id_notificationWindow.style.display = "none"; 
}

// Download ================================================================

// TODO: enable current shader display download as picture
function onDownload() {
  let answer = confirm("Download the current image?");
  if (answer) {
    requestDownload = true;
  }
}

function download() {
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
  // https://stackoverflow.com/questions/55298242/threejs-scene-with-textures-why-todataurl-return-black-jpg

  canvas.toBlob(function (blob) {
    // TODO: neither one of these two options produces the shader image for now
    let url = URL.createObjectURL(blob);
    // let url = renderer.domElement.toDataURL("image/png");

    // download the current canvas/renderer display
    let downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "fractalExplorer.jpg";
    downloadLink.click();

    URL.revokeObjectURL(url);
  });
}

// Function to download data to a file
// https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
// function download(data, filename, type) {
//   var file = new Blob([data], { type: type });
//   if (window.navigator.msSaveOrOpenBlob)
//     // IE10+
//     window.navigator.msSaveOrOpenBlob(file, filename);
//   else {
//     // Others
//     var a = document.createElement("a"),
//       url = URL.createObjectURL(file);
//     a.href = url;
//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();
//     setTimeout(function () {
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     }, 0);
//   }
// }

// Initialization ==========================================================

init();
animate();
