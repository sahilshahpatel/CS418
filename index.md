## Sahil's CS 418 (Interactive Computer Graphics) Code Repository

In this repository you can find my code for all of my CS 418 Machine Problems. You can also find my [ray tracer](ray-tracer/gpu).

### Ray Tracer
I began the ray tracer in JavaScript, since CPU-based ray tracing is still the most common type. When it started to take quite a while for my basic scenes to render,
I decided to try GPU-based ray tracing instead. I opted to use only a fragment shader, following the likes of [MadeByEvan](http://madebyevan.com/webgl-path-tracing/). I started by recreating the functionality already present in the JS version (except for texturing), and then added some new features including triangle objects and a bounding volume hierarchy.

Points of Interest:
- Is completely fragment shader-based
- Re-renders as parameters are changed by the user
- Implements a Bounding Volume Hierarchy traversal in the fragment shader to speed up ray intersection checks

### MP1
In our [first MP](mp1/mp1.html) we learned about the basics of WebGL and created two animations using affine transforms and vertex buffer changes

### MP2
In our [second MP](mp2/MP2.html) we learned about terrain generation. We used the faulting method and a vertex shader-based color map.

### MP3
In our [third MP](mp3/mp3.html) we created a flight simulator to tour our generated terrain. To do this we learned about methods of tracking orientation including why Gimbal lock occurs when using Euler angles and how quaternions can solve the problem.

### MP4
In our [fourth MP](mp4/MP4.html) we learned texturing with the basic example of a brick texture on the Utah teapot.

### MP5
In our [final MP](mp5/MP5.html) we implemented a basic particle simulator. In the simulator particles bounce off the walls realistically, but they do not bounce off each other. We also used instancing to speed up performance.
