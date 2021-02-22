/* Global variables */
var canvas;
var settings;
var cam;
var scene;


/**
 * Initialize globals after window loads. Then render
 */
window.onload = function(){
    canvas = document.getElementById("canvas");
    settings = {
        antialiasing: 10,
        bounceLimit: 10
    }

    // Putting camera further from scene with smaller FOV reduces distortion
    cam = new Camera(
        glMatrix.vec3.fromValues(0, 0, 2),
        glMatrix.vec3.fromValues(0, 0, -1),
        glMatrix.vec3.fromValues(0, 1, 0),
        Math.PI/4,  // FOV
        1e-5,       // Near clipping distance (cannot be 0!)
        canvas.width,
        canvas.height
    );

    matNormals = new Material(function(p, n){return colorFromNormal(n)}, 0);
    matGray = new Lambertian(glMatrix.vec4.fromValues(0.5, 0.5, 0.5, 1), 0.05);
    matRed = new Lambertian(glMatrix.vec4.fromValues(1, 0, 0, 1), 0.25);
    matGreen = new Lambertian(glMatrix.vec4.fromValues(0, 1, 0, 1), 0.25);
    matMetal = new Metal(glMatrix.vec4.fromValues(0.8, 0.8, 0.8, 1), 0.75, 0.3);

    scene = {
        "objects": [
            new Sphere(glMatrix.vec3.fromValues(0, -100.5, -1), 100, matGray),
            new Sphere(glMatrix.vec3.fromValues(0, 0, -1), 0.5, matRed),
            new Sphere(glMatrix.vec3.fromValues(1, 0, -1), 0.5, matMetal),
        ]
    }

    render();
};


/**
 * Renders the scene to HTML canvas
 */
function render(){    
    let context = canvas.getContext("2d");
    let img = context.createImageData(canvas.width, canvas.height);

    renderScene(scene, cam, img);
    context.putImageData(img, 0, 0);
}


/**
 * Renders scene to the given ImageData
 * @param {ImageData} img
 */
function renderScene(scene, cam, img){
    // Main loop over each pixel
    for(let x = 0; x < img.width; ++x){
        for(let y = 0; y < img.height; ++y){
            let color = glMatrix.vec4.create();
            
            // Multiple samples per pixel if antialiasing is on
            for(let s = 0; s < settings.antialiasing + 1; ++s){
                const u = (x + Math.random()) / (img.width  - 1);
                const v = (y + Math.random()) / (img.height - 1);
                
                const ray = cam.uvToRay(u, v);
                glMatrix.vec4.add(color, color, getColor(ray, scene, settings.bounceLimit));
            }
            glMatrix.vec4.scale(color, color, 1/(settings.antialiasing+1));

            // Gamma correction
            let gamma = 0.45;
            color[0] = Math.pow(color[0], gamma);
            color[1] = Math.pow(color[1], gamma);
            color[2] = Math.pow(color[2], gamma);
            color[3] = Math.pow(color[0], gamma);

            setPixel(img, x, y, color);
        }
    }
    
    return img;
}


/**
 * Returns the color of the given ray after traveling through the scene
 * @param {Ray} ray 
 * @param {Scene} scene 
 */
function getColor(ray, scene, depth){
    if(depth === 0){
        return glMatrix.vec4.fromValues(0, 0, 0, 1);
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
        color = hit.material.texture(hit.point, hit.normal);

        // Recurse for reflections
        let scatter = hit.material.scatter(ray, hit.point, hit.normal);
        if(!scatter || !scatter.ray || scatter.attenuation === 0){ return color; }
        
        glMatrix.vec4.scale(color, color, scatter.attenuation);
        let reflection = getColor(scatter.ray, scene, depth-1);
        glMatrix.vec4.scale(reflection, reflection, 1 - scatter.attenuation);
        glMatrix.vec4.add(color, color, reflection);
    }

    return color;
}
