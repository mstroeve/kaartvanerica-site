// How a building looks: its colors, and the windows, doors and roof tiles painted on its faces.
// Shared by the renderer (render/scene.js) and by the viewer, where people give their own house its real colors
// and see it change. Both hand in their own copy of three.js.

export const SUN_AZIMUTH = 250; // keep in sync with scripts/sun.py
export const SUN_ELEVATION = 40;
export const TYPES = { house: 0, barn: 1, shed: 2, greenhouse: 3, tank: 4, silo: 5, canopy: 6, church: 7, tower: 8, turret: 9, school: 10, mast: 11, cross: 12, annex: 13 };

// What people can choose from for their own house (the viewer shows these as swatches), as [name, r, g, b].
export const CHOICES = {
  wall: [
    ['Rode baksteen', 150, 74, 54], ['Donkerrode baksteen', 118, 58, 44], ['Oranjerode baksteen', 176, 104, 74], ['Bruine baksteen', 112, 72, 56],
    ['Donkerbruine baksteen', 84, 64, 52], ['Gele baksteen', 200, 172, 132], ['Zandkleurige baksteen', 214, 196, 160], ['Beige-witte baksteen', 224, 214, 196], ['Grijze baksteen', 132, 128, 122],
    ['Antraciet', 70, 72, 76], ['Wit gestuukt', 232, 228, 218], ['Crème gestuukt', 226, 214, 186], ['Zwart hout', 50, 50, 52],
    ['Bruin hout', 104, 76, 54], ['Groen hout', 74, 98, 78],
  ],
  roof: [
    ['Oranje pannen', 176, 84, 58], ['Rode pannen', 140, 64, 50], ['Donkerrode pannen', 108, 56, 46], ['Bruine pannen', 120, 92, 70],
    ['Antraciet pannen', 66, 68, 74], ['Zwarte pannen', 44, 48, 56], ['Grijze pannen', 88, 90, 96], ['Lichtgrijs', 150, 150, 146],
    ['Riet', 150, 128, 88], ['Groen', 98, 114, 98],
  ],
  frame: [
    ['Wit', 238, 236, 228], ['Crème', 226, 214, 186], ['Antraciet', 58, 60, 64], ['Zwart', 34, 34, 36], ['Bruin', 88, 62, 48],
    ['Donkergroen', 44, 74, 56], ['Donkerblauw', 44, 58, 92], ['Grijs', 150, 150, 146],
  ],
  door: [
    ['Wit', 238, 236, 228], ['Antraciet', 58, 60, 64], ['Zwart', 34, 34, 36], ['Bruin', 96, 64, 44], ['Donkergroen', 44, 78, 58],
    ['Donkerblauw', 44, 60, 100], ['Rood', 140, 44, 38], ['Geel', 214, 170, 60], ['Lichtblauw', 120, 160, 190], ['Eikenhout', 164, 122, 78],
  ],
};

export default function facade(THREE) {
  const rgb = (r, g, b) => new THREE.Color(r / 255, g / 255, b / 255);
  const hash = (x) => {
    const s = Math.sin(x * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };

  const WALLS_BARN = [
    [rgb(108, 122, 104), 3], [rgb(78, 96, 80), 2], [rgb(150, 146, 132), 2], [rgb(120, 70, 54), 2], [rgb(96, 102, 108), 2],
  ];
  // A shed that stands on its own in a garden: stained or painted wood, now and then brick.
  const WALLS_SHED = [
    [rgb(96, 72, 54), 3], [rgb(58, 56, 56), 3], [rgb(74, 94, 78), 2], [rgb(132, 126, 114), 1], [rgb(128, 72, 54), 2],
  ];
  // Roof colors snap to this palette after a little contrast from the aerial sample.
  const ROOFS = [
    rgb(176, 84, 58), rgb(140, 64, 50), rgb(108, 56, 46), rgb(66, 68, 74), rgb(88, 90, 96), rgb(120, 122, 124),
    rgb(150, 150, 146), rgb(184, 182, 176), rgb(120, 92, 70), rgb(98, 114, 98), rgb(214, 214, 206), rgb(44, 48, 56),
  ];
  const DOORS = [rgb(44, 78, 58), rgb(44, 60, 100), rgb(238, 236, 228), rgb(96, 64, 44), rgb(140, 44, 38), rgb(58, 60, 64), rgb(238, 236, 228), rgb(96, 64, 44)];

  // Facades by construction year (BAG): the brick of a peat-colony village, mostly red and brown, and the color of
  // the window frames that went with it.
  const ERAS = [
    [1945, [[rgb(138, 68, 50), 4], [rgb(118, 58, 44), 3], [rgb(158, 90, 64), 2], [rgb(226, 220, 206), 0.5]], rgb(236, 234, 226)],
    [1970, [[rgb(160, 88, 62), 4], [rgb(176, 106, 74), 3], [rgb(140, 78, 58), 2], [rgb(200, 172, 132), 1]], rgb(232, 230, 222)],
    [1995, [[rgb(112, 72, 56), 3], [rgb(128, 84, 62), 3], [rgb(150, 80, 58), 3], [rgb(196, 170, 128), 1.5]], rgb(228, 224, 214)],
    [9999, [[rgb(150, 80, 60), 4], [rgb(128, 84, 62), 2], [rgb(176, 104, 74), 1.5], [rgb(112, 108, 104), 1], [rgb(226, 222, 212), 1], [rgb(84, 64, 52), 1]], rgb(236, 234, 226)],
  ];
  const era = (m) => ERAS.find(([until]) => (m.year || 1985) < until);

  function pickWeighted(list, r) {
    const total = list.reduce((s, [, w]) => s + w, 0);
    let t = r * total;
    for (const [c, w] of list) if ((t -= w) <= 0) return c;
    return list[0][0];
  }

  function nearestRoof(c) {
    let best = ROOFS[0], bd = Infinity;
    for (const p of ROOFS) {
      const d = (p.r - c.r) ** 2 * 0.9 + (p.g - c.g) ** 2 * 1.2 + (p.b - c.b) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  // The colors of a building. get(b) gives the building with that index: a shed built onto a house looks like it.
  const house = (m, get) => (m.kind === 'shed' && m.like != null && get(m.like)) || null;

  function wallColor(m, get) {
    if (m.wall_fixed) return rgb(...m.wall_fixed);
    if (m.kind === 'tank') return [rgb(74, 98, 82), rgb(150, 150, 140), rgb(64, 72, 80)][Math.floor(m.rand * 3)];
    if (m.kind === 'silo') return rgb(196, 198, 192);
    if (m.kind === 'barn') return pickWeighted(WALLS_BARN, m.rand);
    if (m.kind === 'shed') {
      const h = house(m, get);
      return h ? wallColor(h, get) : pickWeighted((m.area ?? 20) < 70 ? WALLS_SHED : WALLS_BARN, m.rand);
    }
    return pickWeighted(era(m)[1], m.tone ?? m.rand);
  }

  function roofColor(m) {
    if (m.roof_fixed) return rgb(...m.roof_fixed);
    if (!m.roof_rgb) return ROOFS[4];
    const c = rgb(...m.roof_rgb);
    // Push saturation up a bit: the photo is hazy, pixel art is not.
    const hsl = {};
    c.getHSL(hsl);
    c.setHSL(hsl.h, Math.min(1, hsl.s * 1.5), hsl.l);
    return nearestRoof(c);
  }

  function frameColor(m, get) {
    if (m.frame_fixed) return rgb(...m.frame_fixed);
    if (m.kind === 'school') return rgb(176, 40, 34);
    const h = house(m, get);
    return h ? frameColor(h, get) : era(m)[2];
  }

  function doorColor(m, get) {
    if (m.door_fixed) return rgb(...m.door_fixed);
    if (m.kind === 'shed') {
      const h = house(m, get);
      return h ? frameColor(h, get) : wallColor(m, get).clone().multiplyScalar(0.72);
    }
    return DOORS[Math.floor(hash((m.rand ?? 0.5) * 91.7) * DOORS.length) % DOORS.length];
  }

  const typeOf = (m, get) => (house(m, get) ? TYPES.annex : TYPES[m.kind] ?? 0);
  const WINDOWS = { few: 0, many: 2 };
  const axisOf = (m) => (m.kind === 'greenhouse' ? m.axis : m.kind === 'house' ? (m.rows ?? 2) * 10 + (WINDOWS[m.windows] ?? 1) : (m.param ?? m.axis ?? 0));

  const vertex = `
attribute vec2 aUv;
attribute float aKind;
attribute float aType;
attribute float aAxis;
attribute vec3 aFrame;
attribute vec3 aDoor;
attribute vec2 aAtlas;
attribute vec4 aWall;
attribute vec3 aIdColor;
varying vec3 vIdColor;
varying vec3 vFrame;
varying vec3 vDoor;
varying vec2 vAtlas;
varying vec4 vWall;
varying vec2 vUv2;
varying float vKind;
varying float vType;
varying float vAxis;
varying vec3 vWorld;
varying vec3 vWorldNormal;
`;

  const fragment = `
varying vec2 vUv2;
varying float vKind;
varying float vType;
varying float vAxis;
varying vec3 vWorld;
varying vec3 vWorldNormal;
varying vec3 vFrame;
varying vec3 vDoor;
varying vec2 vAtlas;
varying vec4 vWall;
varying vec3 vIdColor;
uniform sampler2D roofAtlas;
// Peeling (render/scene.js): frontId holds, per pixel, the number of the building that stands in front there. With
// peel on, that building is left out, so what stands behind it shows.
uniform sampler2D frontId;
uniform vec2 frontSize;
uniform float peel;

const vec3 GLASS = vec3(0.24, 0.31, 0.4);

// A house wall. u runs from -half to +half along the wall, y is the height above the ground. The windows stand in
// bays that divide the wall evenly, one row per storey that fits under the eaves; a gable gets a window in its top.
vec3 houseWall(vec3 c) {
  float u = vUv2.x, y = vUv2.y;
  float half_ = vWall.x, eave = vWall.y, top = vWall.z;
  bool front = vWall.w > 0.5 && vWall.w < 1.5;
  float w = 2.0 * half_;
  bool gable = top - eave > 1.2;
  // vAxis of a house: its rows of windows times ten, plus how many windows a row has (0 few, 1 usual, 2 many).
  float rows = floor(vAxis / 10.0 + 0.01), many = vAxis - rows * 10.0;
  float n = floor((w - 0.4) / (many < 0.5 ? 4.8 : (many > 1.5 ? 2.6 : 3.6)));
  if (w >= 2.2) n = max(n, 1.0);
  if (front && w >= 3.2) n = max(n, 2.0);
  if (gable && !front && n > 1.5) n = max(1.0, floor(n * 0.5));
  bool done = false;
  if (n > 0.5 && y <= eave) {
    float bw = w / n;
    float bay = clamp(floor((u + half_) / bw), 0.0, n - 1.0);
    float cu = u + half_ - (bay + 0.5) * bw;
    float f = floor(y / 2.8), fy = y - f * 2.8;
    if (front && f < 0.5 && abs(bay - floor(n * 0.5)) < 0.5) {
      // The front door, with a small pane in it.
      if (abs(cu) < 0.68 && y < 2.32) {
        c = vFrame;
        if (abs(cu) < 0.46 && y < 2.1) c = (y > 1.35 && y < 1.9 && abs(cu) < 0.26) ? GLASS : vDoor;
        done = true;
      }
    } else if (f < rows - 0.5 && f * 2.8 + 2.45 <= eave + 0.01) {
      // Downstairs a wide window, upstairs a smaller one.
      float hw = f < 0.5 ? min(1.15, bw * 0.36) : min(0.85, bw * 0.3);
      float y0 = f < 0.5 ? 0.7 : 0.9, y1 = 2.3;
      if (abs(cu) < hw && fy > y0 && fy < y1) {
        c = GLASS;
        if (cu - (fy - y0) < -hw * 0.55) c = GLASS + 0.07;
        if (abs(cu) > hw - 0.24 || fy > y1 - 0.22 || fy < y0 + 0.2) c = vFrame;
        
        done = true;
      } else if (abs(cu) < hw + 0.06 && fy > y0 - 0.12 && fy <= y0) {
        c = vec3(0.8, 0.78, 0.72);
        done = true;
      }
    }
  }
  if (gable && y > eave && top - eave > 2.6) {
    // The attic window, where the gable is still wide enough for it.
    float y0 = eave + 0.45, y1 = y0 + 1.0;
    float room = half_ * (top - y1) / (top - eave);
    if (room > 0.95 && abs(u) < 0.58 && y > y0 && y < y1) {
      c = (abs(u) > 0.34 || y > y1 - 0.2 || y < y0 + 0.2) ? vFrame : GLASS;
      done = true;
    }
  }
  if (!done && y < 0.35) c *= 0.72;
  return c;
}

// A door in a shed or garage wall, if this is the wall that has one.
vec3 shedDoor(vec3 c) {
  float u = vUv2.x, y = vUv2.y;
  if (vWall.w > 1.5 && vWall.w < 2.5) {
    float hw = min(1.25, vWall.x - 0.25);
    if (abs(u) < hw + 0.08 && y < 2.2) {
      c = vec3(0.84, 0.84, 0.82);
      if (mod(y, 0.52) < 0.08) c *= 0.86;
      if (abs(u) > hw || y > 2.12) c = vFrame;
    }
  } else if (vWall.w > 2.5 && abs(u) < 0.48 && y < 2.0 && vWall.x > 0.7) {
    c = vDoor;
  }
  return c;
}

vec3 buildingPattern(vec3 base) {
  vec3 c = base;
  bool wall = vKind > 0.5 && vKind < 1.5;
  bool roof = vKind > 1.5;
  int type = int(vType + 0.5);
  if (wall) {
    if (type == 0) {
      c = houseWall(c);
    } else if (type == 13) {
      // A shed or garage built onto a house, of the same brick.
      if (vUv2.y < 0.35) c *= 0.72;
      c = shedDoor(c);
    } else if (type == 1 || type == 2) {
      // Barns and sheds: corrugated metal or planks with a concrete plinth.
      if (mod(vUv2.x + 50.0, 1.2) < 0.3) c *= 0.88;
      if (vUv2.y < (type == 1 ? 0.9 : 0.3)) c = mix(c, vec3(0.6, 0.6, 0.58), 0.6);
      float bay = mod(vUv2.x + 56.0, 14.0);
      if (type == 1 && bay > 4.0 && bay < 8.0 && vUv2.y < 4.2 && vUv2.y > 0.2) c = vec3(0.36, 0.38, 0.4);
      if (type == 2) c = shedDoor(c);
    } else if (type == 3) {
      // Greenhouse glass: pale with the crop showing through, white mullions.
      c = mix(vec3(0.74, 0.82, 0.84), vec3(0.42, 0.58, 0.42), 0.3);
      if (mod(vUv2.x + 500.0, 2.0) < 0.28 || mod(vUv2.y, 1.7) < 0.22) c = vec3(0.9, 0.92, 0.92);
    } else if (type == 4) {
      if (mod(vUv2.y, 1.2) < 0.18) c *= 0.85;
    } else if (type == 5) {
      if (mod(vUv2.y, 1.6) < 0.2) c *= 0.82;
    } else if (type == 6) {
      // Canopy: mostly open, just posts.
      if (vUv2.y < 2.6 && mod(vUv2.x + 100.0, 4.0) > 0.4) c = vec3(0.28, 0.27, 0.25);
    } else if (type == 7) {
      // Church: tall round-arched windows in bays, a darker plinth.
      float cx = mod(vUv2.x + 2.1 + 420.0, 4.2) - 2.1;
      float y = vUv2.y;
      bool arch = y > 6.0 && length(vec2(cx, y - 6.0)) < 0.75;
      if (abs(cx) < 0.75 && y > 2.2 && (y < 6.0 || arch)) {
        c = vec3(0.22, 0.25, 0.32);
        if (mod(y, 1.1) < 0.12 || abs(cx) < 0.06) c = vec3(0.55, 0.56, 0.58);
      }
      if (y < 0.6) c *= 0.78;
    } else if (type == 8) {
      // Church tower: louvred belfry, a clock face below it, a slit window, brick plinth.
      float u = vUv2.x, y = vUv2.y, top = vAxis;
      if (abs(u) < 0.8 && y > top - 3.8 && y < top - 0.9) {
        c = vec3(0.16, 0.16, 0.18);
        if (mod(y, 0.42) < 0.14) c = vec3(0.42, 0.36, 0.3);
      }
      float r = length(vec2(u, y - (top - 5.4)));
      if (r < 0.85) c = r < 0.1 ? vec3(0.15) : (r > 0.72 ? vec3(0.2, 0.2, 0.22) : vec3(0.93, 0.92, 0.86));
      if (abs(u) < 0.28 && y > 4.0 && y < 8.5) c = vec3(0.2, 0.22, 0.28);
      if (y < 0.6) c *= 0.78;
    } else if (type == 9) {
      // Roof turret: white, with arched openings near the top.
      if (abs(vUv2.x) < 0.22 && vUv2.y > vAxis - 1.9 && vUv2.y < vAxis - 0.4) c = vec3(0.18, 0.18, 0.2);
    } else if (type == 10) {
      // 1930s school: tall classroom windows with red frames.
      float col = mod(vUv2.x + 200.0, 2.0);
      float y = vUv2.y;
      if (col > 0.45 && col < 1.55 && y > 0.9 && y < 3.7) {
        c = vec3(0.22, 0.25, 0.3);
        if (col < 0.58 || col > 1.42 || y < 1.02 || y > 3.58 || abs(y - 2.9) < 0.08) c = vFrame;
      }
      if (y < 0.5) c *= 0.8;
    } else if (type == 11) {
      // Lattice mast: steel cross-bracing.
      float a = fract((vUv2.x + vUv2.y) / 2.2), b = fract((vUv2.y - vUv2.x) / 2.2);
      c = (a < 0.16 || b < 0.16 || mod(vUv2.y, 2.2) < 0.25) ? vec3(0.78, 0.8, 0.82) : vec3(0.42, 0.44, 0.47);
    }
  } else if (roof) {
    if (type >= 8 && type != 10 && type != 13) {
      // Spires and caps: plain slate or metal.
    } else if (type == 3) {
      // Venlo greenhouse roof: rows of glass ridges, lit on one side.
      vec2 dir = vec2(cos(vAxis), sin(vAxis));
      float across = dot(vUv2, vec2(-dir.y, dir.x));
      float t = mod(across, 3.2);
      c = t < 1.6 ? vec3(0.88, 0.92, 0.93) : vec3(0.7, 0.79, 0.82);
      if (t < 0.22) c = vec3(0.56, 0.6, 0.62);
      float along = dot(vUv2, dir);
      if (mod(along, 5.0) < 0.2) c *= 0.93;
    } else {
      // The real roof from the aerial photo, when there is one: solar panels, skylights, chimneys.
      if (vAtlas.x >= 0.0) c = texture2D(roofAtlas, vAtlas).rgb;
      if (vWorldNormal.y < 0.97) {
        // Pitched roof: courses of tiles along the contour.
        if (mod(vWorld.y, 0.55) < 0.16) c *= vAtlas.x >= 0.0 ? 0.93 : 0.86;
      } else if (vAtlas.x < 0.0) {
        // Flat roof without a photo: gravel speckle.
        float n = fract(sin(dot(floor(vUv2 * 2.0), vec2(12.9898, 78.233))) * 43758.5453);
        c *= 0.95 + 0.08 * n;
      }
    }
  }
  return c;
}
`;

  // The colors of the vertices of v (cols floats each, see scripts/build_buildings.py) into the geometry g.
  function paint(g, v, cols, get) {
    const n = v.length / cols;
    const col = g.attributes.color.array, frame = g.attributes.aFrame.array, door = g.attributes.aDoor.array, axis = g.attributes.aAxis.array;
    const seen = new Map();
    for (let i = 0; i < n; i++) {
      const b = v[i * cols + 9];
      let c = seen.get(b);
      if (!c) {
        const m = get(b);
        seen.set(b, (c = { wall: wallColor(m, get), roof: roofColor(m), frame: frameColor(m, get), door: doorColor(m, get), axis: axisOf(m) }));
      }
      const main = v[i * cols + 8] === 2 ? c.roof : c.wall;
      col.set([main.r, main.g, main.b], i * 3);
      frame.set([c.frame.r, c.frame.g, c.frame.b], i * 3);
      door.set([c.door.r, c.door.g, c.door.b], i * 3);
      axis[i] = c.axis;
    }
    for (const k of ['color', 'aFrame', 'aDoor', 'aAxis']) g.attributes[k].needsUpdate = true;
  }

  function geometry(v, cols, get, { photo = true } = {}) {
    const n = v.length / cols;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), atlasUv = new Float32Array(n * 2);
    const kind = new Float32Array(n), type = new Float32Array(n), axis = new Float32Array(n), wall = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const o = i * cols;
      pos.set([v[o], v[o + 1], v[o + 2]], i * 3);
      nor.set([v[o + 3], v[o + 4], v[o + 5]], i * 3);
      uv.set([v[o + 6], v[o + 7]], i * 2);
      kind[i] = v[o + 8];
      const m = get(v[o + 9]);
      type[i] = typeOf(m, get);
      axis[i] = axisOf(m);
      atlasUv.set(photo ? [v[o + 10], v[o + 11]] : [-1, -1], i * 2);
      wall.set([v[o + 12], v[o + 13], v[o + 14], v[o + 15]], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
    g.setAttribute('aType', new THREE.BufferAttribute(type, 1));
    g.setAttribute('aAxis', new THREE.BufferAttribute(axis, 1));
    g.setAttribute('aFrame', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aDoor', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aAtlas', new THREE.BufferAttribute(atlasUv, 2));
    g.setAttribute('aWall', new THREE.BufferAttribute(wall, 4));
    g.setAttribute('aIdColor', new THREE.BufferAttribute(new Float32Array(n * 3), 3));  // filled by the renderer, for peeling
    paint(g, v, cols, get);
    return g;
  }

  function material(atlas) {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
    mat.userData.peel = { frontId: { value: null }, frontSize: { value: new THREE.Vector2(1, 1) }, peel: { value: 0 } };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.roofAtlas = { value: atlas || null };
      Object.assign(sh.uniforms, mat.userData.peel);
      sh.vertexShader = vertex + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vUv2 = aUv; vKind = aKind; vType = aType; vAxis = aAxis; vFrame = aFrame; vDoor = aDoor; vAtlas = aAtlas; vWall = aWall; vIdColor = aIdColor;
         vWorld = position; vWorldNormal = normal;`,
      );
      sh.fragmentShader = fragment + sh.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         if (peel > 0.5 && distance(texture2D(frontId, gl_FragCoord.xy / frontSize).rgb, vIdColor) < 0.002) discard;
         diffuseColor.rgb = buildingPattern(diffuseColor.rgb);`,
      );
    };
    return mat;
  }

  function lights(scene) {
    const deg = Math.PI / 180, az = SUN_AZIMUTH * deg, el = SUN_ELEVATION * deg;
    // Toward the sun, in world axes: east = +x, north = -z.
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const sun = new THREE.DirectionalLight(0xfff4e0, 0.95 * Math.PI);
    sun.position.copy(dir.multiplyScalar(1000));
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xc8d8f0, 0x6a6450, 0.62 * Math.PI));
  }

  const bytes = (c) => [c.r, c.g, c.b].map((x) => Math.round(x * 255));
  // The colors a building has now, as [r, g, b] of 0-255: what the editor starts from.
  const colors = (m, get) => ({ wall: bytes(wallColor(m, get)), roof: bytes(roofColor(m)), frame: bytes(frameColor(m, get)), door: bytes(doorColor(m, get)) });

  return { geometry, paint, material, lights, colors };
}
