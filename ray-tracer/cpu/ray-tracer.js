/* Global variables */
var canvas;
var settings = {};
var cam;
var scene;

const WHITE = glMatrix.vec3.fromValues(1, 1, 1);
const BLACK = glMatrix.vec3.fromValues(0, 0, 0);


/**
 * Initialize globals after window loads. Then render
 */
window.onload = function(){
    /* Load all resources via promises */
    let promises = [
        // Earth texture from http://planetpixelemporium.com/earth.html
        imageDataFromFile('earthmap1k.jpg'),
    ];
    
    /* Create global variables and enable render button */
    Promise.all(promises).then( ([earthImgData]) => {
        canvas = document.getElementById("canvas");

        // Putting camera further from scene with smaller FOV reduces distortion
        cam = new Camera(
            glMatrix.vec3.fromValues(0, 0.5, 2),      // Camera pos
            glMatrix.vec3.fromValues(0, 0, -1),     // LookAt point
            glMatrix.vec3.fromValues(0, 1, 0),
            Math.PI/4,  // FOV
            0,          // Aperture
            canvas.width,
            canvas.height
        );

        /* Materials */
        let matNormals = new Material(function(uv, p, n){ return colorFromNormal(n) });
        let matGray = new Lambertian(glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        let matRed = new Lambertian(glMatrix.vec3.fromValues(1, 0, 0));
        let matGreen = new Lambertian(glMatrix.vec3.fromValues(0, 1, 0));
        let matMetal = new Metal(glMatrix.vec3.fromValues(0.8, 0.8, 0.8), 0.3);
        let matGlass = new Dielectric(glMatrix.vec3.fromValues(1, 1, 1), 1.5);
        let matEarth = new Material(earthImgData);

        /* Scene */
        scene = {
            "objects": [
                new Plane(glMatrix.vec3.fromValues(0, -0.5, 0), glMatrix.vec3.fromValues(0, 1, 0), matGray),
                new Sphere(glMatrix.vec3.fromValues(-0.55, 0, -1), 0.5, matRed),
                new Sphere(glMatrix.vec3.fromValues(0, 0, -0.5), 0.5, matGlass),
                new Sphere(glMatrix.vec3.fromValues(0.55, 0, -1), 0.5, matEarth),
            ]
        }

        // Set canvas to black initially
        renderBlack();

        // Enable button
        const renderButton = document.getElementById("renderButton");
        const renderText = document.getElementById('renderText');
        const renderSpinner = document.getElementById('renderSpinner');
        renderButton.onclick = () => {
            // Read settings
            updateSettings();
            
            // Add loading spinner while rendering
            renderText.classList.add('me-2');
            renderSpinner.classList.remove('visually-hidden');
            // Wait 1 frame allowing page to update before stalling in render call
            waitFrame(function(){
                render();
                renderSpinner.classList.add('visually-hidden');
                renderText.classList.remove('me-2');
            });
        };
    });
};


/**
 * Reads settings from HTML elements and updates global variable
 */
function updateSettings(){
    const detailSlider = document.getElementById('detail');
    const bounceSlider = document.getElementById('bounceLimit');
    
    settings.antialiasing = parseInt(detailSlider.value);
    settings.bounceLimit = parseInt(bounceSlider.value);
}


/**
 * Fills canvas with black
 */
function renderBlack(){
    let context = canvas.getContext("2d");
    context.fillRect(0, 0, canvas.width, canvas.height);
}


/**
 * Renders the scene to HTML canvas
 */
function render(){    
    let context = canvas.getContext("2d");
    let img = context.createImageData(canvas.width, canvas.height);
    renderScene(scene, cam, img).then(() => {
        context.putImageData(img, 0, 0);
    });
}


/**
 * Renders scene to the given ImageData
 * @param {Object} scene
 * @param {Camera} cam
 * @param {ImageData} img
 * @returns A Promise which will resolve when the image has been rendered
 */
function renderScene(scene, cam, img){
    let tasks = [];
    for(let x = 0; x < img.width; ++x){
        for(let y = 0; y < img.height; ++y){
            let renderFrag = (scene, cam, img, x, y) => {
                let color = glMatrix.vec3.create();

                // Multiple samples per pixel if antialiasing is on
                for(let s = 0; s < settings.antialiasing + 1; ++s){
                    const u = (x + Math.random()) / (img.width  - 1);
                    const v = (y + Math.random()) / (img.height - 1);
                    
                    const ray = cam.uvToRay(u, v);
                    glMatrix.vec3.add(color, color, getColor(ray, scene, settings.bounceLimit));
                }
                glMatrix.vec3.scale(color, color, 1/(settings.antialiasing+1));

                // Gamma correction
                let gamma = 0.45;
                color[0] = Math.pow(color[0], gamma);
                color[1] = Math.pow(color[1], gamma);
                color[2] = Math.pow(color[2], gamma);

                setPixel(img, x, y, color);
            };

            tasks.push(() => renderFrag(scene, cam, img, x, y));
        }
    }

    let queue = new ConcurrentTaskQueue(tasks, 1024);
    return queue.runTasks();
}


/**
 * Returns the color of the given ray after traveling through the scene
 * @param {Ray} ray 
 * @param {Scene} scene 
 */
function getColor(ray, scene, depth){
    if(depth === 0){
        return BLACK;
    }

    // Default background is skybox
    let color = skybox(ray);
    
    let hit = null;
    scene.objects.forEach(function(obj){
        const new_hit = obj.hit(ray, 0.001, 100);
        if(new_hit !== null && (hit === null || new_hit.t < hit.t)){
            hit = new_hit;
        }
    });

    if(hit != null){
        // Recurse for reflections
        let scatter = hit.material.scatter(ray, hit.point, hit.normal);
        if(!scatter || !scatter.ray || glMatrix.vec3.exactEquals(scatter.color, BLACK)){ 
            return hit.material.texture(hit.uv, hit.point, hit.normal);
        }
        

        // Color is based on scatter ray attenuated by object color (1 - absorbance)
        color = glMatrix.vec3.create();
        glMatrix.vec3.multiply(color, scatter.color, getColor(scatter.ray, scene, depth - 1));
    }

    return color;
}
