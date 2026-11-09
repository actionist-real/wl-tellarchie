// Hero background, modelled on a prism-light shader: a cone of light rising from the bottom
// centre with a sharp crease, a saturated lobe on one side and a cool pale lobe on the other,
// dust rising along the cone, heavy film grain and a dark vignette. Plain WebGL; without it
// the hero keeps a CSS gradient.
const hero = document.querySelector('#hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG = `
precision highp float;
uniform vec2 uRes;            // canvas size in device pixels
uniform float uTime, uCrease, uBloom, uDpr, uLight;
uniform vec4 uProtect;        // text area: centre xy and radii zw, device pixels
uniform vec3 uBg, uAccent, uGlow, uDeep, uSlate, uPale, uInk;

float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.03+17.1;a*=.5;}return v;}

void main(){
  vec2 px=gl_FragCoord.xy, uv=px/uRes;
  float asp=uRes.x/uRes.y, t=uTime;
  vec2 p=vec2((uv.x-.5)*asp,uv.y);                      // x centred, y from the bottom

  // The cone's apex sits below the bottom edge, just right of centre.
  vec2 apex=vec2(.06,-.42);
  // A slow, low-frequency warp makes the edges read as folded glass rather than geometry.
  vec2 w=p+.07*vec2(fbm(p*1.4+vec2(t*.045,0.))-.5,fbm(p*1.4+vec2(5.2,-t*.035))-.5);
  vec2 d=w-apex; float r=length(d);
  float ang=atan(d.x,d.y);                               // 0 points straight up; positive leans right
  float crease=.07+.035*sin(t*.21)+.02*sin(t*.37+1.3);   // the crease sways gently
  float a=ang-crease;                                    // negative: left lobe, positive: right lobe

  float open=mix(.04,1.,uBloom);                         // the lobes open outward on the intro
  float left =smoothstep(0.,.01,-a)*exp(-pow(-a/(.62*open),2.));
  float right=smoothstep(0.,.01, a)*exp(-pow( a/(.40*open),2.));
  // Brightest through the middle of the hero, fading toward the top and the very bottom.
  float env=smoothstep(.05,.55,r)*exp(-pow(max(r-.78,0.)/.5,2.));
  float lineW=mix(.02,.0055,uCrease);
  float line=exp(-pow(a/lineW,2.))*env*uCrease;          // the crease lights first
  float halo=exp(-pow(a/.07,2.))*env*uCrease;

  // Keep the headline, description and tagline readable.
  vec2 e=(px-uProtect.xy)/uProtect.zw;
  float guard=1.-.55*exp(-dot(e,e)*1.4);

  // Dust rising along the cone, densest near the lobes' bright edges.
  vec2 dir=d/max(r,1e-4);
  vec2 flow=px-dir*t*16.*uDpr;
  vec2 cell=floor(flow/uDpr);
  float dens=(left*exp(-pow(-a/.22,2.))+right*exp(-pow(a/.16,2.))*.8)*env*uBloom;
  dens*=.55+.45*noise(px/(uRes.y*.12)+vec2(0.,-t*.08));
  dens*=mix(.5,1.,smoothstep(480.,1100.,uRes.x/uDpr));
  float speck=step(1.-dens*.28,hash(cell+floor(t*6.)*.013))*(.35+.65*hash(cell*1.7+3.1));

  vec3 col=uBg;
  if(uLight<.5){
    // Left lobe: deep shade into Glow toward the crease. Right lobe: Primary slate, paler near the crease.
    vec3 lc=mix(uDeep,uGlow,exp(-pow(-a/.2,2.)));
    vec3 rc=mix(uSlate*.55,mix(uSlate,uPale,.35),exp(-pow(a/.14,2.)));
    col+=lc*left*env*uBloom*.62*guard;
    col+=rc*right*env*uBloom*.42*guard;
    col+=uGlow*halo*.22*guard;
    col+=mix(uAccent,vec3(1.),.45)*line*.75*guard;
    col+=mix(uGlow,uAccent,.5)*speck*.45*guard;
    // Vignette and a darker top, as in the reference.
    float vg=length((uv-vec2(.5,.32))*vec2(1.05,1.25));
    col*=mix(1.,.5,smoothstep(.45,1.05,vg));
    col=mix(col,uBg*.75,smoothstep(.7,1.,uv.y)*.55);
    col=mix(vec3(.0196),col,smoothstep(0.,.25,uCrease));  // starts on neutral #050505, the hero's holding colour
  } else {
    vec3 lc=mix(uPale,uGlow,exp(-pow(-a/.2,2.))*.35);
    vec3 rc=mix(vec3(.86,.9,.92),uSlate,exp(-pow(a/.14,2.))*.25);
    col=mix(col,lc,left*env*uBloom*.55*guard);
    col=mix(col,rc,right*env*uBloom*.45*guard);
    col=mix(col,uGlow,line*.55*guard+halo*.08*guard);
    col=mix(col,uInk,speck*.32*guard);
  }

  // Heavy film grain, refreshed at about 24 fps.
  float g=hash(px+floor(t*24.)*vec2(37.1,11.7))-.5;
  col+=g*(uLight<.5?.055:.028);

  // Blend into the page below the hero.
  col=mix(uBg,col,smoothstep(0.,.06,uv.y));
  gl_FragColor=vec4(col,1.);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const PALETTE = {
  dark: { bg: '#121212', accent: '#01EBFD', glow: '#01B9CF', deep: '#00626E', slate: '#5E707D', pale: '#9FF5FE', ink: '#01B9CF' },
  light: { bg: '#F6FAFB', accent: '#01EBFD', glow: '#01B9CF', deep: '#00626E', slate: '#5E707D', pale: '#BFEEF4', ink: '#00818F' },
};

function start() {
  if (!hero) return false;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-shader';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return false;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (error) { console.warn('Hero shader unavailable:', error.message); return false; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['uRes', 'uTime', 'uCrease', 'uBloom', 'uDpr', 'uLight', 'uProtect', 'uBg', 'uAccent', 'uGlow', 'uDeep', 'uSlate', 'uPale', 'uInk'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  hero.prepend(canvas);
  document.documentElement.classList.add('hero-shader-on');

  let dpr = 1, frame = 0, visible = true, lost = false;
  const started = performance.now();
  const theme = () => {
    const light = document.documentElement.classList.contains('light');
    const c = PALETTE[light ? 'light' : 'dark'];
    gl.uniform1f(u.uLight, light ? 1 : 0);
    for (const [key, name] of [['bg', 'uBg'], ['accent', 'uAccent'], ['glow', 'uGlow'], ['deep', 'uDeep'], ['slate', 'uSlate'], ['pale', 'uPale'], ['ink', 'uInk']]) gl.uniform3fv(u[name], hex(c[key]));
  };
  const layout = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    const box = hero.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uDpr, dpr);
    const toGl = (x, y) => [(x - box.left) * dpr, (box.bottom - y) * dpr];
    const top = hero.querySelector('.hero-title')?.getBoundingClientRect();
    const tag = hero.querySelector('.framer-1uqwldy')?.getBoundingClientRect() || top;
    if (top && tag) {
      const cx = top.left + top.width / 2, cy = (top.top + tag.bottom) / 2;
      gl.uniform4f(u.uProtect, ...toGl(cx, cy), Math.max(top.width, 320) * .62 * dpr, (tag.bottom - top.top) * .62 * dpr);
    } else gl.uniform4f(u.uProtect, -1e4, -1e4, 1, 1);
  };
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const draw = (now) => {
    const t = (now - started) / 1000;
    const still = reduce.matches;
    gl.uniform1f(u.uTime, still ? 4 : t + 4);
    gl.uniform1f(u.uCrease, still ? 1 : ease((t - .1) / .55));   // the crease lights first
    gl.uniform1f(u.uBloom, still ? 1 : ease((t - .3) / 1.3));    // then the lobes open
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (now) => { frame = requestAnimationFrame(loop); draw(now); };
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0;
    if (lost) return;
    if (reduce.matches) { draw(performance.now()); return; }
    if (visible && !document.hidden) frame = requestAnimationFrame(loop);
  };

  theme(); layout(); draw(performance.now()); sync();
  new MutationObserver(() => { theme(); if (!frame) draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(() => { layout(); if (!frame) draw(performance.now()); }).observe(hero);
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  // The headline settles after fonts load; refresh the protected text area then.
  document.fonts?.ready.then(() => { layout(); if (!frame) draw(performance.now()); });
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); lost = true; sync(); canvas.remove(); document.documentElement.classList.remove('hero-shader-on'); });
  return true;
}

export const heroShaderRunning = start();
// Release the hero from its holding frame: the shader is now drawing, or the CSS fallback takes over.
document.documentElement.classList.remove('hero-wait', 'hero-pending');
