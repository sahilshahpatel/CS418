class Slinky extends WebGLAnimation{
    constructor(vertexShader, fragmentShader){
        super(vertexShader, fragmentShader);

        this.clear_color = [159/255, 215/255, 237/255, 1];

        this.step = 0.20;
        this.stairs = this.stairsVertices();
        this.slinky_color = [0.5, 0.5, 0.5, 1];
        this.stairs_color = [237/255, 228/255, 159/255, 1];
    }

    /**
     * Sets up WebGL for this animation's shaders and buffers
     */
    setup(){
        /* Setup shaders */
        super.setup();

        /* Setup Buffers */

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);

        let slinky = this.slinkyVertices(0);
        let vertices = slinky.concat(this.stairs);

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
        
        let colors = [];
        for(let i = 0; i < slinky.length/3; i++){
            colors.push(...this.slinky_color);
        }
        for(let i = 0; i < this.stairs.length/3; i++){
            colors.push(...this.stairs_color);
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
        const anim_period = 1;

        let t = (currentTime % anim_period) / anim_period;

        // Reset vertex position and color buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        let slinky = this.slinkyVertices(t);
        let stairs = this.stairsVertices();
        const vertices = slinky.concat(stairs);
        this.vertexPositionBuffer.numberOfItems = vertices.length / this.vertexPositionBuffer.itemSize;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        let colors = [];
        for(let i = 0; i < slinky.length/3; i++){
            colors.push(...this.slinky_color);
        }
        for(let i = 0; i < this.stairs.length/3; i++){
            colors.push(...this.stairs_color);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
        this.vertexColorBuffer.numItems = this.vertexPositionBuffer.numberOfItems;  

        glMatrix.mat4.fromTranslation(
            this.modelViewMatrix, [-this.step*t, this.step*t, 0]
        );
    }

    /**
     * Returns vertex set for slinky at time 0 <= t <= 1
     */
    slinkyVertices(t){
        const x = -this.step * 3/4;
        const r = this.step/2;
        const r_i = r/2;

        let arc = [];
        let box = [];

        let angle_0 = 0;
        let angle = 0;

        let y = 0;
        let box_height = 0;

        // Split into phases
        const curve_start = 0;
        const fall_start = 0.25;
        const uncurve_start = 0.5;
        const squish_start = 0.75;

        if(t <= fall_start){
            t = utime(t, curve_start, fall_start);

            angle_0 = Math.PI;
            angle = lerp(0, -Math.PI, t);
        }
        else if(t <= uncurve_start){
            t = utime(t, fall_start, uncurve_start);

            angle_0 = Math.PI;
            angle = -Math.PI;

            box_height = lerp(0, this.step, t);
        }
        else if(t <= squish_start){
            t = utime(t, uncurve_start, squish_start);

            angle_0 = 0;
            angle = lerp(Math.PI, 0, t);

            box_height = this.step;
        }
        else{
            t = utime(t, squish_start, 1);

            y = lerp(0, -this.step, t);
            box_height = lerp(this.step, 0, t);
        }

        const sections = 5*Math.abs(angle);
        arc = this.arcVertices(x + r + r_i, y, r_i, r+r_i, angle, angle_0, sections);
        box = this.boxVertices(x + 2*r_i + r, y, r, box_height);

        return arc.concat(box);
    }

    /**
     * Returns vertex set for stairs
     */
    stairsVertices(){
        let stairs = [];
        // Create two extra stairs to allow animation looping
        for(let i = 0; i < 2/this.step + 2; i++){
            let box = this.boxVertices(-1-this.step*i, -1+this.step*i, 2, this.step);
            stairs = stairs.concat(box);
        }
        
        return stairs;
    }

    /**
     * Returns vertex set for a box
     */
    boxVertices(x, y, width, height){
        return [
            x, y, 0,
            x+width, y, 0,
            x+width, y-height, 0,
            x+width, y-height, 0,
            x, y-height, 0,
            x, y, 0,
        ]
    }

    /**
     * Returns vertex set for a circle arc
     */
    arcVertices(x, y, r_i, r_o, angle, angle_0, sections){
        sections = Math.max(1, Math.ceil(sections));

        let vertices = [];

        let drad = angle/sections;
        let rad = angle_0;
        let rad2 = angle_0 + drad;

        for(let i = 0; i < sections; i++){
            let inner1 = this.arcPoint(x, y, r_i, rad);
            let inner2 = this.arcPoint(x, y, r_i, rad2);
            let outer1 = this.arcPoint(x, y, r_o, rad);
            let outer2 = this.arcPoint(x, y, r_o, rad2);

            rad += drad;
            rad2 += drad;

            vertices = vertices.concat(inner1, outer1, outer2, outer2, inner2, inner1);
        }

        return vertices;
    }

    /**
     * Returns point along arc
     */
    arcPoint(x, y, r, radians){
        return [
            r*Math.cos(radians) + x,
            r*Math.sin(radians) + y,
            0
        ]
    }
}