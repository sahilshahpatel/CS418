class BlockI extends WebGLAnimation{
    constructor(vertexShader, fragmentShader){
        super(vertexShader, fragmentShader);
    }

    /**
     * Sets up WebGL for this animation's shaders and buffers
     */
    setup(){
        /* Setup shaders */
        super.setup();


        /* Setup Buffers */

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);

        // Define a Block I in clip coordinates
        var vertices = this.blockIVertices(0);

        // Populate the buffer with the position data.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numberOfItems = vertices.length / this.vertexPositionBuffer.itemSize;

        // Binds the buffer that we just made to the vertex position attribute.
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        // Do the same steps for the color buffer.
        this.vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        
        const illini_orange = [0.90625, 0.2890625, 0.15234375, 1.0]
        var colors = new Array(4 * vertices.length / 3)
        for(let i = 0; i < vertices.length; i++){
            colors[4*i] = illini_orange[0];
            colors[4*i + 1] = illini_orange[1];
            colors[4*i + 2] = illini_orange[2];
            colors[4*i + 3] = illini_orange[3];
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        this.vertexColorBuffer.itemSize = 4;
        this.vertexColorBuffer.numItems = this.vertexPositionBuffer.numberOfItems;  
        gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, 
                               this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }

    /**
     * Changes the vertexPositionBuffer and modelViewMatrix to produce animation in WebGL canvas
     * @param {Number} currentTime 
     * @param {Number} deltaTime 
     */
    _animate(currentTime, deltaTime){
        // Animation phase periods
        const pre_jump = 0.5;
        const jump = 1;
        const split = 1;
        const anim_period = pre_jump + jump + split;

        let t = currentTime % anim_period;
        
        if(t < pre_jump){
            t /= pre_jump; // put t in [0, 1]

            // Reset vertex position buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            const vertices = this.blockIVertices(0);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

            // Squeeze is linear over time
            let squeeze = lerp(1, 0.25, t);
            
            // To keep baseline the same, we use translations
            glMatrix.mat4.fromTranslation(this.modelViewMatrix, [0, -0.80, 0])
            glMatrix.mat4.scale(this.modelViewMatrix, this.modelViewMatrix, [1, squeeze, 1]);
            glMatrix.mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, 0.80, 0]);
        }
        else if(t < pre_jump + jump){
            t = (t - pre_jump)/jump; // put t in [0, 1]

            // Undo squeeze non-linearly for "spring" effect
            let squeeze_t = min(1, Math.pow(3*t, 0.3));
            let squeeze = lerp(0.25, 1, squeeze_t);
            
            // Height is a parabola for "gravity" effect
            let height = 1 - Math.pow(2*t-1, 2);
            
            // Squeeze with moving baseline
            glMatrix.mat4.fromTranslation(this.modelViewMatrix, [0, -0.80 + height, 0])
            glMatrix.mat4.scale(this.modelViewMatrix, this.modelViewMatrix, [1, squeeze, 1]);
            glMatrix.mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, 0.80, 0]);
        }
        else if(t < pre_jump + jump + split){
            t = (t - pre_jump - jump)/split; // put t in [0, 1]

            // Non affine transform requires re-binding vertex array
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            const vertices = this.blockIVertices(t);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
        }
        else{
            glMatrix.mat4.identity(this.modelViewMatrix);
        }
    }

    /**
     * Returns the vertices of the Block I at time t
     * @param {Number} t 0 <= t <= 1, specifies the time within the non-affine animation
     */
    blockIVertices(t){
        const dx = 0.25*(1 - Math.pow(2*t-1, 2));
        const dy = dx;
    
        return [
            // Top left of I
            -0.75-dx, 0.80+dy, 0.0,
            -0.75-dx, 0.40+dy, 0.0,
            -0.40-dx, 0.40+dy, 0.0,
            -0.75-dx, 0.80+dy, 0.0,
            -0.40-dx, 0.80+dy, 0.0,
            -0.40-dx, 0.40+dy, 0.0,
        
            // Top center of I
            -0.40, 0.80, 0.0,
            0.40, 0.80, 0.0,
            0.40, 0.40, 0.0,
            -0.40, 0.80, 0.0,
            -0.40, 0.40, 0.0,
            0.40, 0.40, 0.0,
        
            // Top right of I
            0.75+dx, 0.80+dy, 0.0,
            0.75+dx, 0.40+dy, 0.0,
            0.40+dx, 0.40+dy, 0.0,
            0.75+dx, 0.80+dy, 0.0,
            0.40+dx, 0.80+dy, 0.0,
            0.40+dx, 0.40+dy, 0.0,
        
            // Center of I
            -0.40,  0.40, 0.0,
            -0.40, -0.40, 0.0,
            0.40, -0.40, 0.0,
            -0.40,  0.40, 0.0,
            0.40,  0.40, 0.0,
            0.40, -0.40, 0.0,
        
            // Bot left of I
                -0.75-dx, -0.80-dy, 0.0,
            -0.75-dx, -0.40-dy, 0.0,
            -0.40-dx, -0.40-dy, 0.0,
            -0.75-dx, -0.80-dy, 0.0,
            -0.40-dx, -0.80-dy, 0.0,
            -0.40-dx, -0.40-dy, 0.0,
        
            // Bot center of I
            -0.40, -0.80, 0.0,
            0.40, -0.80, 0.0,
            0.40, -0.40, 0.0,
            -0.40, -0.80, 0.0,
            -0.40, -0.40, 0.0,
            0.40, -0.40, 0.0,
        
            // Bot right of I
            0.75+dx, -0.80-dy, 0.0,
            0.75+dx, -0.40-dy, 0.0,
            0.40+dx, -0.40-dy, 0.0,
            0.75+dx, -0.80-dy, 0.0,
            0.40+dx, -0.80-dy, 0.0,
            0.40+dx, -0.40-dy, 0.0,
        ];
    }
}