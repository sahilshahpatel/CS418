/**
 * @file Terrain.js - A simple 3D terrain model for WebGL
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP2 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 * 
 * You'll need to implement the following functions:
 * setVertex(v, i) - convenient vertex access for 1-D array
 * getVertex(v, i) - convenient vertex access for 1-D array
 * generateTriangles() - generate a flat grid of triangles
 * shapeTerrain() - shape the grid into more interesting terrain
 * calculateNormals() - calculate normals after warping terrain
 * 
 * Good luck! Come to office hours if you get stuck!
 */

class Terrain {   
    /**
     * Initializes the members of the Terrain object.
     * @param {number} div Number of triangles along the x-axis and y-axis.
     * @param {number} minX Minimum X coordinate value.
     * @param {number} maxX Maximum X coordinate value.
     * @param {number} minY Minimum Y coordinate value.
     * @param {number} maxY Maximum Y coordinate value.
     */
    constructor(div, minX, maxX, minY, maxY) {
        this.div = div;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        
        // Allocate the vertex array
        this.positionData = [];
        // Allocate the normal array.
        this.normalData = [];
        // Allocate the triangle array.
        this.faceData = [];
        // Allocate an array for edges so we can draw a wireframe.
        this.edgeData = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        this.shapeTerrain();
        console.log("Terrain: Sculpted terrain");

        this.calculateNormals();
        console.log("Terrain: Generated normals");

        // You can use this function for debugging your buffers:
        // this.printBuffers();
    }
    

    //-------------------------------------------------------------------------
    // Vertex access and triangle generation - your code goes here!
    /**
     * Set the x,y,z coords of the ith vertex
     * @param {Object} v An array of length 3 holding the x,y,z coordinates.
     * @param {number} i The index of the vertex to set.
     */
    setVertex(v, i) {
        i *= 3;
        this.positionData[i] = v[0];
        this.positionData[i+1] = v[1];
        this.positionData[i+2] = v[2];
    }
    

    /**
     * Returns the x,y,z coords of the ith vertex.
     * @param {Object} v An array of length 3 to hold the x,y,z coordinates.
     * @param {number} i The index of the vertex to get.
     */
    getVertex(v, i) {
        i *= 3;
        v[0] = this.positionData[i];
        v[1] = this.positionData[i+1];
        v[2] = this.positionData[i+2];
    }


    /**
     * Generates the vertex and face data for the terrain based
     * on this class' fields (constructor arguments)
     */    
    generateTriangles() {
        /* Set up vertices */
        let  dx = (this.maxX-this.minX)/this.div;
        let dy = (this.maxY-this.minY)/this.div;
        for(let i = 0; i <= this.div; i++){
            let y = this.minY + dy*i;
            for(let j = 0; j <= this.div; j++){ 
                let x = this.minX + dx*j;
                this.positionData.push(x);
                this.positionData.push(y);
                this.positionData.push(0);
            }
        }

        /* Set up faces */
        for(let i = 0; i < this.div; i++){
            for(let j = 0; j < this.div; j++){
                let bottomLeft = i*(this.div+1) + j;
                let bottomRight = bottomLeft + 1;
                let topLeft = bottomLeft + this.div + 1;
                let topRight = topLeft + 1;

                this.faceData.push(bottomLeft);
                this.faceData.push(bottomRight);
                this.faceData.push(topLeft);

                this.faceData.push(bottomRight);
                this.faceData.push(topRight);
                this.faceData.push(topLeft);
            }
        }

        // We'll need these to set up the WebGL buffers.
        this.numVertices = this.positionData.length/3;
        this.numFaces = this.faceData.length/3;
    }


    /**
     * Applies the faulting method on this terrain's vertices
     */
    shapeTerrain() {
        const iterations = 100;
        const initialDelta = 0.005;
        const deltaDropoff = 1; // Math.pow(2, 0.5);

        // Set full range to be the whole terrain for now
        let dx = this.maxX - this.minX;
        let dy = this.maxY - this.minY;
        const range = Math.sqrt(dx*dx + dy*dy);
        
        let delta = initialDelta;
        for(let i = 0; i < iterations; i++){
            /* Generate random point in terrain */
            let x = Math.random()*(this.maxX - this.minX) + this.minX;
            let y = Math.random()*(this.maxY - this.minY) + this.minY;
            let p = glMatrix.vec2.fromValues(x, y);
            
            /* Generate random normal vector */
            let n = glMatrix.vec2.create();
            glMatrix.vec2.random(n);

            /* Update vertices based on which side of the plane they are on */
            for(let j = 0; j < this.numVertices; j++){
                let v = glMatrix.vec3.create();
                this.getVertex(v, j);

                let d = glMatrix.vec2.create();
                glMatrix.vec2.sub(d, v, p);
                let dist = glMatrix.vec2.length(d);

                if(dist < range){
                    // Modifier determines if we lift or sink this vertex
                    let modifier = Math.sign(glMatrix.vec2.dot(d, n));

                    let ratio = dist/range;
                    let sigmoid = 1 - ratio*ratio;
                    sigmoid *= sigmoid;

                    v[2] += modifier * delta * sigmoid;
                    this.setVertex(v, j);
                }
            }

            delta /= deltaDropoff;
        }
    }


    /**
     * Calculates the normal vector for each vertex using
     * triangle area-weighted averaging
     */
    calculateNormals() {
        // Calculate normals on all faces
        let fnormals = [];
        let v1 = glMatrix.vec3.create();
        let v2 = glMatrix.vec3.create();
        let v3 = glMatrix.vec3.create();
        for(let i = 0; i < this.numFaces; i++){
            let f = i*3;
            this.getVertex(v1, this.faceData[f]);
            this.getVertex(v2, this.faceData[f+1]);
            this.getVertex(v3, this.faceData[f+2]);

            glMatrix.vec3.sub(v1, v2, v1);
            glMatrix.vec3.sub(v2, v3, v2);

            let n = glMatrix.vec3.create();
            glMatrix.vec3.cross(n, v1, v2);

            // TODO: I don't quite understand the difference between
            //  triangle and parallelogram area weighting since this
            //  1/2 factor should end up canceling when I normalize later...
            glMatrix.vec3.scale(n, n, 0.5);
            
            fnormals.push(n);
        }
        
        // Interpolate normals for each vertex
        for(let y = 0; y <= this.div; y++){
            for(let x = 0; x <= this.div; x++){                
                let v = 2*(y*(this.div+1) + x); // Index of upper right face
                let v_b = v - 2*this.div; // Index of bottom right-left face

                let faces = [];

                // Upper right
                if(x < this.div && y < this.div){
                    faces.push(v);
                }

                // Upper left
                if(x > 0 && y < this.div) {
                    faces.push(v-1);
                    faces.push(v-2);
                }

                // Bottom right
                if(x < this.div && y > 0){
                    faces.push(v_b + 1);
                    faces.push(v_b);
                }

                // Bottom left
                if(x > 0 && y > 0){
                    faces.push(v_b - 1);
                }

                let n = glMatrix.vec3.create();
                for(let f in faces){
                    glMatrix.vec3.add(n, n, fnormals[f]);
                }
                glMatrix.vec3.normalize(n, n);

                this.normalData.push(n[0]);
                this.normalData.push(n[1]);
                this.normalData.push(n[2]);
            }
        }
    }


    //-------------------------------------------------------------------------
    // Setup code (run once)
    /**
     * Generates line data from the faces in faceData for wireframe rendering.
     */
    generateLines() {
        for (let f = 0; f < this.faceData.length; f+=3) {
            // Calculate index of the face
            this.edgeData.push(this.faceData[f]);
            this.edgeData.push(this.faceData[f+1]);
            
            this.edgeData.push(this.faceData[f+1]);
            this.edgeData.push(this.faceData[f+2]);
            
            this.edgeData.push(this.faceData[f+2]);
            this.edgeData.push(this.faceData[f]);
        }
    }


    /**
     * Sets up the WebGL buffers and vertex array object.
     * @param {object} shaderProgram The shader program to link the buffers to.
     */
    setupBuffers(shaderProgram) {
        // Create and bind the vertex array object.
        this.vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayObject);

        // Create the position buffer and load it with the position data.
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionData),
                      gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexPositionBuffer.numItems, " vertices.");

        // Link the position buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexPosition,
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexPosition);
    
        // Specify normals to be able to do lighting calculations
        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData),
                      gl.STATIC_DRAW);
        this.vertexNormalBuffer.itemSize = 3;
        this.vertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexNormalBuffer.numItems, " normals.");

        // Link the normal buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexNormal,
                               this.vertexNormalBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexNormal);
    
        // Set up the buffer of indices that tells WebGL which vertices are
        // part of which triangles.
        this.triangleIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.faceData),
                      gl.STATIC_DRAW);
        this.triangleIndexBuffer.itemSize = 1;
        this.triangleIndexBuffer.numItems = this.faceData.length;
        console.log("Loaded ", this.triangleIndexBuffer.numItems, " triangles.");
    
        // Set up the index buffer for drawing edges.
        this.edgeIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.edgeData),
                      gl.STATIC_DRAW);
        this.edgeIndexBuffer.itemSize = 1;
        this.edgeIndexBuffer.numItems = this.edgeData.length;
        
        // Unbind everything; we want to bind the correct element buffer and
        // VAO when we want to draw stuff
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    

    //-------------------------------------------------------------------------
    // Rendering functions (run every frame in draw())
    /**
     * Renders the terrain to the screen as triangles.
     */
    drawTriangles() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.triangleIndexBuffer.numItems,
                        gl.UNSIGNED_INT, 0);
    }
    

    /**
     * Renders the terrain to the screen as edges, wireframe style.
     */
    drawEdges() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.drawElements(gl.LINES, this.edgeIndexBuffer.numItems,
                        gl.UNSIGNED_INT, 0);   
    }


    //-------------------------------------------------------------------------
    // Debugging
    /**
     * Prints the contents of the buffers to the console for debugging.
     */
    printBuffers() {
        for (var i = 0; i < this.numVertices; i++) {
            console.log("v ", this.positionData[i*3], " ", 
                              this.positionData[i*3 + 1], " ",
                              this.positionData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numVertices; i++) {
            console.log("n ", this.normalData[i*3], " ", 
                              this.normalData[i*3 + 1], " ",
                              this.normalData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numFaces; i++) {
            console.log("f ", this.faceData[i*3], " ", 
                              this.faceData[i*3 + 1], " ",
                              this.faceData[i*3 + 2], " ");
        }  
    }

} // class Terrain