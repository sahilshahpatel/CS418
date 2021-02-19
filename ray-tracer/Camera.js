class Camera{
    constructor(pos, dir, up, fov, focalLength, imgWidth, imgHeight){
        this.pos = glMatrix.vec3.clone(pos);
        this.dir = glMatrix.vec3.clone(dir);
        this.up = glMatrix.vec3.clone(up);
        this.fov = fov;
        this.focalLength = focalLength;

        this.updateViewport(imgWidth, imgHeight);
    }

    updateViewport(imgWidth, imgHeight){
        const height = 2 * this.focalLength / Math.cos(this.fov / 2);
        const width = imgWidth / imgHeight * height;
    
        const y = glMatrix.vec3.create();
        glMatrix.vec3.scale(y, this.up, -1);
        const x = glMatrix.vec3.create();
        glMatrix.vec3.cross(x, this.dir, this.up);
    
        this.viewport = {
            "width": width,
            "height": height,
            "basis": {
                "x": x,
                "y": y
            }
        }
    }
}