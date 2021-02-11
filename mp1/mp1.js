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

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;
/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var modelViewMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;


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
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // We only use one shader program for this example, so we can just bind
  // it as the current program here.
  gl.useProgram(shaderProgram);

  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObject = gl.createVertexArray();
  gl.bindVertexArray(vertexArrayObject);
    
  // Query the index of each attribute in the list of attributes maintained
  // by the GPU. 
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexColor");
  shaderProgram.modelViewMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uModelViewMatrix");

  // Enable each attribute we are using in the VAO.  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}


/**
 * Set up the buffers to hold the triangle's vertex positions and colors.
 */
function setupBuffers() {
  // Create a buffer for positions, and bind it to the vertex array object.
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  // Define a Block I in clip coordinates
  var vertices = blockIVertices(0);

  // Populate the buffer with the position data.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = vertices.length / vertexPositionBuffer.itemSize;

  // Binds the buffer that we just made to the vertex position attribute.
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Do the same steps for the color buffer.
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  
  const illini_orange = [0.90625, 0.2890625, 0.15234375, 1.0]
  var colors = new Array(4 * vertices.length / 3)
  for(i = 0; i < vertices.length; i++){
    colors[4*i] = illini_orange[0];
    colors[4*i + 1] = illini_orange[1];
    colors[4*i + 2] = illini_orange[2];
    colors[4*i + 3] = illini_orange[3];
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = vertexPositionBuffer.numberOfItems;  
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
}


/**
 * Draws a frame to the screen.
 */
function draw() {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the vertex array object that we set up.
  gl.bindVertexArray(vertexArrayObject);
    
  // Send the ModelView matrix with our transformations to the vertex shader.
  gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
                      false, modelViewMatrix);
    
  // Render the triangle. 
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}


/**
 * Animates the triangle by updating the ModelView matrix with a rotation
 * each frame.
 */
 function animate(currentTime) {
  // Convert the time to seconds.
  currentTime *= 0.001;
  // Subtract the previous time from the current time.
  var deltaTime = currentTime - previousTime;
  // Remember the current time for the next frame.
  previousTime = currentTime;

  // Select animation
  animateBlockI(currentTime);

  // Draw the frame.
  draw();
  
  // Animate the next frame. The animate function is passed the current time in
  // milliseconds.
  requestAnimationFrame(animate);
}


/**
 * Animates geometry according to Block I animation
 * @param {Number} currentTime 
 */
function animateBlockI(currentTime){  
  // Animation phase periods
  const pre_jump = 0.5;
  const jump = 1;
  const split = 1;
  const anim_period = pre_jump + jump + split;

  let t = currentTime % anim_period;
 
  if(t < pre_jump){
    t /= pre_jump; // put t in [0, 1]

    // Reset vertex position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    const vertices = blockIVertices(0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Squeeze is linear over time
    let squeeze = lerp(1, 0.25, t);
    
    // To keep baseline the same, we use translations
    glMatrix.mat4.fromTranslation(modelViewMatrix, [0, -0.80, 0])
    glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [1, squeeze, 1]);
    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0.80, 0]);
  }
  else if(t < pre_jump + jump){
    t = (t - pre_jump)/jump; // put t in [0, 1]

    // Undo squeeze non-linearly for "spring" effect
    let squeeze_t = min(1, Math.pow(3*t, 0.3));
    let squeeze = lerp(0.25, 1, squeeze_t);
    
    // Height is a parabola for "gravity" effect
    let height = 1 - Math.pow(2*t-1, 2);
    
    // Squeeze with moving baseline
    glMatrix.mat4.fromTranslation(modelViewMatrix, [0, -0.80 + height, 0])
    glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [1, squeeze, 1]);
    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0.80, 0]);
  }
  else if(t < pre_jump + jump + split){
    t = (t - pre_jump - jump)/split; // put t in [0, 1]

    // Non affine transform requires re-binding vertex array
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    const vertices = blockIVertices(t);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  }
  else{
    glMatrix.mat4.identity(modelViewMatrix);
  }
}

/**
 * Startup function called from html code to start the program.
 */
 function startup() {
  console.log("No bugs so far...");
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  const blockI = new BlockI(shaderProgram);
  blockI.setup();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Binding required when passing functions as parameters
  // see https://eliux.github.io/javascript/common-errors/why-this-gets-undefined-inside-methods-in-javascript/
  requestAnimationFrame(blockI.animate.bind(blockI));
  //requestAnimationFrame(animate); 
}

/**
 * Returns the vertices of the Block I at time t
 * @param {Number} t 0 <= t <= 1, specifies the time within the non-affine animation
 */
function blockIVertices(t){
  const dx = 0.25*(1 - Math.pow(2*t-1, 2));
  const dy = dx;

  return [
      // Top left of I
      -0.75-dx, 0.80+dy, 0.0,
      -0.75-dx, 0.40+dy, 0.0,
      -0.40-dx, 0.40+dy, 0.0,
      -0.75-dx, 0.80+dy, 0.0,
      -0.40-dx, 0.80+dy, 0.0,
      -0.40-dx, 0.40+dy, 0.0,
  
      // Top center of I
      -0.40, 0.80, 0.0,
      0.40, 0.80, 0.0,
      0.40, 0.40, 0.0,
      -0.40, 0.80, 0.0,
      -0.40, 0.40, 0.0,
      0.40, 0.40, 0.0,
  
      // Top right of I
      0.75+dx, 0.80+dy, 0.0,
      0.75+dx, 0.40+dy, 0.0,
      0.40+dx, 0.40+dy, 0.0,
      0.75+dx, 0.80+dy, 0.0,
      0.40+dx, 0.80+dy, 0.0,
      0.40+dx, 0.40+dy, 0.0,
  
      // Center of I
      -0.40,  0.40, 0.0,
      -0.40, -0.40, 0.0,
      0.40, -0.40, 0.0,
      -0.40,  0.40, 0.0,
      0.40,  0.40, 0.0,
      0.40, -0.40, 0.0,
  
      // Bot left of I
          -0.75-dx, -0.80-dy, 0.0,
      -0.75-dx, -0.40-dy, 0.0,
      -0.40-dx, -0.40-dy, 0.0,
      -0.75-dx, -0.80-dy, 0.0,
      -0.40-dx, -0.80-dy, 0.0,
      -0.40-dx, -0.40-dy, 0.0,
  
      // Bot center of I
      -0.40, -0.80, 0.0,
      0.40, -0.80, 0.0,
      0.40, -0.40, 0.0,
      -0.40, -0.80, 0.0,
      -0.40, -0.40, 0.0,
      0.40, -0.40, 0.0,
  
      // Bot right of I
      0.75+dx, -0.80-dy, 0.0,
      0.75+dx, -0.40-dy, 0.0,
      0.40+dx, -0.40-dy, 0.0,
      0.75+dx, -0.80-dy, 0.0,
      0.40+dx, -0.80-dy, 0.0,
      0.40+dx, -0.40-dy, 0.0,
  ];
}
