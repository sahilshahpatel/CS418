/* Globals */
var gl;
var renderer;

window.onload = function(){
    /* Get UI Control Elements */
    let bounceLimitSlider = document.getElementById('bounceLimit');
    let apertureSlider = document.getElementById('aperture');
    let focalLengthSlider = document.getElementById('focalLength');

    /* Create webgl context */
    let canvas = document.getElementById('canvas');
    gl = createGLContext(canvas);

    /* Create Materials */
    let matRed = new Lambertian(glMatrix.vec3.fromValues(1, 0, 0));
    let matGreen = new Lambertian(glMatrix.vec3.fromValues(0, 1, 0));
    let matBlue = new Lambertian(glMatrix.vec3.fromValues(0, 0, 1));
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
            matRed
        ),
        new Sphere(
            glMatrix.vec3.fromValues(1, 0, 1),
            1,
            matSteel
        ),
        new Sphere(
            glMatrix.vec3.fromValues(1, 0, -1),
            1,
            matNormals
        ),
        new Sphere(
            glMatrix.vec3.fromValues(-1, 0, 1),
            1,
            matGreen
        ),
        new Sphere(
            glMatrix.vec3.fromValues(0, Math.sqrt(2), 0),
            1,
            matGlass
        ),
        new Triangle(
            glMatrix.vec3.fromValues(2, 0, -1),
            glMatrix.vec3.fromValues(2, 0, +1),
            glMatrix.vec3.fromValues(2.5, -1,  0),
            matRed
        ),
    ];

    /* Create camera */
    camera = new Camera(
        9,                                      // Zoom
        Math.PI/4,                              // FOV
        parseFloat(apertureSlider.value),       // Aperture
        7,                                      // Focal length
    );

    // Bunny mesh has +Z as up and is too big
    let bunnyMatrix = glMatrix.mat4.create();
    glMatrix.mat4.fromXRotation(bunnyMatrix, -Math.PI/2);
    glMatrix.mat4.scale(bunnyMatrix, bunnyMatrix, glMatrix.vec3.fromValues(0.03, 0.03, 0.03));
    let bunny = new STLMesh('bunny.stl', bunnyMatrix, matBlue);
    bunny.init().then(() => {
        // We actually won't use the bunny here because my GPU can only barely handle it with the current BVH
        // objects = objects.concat(bunny.triangles);

        let pathTracer = new PathTracer(objects, camera, parseInt(bounceLimitSlider.value));

        // Set up nice initial camera view
        camera.angleX = -35;
        camera.angleY = 102;

        /* Render object */
        renderer = new Renderer(pathTracer);
        renderer.init().then(() => renderer.start());
    });    

    /* Attach mouse controls */
    let mousedown = false;
    canvas.addEventListener("mousedown", () => { mousedown = true; });
    document.addEventListener("mouseup", () => { mousedown = false; });
    canvas.addEventListener("mousemove", e => {
        if(!mousedown) { return; }

        let k = 1; // Rotation speed
        camera.angleX -= k * e.movementY;
        camera.angleY -= k * e.movementX;

        renderer.reset();
    });

    canvas.addEventListener("wheel", e => {
        camera.zoom += e.deltaY * 0.01;
        renderer.reset();
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