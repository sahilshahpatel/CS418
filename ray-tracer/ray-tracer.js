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

    let scene = {
        "background": glMatrix.vec4.fromValues(0.5, 0.5, 0.5, 1),
        "objects": [
            new Sphere(glMatrix.vec3.fromValues(0, 0, -1), 0.5),
        ]
    }

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
            let color = getColor(ray, scene);
            glMatrix.vec4.scale(color, color, MAX_COLOR);
            
            setPixel(img, x, y, color); 
        }
    }
    
    return img;
}

function getColor(ray, scene){
    // Default background if none is supplied
    let color = glMatrix.vec4.fromValues(0.5, 0.5, 0.5, 1);
    if(scene.background != null){
        color = glMatrix.vec4.clone(scene.background);
    }
    
    let n = null;
    let dist2 = 0;
    scene.objects.forEach(function(obj){
        const temp = obj.hit(ray, 0, 100);
        if(temp != null){
            const new_dist2 = glMatrix.vec3.sqrDist(temp.origin, ray.origin);
            if(n == null || new_dist2 < dist2){
                n = temp;
                dist2 = new_dist2;
    
                color = colorFromNormal(n.dir);
            }
        } 
    });

    return color;
}
