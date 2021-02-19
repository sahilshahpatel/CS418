const MAX_COLOR = 255;

// Render scene on load
window.onload = function(){    
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    let img = context.createImageData(canvas.width, canvas.height);
    
    renderScene(img);
    context.putImageData(img, 0, 0);
}

/**
 * Renders scene to the given ImageData
 * @param {ImageData} img
 */
function renderScene(img){
    // Canvas is positioned in world space with center at cam.pos + focalLength*cam.dir
    let cam = {
        "pos": glMatrix.vec3.fromValues(0, 0, 0),
        "dir": glMatrix.vec3.fromValues(0, 0, -1),
        "up": glMatrix.vec3.fromValues(0, 1, 0),
    }
    let focalLength = 1;

    // Main loop over each pixel
    for(let x = 0; x < img.width; x++){
        for(let y = 0; y < img.height; y++){
            const pos = canvasToWorld(cam, focalLength, x, y, img.width, img.height);
            const ray = glMatrix.vec3.create();
            glMatrix.vec3.sub(ray, pos, cam.pos);
            let color = [ray[0], ray[1], ray[2], MAX_COLOR];
            setPixel(img, x, y, color); 
        }
    }
    
    return img;
}
