// Curved image row, ported from the "Tilted Grid Hero" component (21st.dev, ruixen.ui) to plain JS.
// One row of images streams right to left round the inside of a cylinder: flat in the centre,
// curling toward the viewer at the ends, which fade into the page. Each tile is cut into SLICES
// vertical strips, each a facet of the cylinder; the tile (preserve-3d) is what moves, with one
// rotateY about the cylinder's axis. JS only sizes the loop and hands a tile its next image each
// time it wraps, out of sight.
const SLICES = 16;     // strips per tile
const CAMERA = 1.6;    // camera distance, as a multiple of the cylinder's radius
const MAX_WIDTH = 55;  // a tile is never wider than this share of the frame

// Cylinder radius, as a share of the frame's width, that puts the frame's edge `bend` radians round the arc.
const arc = (bend) => (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));

// The furthest any part of a tile may sit round the cylinder while it can be visible. The camera
// sits 1.6 radii out, so a strip past acos(1 - CAMERA) ≈ 127° crosses behind it and the browser
// projects it as a huge stretched slab (the flash seen as tiles wrap in at the right edge).
const MAX_EDGE = 115;
// Tile height cap, as a share of the frame's width, that keeps a tile's far edge inside MAX_EDGE.
const edgeCap = (bend, aspect) => (arc(bend) * Math.max(0, (MAX_EDGE * Math.PI) / 180 - bend)) / aspect;

function measure(width, height, tile, aspect, gap, bend) {
  const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect, width * edgeCap(bend, aspect));
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
}

let instance = 0;
export function curvedGallery(root, images, {
  speed = 4, tileHeight = 26, aspectRatio = 16 / 9, gap = 6, axis = 56, curve = 80, fade = 12,
} = {}) {
  if (!root || !images.length) return null;
  const id = ++instance;
  const orbit = `cg-o-${id}`, tileClass = `cg-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;
  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  // Must match the three caps in measure(): frame height, frame width, and the camera-edge limit.
  const u = (n) => `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw, ${+(100 * edgeCap(bend, aspectRatio)).toFixed(4)}cqw))`;
  const turn = (d) => `translateZ(${radius}) rotateY(${+d.toFixed(4)}deg) translateZ(-${radius})`;
  const share = aspectRatio / SLICES;

  root.style.containerType = 'size';
  const style = document.createElement('style');
  const band = document.createElement('div');
  band.className = 'curved-gallery-band';
  band.setAttribute('aria-hidden', 'true');
  Object.assign(band.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none', opacity: '0', transition: 'opacity .5s',
    perspective: `${+(r * CAMERA).toFixed(3)}cqw`, perspectiveOrigin: `50% ${axis}%`,
  });
  // Edge fades are plain 2D overlays in the page colour, not a mask on the band: Chrome's GPU path
  // does not reliably apply a mask to preserve-3d children, which left a hard cut at the frame edge.
  const fades = ['left', 'right'].map((side) => {
    const f = document.createElement('div');
    f.className = `curved-gallery-fade ${side}`;
    f.setAttribute('aria-hidden', 'true');
    f.style.width = `${fade}%`;
    return f;
  });
  root.append(style, band, ...fades);

  // Fetch and decode every image up front, so a tile's image swap never decodes on the main thread
  // while the row is moving. A tile picks its next one just before it comes back into view.
  const decoded = new Map();
  for (const src of images) {
    const image = new Image();
    image.src = src;
    decoded.set(src, image.decode().catch(() => {}));
  }

  let layout = null;
  const shown = {};
  function render() {
    const { columns, sweep, unit, limit } = layout;
    const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
    const duration = columns * speed;
    // Transform-only keyframes, so the browser runs the orbit on the compositor and main-thread work
    // can never stall it (a `visibility` step here forced it onto the main thread, which froze the row).
    // Out of sight, a tile is scaled to a point instead of hidden: same function list, so it interpolates.
    // Opacity is not used: on a preserve-3d tile it would flatten the curve.
    const at = (percent) => -sweep + (2 * sweep * percent) / 100;
    const frame = (percent, scale) => `${+percent.toFixed(4)}%{transform:${turn(at(percent))} scale(${scale})}`;
    style.textContent =
      `@keyframes ${orbit}{` +
      frame(0, 0.001) + frame(hide, 0.001) + frame(hide + 0.001, 1) +
      frame(100 - hide - 0.001, 1) + frame(100 - hide, 0.001) + frame(100, 0.001) + '}' +
      `@media(prefers-reduced-motion:reduce){.${tileClass}{animation-play-state:paused!important}}` +   // !important: the inline animation shorthand would otherwise win
      `.is-offscreen .${tileClass}{animation-play-state:paused!important}`;
    band.replaceChildren();
    for (let t = 0; t < columns; t++) {
      const first = columns - 1 - t;   // tiles numbered in the order they come on
      const tile = document.createElement('div');
      tile.className = tileClass;
      Object.assign(tile.style, {
        position: 'absolute', left: `calc(50% - ${u(aspectRatio / 2)})`, top: `calc(${axis}% - ${u(0.5)})`,
        width: u(aspectRatio), height: u(1), transformStyle: 'preserve-3d',
        animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
      });
      const imgs = [];
      for (let k = 0; k < SLICES; k++) {
        const strip = document.createElement('div');
        strip.className = 'curved-gallery-strip' + (k === 0 ? ' is-first' : '') + (k === SLICES - 1 ? ' is-last' : '');
        Object.assign(strip.style, {
          position: 'absolute', top: '0', overflow: 'hidden', left: u((aspectRatio - share) / 2),
          width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`, height: u(1),
          transform: turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
        });
        const img = document.createElement('img');
        img.alt = ''; img.draggable = false; img.decoding = 'async';
        Object.assign(img.style, { position: 'absolute', top: '0', maxWidth: 'none', objectFit: 'cover', left: u(-k * share), width: u(aspectRatio), height: u(1) });
        strip.append(img); tile.append(strip); imgs.push(img);
      }
      const show = (n) => {
        const src = images[n % images.length];
        const apply = () => { for (const img of imgs) if (img.getAttribute('src') !== src) img.src = src; };
        (decoded.get(src) || Promise.resolve()).then(apply);
      };
      show(shown[t] ?? first);
      tile.addEventListener('animationiteration', (e) => {
        const lap = Math.round(e.elapsedTime / duration);   // counts whole loops, missed events included
        shown[t] = lap * columns + first;
        show(shown[t]);
      });
      band.append(tile);
    }
    band.style.opacity = '1';
  }

  const ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
    if (layout && layout.columns === next.columns && layout.sweep === next.sweep && layout.unit === next.unit) return;
    layout = next;
    render();
    root.classList.add('is-curved');
  });
  ro.observe(root);
  // Pause the orbit while the gallery is offscreen; it resumes where it left off.
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => root.classList.toggle('is-offscreen', !entry.isIntersecting), { rootMargin: '100px 0px' })
    : null;
  io?.observe(root);
  return { destroy() { ro.disconnect(); io?.disconnect(); root.classList.remove('is-offscreen'); band.remove(); style.remove(); fades.forEach((f) => f.remove()); root.classList.remove('is-curved'); } };
}

const root = document.querySelector('[data-curved-gallery]');
if (root) {
  const images = [...root.querySelectorAll('.curved-gallery-fallback img')].map((img) => img.getAttribute('src'));
  curvedGallery(root, images, { speed: 4, tileHeight: 38, aspectRatio: 16 / 10, gap: 6, axis: 50, curve: 65, fade: 14 });
}
