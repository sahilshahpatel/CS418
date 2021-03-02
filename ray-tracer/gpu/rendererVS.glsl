#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec3 aVertexPosition;

out vec2 textureCoord;

void main(void){
    gl_Position = vec4(aVertexPosition, 1.0);

    // Map [-1, 1] UVs to [0, 1] texture coords
    textureCoord = aVertexPosition.xy * 0.5 + 0.5;
}