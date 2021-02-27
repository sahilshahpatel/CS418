class Renderer{
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

        /* Create shader attribtues */ 
        this.shaderProgram.vertexPositionAttribute =
            gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

        /* Create shader uniforms */
        this.shaderProgram.cameraPositionUniform = 
                gl.getUniformLocation(this.shaderProgram, "uCam.pos");
        this.shaderProgram.cameraLookAtUniform = 
                gl.getUniformLocation(this.shaderProgram, "uCam.lookAt");
        this.shaderProgram.cameraUpUniform = 
                gl.getUniformLocation(this.shaderProgram, "uCam.up");
        this.shaderProgram.viewportUniform = 
                gl.getUniformLocation(this.shaderProgram, "uViewport");
        this.shaderProgram.bounceLimitUniform = 
                gl.getUniformLocation(this.shaderProgram, "uBounceLimit");
        this.shaderProgram.detailUniform = 
                gl.getUniformLocation(this.shaderProgram, "uDetail");
        this.shaderProgram.seedUniform = 
                gl.getUniformLocation(this.shaderProgram, "uSeed");

        this.clearColor = [1, 0, 0, 1];
        this._previousTime = 0;
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexColorBuffer = gl.createBuffer();

        // Animation frame ID
        this.requestAnimationFrameID = undefined;
    }

    /**
     * Sets up WebGL for this animation's shaders and buffers
     */
    setup(){
        gl.clearColor(...this.clearColor);
        gl.useProgram(this.shaderProgram);
        gl.bindVertexArray(this.vertexArrayObject);

        // Enable each attribute we are using in the VAO.
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        /* Setup Buffers */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);

        // Define a basic quad
        const vertices = [
            -1, -1, 0,
            -1, +1, 0,
            +1, -1, 0,
            -1, +1, 0,
            +1, -1, 0,
            +1, +1, 0,
        ];

        // Populate the buffer with the position data.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numberOfItems = vertices.length / this.vertexPositionBuffer.itemSize;

        // Binds the buffer that we just made to the vertex position attribute.
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
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
        
        // Render the triangle. 
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.numberOfItems);
        
        // Unbind the vertex array object to be safe.
        gl.bindVertexArray(null);
    }

    animate(time){
        /* Set uniforms */
        gl.uniform3f(this.shaderProgram.cameraPositionUniform, 0, 0, -2);
        gl.uniform3f(this.shaderProgram.cameraLookAtUniform, 0, 0, 0);
        gl.uniform3f(this.shaderProgram.cameraUpUniform, 0, 1, 0);
        gl.uniform2f(this.shaderProgram.viewportUniform, gl.viewportWidth, gl.viewportHeight);    
        gl.uniform1i(this.shaderProgram.bounceLimitUniform, 5);
        gl.uniform1i(this.shaderProgram.detailUniform, 10);
        gl.uniform1f(this.shaderProgram.seedUniform, time);

        this.draw();
        // this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }

    start(){
        this.setup();
        this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }

    stop(){
        cancelAnimationFrame(this.requestAnimationFrameID);
        this.requestAnimationFrameID = undefined;
        gl.useProgram(null);
    }
}