/* Globals */
var gl;

window.onload = function(){
    /* Create webgl context */
    canvas = document.getElementById('canvas');
    gl = createGLContext(canvas);

    /* Create PathTracer object */
    let pathTracer = new PathTracerGPU();
    let vertShader = loadShaderFromSource(
        pathTracer.getVertexShaderSource(),
        "x-shader/x-vertex"
    );
    let fragShader = loadShaderFromSource(
        pathTracer.getFragmentShaderSource(),
        "x-shader/x-fragment"
    );

    /* Render object */
    let renderer = new Renderer(vertShader, fragShader);
    renderer.render();
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

    return loadShaderFromSource(shaderSource, shaderScript.type);
}


function loadShaderFromSource(shaderSource, type){
    var shader;
    if (type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type = "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    } 
    return shader;
}