class WebGLAnimation{
    constructor(vertexShader, fragmentShader){
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;

        this.shaderProgram = null;
        this._previousTime = 0;
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexColorBuffer = gl.createBuffer();
        this.modelViewMatrix = glMatrix.mat4.create();
        this.vertexArrayObject = gl.createVertexArray();
    }


    /** 
     * Sets up shaders
     */
    setup(){        
        // Link the shaders together into a program.
        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, this.vertexShader);
        gl.attachShader(this.shaderProgram, this.fragmentShader);
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert("Failed to setup shaders");
        }
        
        gl.useProgram(this.shaderProgram);

        gl.bindVertexArray(this.vertexArrayObject);
            
        // Query the index of each attribute in the list of attributes maintained
        // by the GPU. 
        this.shaderProgram.vertexPositionAttribute =
            gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.shaderProgram.vertexColorAttribute =
            gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        this.shaderProgram.modelViewMatrixUniform =
            gl.getUniformLocation(this.shaderProgram, "uModelViewMatrix");

        // Enable each attribute we are using in the VAO.  
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
        gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
    }

    /**
     * Draws a frame to the screen.
     */
    draw(){
        // Transform the clip coordinates so the render fills the canvas dimensions.
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
        // Clear the screen.
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Use the vertex array object that we set up.
        gl.bindVertexArray(this.vertexArrayObject);
        
        // Send the ModelView matrix with our transformations to the vertex shader.
        gl.uniformMatrix4fv(this.shaderProgram.modelViewMatrixUniform,
                            false, this.modelViewMatrix);
        
        // Render the triangle. 
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.numberOfItems);
        
        // Unbind the vertex array object to be safe.
        gl.bindVertexArray(null);
    }

    /**
     * Starts this animation
     */
    start(){
        // Binding required when passing functions as parameters
        // see https://eliux.github.io/javascript/common-errors/why-this-gets-undefined-inside-methods-in-javascript/
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Performs the actual changes to the ModelView matrix and vertex positions
     * @param {Number} currentTime Time since start in seconds 
     * @param {Number} deltaTime Time since last frame in seconds 
     */
    _animate(currentTime, deltaTime){ }

    /**
     * Performs the surrounding calls necessary for WebGL to show the animation
     */
    animate(currentTime){
        // Convert the time to seconds.
        currentTime *= 0.001;
        // Subtract the previous time from the current time.
        const deltaTime = currentTime - this._previousTime;
        // Remember the current time for the next frame.
        this._previousTime = currentTime;

        this._animate(currentTime, deltaTime);

        this.draw();
        
        // Binding required when passing functions as parameters
        // see https://eliux.github.io/javascript/common-errors/why-this-gets-undefined-inside-methods-in-javascript/
        requestAnimationFrame(this.animate.bind(this));
    }
}