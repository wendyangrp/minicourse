// Material explorer: draws a lit sphere and restyles it from the type, colour and roughness controls.
// The shading is a simplified version of what a renderer does, pixel by pixel:
// soft "diffuse" light, a sharp "specular" highlight, and reflections of a simple studio.

(function () {
  const root = document.getElementById('material-explorer');
  if (!root) return;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const colourInput = root.querySelector('#mx-colour');
  const roughnessInput = root.querySelector('#mx-roughness');
  const roughnessValue = root.querySelector('#mx-roughness-value');
  const typeInputs = root.querySelectorAll('input[name="mx-type"]');
  const description = root.querySelector('#mx-description');
  const presetButtons = root.querySelectorAll('[data-preset]');
  const STORAGE_KEY = 'materialExplorer';

  const presets = {
    'yellow-plastic': { type: 'plastic', colour: '#f2c230', roughness: 15 },
    'matte-rubber': { type: 'plastic', colour: '#2b2b2b', roughness: 90 },
    'polished-gold': { type: 'metal', colour: '#e8b84a', roughness: 8 },
    'brushed-aluminium': { type: 'metal', colour: '#c9ced4', roughness: 55 },
  };

  // ---- Settings: read, save and restore ----

  function current() {
    return {
      type: root.querySelector('input[name="mx-type"]:checked').value,
      colour: colourInput.value,
      roughness: Number(roughnessInput.value),
    };
  }

  function apply(settings) {
    typeInputs.forEach((input) => {
      input.checked = input.value === settings.type;
    });
    colourInput.value = settings.colour;
    roughnessInput.value = settings.roughness;
    update();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current()));
    } catch (e) {
      // Storage can be blocked (e.g. private browsing); the explorer still works for this visit.
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && /^#[0-9a-f]{6}$/i.test(saved.colour)) {
        return {
          type: saved.type === 'metal' ? 'metal' : 'plastic',
          colour: saved.colour,
          roughness: Math.min(100, Math.max(0, Number(saved.roughness) || 0)),
        };
      }
    } catch (e) {
      // Ignore unreadable or blocked storage.
    }
    return null;
  }

  // ---- Plain-language description of the current material ----

  function describe({ type, roughness }) {
    let surface;
    if (roughness < 20) surface = 'Smooth';
    else if (roughness < 60) surface = 'Slightly rough';
    else surface = 'Rough';

    if (type === 'metal') {
      if (roughness < 20) return `${surface} metal: sharp, mirror-like reflections of the room, tinted by the metal's colour.`;
      if (roughness < 60) return `${surface} metal, like brushed aluminium: the reflections are blurred into a soft sheen.`;
      return `${surface} metal: the reflections spread out so much the surface looks dull and satin.`;
    }
    if (roughness < 20) return `${surface}, glossy plastic: a small, bright highlight and faint reflections at the edges.`;
    if (roughness < 60) return `${surface} plastic: the highlight spreads out and softens.`;
    return `${surface}, matte plastic, like rubber: almost no highlight, just soft, even shading.`;
  }

  // ---- Drawing ----

  function hexToLinear(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2));
  }

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  const LIGHT = normalize([-0.5, 0.65, 0.6]); // a key light above and to the left
  const HALF = normalize([LIGHT[0], LIGHT[1], LIGHT[2] + 1]); // halfway between light and viewer

  // The "studio" the sphere reflects: a bright softbox up-left, a pale wall, and a darker floor.
  // Rougher surfaces blur it: the horizon softens and the softbox spreads out.
  function studio(rx, ry, rz, blur) {
    const width = 0.04 + blur * 0.7;
    const t = Math.min(1, Math.max(0, (ry + width) / (2 * width)));
    const horizon = t * t * (3 - 2 * t);
    // Walls brighten towards the ceiling and darken behind the camera.
    const wall = (0.3 + 0.55 * Math.max(0, ry)) * (0.55 + 0.45 * (0.5 + 0.5 * rz));
    const floor = 0.08 + 0.1 * (1 + Math.min(0, ry));
    let v = floor + (wall - floor) * horizon;
    const box = Math.max(0, rx * LIGHT[0] + ry * LIGHT[1] + rz * LIGHT[2]);
    v += (3 - 2.2 * blur) * Math.pow(box, 2 + 50 * (1 - blur));
    return v;
  }

  function draw() {
    const size = canvas.clientWidth || 280;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * ratio);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }

    const { type, colour, roughness } = current();
    const base = hexToLinear(colour);
    const r = roughness / 100;
    const metal = type === 'metal';
    const exponent = 4 + Math.pow(1 - r, 3) * 600;
    const specStrength = (metal ? 1.4 : 1.0) * (1 - 0.85 * r);
    const blur = Math.min(1, r * 1.3);

    const image = ctx.createImageData(px, px);
    const data = image.data;
    const radius = px * 0.4;
    const cx = px / 2;
    const cy = px * 0.46;

    for (let j = 0; j < px; j++) {
      for (let i = 0; i < px; i++) {
        const k = (j * px + i) * 4;
        const x = (i + 0.5 - cx) / radius;
        const y = -(j + 0.5 - cy) / radius;
        const d2 = x * x + y * y;
        let out;

        if (d2 > 1) {
          // Background: a soft studio backdrop with a shadow under the sphere.
          const t = j / px;
          let bg = 0.62 - 0.28 * t;
          const sx = (i + 0.5 - cx) / (radius * 1.1);
          const sy = (j + 0.5 - (cy + radius * 1.02)) / (radius * 0.18);
          const shadow = sx * sx + sy * sy;
          if (shadow < 1) bg *= 0.55 + 0.45 * shadow;
          out = [bg, bg, bg];
        } else {
          const z = Math.sqrt(1 - d2);
          const nDotL = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
          const nDotH = Math.max(0, x * HALF[0] + y * HALF[1] + z * HALF[2]);
          const spec = specStrength * Math.pow(nDotH, exponent);
          // Reflection direction of the view ray (the viewer looks along -z).
          const env = studio(2 * z * x, 2 * z * y, 2 * z * z - 1, blur);
          const fresnel = 0.04 + 0.96 * Math.pow(1 - z, 5);

          out = base.map((c) => {
            if (metal) {
              // Metals have almost no diffuse light: their colour comes from tinted reflections.
              // Rough metals also pick up broad, soft shading from the key light.
              return c * (0.05 + env * (0.95 - 0.45 * r) + 0.55 * r * nDotL) + spec * c;
            }
            const diffuse = c * (0.12 + 0.88 * nDotL);
            return diffuse + fresnel * env * (1 - r) * 0.6 + spec;
          });
        }

        for (let c = 0; c < 3; c++) {
          data[k + c] = Math.round(255 * Math.pow(Math.min(1, out[c]), 1 / 2.2));
        }
        data[k + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  // Redraw at most once per frame while a slider is being dragged.
  let pending = false;
  function update() {
    const settings = current();
    roughnessValue.textContent = settings.roughness;
    const text = describe(settings);
    description.textContent = text;
    canvas.setAttribute('aria-label', `Preview sphere. ${text}`);
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        draw();
      });
    }
  }

  function onChange() {
    update();
    save();
  }

  colourInput.addEventListener('input', onChange);
  roughnessInput.addEventListener('input', onChange);
  typeInputs.forEach((input) => input.addEventListener('change', onChange));
  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      apply(presets[button.dataset.preset]);
      save();
    });
  });

  // The canvas has no size while its lesson is hidden, so draw again when it's resized or shown.
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => update()).observe(canvas);
  } else {
    window.addEventListener('resize', update);
  }

  const saved = restore();
  if (saved) {
    apply(saved);
  } else {
    update();
  }
})();
