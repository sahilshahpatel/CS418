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


// Helper function to convert canvas coordinates to world coordinates
function canvasToWorld(cam, focalLength, x, y, width, height){      
    let pos = glMatrix.vec3.clone(cam.dir);
    glMatrix.vec3.scale(pos, pos, focalLength);
    glMatrix.vec3.add(pos, pos, cam.pos);
    glMatrix.vec3.add(pos, pos, glMatrix.vec3.fromValues(-width/2 + x + 0.5, height/2 - y + 0.5, 0));
    return pos;
}