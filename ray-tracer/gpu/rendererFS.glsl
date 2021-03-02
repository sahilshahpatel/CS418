#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uTexture;
in vec2 textureCoord;
out vec4 fragColor;

void main(void){
    fragColor = texture(uTexture, textureCoord); 
}