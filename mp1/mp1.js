/**
 * @file CS 418 MP1: Dancing Logo
 * @author Sahil Patel <sahilsp2@eillinois.edu>
 * 
 * Updated Spring 2021 to use WebGL 2.0 and GLSL 3.00
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global The Block I animation object */
var blockI;

/** @global The Slinky animation object */
var slinky;

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Linear interpolation
 * @param {Number} start The value at t=0
 * @param {Number} end The value at t=1
 * @param {Number} t The interpolation value (0 <= t <= 1)
 */
function lerp(start, end, t){
  return start + t*(end-start);
}


/**
 * Returns a number in [0, 1] representing how far t is in the interval [min, max]
 * @param {Number} t 
 * @param {Number} max 
 * @param {Number} min 
 */
function utime(t, min, max){
  return (t - min)/(max - min);
}


/**
 * Returns the minimum of two numbers
 * @param {Number} a 
 * @param {Number} b 
 */
function min(a, b){
  if(a<b){
    return a;
  }
  return b;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}


/**
 * Startup function called from html code to start the program.
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas); 

  let vertexShader = loadShaderFromDOM("shader-vs");
  let fragmentShader = loadShaderFromDOM("shader-fs");

  // Choose between animations
  blockI = new BlockI(vertexShader, fragmentShader);
  slinky = new Slinky(vertexShader, fragmentShader);

  const select = document.getElementById("animations");
  select.addEventListener("change", start_animation)

  start_animation();
}

function start_animation() {
  switch(document.getElementById("animations").value){
    case "blockI":
      blockI.setup();
      blockI.start();
      break;
    case "slinky":
      slinky.setup();
      slinky.start();
      break;
  }
}

