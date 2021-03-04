class Renderer{
    constructor(pathTracer, camera){
        this.pathTracer = pathTracer;
        this.camera = camera;
        this.frameNum = 0;
        this.currFramebuffer = 0;
        this.requestAnimationFrameID = undefined;
    }

    init(){
        return new Promise( (resolve, reject) => {
            // Create shader program from path tracer sources
            Promise.all([this.pathTracer.getVertexShaderSource(), this.pathTracer.getFragmentShaderSource(), fetchText('rendererVS.glsl'), fetchText('rendererFS.glsl')])
            .then(([pathVSource, pathFSource, renderVSource, renderFSource]) => {
                let pathVS = loadShaderFromSource(pathVSource, "x-shader/x-vertex");
                let pathFS = loadShaderFromSource(pathFSource, "x-shader/x-fragment");

                this.createShaderProgram(pathVS, pathFS);
                if(!this.shaderProgram) reject();

                let renderVS = loadShaderFromSource(renderVSource, "x-shader/x-vertex");
                let renderFS = loadShaderFromSource(renderFSource, "x-shader/x-fragment");

                this.createRenderProgram(renderVS, renderFS);
                if(!this.renderProgram) reject();

                this.vertexArrayObject = gl.createVertexArray();
                gl.bindVertexArray(this.vertexArrayObject);

                gl.clearColor(1, 0, 0, 1);
                this.framebuffer = gl.createFramebuffer();

                // Create two textures to hold last frame and current frame (adopted from http://madebyevan.com/webgl-path-tracing/webgl-path-tracing.js)
                this.frameTextures = [];
                let ext = gl.getExtension("EXT_color_buffer_float");
                for(let i = 0; i < 2; i++){
                    this.frameTextures.push(gl.createTexture());
                    gl.bindTexture(gl.TEXTURE_2D, this.frameTextures[i]);

                    // See https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/glTexParameter.xhtml for details
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    
                    if(ext){
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.viewportWidth, gl.viewportHeight, 0, gl.RGBA, gl.FLOAT, null);
                    }
                    else{
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.viewportWidth, gl.viewportHeight, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
                    }
                }
                gl.bindTexture(gl.TEXTURE_2D, null);

                /* Set up vertex position buffer */
                this.vertexPositionBuffer = gl.createBuffer();
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

                resolve();
            });
        });
    }

    /**
     * Runs shader program to draw to texture
     */
    update(time){
        gl.useProgram(this.shaderProgram);
        gl.bindVertexArray(this.vertexArrayObject);

        // Enable each attribute we are using in the VAO.
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        // Binds the vertexPositionBuffer to the vertex position attribute.
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        /* Set uniforms */
        gl.uniform3fv(this.shaderProgram.cameraPositionUniform, this.camera.pos);
        gl.uniform3fv(this.shaderProgram.cameraLookAtUniform, this.camera.lookAt);
        gl.uniform3fv(this.shaderProgram.cameraUpUniform, this.camera.up);
        gl.uniform3fv(this.shaderProgram.cameraRightUniform, this.camera.right);
        gl.uniform1f(this.shaderProgram.cameraApertureUniform, this.camera.aperture);
        gl.uniform1f(this.shaderProgram.cameraZoomUniform, this.camera.zoom);
        gl.uniform2f(this.shaderProgram.viewportUniform, gl.viewportWidth, gl.viewportHeight);
        gl.uniform1i(this.shaderProgram.bounceLimitUniform, 5);
        gl.uniform1f(this.shaderProgram.seedUniform, time*1000);
        gl.uniform1f(this.shaderProgram.frameWeightUniform, this.frameNum / (this.frameNum + 1));

        // Transform the clip coordinates so the render fills the canvas dimensions.
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
        // Clear the screen.
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Use the vertex array object that we set up.
        gl.bindVertexArray(this.vertexArrayObject);

        // Send old frame
        gl.bindTexture(gl.TEXTURE_2D, this.frameTextures[this.currFramebuffer]);

        // Store new frame
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTextures[1 - this.currFramebuffer], 0);
        
        // Render the triangle. 
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.numberOfItems);
        
        // Unbind to be safe
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Switch frameTextures and update frameNum
        this.currFramebuffer = 1 - this.currFramebuffer;
        this.frameNum++;
    }

    render(){
        gl.useProgram(this.renderProgram);
        gl.bindVertexArray(this.vertexArrayObject);

        // Enable each attribute we are using in the VAO.
        gl.enableVertexAttribArray(this.renderProgram.vertexPositionAttribute);

        // Binds the buffers to the vertex position attribute.
        gl.vertexAttribPointer(this.renderProgram.vertexPositionAttribute, 
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        /* Set uniforms */
        gl.bindTexture(gl.TEXTURE_2D, this.frameTextures[this.currFramebuffer]);

        // Draw
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(this.vertexArrayObject);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.numberOfItems);
        
        // Unbind to be safe
        gl.bindVertexArray(null);
    }

    start(){
        this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }

    animate(time){
        this.update(time);
        this.render();
        this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }

    stop(){
        cancelAnimationFrame(this.requestAnimationFrameID);
        this.requestAnimationFrameID = undefined;
        gl.useProgram(null);
    }

    reset(){
        // Setting frameNum to 0 will make the uPreviousFrameWeight 0 which resets the shader
        this.frameNum = 0;
    }

    createShaderProgram(vertexShader, fragmentShader){
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
        this.shaderProgram.cameraRightUniform = 
                gl.getUniformLocation(this.shaderProgram, "uCam.right");
        this.shaderProgram.cameraApertureUniform = 
                gl.getUniformLocation(this.shaderProgram, "uCam.aperture");
        this.shaderProgram.cameraZoomUniform = 
                gl.getUniformLocation(this.shaderProgram, "uCam.zoom");
        this.shaderProgram.viewportUniform = 
                gl.getUniformLocation(this.shaderProgram, "uViewport");
        this.shaderProgram.bounceLimitUniform = 
                gl.getUniformLocation(this.shaderProgram, "uBounceLimit");
        this.shaderProgram.seedUniform = 
                gl.getUniformLocation(this.shaderProgram, "uSeed");
        this.shaderProgram.frameWeightUniform = 
                gl.getUniformLocation(this.shaderProgram, "uPreviousFrameWeight");
    }

    createRenderProgram(vertexShader, fragmentShader){
        // Link the shaders together into a program.
        this.renderProgram = gl.createProgram();
        gl.attachShader(this.renderProgram, vertexShader);
        gl.attachShader(this.renderProgram, fragmentShader);
        gl.linkProgram(this.renderProgram);

        if (!gl.getProgramParameter(this.renderProgram, gl.LINK_STATUS)) {
            alert("Failed to setup shaders");
        }

        /* Create shader attribtues */ 
        this.renderProgram.vertexPositionAttribute =
            gl.getAttribLocation(this.renderProgram, "aVertexPosition");
    }
}