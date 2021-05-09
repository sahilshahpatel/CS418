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

        this.d = Particle.DEFAULT_DRAG;

        this.active = true;
    }

    static get DEFAULT_SPEED()  { return 10; }
    static get MAX_RADIUS()     { return 0.5; }
    static get MIN_RADIUS()     { return 0.1; }
    static get DEFAULT_MASS()   { return 0.1; }
    static get STOP_SPEED()     { return 1; }
    static get DEFAULT_DRAG()   { return 0.5; }

    update(deltaT){
        if(!this.active){ return; }

        // Adjust velocity by drag
        glMatrix.vec3.scale(this.vel, this.vel, Math.pow(this.d, deltaT));

        // Adjust velocity by gravity
        let deltaV = glMatrix.vec3.fromValues(0, -GRAVITY*deltaT, 0);
        glMatrix.vec3.add(this.vel, this.vel, deltaV);


        // Update position
        let newPos = glMatrix.vec3.clone(this.pos);
        let deltaP = glMatrix.vec3.create();
        glMatrix.vec3.scale(deltaP, this.vel, deltaT);
        glMatrix.vec3.add(newPos, newPos, deltaP);        


        // Check that new position is in world bounds
        let collision = {t: Infinity, dim: -1, sign: 0};
        for(let dim = 0; dim < 3; dim++){
            let t = Infinity;
            let sign = 0;

            if(Math.abs(newPos[dim] + this.r) >= WORLD_SIZE && newPos[dim] > 0){
                t = ((WORLD_SIZE - this.r) - this.pos[dim]) / this.vel[dim];
                sign = 1;
            }
            else if(Math.abs(newPos[dim] - this.r) >= WORLD_SIZE && newPos[dim] < 0){
                t = ((-WORLD_SIZE + this.r) - this.pos[dim]) / this.vel[dim];
                sign = -1;
            }

            if(t < collision.t){
                collision.t = t;
                collision.dim = dim;
                collision.sign = sign;
            }
        }

        if(collision.t < Infinity){
            // Special case: hit the floor with low velocity
            if(collision.dim == 1 && collision.sign == -1 && glMatrix.vec3.length(this.vel) < Particle.STOP_SPEED){
                this.vel = glMatrix.vec3.fromValues(0, 0, 0);
                this.active = false;
                console.log("Stopping particle on floor");
            }

            // Update new position to edge of wall
            glMatrix.vec3.scale(deltaP, this.vel, collision.t);
            glMatrix.vec3.add(newPos, this.pos, deltaP);

            // Find new velocity after bounce
            let n = glMatrix.vec3.fromValues(0, 0, 0);
            n[collision.dim] = collision.sign;
            let dot = glMatrix.vec3.dot(this.vel, n);
            glMatrix.vec3.scale(n, n, 2*dot);
            glMatrix.vec3.subtract(this.vel, this.vel, n);

            // Dampen velocity after bounce
            glMatrix.vec3.scale(this.vel, this.vel, BOUNCE_DAMPENING);


            // Cannot naively update position after bounce because another collision could happen in this next move
            // We could just call update(deltaT - collision.t), but I don't want to worry about infinite recursion.
            // For this MP, ignoring this portion of the time frame is OK.
            // if(collision.t >= 0){
            //     // Update new position after bounce
            //     glMatrix.vec3.scale(deltaP, this.vel, deltaT - collision.t);
            //     glMatrix.vec3.add(newPos, newPos, deltaP);
            // }
        }

        // Apply updates
        this.pos = newPos;
    }
}