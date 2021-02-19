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

    img.data[img.width*y + x    ] = rgba[0];
    img.data[img.width*y + x + 1] = rgba[1];
    img.data[img.width*y + x + 2] = rgba[2];
    img.data[img.width*y + x + 3] = rgba[3];
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


function getViewport(cam, imgWidth, imgHeight){
    const height = 2 * cam.focalLength / Math.cos(cam.fov / 2);
    const width = imgWidth / imgHeight * height;

    const y = glMatrix.vec3.create();
    glMatrix.vec3.scale(y, cam.up, -1);
    const x = glMatrix.vec3.create();
    glMatrix.vec3.cross(x, cam.dir, cam.up);

    return {
        "width": width,
        "height": height,
        "basis": {
            "x": x,
            "y": y
        }
    }
}


// Helper function to convert canvas UVs to world coordinates
function uvToWorld(cam, viewport, u, v){
    // Get center of viewport
    let pos = glMatrix.vec3.clone(cam.dir);
    glMatrix.vec3.scale(pos, pos, cam.focalLength); 
    glMatrix.vec3.add(pos, pos, cam.pos);

    // Move alone viewport basis vectors
    let dx = glMatrix.vec3.create();
    glMatrix.vec3.scale(dx, viewport.basis.x, (u - 0.5)*viewport.width);
    let dy = glMatrix.vec3.create();
    glMatrix.vec3.scale(dy, viewport.basis.y, (v - 0.5)*viewport.height);

    glMatrix.vec3.add(pos, pos, dx);
    glMatrix.vec3.add(pos, pos, dy);

    return pos;
}


function rayFromFrag(cam, viewport, u, v){
    const fragPos = uvToWorld(cam, viewport, u, v);

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