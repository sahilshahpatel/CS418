const MAX_COLOR = 255;

/**
 * Sets the color of the given pixel in the given ImageData
 * @param {ImageData} img 
 * @param {Number} x 
 * @param {Number} y 
 * @param {vec4 | Array<Number>(4)} rgba 
 */
function setPixel(img, x, y, rgba){
    if(x < 0 || x >= img.width || y < 0 || y >= img.height){
        return;
    }

    // Must skip 4 bytes at a time
    x *= 4;
    y *= 4;

    img.data[img.width*y + x    ] = MAX_COLOR*clamp(rgba[0], 0, 1);
    img.data[img.width*y + x + 1] = MAX_COLOR*clamp(rgba[1], 0, 1);
    img.data[img.width*y + x + 2] = MAX_COLOR*clamp(rgba[2], 0, 1);
    img.data[img.width*y + x + 3] = MAX_COLOR*clamp(rgba[3], 0, 1);
}


/**
 * Returns the color of the given pixel in the given ImageData
 * @param {ImageData} img 
 * @param {Number} x 
 * @param {Number} y 
 */
function getPixel(img, x, y){
    if(x < 0 || x >= img.width || y < 0 || y >= img.height){
        return;
    }

    // Must skip 4 bytes at a time
    x *= 4;
    y *= 4;

    return glMatrix.vec4.fromValues(
        img.data[img.width*y + x    ],
        img.data[img.width*y + x + 1],
        img.data[img.width*y + x + 2],
        img.data[img.width*y + x + 3]
    );
}


function clamp(val, min, max){
    if(val > max) return max;
    if(val < min) return min;
    return val;
}


// Helper function to convert canvas UVs to world coordinates
function uvToWorld(cam, u, v){
    // Get center of viewport
    let pos = glMatrix.vec3.clone(cam.dir);
    glMatrix.vec3.scale(pos, pos, cam.focalLength); 
    glMatrix.vec3.add(pos, pos, cam.pos);

    // Move alone viewport basis vectors
    let dx = glMatrix.vec3.create();
    glMatrix.vec3.scale(dx, cam.viewport.basis.x, (u - 0.5)*cam.viewport.width);
    let dy = glMatrix.vec3.create();
    glMatrix.vec3.scale(dy, cam.viewport.basis.y, (v - 0.5)*cam.viewport.height);

    glMatrix.vec3.add(pos, pos, dx);
    glMatrix.vec3.add(pos, pos, dy);

    return pos;
}


function rayFromFrag(cam, u, v){
    const fragPos = uvToWorld(cam, u, v);

    const dir = glMatrix.vec3.create();
    glMatrix.vec3.sub(dir, fragPos, cam.pos);
    glMatrix.vec3.normalize(dir, dir);

    return new Ray(cam.pos, dir);
}


function colorFromNormal(n){
    color = glMatrix.vec3.clone(n);
    glMatrix.vec3.add(color, color, glMatrix.vec3.fromValues(1, 1, 1));
    glMatrix.vec3.scale(color, color, 0.5);
    
    color = glMatrix.vec4.fromValues(
        color[0], color[1], color[2], 1
    );

    return color;
}


function randomPointOnUnitSphere(){
    // From https://mathworld.wolfram.com/SpherePointPicking.html
    let u = Math.random();
    let v = Math.random();

    let theta = 2*Math.PI*u;
    let phi = Math.acos(2*v-1);

    let x = Math.sin(theta)*Math.cos(phi);
    let y = Math.sin(theta)*Math.sin(phi);
    let z = Math.cos(theta);
    
    let p = glMatrix.vec3.fromValues(x, y, z);
    return p;
}


function skybox(ray){
    let u = glMatrix.vec3.clone(ray.dir);
    let t = 0.5*u[1] + 1;

    let white = glMatrix.vec4.fromValues(1, 1, 1, 1);
    glMatrix.vec4.scale(white, white, 1-t);
    let blue = glMatrix.vec4.fromValues(0.5, 0.7, 1, 1);
    glMatrix.vec4.scale(blue, blue, t);

    let c = glMatrix.vec4.create();
    glMatrix.vec4.add(c, white, blue);

    return c;
}