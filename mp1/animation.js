class Animation{
    constructor(){
        this._previousTime = 0;
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexColorBuffer = gl.createBuffer();
        this.modelViewMatrix = glMatrix.mat4.create();
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
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
                            false, modelViewMatrix);
        
        // Render the triangle. 
        gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
        
        // Unbind the vertex array object to be safe.
        gl.bindVertexArray(null);
    }

    /**
     * Animates the triangle by updating the ModelView matrix with a rotation
     * each frame.
     */
    animate(currentTime){}
}