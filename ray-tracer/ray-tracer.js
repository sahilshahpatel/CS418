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
    }
    cam = new Camera(
        glMatrix.vec3.fromValues(0, 0, 0),
        glMatrix.vec3.fromValues(0, 0, -1),
        glMatrix.vec3.fromValues(0, 1, 0),
        Math.PI/2,
        1,
        canvas.width,
        canvas.height
    );
    scene = {
        "background": glMatrix.vec4.fromValues(0.5, 0.5, 0.5, 1),
        "objects": [
            new Sphere(glMatrix.vec3.fromValues(0, 0, -1), 0.5, glMatrix.vec4.fromValues(1, 0, 0, 1)),
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
            
            for(let s = 0; s < settings.antialiasing + 1; ++s){
                const u = (x + Math.random()) / (img.width  - 1);
                const v = (y + Math.random()) / (img.height - 1);
                
                const ray = rayFromFrag(cam, u, v);
                glMatrix.vec4.add(color, color, getColor(ray, scene));
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
function getColor(ray, scene){
    // Default background if none is supplied
    let color = glMatrix.vec4.fromValues(0.5, 0.5, 0.5, 1);
    if(scene.background != null){
        color = glMatrix.vec4.clone(scene.background);
    }
    
    let hit = null;
    scene.objects.forEach(function(obj){
        const new_hit = obj.hit(ray, 0, 100);
        if(new_hit != null && (hit == null || new_hit.t < hit.t)){
            hit = new_hit;
        }
    });

    if(hit != null){
        color = hit.color;

        // For debugging:
        color = colorFromNormal(hit.normal);
    }

    return color;
}
