/* Globals */
var gl;
var renderer;

window.onload = function(){
    /* Get UI Control Elements */
    let bounceLimitSlider = document.getElementById('bounceLimit');
    let apertureSlider = document.getElementById('aperture');
    let focalLengthSlider = document.getElementById('focalLength');

    /* Create webgl context */
    canvas = document.getElementById('canvas');
    gl = createGLContext(canvas);

    /* Create Materials */
    let matRed = new Lambertian(glMatrix.vec3.fromValues(1, 0, 0));
    let matGreen = new Lambertian(glMatrix.vec3.fromValues(0, 1, 0));
    let matGray = new Lambertian(glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
    let matGlass = new Dielectric(glMatrix.vec3.fromValues(1, 1, 1), 1.5);
    let matSteel = new Metal(glMatrix.vec3.fromValues(0.75, 0.75, 0.75), 0);
    let matNormals = new Normals();

    /* Create scene */
    let objects = [
        new Plane(
            glMatrix.vec3.fromValues(0, -1, 0),
            glMatrix.vec3.fromValues(0, 1, 0),
            matGray
        ),
        new Sphere(
            glMatrix.vec3.fromValues(-1, 0, -1),
            1,
            matGreen
        ),
        new Sphere(
            glMatrix.vec3.fromValues(1, 0, 1),
            1,
            matRed
        ),
        new Sphere(
            glMatrix.vec3.fromValues(1, 0, -1),
            1,
            matNormals
        ),
        new Sphere(
            glMatrix.vec3.fromValues(-1, 0, 1),
            1,
            matSteel
        ),
        new Sphere(
            glMatrix.vec3.fromValues(0, 1, 0),
            1,
            matGlass
        ),
        new Triangle(
            glMatrix.vec3.fromValues(0, 0, 0),
            glMatrix.vec3.fromValues(0, 5, 0),
            glMatrix.vec3.fromValues(5, 0, 0),
            matRed
        ),
    ];

    /* Create camera */
    camera = new Camera(
        glMatrix.vec3.fromValues(1, 3, 7),      // Position
        glMatrix.vec3.fromValues(0, 1, 0),      // Up vector
        Math.PI/4,                              // FOV
        parseFloat(apertureSlider.value),       // Aperture
        7,                                      // Focal length
    );

    // Bunny mesh has +Z as up and is too big
    let bunnyMatrix = glMatrix.mat4.create();
    glMatrix.mat4.fromXRotation(bunnyMatrix, -Math.PI/2);
    glMatrix.mat4.scale(bunnyMatrix, bunnyMatrix, glMatrix.vec3.fromValues(0.03, 0.03, 0.03));
    let bunny = new STLMesh('bunny.stl', bunnyMatrix, matGreen);
    bunny.init().then(() => {
        // objects = objects.concat(bunny.triangles);
        let pathTracer = new PathTracer(objects, camera, parseInt(bounceLimitSlider.value));

        /* Render object */
        renderer = new Renderer(pathTracer);
        renderer.init().then(() => renderer.start());

        /* Attach mouse controls */
        let mousedown = false;
        let angleX = 0;
        let angleY = 0;
        canvas.addEventListener("mousedown", () => { mousedown = true; });
        document.addEventListener("mouseup", () => { mousedown = false; });
        canvas.addEventListener("mousemove", e => {
            if(!mousedown) { return; }

            let k = 1; // View movement speed
            angleX -= k * e.movementY;
            angleY -= k * e.movementX;

            let quat = glMatrix.quat.create();
            glMatrix.quat.fromEuler(quat, angleX, angleY, 0);
            camera.orientation = quat;
            
            renderer.reset();
        });
    });    

    /* Attach UI Controls */
    bounceLimitSlider.addEventListener("input", () => {
        renderer.pathTracer.bounceLimit = parseInt(bounceLimitSlider.value);
        renderer.reset();
    });

    apertureSlider.addEventListener("input", () => {
        camera.aperture = parseFloat(apertureSlider.value);
        renderer.reset();
    });

    focalLengthSlider.addEventListener("input", () => {
        camera.focalLength = parseFloat(focalLengthSlider.value);
        renderer.reset();
    });
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
        console.log(shaderSource);
        console.error(gl.getShaderInfoLog(shader));
        return null;
    } 
    return shader;
}