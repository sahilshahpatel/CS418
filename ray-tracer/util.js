const MAX_COLOR = 255;

/**
 * Sets the color of the given pixel in the given ImageData
 * @param {ImageData} img 
 * @param {Number} x 
 * @param {Number} y 
 * @param {vec3 | Array<Number>(3)} rgba 
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
    img.data[img.width*y + x + 3] = MAX_COLOR;
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

    return glMatrix.vec3.fromValues(
        img.data[img.width*y + x    ],
        img.data[img.width*y + x + 1],
        img.data[img.width*y + x + 2]
    );
}


function clamp(val, min, max){
    if(val > max) return max;
    if(val < min) return min;
    return val;
}


function colorFromNormal(n){
    color = glMatrix.vec3.clone(n);
    glMatrix.vec3.add(color, color, glMatrix.vec3.fromValues(1, 1, 1));
    glMatrix.vec3.scale(color, color, 0.5);

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


function nearZero(vec){
    let e = 1e-8;
    return Math.abs(vec[0]) < e 
        && Math.abs(vec[1]) < e 
        && Math.abs(vec[2]) < e;
}


/**
 * Returns v reflected about n
 * @param {vec3} v 
 * @param {vec3} n 
 */
function reflect(v, n){
    let d = glMatrix.vec3.dot(v, n);

    let r = glMatrix.vec3.create();
    glMatrix.vec3.scale(r, n, 2*d);
    glMatrix.vec3.sub(r, v, r);
    
    return r;
}


function refract(v, n, eta_ratio){
    let negV = glMatrix.vec3.create();
    glMatrix.vec3.scale(negV, v, -1);

    // Assumes v and n are unit length
    let cosTheta = glMatrix.vec3.dot(negV, n);

    // Split computation into perpendicular and parallel components
    let rPerp = glMatrix.vec3.create();
    glMatrix.vec3.scale(rPerp, n, cosTheta);
    glMatrix.vec3.add(rPerp, rPerp, v);
    glMatrix.vec3.scale(rPerp, rPerp, eta_ratio);

    let rPar = glMatrix.vec3.create();
    let coeff = -Math.sqrt(Math.abs(1 - glMatrix.vec3.sqrLen(rPerp)));
    glMatrix.vec3.scale(rPar, n, coeff);

    let r = glMatrix.vec3.create();
    glMatrix.vec3.add(r, rPerp, rPar);
    
    return r;
}


function skybox(ray){
    let u = glMatrix.vec3.clone(ray.dir);
    let t = 0.5*u[1] + 1;

    let white = glMatrix.vec3.fromValues(1, 1, 1);
    glMatrix.vec3.scale(white, white, 1-t);
    let blue = glMatrix.vec3.fromValues(0.5, 0.7, 1);
    glMatrix.vec3.scale(blue, blue, t);

    let c = glMatrix.vec3.create();
    glMatrix.vec3.add(c, white, blue);

    return c;
}