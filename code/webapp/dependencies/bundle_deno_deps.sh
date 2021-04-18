#!/bin/sh
deno bundle deno_dependencies.ts > bundle.js
cp ~/Documents/projects/shader_canvas/build/shader_canvas.js .
