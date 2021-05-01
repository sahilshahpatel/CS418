const WORLD_SIZE = 3;
const GRAVITY = 9.8;
const BOUNCE_DAMPENING = 0.75;

class Particle{
    constructor(){
        this.r = Math.random() * (Particle.MAX_RADIUS - Particle.MIN_RADIUS) + Particle.MIN_RADIUS;

        let getRand = () => (2*Math.random() - 1) * (WORLD_SIZE - this.r);
        this.pos = glMatrix.vec3.fromValues(getRand(), getRand(), getRand());

        this.vel = glMatrix.vec3.create();
        glMatrix.vec3.random(this.vel, Particle.DEFAULT_SPEED);
        

        this.c = glMatrix.vec3.fromValues(Math.random(), Math.random(), Math.random());

        this.m = Particle.DEFAULT_MASS;

        this.active = true;

        // this.pos = glMatrix.vec3.fromValues(0, 0, 0);
        // this.vel = glMatrix.vec3.fromValues(1, 1, 0);
    }

    static get DEFAULT_SPEED()  { return 3; }
    static get MAX_RADIUS()     { return 0.5; }
    static get MIN_RADIUS()     { return 0.1; }
    static get DEFAULT_MASS()   { return 1; }
    static get STOP_SPEED()     { return 1e-10; }

    update(deltaT){
        if(!this.active){ return; }

        let newPos = glMatrix.vec3.clone(this.pos);
        let deltaP = glMatrix.vec3.create();
        glMatrix.vec3.scale(deltaP, this.vel, deltaT);
        glMatrix.vec3.add(newPos, newPos, deltaP);

        // Check that new position is in world bounds
        let collision = {t: Infinity, dim: -1};
        for(let dim = 0; dim < 3; dim++){
            let t = Infinity;

            if(Math.abs(newPos[dim] + this.r) >= WORLD_SIZE && newPos[dim] > 0){
                t = ((WORLD_SIZE - this.r) - this.pos[dim]) / this.vel[dim];
            }
            else if(Math.abs(newPos[dim] - this.r) >= WORLD_SIZE && newPos[dim] < 0){
                t = ((-WORLD_SIZE + this.r) - this.pos[dim]) / this.vel[dim];
            }

            if(t < collision.t){
                collision.t = t;
                collision.dim = dim;
            }
        }

        if(collision.t < Infinity){
            // Special case: hit the floor with low velocity
            if(collision.dim == 1 && this.vel[1] < 0 && glMatrix.vec3.length(this.vel) < Particle.STOP_SPEED){
                this.vel = glMatrix.vec3.fromValues(0, 0, 0);
                this.active = false;
                console.log("Stopping particle on floor");
            }

            // Update new position to edge of wall
            glMatrix.vec3.scale(deltaP, this.vel, collision.t);
            glMatrix.vec3.add(newPos, this.pos, deltaP);

            // Find new velocity after bounce
            let n = glMatrix.vec3.fromValues(0, 0, 0);
            n[collision.dim] = Math.sign(this.vel[collision.dim]);
            let dot = glMatrix.vec3.dot(this.vel, n);
            glMatrix.vec3.scale(n, n, 2*dot);
            glMatrix.vec3.subtract(this.vel, this.vel, n);

            // Dampen velocity after bounce
            glMatrix.vec3.scale(this.vel, this.vel, BOUNCE_DAMPENING);

            if(collision.t >= 0){
                // Update new position after bounce
                glMatrix.vec3.scale(deltaP, this.vel, deltaT - collision.t);
                glMatrix.vec3.add(newPos, newPos, deltaP);
            }
        }

        // DEBUGGING: check that position is changing
        // deltaP = glMatrix.vec3.create();
        // glMatrix.vec3.sub(deltaP, newPos, this.pos);
        // if(glMatrix.vec3.length(deltaP) == 0){
        //     debugger;
        // }

        // Apply updates
        this.pos = newPos;
    }
}