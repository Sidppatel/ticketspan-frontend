import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec3 u_green;
uniform vec3 u_gold;
vec3 hash3(vec2 p){ vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9))); return fract(sin(q)*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  float a=hash3(i).x,b=hash3(i+vec2(1,0)).x,c=hash3(i+vec2(0,1)).x,d=hash3(i+vec2(1,1)).x;
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){ float v=0.0,amp=0.5; for(int i=0;i<5;i++){ v+=amp*noise(p); p*=2.03; amp*=0.5; } return v; }
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy; vec2 p=uv; p.y-=0.15;
  float t=u_time*0.06;
  float flow=fbm(vec2(p.x*2.2+t, p.y*3.0 - t*1.4));
  float band=smoothstep(0.15,0.85, p.y + flow*0.55 - 0.25);
  float aur=fbm(vec2(p.x*3.0 - t*1.2, p.y*1.5))*band;
  vec3 green=u_green; vec3 gold=u_gold; vec3 deep=u_green*0.16;
  vec3 col=deep;
  col=mix(col, green, smoothstep(0.0,0.7,aur));
  col=mix(col, gold, smoothstep(0.55,1.0,aur)*0.9);
  float m=distance(uv,u_mouse); col+=gold*0.10*smoothstep(0.5,0.0,m);
  col+=green*0.06;
  gl_FragColor=vec4(col,1.0);
}`;

function hexToRgb(raw: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function brandColors(): { green: [number, number, number]; gold: [number, number, number] } {
  const cs = getComputedStyle(document.documentElement);
  const green = hexToRgb(cs.getPropertyValue('--brand')) ?? [0.122, 0.239, 0.169];
  const gold =
    hexToRgb(cs.getPropertyValue('--accent-gold')) ??
    hexToRgb(cs.getPropertyValue('--voltage-accent')) ?? [0.976, 0.659, 0.145];
  return { green, gold };
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function AuroraBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, powerPreference: 'low-power' });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const { green, gold } = brandColors();
    gl.uniform3f(gl.getUniformLocation(prog, 'u_green'), green[0], green[1], green[2]);
    gl.uniform3f(gl.getUniformLocation(prog, 'u_gold'), gold[0], gold[1], gold[2]);
    const mouse = { x: 0.5, y: 0.6 };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = 1 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener('pointermove', onMove);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const start = performance.now();
    const render = (now: number) => {
      gl.uniform1f(uTime, reduce ? 8 : (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
