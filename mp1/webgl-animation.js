class WebGLAnimation{
    constructor(vertexShader, fragmentShader){
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;

        this.vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayObject)

        // Link the shaders together into a program.
        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert("Failed to setup shaders");
        }

        // Query the index of each attribute in the list of attributes maintained
        // by the GPU. 
        this.shaderProgram.vertexPositionAttribute =
            gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.shaderProgram.vertexColorAttribute =
            gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        this.shaderProgram.modelViewMatrixUniform =
            gl.getUniformLocation(this.shaderProgram, "uModelViewMatrix");

        this.clear_color = [0, 0, 0, 1];
        this._previousTime = 0;
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexColorBuffer = gl.createBuffer();
        this.modelViewMatrix = glMatrix.mat4.create();

        // Animation frame ID
        this.requestAnimationFrameID = undefined;
    }


    /** 
     * Sets up shaders
     */
    setup(){
        gl.clearColor(...this.clear_color);
        
        gl.useProgram(this.shaderProgram);

        gl.bindVertexArray(this.vertexArrayObject);

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
        this.setup();

        // Binding required when passing functions as parameters
        // see https://eliux.github.io/javascript/common-errors/why-this-gets-undefined-inside-methods-in-javascript/
        this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Stops this animation
     */
    stop(){
        cancelAnimationFrame(this.requestAnimationFrameID);
        this.requestAnimationFrameID = undefined;
        gl.useProgram(null);
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
        this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }
}