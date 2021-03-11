class Renderer{
    constructor(pathTracer){
        this.pathTracer = pathTracer;

        this.seed = 0;
        this.frameNum = 0;
        this.currFramebuffer = 0;
        this.requestAnimationFrameID = undefined;
        this.frameTimes = [];

        // Naming conventions based on names in path tracer shader code
        this.uniforms = {
            uCam: {
                pos: {
                    location: undefined,
                    value: () => this.pathTracer.camera.pos,
                    set: gl.uniform3fv,
                },
                lookAt: {
                    location: undefined,
                    value: () => this.pathTracer.camera.lookAt,
                    set: gl.uniform3fv,
                },
                up: {
                    location: undefined,
                    value: () => this.pathTracer.camera.up,
                    set: gl.uniform3fv,
                },
                right: {
                    location: undefined,
                    value: () => this.pathTracer.camera.right,
                    set: gl.uniform3fv,
                },
                aperture: {
                    location: undefined,
                    value: () => this.pathTracer.camera.aperture,
                    set: gl.uniform1f,
                },                
            },

            uViewport: {
                location: undefined,
                value: () => glMatrix.vec2.fromValues(gl.viewportWidth, gl.viewportHeight),
                set: gl.uniform2fv,
            },

            uBounceLimit: {
                location: undefined,
                value: () => this.pathTracer.bounceLimit,
                set: gl.uniform1i,
            },

            uSeed: {
                location: undefined,
                value: () => this.seed,
                set: gl.uniform1f,
            },

            uPreviousFrameWeight: {
                location: undefined,
                value: () => this.frameNum / (this.frameNum + 1),
                set: gl.uniform1f,
            },

            uPreviousFrame: {
                location: undefined,
                value: () => 0,
                set: gl.uniform1i
            },

            uBVH: {
                location: undefined,
                value: () => 1,
                set: gl.uniform1i
            },

            uBVHSize: {
                location: undefined,
                value: () => [this.pathTracer.bvh.nodes, this.pathTracer.bvh.treeFields],
                set: gl.uniform2fv
            },

            uObjects: {
                location: undefined,
                value: () => 2,
                set: gl.uniform1i
            },

            uObjectsSize: {
                location: undefined,
                value: () => [this.pathTracer.bvh.objects.length, this.pathTracer.bvh.objFields],
                set: gl.uniform2fv
            }
        }
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
                if(!gl.getExtension("EXT_color_buffer_float")){
                    throw "Error: This requires EXT_color_buffer_float extension to work properly";
                }
                for(let i = 0; i < 2; i++){
                    this.frameTextures.push(gl.createTexture());
                    gl.activeTexture(gl.TEXTURE0 + this.uniforms.uPreviousFrame.value());
                    gl.bindTexture(gl.TEXTURE_2D, this.frameTextures[i]);

                    // See https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/glTexParameter.xhtml for details
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.viewportWidth, gl.viewportHeight, 0, gl.RGBA, gl.FLOAT, null);
                }

                // Create BVH texture
                this.BVHTexture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + this.uniforms.uBVH.value());
                gl.bindTexture(gl.TEXTURE_2D, this.BVHTexture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.pathTracer.bvh.nodes, this.pathTracer.bvh.treeFields,
                    0, gl.RGBA, gl.FLOAT, this.pathTracer.bvh.treeData);
                
                // Create Objects texture
                this.objectsTexture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + this.uniforms.uObjects.value());
                gl.bindTexture(gl.TEXTURE_2D, this.objectsTexture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.pathTracer.bvh.objects.length, this.pathTracer.bvh.objFields,
                    0, gl.RGBA, gl.FLOAT, this.pathTracer.bvh.objData);

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
        this.seed = time;

        gl.useProgram(this.shaderProgram);
        gl.bindVertexArray(this.vertexArrayObject);

        // Enable each attribute we are using in the VAO.
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        // Binds the vertexPositionBuffer to the vertex position attribute.
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.setUniforms(this.uniforms);
        
        // Transform the clip coordinates so the render fills the canvas dimensions.
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
        // Clear the screen.
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Use the vertex array object that we set up.
        gl.bindVertexArray(this.vertexArrayObject);

        // Send textures (previous frame, BVH)
        gl.activeTexture(gl.TEXTURE0 + this.uniforms.uPreviousFrame.value());
        gl.bindTexture(gl.TEXTURE_2D, this.frameTextures[this.currFramebuffer]);

        gl.activeTexture(gl.TEXTURE0 + this.uniforms.uBVH.value());
        gl.bindTexture(gl.TEXTURE_2D, this.BVHTexture);

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
        this.frameTimes = [];
        this.requestAnimationFrameID = requestAnimationFrame(this.animate.bind(this));
    }

    animate(time){
        // Get moving average FPS and update list
        this.frameTimes.push(time);
        this.frameTimes = this.frameTimes.slice(-50);
        let fps = this.frameTimes.length == 1 ? 0 : 1000 * this.frameTimes.length / (this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0]);
        document.getElementById('fps').innerHTML = fps.toFixed(1);

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
        this.frameTimes = [];
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
        this.initUniforms(this.uniforms, this.shaderProgram);
    }

    setUniforms(uniforms){
        for(const [name, uniform] of Object.entries(uniforms)){
            let keys = Object.keys(uniform);
            if(keys.includes('location'), keys.includes('value'), keys.includes('set')){
                // This is a uniform, add it
                uniform.set.call(gl, uniform.location, uniform.value());
            } else {
                // This is not yet a uniform (might be struct), recurse
                this.setUniforms(uniform);
            }
        }
    }

    initUniforms(uniforms, program, prefix = ''){
        for(const [name, uniform] of Object.entries(uniforms)){
            let keys = Object.keys(uniform);
            if(keys.includes('location'), keys.includes('value'), keys.includes('set')){
                // This is a uniform, set it's location
                uniform.location = gl.getUniformLocation(program, prefix + name);
            } else {
                // This is not yet a uniform (might be struct), recurse
                this.initUniforms(uniform, program, prefix + name + '.');
            }
        }
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