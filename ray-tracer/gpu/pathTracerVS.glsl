#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec3 aVertexPosition;

void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);
}