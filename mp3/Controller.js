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
    static get SPEED_DELTA()        { return 0.1; }
    static get ROLL_DELTA()         { return 5 * 2 * Math.PI; }
    static get PITCH_DELTA()        { return 5 * 2 * Math.PI; }
    static get INIT_SPEED()         { return 0.1; }
    static get INIT_DIR()           { return glMatrix.vec3.fromValues(1, 0, 0); }
    static get INIT_UP()            { return glMatrix.vec3.fromValues(0, 0, 1); }

    /* Controls */
    static get KEY_SPEED_UP()       { return "="; }
    static get KEY_SLOW_DOWN()      { return "-"; }
    static get KEY_ROLL_RIGHT()     { return "d"; }
    static get KEY_ROLL_LEFT()      { return "a"; }
    static get KEY_PITCH_UP()       { return "w"; }
    static get KEY_PITCH_DOWN()     { return "s"; }
    static get KEY_RESET()          { return "Escape"; }

    /* Getters */
    get dir() {
        let dir = Controller.INIT_DIR;
        glMatrix.vec3.transformQuat(dir, dir, this.orientation);
        glMatrix.vec3.normalize(dir, dir);
        return dir;
    }

    get up() {
        let up = Controller.INIT_UP;
        glMatrix.vec3.transformQuat(up, up, this.orientation);
        glMatrix.vec3.normalize(up, up);
        return up;
    }

    get lookAt() {
        let lookAt = glMatrix.vec3.create();
        glMatrix.vec3.add(lookAt, this.dir, this.pos);
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
        let eulerX = 0;
        let eulerY = 0;
        let eulerZ = 0;
        
        /* Calculate deltas */
        if(this.keys[Controller.KEY_SPEED_UP]){
            this.speed += Controller.SPEED_DELTA * deltaT;
        }
        
        if(this.keys[Controller.KEY_SLOW_DOWN]){
            this.speed -= Controller.SPEED_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_ROLL_RIGHT]){
            eulerX += Controller.ROLL_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_ROLL_LEFT]){
            eulerX -= Controller.ROLL_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_PITCH_UP]){
            eulerY += Controller.PITCH_DELTA * deltaT;
        }

        if(this.keys[Controller.KEY_PITCH_DOWN]){
            eulerY -= Controller.PITCH_DELTA * deltaT;
        }

        /* Update orientation */
        let orientationDelta = glMatrix.quat.create();
        glMatrix.quat.fromEuler(orientationDelta, eulerX, eulerY, eulerZ);
        
        glMatrix.quat.multiply(this.orientation, this.orientation, orientationDelta);

        /* Update position */
        let posDelta = glMatrix.vec3.create();
        glMatrix.vec3.scale(posDelta, this.dir, this.speed * deltaT);
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