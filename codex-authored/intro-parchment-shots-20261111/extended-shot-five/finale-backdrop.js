'use strict';

function makeFinaleBackdrop(plate, gate, {w,h,canvas}) {
  const surface=document.createElement('canvas');
  surface.width=w;surface.height=h;
  const gl=surface.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if (!gl) throw Error('The finale background compositor needs WebGL.');
  const matte=canvas();
  matte.filter='blur(38px)';
  matte.fill(gate);

  function compile(type, code) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,code);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program=gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,
    'attribute vec2 pos; void main(){gl_Position=vec4(pos,0.0,1.0);}'));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`
    precision highp float;
    uniform vec2 size;
    uniform vec3 offset;
    uniform sampler2D plate;
    uniform sampler2D matte;

    float depthShift(vec2 pixel){
      float sky = 1.0 - smoothstep(205.0,449.0,pixel.y);
      float gate = texture2D(matte,clamp(pixel/size,0.0,1.0)).a;
      float near = smoothstep(531.0,773.0,pixel.y);
      return mix(sky*offset.x,offset.y,gate) + near*offset.z;
    }
    void main(){
      vec2 pixel=vec2(gl_FragCoord.x,size.y-gl_FragCoord.y);
      vec2 origin=pixel;
      // Solve for the source position across the feathered boundaries.
      // Sampling the plate once keeps overlapping stone contours out of the seam.
      for(int step=0;step<5;step++) origin.x=pixel.x-depthShift(origin);
      float reflected=size.x-abs(size.x-abs(origin.x));
      gl_FragColor=texture2D(plate,vec2(reflected,origin.y)/size);
    }
  `));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.viewport(0,0,w,h);

  const vertices=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'pos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const shift=gl.getUniformLocation(program,'offset');
  gl.uniform2f(gl.getUniformLocation(program,'size'),w,h);
  for(const [i,name,image] of [[0,'plate',plate],[1,'matte',matte.canvas]]){
    gl.activeTexture(gl.TEXTURE0+i);
    gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.uniform1i(gl.getUniformLocation(program,name),i);
  }
  return function draw(ctx, parallax) {
    gl.uniform3f(shift,parallax.sky,parallax.gate,parallax.near);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    ctx.drawImage(surface,0,0);
  };
}
