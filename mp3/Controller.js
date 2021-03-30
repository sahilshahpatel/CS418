class Controller {
    constructor(pos){
        // Keeps track of camera position
        this.initPos = glMatrix.vec3.clone(pos);

        this.init();

        // Keeps track of which keys are currently down
        this.keys = {};

        /* Attach event listeners */
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    /* Parameters */
    static get SPEED_DELTA()        { return 0.05; }
    static get ROLL_DELTA()         { return 5 * 2 * Math.PI; }
    static get PITCH_DELTA()        { return 5 * 2 * Math.PI; }
    static get LIFT_TILT()          { return 0.5; }
    static get INIT_SPEED()         { return 0.075; }
    static get INIT_DIR()           { return glMatrix.vec3.fromValues(1, 0, 0); }
    static get INIT_UP()            { return glMatrix.vec3.fromValues(0, 0, 1); }
    static get MAX_ROLL()           { return 2 * Math.PI / 8; } // Should always be less than a quarter turn

    /* Controls */
    static get KEY_SPEED_UP()       { return "="; }
    static get KEY_SLOW_DOWN()      { return "-"; }
    static get KEY_ROLL_RIGHT()     { return "d"; }
    static get KEY_ROLL_LEFT()      { return "a"; }
    static get KEY_PITCH_UP()       { return "s"; }
    static get KEY_PITCH_DOWN()     { return "w"; }
    static get KEY_RESET()          { return "Escape"; }

    /* Getters */
    get forward() {
        let forward = Controller.INIT_DIR;
        glMatrix.vec3.transformQuat(forward, forward, this.orientation);
        glMatrix.vec3.normalize(forward, forward);
        return forward;
    }

    get up() {
        let up = Controller.INIT_UP;
        glMatrix.vec3.transformQuat(up, up, this.orientation);
        glMatrix.vec3.normalize(up, up);
        return up;
    }

    get right() {
        let right = glMatrix.vec3.create();
        glMatrix.vec3.cross(right, this.forward, this.up);
        return right;
    }

    get lookAt() {
        let lookAt = glMatrix.vec3.create();
        glMatrix.vec3.add(lookAt, this.forward, this.pos);
        return lookAt;
    }

    /**
     * Initializes (or re-initializes) position, orientation, and speed
     */
    init(){
        this.pos = glMatrix.vec3.clone(this.initPos);
        this.orientation = glMatrix.quat.create();
        this.speed = Controller.INIT_SPEED;
    }

    /**
     * Updates properties based on keyboard controls
     * @param {Number} deltaT -- the number of seconds since last update call
     */
    update(deltaT){
        // Store Euler angle deltas
        let roll = 0;
        let pitch = 0;
        let yaw = 0;
        
        /* Calculate deltas */
        if(this.keys[Controller.KEY_SPEED_UP]){
            this.speed += Controller.SPEED_DELTA * deltaT;
        }
        
        if(this.keys[Controller.KEY_SLOW_DOWN]){
            this.speed -= Controller.SPEED_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_ROLL_RIGHT]){
            roll += Controller.ROLL_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_ROLL_LEFT]){
            roll -= Controller.ROLL_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_PITCH_UP]){
            pitch -= Controller.PITCH_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_PITCH_DOWN]){
            pitch += Controller.PITCH_DELTA * deltaT;
        }

        /* Update orientation */
        let nextOrientation = glMatrix.quat.create();
        let getNextOrientation = () => {
            glMatrix.quat.fromEuler(nextOrientation, roll, pitch, yaw);
            glMatrix.quat.multiply(nextOrientation, this.orientation, nextOrientation);
        }
        getNextOrientation();

        let up = this.up; // Avoid recalculating
        let nextRoll = Math.sign(roll) * Math.acos(glMatrix.vec3.dot(up, glMatrix.vec3.fromValues(0, 0, 1)));
        if(Math.abs(nextRoll) < Controller.MAX_ROLL){
            this.orientation = nextOrientation;
        }
        else{
            roll = roll - (nextRoll - Math.sign(nextRoll) * Controller.MAX_ROLL);
            getNextOrientation();
            this.orientation = nextOrientation;  
        }

        /* Naively simulate turning via rolling */
        let tiltQuat = glMatrix.quat.create();
        // Uses vec2 to ignore Z component
        let sign = -Math.sign(glMatrix.vec2.dot(up, this.right));
        let tilt = sign * Controller.LIFT_TILT * glMatrix.vec2.length(up);
        glMatrix.quat.fromEuler(tiltQuat, 0, 0, tilt);
        glMatrix.quat.multiply(this.orientation, tiltQuat, this.orientation);

        /* Update position */
        let posDelta = glMatrix.vec3.create();
        glMatrix.vec3.scale(posDelta, this.forward, this.speed * deltaT);
        glMatrix.vec3.add(this.pos, this.pos, posDelta);
    }

    /**
     * Marks pressed keys
     * @param {Event} e 
     */
    onKeyDown(e){
        // If reset key was pressed, do it once
        if(e.key === Controller.KEY_RESET){
            this.init();
            return;
        }

        this.keys[e.key] = true;
    }

    /**
     * Unmarks pressed keys
     * @param {Event} e 
     */
    onKeyUp(e){
        this.keys[e.key] = undefined;
    }
}