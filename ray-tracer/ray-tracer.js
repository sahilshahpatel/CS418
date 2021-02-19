const MAX_COLOR = 255;

// Render scene on load
window.onload = function(){    
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    let img = context.createImageData(canvas.width, canvas.height);
    
    let cam = {
        "pos": glMatrix.vec3.fromValues(0, 0, 0),
        "dir": glMatrix.vec3.fromValues(0, 0, -1),
        "up": glMatrix.vec3.fromValues(0, 1, 0),
        "fov": Math.PI/2,
        "focalLength": 1,
    }

    let scene = [
        new Sphere(glMatrix.vec3.fromValues(0, 0, -1), 0.5),
    ]

    renderScene(scene, cam, img);
    context.putImageData(img, 0, 0);
}

/**
 * Renders scene to the given ImageData
 * @param {ImageData} img
 */
function renderScene(scene, cam, img){
    let viewport = getViewport(cam, img.width, img.height);

    // Main loop over each pixel
    for(let x = 0; x < img.width; x++){
        for(let y = 0; y < img.height; y++){
            const u = x / (img.width - 1);
            const v = y / (img.height - 1);
            
            const ray = rayFromFrag(cam, viewport, u, v);
            const color = getColor(ray, scene);
            
            setPixel(img, x, y, color); 
        }
    }
    
    return img;
}

function getColor(ray, scene){
    // Default background is black
    let color = [0, 0, 0, MAX_COLOR]
    
    // TODO: loop over all objects?
    let sphere = scene[0];
    if(sphere.hit(ray, 0, 100)){
        color[0] = MAX_COLOR;
    }
    else{
        const up = glMatrix.vec3.fromValues(0, 1, 0);
        color[2] = 0.5*(1+glMatrix.vec3.dot(ray.dir, up)) * MAX_COLOR;
    }

    return color;
}
