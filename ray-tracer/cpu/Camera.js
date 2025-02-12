class Camera{
    constructor(pos, lookAt, up, fov, aperture, imgWidth, imgHeight){
        this.pos = glMatrix.vec3.clone(pos);

        // Focal length and direction vector come from lookAt point
        this.dir = glMatrix.vec3.create();
        glMatrix.vec3.sub(this.dir, lookAt, pos);
        this.focalLength = glMatrix.vec3.length(this.dir);
        glMatrix.vec3.normalize(this.dir, this.dir);

        this.up = glMatrix.vec3.create();
        glMatrix.vec3.normalize(this.up, up);

        this.fov = fov;
        this.aperture = aperture;

        this.updateViewport(imgWidth, imgHeight);
    }

    updateViewport(imgWidth, imgHeight){
        const height = 2 * this.focalLength * Math.tan(this.fov / 2);
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

    uvToWorld(u, v){
        // Get center of viewport
        let pos = glMatrix.vec3.clone(this.dir);
        glMatrix.vec3.scale(pos, pos, this.focalLength); 
        glMatrix.vec3.add(pos, pos, this.pos);

        // Move along viewport basis vectors
        let dx = glMatrix.vec3.create();
        glMatrix.vec3.scale(dx, this.viewport.basis.x, (u - 0.5)*this.viewport.width);
        let dy = glMatrix.vec3.create();
        glMatrix.vec3.scale(dy, this.viewport.basis.y, (v - 0.5)*this.viewport.height);

        glMatrix.vec3.add(pos, pos, dx);
        glMatrix.vec3.add(pos, pos, dy);

        return pos;
    }

    uvToRay(u, v){
        const fragPos = this.uvToWorld(u, v);

        // Add depth of field by offsetting camera pos within small disk
        const offset = randomPointInUnitDisk();
        glMatrix.vec3.scale(offset, offset, this.aperture/2);

        const du = glMatrix.vec3.create();
        glMatrix.vec3.scale(du, this.viewport.basis.x, offset[0]);
        
        const dv = glMatrix.vec3.create();
        glMatrix.vec3.scale(dv, this.viewport.basis.y, offset[1]);

        glMatrix.vec3.add(offset, du, dv);

        const pos = glMatrix.vec3.create();
        glMatrix.vec3.add(pos, this.pos, offset);
    
        const dir = glMatrix.vec3.create();
        glMatrix.vec3.sub(dir, fragPos, pos);
        glMatrix.vec3.normalize(dir, dir);
    
        return new Ray(pos, dir);
    }
}