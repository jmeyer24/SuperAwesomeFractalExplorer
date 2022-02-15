// setup ======================================================================

// utilities
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { sin, cos } from "mathjs";

// fractal shaders
import { MandelbrotFrag } from "./fractalShaders/mandelbrot.frag";
// import { MandelbrotIterationChangeFrag } from "./fractalShaders/mandelbrotIterationChange.frag";
import { KochsnowflakeFrag } from "./fractalShaders/kochsnowflake.frag";
import { JuliaSetFrag } from "./fractalShaders/juliaset.frag";
import { MandelbulbFrag } from "./fractalShaders/mandelbulb.frag";
import { TestFrag } from "./fractalShaders/test.frag";
// import { MandelbulbFractallabFrag } from "./fractalShaders/mandelbulb.fractallab.frag";
// import { IsoFrag } from "./fractalShaders/isoShader.frag";

// other
// import { VaryingVert } from "./other/varying.vert";
// import { SpriteVert } from "./other/sprite.vert";
// import { SpriteFrag } from "./other/sprite.frag";

const shaders = [
  "Mandelbrot",
  // "MandelbrotIterationChange",
  "Kochsnowflake",
  "Juliaset",
  "Mandelbulb",
  // "Test",
  // "MandelbulbFractallab",
  // "Iso",
];

let camera, controls, zoom;
let gui,
  guiMandelbrot,
  guiParameters,
  guiFancyMandelbrot,
  guiColor,
  guiJuliaSet,
  guiMandelbulb;
let scene, renderer, canvas, context;
let geometry, material, mesh;
let uniforms;

let aspect = window.innerWidth / window.innerHeight;

// TODO: apply zoom updating for resolution resetting on-the-fly
const MIN_ZOOM = 2.0;
const MAX_ZOOM = 0.000005;
// ? initialize resolution 3d for 3D fractals like mandelbulb
// https://stackoverflow.com/questions/48384564/webgl-glsl-time-variable-similar-to-shadertoy

// initial settings ========================================================

let requestDownload = false;
let inSettingMode = false;
let previousFractal = "";
const initialFractal = "Mandelbulb";
const iterations = 200;
const maxKochsnowflakeIterations = 20;
let fractalColor = "#CC3333"; // "#CC3333"; red "#2070DF"; blue "#1E0064" violet "#66cc33" green
let colorIntensity = 10.0;
let colorScaleBool = false;
let haloBool = true;
let haloColor = fractalColor;
let colorScale = 240.0;

// html elements ==============================================================

let id_outerSettings = document.getElementById("outerSettings");
let id_bt_load = document.getElementById("bt_load");
let id_body = document.getElementById("body");

let id_iterations = document.getElementById("iterations");
id_iterations.value = iterations / 4.0;

let id_fractalSelector = document.getElementById("fractalSelector");
// add all shaders to the selector
for (let idx in shaders) {
  let option = document.createElement("option");
  option.value = shaders[idx];
  option.innerHTML = shaders[idx];
  id_fractalSelector.appendChild(option);
}
id_fractalSelector.value = initialFractal;

let id_bt_settings = document.getElementById("bt_settings");

let id_colorSelector = document.getElementById("colorSelector");
id_colorSelector.value = fractalColor;

let id_colorIntensity = document.getElementById("colorIntensity");

let id_colorScale = document.getElementById("colorScale");

let id_bt_reset = document.getElementById("bt_reset");
let id_bt_download = document.getElementById("bt_download");

let id_notificationWindow = document.getElementById("notification-window");
let id_notification = document.getElementById("notification");
let id_btnCloseNotification = document.getElementById("btn_closeNotification");

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

  // add mouse scroll event listener for 2D mode
  canvas.addEventListener("wheel", onScroll, { passive: true });

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
    0.0001,
    1000
  );

  // set the camera position x,y,z in the scene
  camera.position.set(0, 2.5, 0);

  // add controls to the camera
  controls = new OrbitControls(camera, renderer.domElement);

  controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;

  // the following 2 options need controls.update() in animate() call!
  // rotate per default
  // controls.autoRotate = true;
  // enable/disable damping effect on controls
  // controls.enableDamping = true;
  // controls.enableZoom = false;

  /*
   * setup GUI
   */

  gui = new GUI({ width: 200 });
  gui.close();
  guiMandelbrot = gui.addFolder("Mandelbrot");
  guiMandelbrot.close();
  guiParameters = guiMandelbrot.addFolder("Parameters");
  guiParameters.close();
  // guiFancyMandelbrot = guiMandelbrot.addFolder("FancyMandelbrot");
  // guiFancyMandelbrot.close();
  // guiColor = guiMandelbrot.addFolder("ColorScale");
  // guiColor.close();
  guiJuliaSet = gui.addFolder("Julia Set");
  guiJuliaSet.close();
  guiMandelbulb = gui.addFolder("Mandelbulb");
  guiMandelbulb.close();

  // mandelbrot parameters
  let parametersMandelbrot = {
    a: 1.0,
    b: 0.0,
    c: 0.0,
    d: 0.0,
    e: 0.0,
    f: 0.0,
  };
  for (let key in parametersMandelbrot) {
    guiParameters
      .add(parametersMandelbrot, key, -5.0, 5.0, 0.01)
      .onChange(function () {
        uniforms.parametersMandelbrot1.value = new THREE.Vector3(
          parametersMandelbrot.a,
          parametersMandelbrot.b,
          parametersMandelbrot.c
        );
        uniforms.parametersMandelbrot2.value = new THREE.Vector3(
          parametersMandelbrot.d,
          parametersMandelbrot.e,
          parametersMandelbrot.f
        );
      });
  }

  let parametersFancy = {
    fancyMandelbrot: false,
  };
  guiMandelbrot
    .add(parametersFancy, "fancyMandelbrot", false)
    .onChange(function () {
      uniforms.parametersFancy.value = parametersFancy.fancyMandelbrot;
    });

  let parametersColor = {
    colorScale: 0.0,
    colorDiversity: 1.0,
    haloBool: true,
  };
  ["colorScale", "colorDiversity"].forEach(function (key, index) {
    guiMandelbrot
      .add(parametersColor, key, 0.0, 1.0, 0.01)
      .onChange(function () {
        uniforms.parametersColor.value = new THREE.Vector2(
          parametersColor.colorScale,
          parametersColor.colorDiversity
        );
      });
  });

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

  // mandelbulb parameters
  let parametersMandelbulb = {
    power: 8.0,
  };
  for (let key in parametersMandelbulb) {
    guiMandelbulb
      .add(parametersMandelbulb, key, 0.0, 16.0, 2.0)
      .onChange(function () {
        uniforms.parametersMandelbulb.value = parametersMandelbulb.power;
      });
  }
  let parametersPixel = {
    pixelRatio: 5.0,
  };
  guiMandelbulb
    .add(parametersPixel, "pixelRatio", 0.1, 8.0, 0.1)
    .onChange(function () {
      uniforms.parametersPixel.value = parametersPixel.pixelRatio;
    });
  guiMandelbulb.add(parametersColor, "haloBool", false).onChange(function () {
    uniforms.haloBool.value = parametersColor.haloBool;
  });
  // guiMandelbulb
  //   .add(parametersColor, "haloColor", "0xff0000")
  //   .onChange(function () {
  //     uniforms.parametersColor.value = parametersColor.haloColor;
  //   });

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
  mesh = new THREE.Mesh(geometry, material);

  // set image plane in front of the camera
  scene.add(camera);
  camera.add(mesh);
  mesh.position.set(0, 0, -7.5);

  // enable grid helper for 3D rotation check
  const gridHelper = new THREE.GridHelper(50, 50);
  scene.add(gridHelper);

  /*
   * setup shader uniforms
   */

  uniforms = {
    res: {
      type: "vec2",
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    zoom: { type: "float", value: zoom },
    parametersMandelbrot1: {
      type: "vec3",
      value: new THREE.Vector3(
        parametersMandelbrot.a,
        parametersMandelbrot.b,
        parametersMandelbrot.c
      ),
    },
    parametersMandelbrot2: {
      type: "vec3",
      value: new THREE.Vector3(
        parametersMandelbrot.d,
        parametersMandelbrot.e,
        parametersMandelbrot.f
      ),
    },
    parametersFancy: {
      type: "bool",
      value: parametersFancy.fancyMandelbrot,
    },
    parametersColor: {
      type: "vec2",
      value: new THREE.Vector2(
        parametersColor.colorScale,
        parametersColor.colorDiversity
      ),
    },
    parametersJulia: {
      type: "vec2",
      value: new THREE.Vector2(parametersJulia.real, parametersJulia.imaginary),
    },
    parametersMandelbulb: {
      type: "float",
      value: parametersMandelbulb.power,
    },
    parametersPixel: {
      type: "float",
      value: parametersPixel.pixelRatio,
    },
    iterations: { type: "int", value: iterations },
    // type "c" for color
    // https://stackoverflow.com/questions/32660646/three-js-define-uniforms-for-fragment-shader
    color: { type: "c", value: fractalColor },
    colorIntensity: { type: "float", value: colorIntensity },
    colorScaleBool: { type: "bool", value: colorScaleBool },
    haloBool: { type: "bool", value: parametersColor.haloBool },
    haloColor: { type: "c", value: haloColor },
    trapR: { type: "float", value: 1e20 },
    // time: { type: "double", value: Date.now() },
    // cameraPosition: { type: "vec3", value: camera.position },
    cameraRotation: { type: "vec3", value: camera.rotation },
  };

  /*
   * initialize setup
   */

  onFractalSelect();
  onIterations();
  onColorSelect();
  onColorScale();
  onColorIntensity();
}

function animate() {
  // uniforms.time = Date.now();
  requestAnimationFrame(animate);

  // for moving the fractal
  // const distance = controls.object.position.distanceTo(controls.target);
  // console.log(distance);

  // for auto rotate or damping
  if (controls.autoRotate == true || controls.enableDamping == true) {
    controls.update();
  }

  render();
}

function render() {
  renderer.render(scene, camera);

  if (requestDownload) {
    download();
    requestDownload = false;
  }
}

// run =======================================================================

init();
animate();

// event listeners ======================================================

// this is essential for being able to use the keys for moving around
document.addEventListener("keydown", onKeydown);
window.addEventListener("resize", windowResize, true);

id_iterations.addEventListener("input", onIterations);
id_fractalSelector.addEventListener("change", onFractalSelect);
id_bt_settings.addEventListener("click", onClickSettingsMenu);
id_colorSelector.addEventListener("input", onColorSelect);
id_colorIntensity.addEventListener("input", onColorIntensity);
id_colorScale.addEventListener("change", onColorScale);
id_bt_reset.addEventListener("click", onReset);
id_bt_download.addEventListener("click", onDownload);
id_btnCloseNotification.addEventListener("click", onCloseNotifcationWindow);

// event functions ================================================

function windowResize() {
  // aspect intentionally not updated -> ?
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
        id_colorScale.click();
        break;
      case "u":
        // this input is of type "submit", so it reloads the page when confirmed
        // id_bt_load.click();
        id_bt_reset.click();
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
    switch (event.key) {
      case "Tab":
        id_bt_settings.click();
        event.preventDefault();
        break;
      case "c":
        if (gui.closed) {
          gui.open();
        } else {
          gui.close();
        }
    }
  }
}

function onIterations() {
  uniforms.iterations.value = id_iterations.value;
  id_iterations.nextElementSibling.value = id_iterations.value;
}

function onChangeFromToKoch(curFrac, preFrac) {
  // change the maximum iterations for Kochsnowflake and Mandelbulb fractals
  // so the computation on change does not excess boundaries
  let exponent = 0.0;
  let max = iterations;
  let min = 1.0;

  if (
    preFrac == "Kochsnowflake" ||
    preFrac == "Mandelbulb" ||
    preFrac == "Test"
  ) {
    if (
      curFrac == "Kochsnowflake" ||
      curFrac == "Mandelbulb" ||
      curFrac == "Test"
    ) {
      return;
    }
    exponent = 1.0;
    if (id_iterations.value == 0.0) {
      id_iterations.value = 1.0;
    }
    id_iterations.max = max;
  } else if (
    curFrac == "Kochsnowflake" ||
    curFrac == "Mandelbulb" ||
    curFrac == "Test"
  ) {
    if (
      preFrac == "Kochsnowflake" ||
      preFrac == "Mandelbulb" ||
      preFrac == "Test"
    ) {
      return;
    }
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

function onColorScale() {
  colorScaleBool = id_colorScale.checked ? true : false;
  uniforms.colorScaleBool.value = colorScaleBool;
}

function onFractalSelect(key = "") {
  onChangeFromToKoch(id_fractalSelector.value, previousFractal);
  previousFractal = id_fractalSelector.value;

  switch (id_fractalSelector.value) {
    case "Mandelbrot":
      // mesh.visible = true;
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbrotFrag,
        side: THREE.DoubleSide,
      });
      controls.enableRotate = false;
      controls.enablePan = true;
      gui.open();
      guiMandelbrot.open();
      guiJuliaSet.close();
      guiMandelbulb.close();
      break;

    // case "MandelbrotIterationChange":
    //   mesh.material = new THREE.ShaderMaterial({
    //     uniforms: uniforms,
    //     fragmentShader: MandelbrotIterationChangeFrag,
    //     side: THREE.DoubleSide,
    //   });
    //   gui.open();
    //   guiMandelbrot.open();
    //   guiJuliaSet.close();
    //   guiMandelbulb.close();
    //   break;

    case "Kochsnowflake":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        // display the shader on the plane how?
        // vertexShader: VaryingVert,
        fragmentShader: KochsnowflakeFrag,
        side: THREE.DoubleSide,
      });
      controls.enableRotate = false;
      controls.enablePan = true;
      gui.close();
      break;

    case "Juliaset":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: JuliaSetFrag,
        side: THREE.DoubleSide,
      });
      controls.enableRotate = false;
      controls.enablePan = true;
      gui.open();
      guiMandelbrot.close();
      guiJuliaSet.open();
      guiMandelbulb.close();
      break;

    case "Mandelbulb":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: MandelbulbFrag,
        side: THREE.DoubleSide,
      });
      controls.enableRotate = true;
      controls.enablePan = false;
      gui.open();
      guiMandelbrot.close();
      guiJuliaSet.close();
      guiMandelbulb.open();
      break;

    case "Test":
      mesh.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: TestFrag,
        side: THREE.DoubleSide,
      });
      controls.enableRotate = true;
      controls.enablePan = false;
      gui.open();
      guiMandelbrot.close();
      guiJuliaSet.close();
      guiMandelbulb.open();
      break;

    // case "MandelbulbFractallab":
    //   mesh.material = new THREE.ShaderMaterial({
    //     uniforms: uniforms,
    //     fragmentShader: MandelbulbFractallabFrag,
    //     side: THREE.DoubleSide,
    //   });
    //   gui.close();
    //   break;

    // case "Iso":
    //   mesh.material = new THREE.ShaderMaterial({
    //     uniforms: uniforms,
    //     fragmentShader: IsoFrag,
    //     side: THREE.DoubleSide,
    //   });
    //   gui.close();
    //   break;

    default:
      if (key == "A") {
        id_fractalSelector.selectedIndex = id_fractalSelector.length - 1;
      } else {
        id_fractalSelector.selectedIndex = 0;
      }
      onFractalSelect();
  }

  resetCamera();
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
  haloColor = new THREE.Color(id_colorSelector.value);
  uniforms.haloColor.value = haloColor;
}

function onColorIntensity() {
  uniforms.colorIntensity.value = id_colorIntensity.value;
  id_colorIntensity.nextElementSibling.value = id_colorIntensity.value;
}

function onScroll(event) {
  if (id_fractalSelector.value == "Mandelbulb") return;

  zoom *= 1 - event.wheelDeltaY * 0.0004;

  if (zoom > MIN_ZOOM) {
    controls.enableZoom = false;
    zoom = MIN_ZOOM;
    showNotificationWidnow("You reached the minimal zoom");
  } else if (zoom < MAX_ZOOM) {
    controls.enableZoom = false;
    zoom = MAX_ZOOM;
    showNotificationWidnow("You reached the maximal zoom");
  } else {
    controls.enableZoom = true;
    uniforms.zoom.value = zoom;
  }
}

function resetCamera() {
  zoom = MIN_ZOOM;
  uniforms.zoom.value = zoom;

  controls.reset();
}

function showNotificationWidnow(msg) {
  if (id_notificationWindow.style.display == "block") return; // avoid function being called multiple times
  id_notificationWindow.style.display = "block";
  id_notification.innerHTML = msg;
  id_notificationWindow.style.display = "block";
  let op = 0;
  let timer = setInterval(function () {
    if (op >= 1) {
      clearInterval(timer);
    }
    id_notificationWindow.style.opacity = op;
    op += 0.1;
  }, 50);
  setTimeout(function () {
    onCloseNotifcationWindow();
  }, 3500);
}

function onCloseNotifcationWindow() {
  let op = 1;
  let timer = setInterval(function () {
    if (op <= 0.1) {
      clearInterval(timer);
      id_notificationWindow.style.display = "none";
    }
    id_notificationWindow.style.opacity = op;
    op -= 0.1;
  }, 50);
}

// download ================================================================

// ask for confirmation on camera reset
function onReset() {
  let answer = confirm("Reset the camera?");
  if (answer) {
    resetCamera();
  }
}

// ask for confirmation on current shader display download as picture
function onDownload() {
  let answer = confirm("Download the current image?");
  if (answer) {
    requestDownload = true;
  }
}

// download current display
function download() {
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
  // https://stackoverflow.com/questions/55298242/threejs-scene-with-textures-why-todataurl-return-black-jpg
  // not working: https://stackoverflow.com/questions/13405129/javascript-create-and-save-file

  canvas.toBlob(function (blob) {
    let url = URL.createObjectURL(blob);

    // download the current canvas/renderer display
    let downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "fractalExplorer.jpg";
    downloadLink.click();

    URL.revokeObjectURL(url);
  });
}
