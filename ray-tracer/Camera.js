class Camera{
    constructor(pos, dir, up, fov, nearClip, imgWidth, imgHeight){
        this.pos = glMatrix.vec3.clone(pos);

        this.dir = glMatrix.vec3.create();
        glMatrix.vec3.normalize(this.dir, dir);

        this.up = glMatrix.vec3.create();
        glMatrix.vec3.normalize(this.up, up);

        this.fov = fov;
        this.nearClip = nearClip;

        this.updateViewport(imgWidth, imgHeight);
    }

    updateViewport(imgWidth, imgHeight){
        const height = 2 * this.nearClip * Math.tan(this.fov / 2);
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
        glMatrix.vec3.scale(pos, pos, this.nearClip); 
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
    
        const dir = glMatrix.vec3.create();
        glMatrix.vec3.sub(dir, fragPos, this.pos);
        glMatrix.vec3.normalize(dir, dir);
    
        return new Ray(fragPos, dir);
    }
}