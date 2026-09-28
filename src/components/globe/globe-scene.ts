import {
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { GRID_POINTS, LAND_MASK } from "./land";

/** Colours as HSL triples, straight from the CSS custom properties. */
export type GlobeTheme = Record<
  | "land"
  | "fill"
  | "edge"
  | "grid"
  | "arc"
  | "pulse"
  | "home"
  | "selected"
  | "activity"
  | "education"
  | "experience",
  [h: number, s: number, l: number]
>;

export type GlobeMarker = {
  id: string;
  coordinates: [longitude: number, latitude: number];
  category: "home" | "activity" | "education" | "experience";
  /** How many things happened there; sets the dot size. */
  weight: number;
};

type Options = {
  canvas: HTMLCanvasElement;
  markers: GlobeMarker[];
  theme: GlobeTheme;
  reducedMotion: boolean;
  onHover: (id: string | null, x: number, y: number) => void;
  onSelect: (id: string) => void;
  /** Fires once the user drags, so the page can stop pointing at the tour. */
  onDrag?: () => void;
};

export type GlobeScene = {
  focus: (id: string, instant?: boolean) => void;
  select: (id: string | null) => void;
  setTheme: (theme: GlobeTheme) => void;
  setActive: (active: boolean) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** The focused place sits a little below the middle, so more of the globe shows above it. */
const VIEW_LAT_OFFSET = 7 * DEG;
const TILT_MIN = -40 * DEG;
const TILT_MAX = 70 * DEG;
/** Camera distance from the centre of the globe, zoomed all the way out. */
const DISTANCE = 4.35;
/**
 * The wheel or a pinch brings the surface up to this many times closer.
 * Further in, the land dots (about a degree apart) are too sparse to read.
 */
const MAX_ZOOM = 3;
const ARC_RADIUS = 0.0032;

function toVector(longitude: number, latitude: number, radius = 1) {
  const phi = latitude * DEG;
  const lambda = longitude * DEG;
  return new Vector3(
    Math.cos(phi) * Math.sin(lambda) * radius,
    Math.sin(phi) * radius,
    Math.cos(phi) * Math.cos(lambda) * radius,
  );
}

/** Point i of the Fibonacci grid. Must match scripts/build-globe-land.mjs. */
function gridPoint(i: number): [number, number] {
  const latitude =
    (Math.asin(1 - ((i + 0.5) * 2) / GRID_POINTS) * 180) / Math.PI;
  const longitude = (((i * GOLDEN_ANGLE) % TAU) - Math.PI) * (180 / Math.PI);
  return [longitude, latitude];
}

function landPositions() {
  const bits = Uint8Array.from(atob(LAND_MASK), (char) => char.charCodeAt(0));
  const positions: number[] = [];
  for (let i = 0; i < GRID_POINTS; i += 1) {
    if (!(bits[i >> 3] & (1 << (i & 7)))) continue;
    const [longitude, latitude] = gridPoint(i);
    const point = toVector(longitude, latitude, 1.001);
    positions.push(point.x, point.y, point.z);
  }
  return new Float32BufferAttribute(positions, 3);
}

function graticule() {
  const positions: number[] = [];
  const push = (a: Vector3, b: Vector3) =>
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (let latitude = -75; latitude <= 75; latitude += 15) {
    for (let longitude = -180; longitude < 180; longitude += 3) {
      push(
        toVector(longitude, latitude, 1.0006),
        toVector(longitude + 3, latitude, 1.0006),
      );
    }
  }
  for (let longitude = -180; longitude < 180; longitude += 15) {
    for (let latitude = -84; latitude < 84; latitude += 3) {
      push(
        toVector(longitude, latitude, 1.0006),
        toVector(longitude, latitude + 3, 1.0006),
      );
    }
  }
  return new Float32BufferAttribute(positions, 3);
}

/** A great-circle arc from a to b, lifted off the surface by its length. */
function arcCurve(from: Vector3, to: Vector3) {
  const angle = from.angleTo(to);
  const lift = 0.012 + angle * 0.22;
  const points: Vector3[] = [];
  const steps = Math.max(12, Math.round(angle * 60));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    // slerp between the two unit vectors
    const sinAngle = Math.sin(angle) || 1;
    const a = Math.sin((1 - t) * angle) / sinAngle;
    const b = Math.sin(t * angle) / sinAngle;
    const point = from
      .clone()
      .multiplyScalar(a)
      .add(to.clone().multiplyScalar(b));
    point.normalize().multiplyScalar(1.002 + Math.sin(Math.PI * t) * lift);
    points.push(point);
  }
  return new CatmullRomCurve3(points);
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function shortestTurn(from: number, to: number) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return from + delta;
}

export function createGlobeScene(options: Options): GlobeScene | null {
  const { canvas, markers, reducedMotion } = options;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, DISTANCE);

  const globe = new Group();
  scene.add(globe);

  // CSS colours are sRGB; three.js would otherwise read HSL as linear.
  const color = (hsl: [number, number, number]) =>
    new Color().setHSL(
      hsl[0] / 360,
      hsl[1] / 100,
      hsl[2] / 100,
      SRGBColorSpace,
    );

  // Paper sphere with a slightly darker rim.
  const sphereMaterial = new ShaderMaterial({
    uniforms: {
      uFill: { value: new Color() },
      uEdge: { value: new Color() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFill;
      uniform vec3 uEdge;
      varying vec3 vNormal;
      void main() {
        float rim = 1.0 - clamp(vNormal.z, 0.0, 1.0);
        vec3 color = mix(uFill, uEdge, smoothstep(0.35, 1.0, rim) * 0.55);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const sphere = new Mesh(new SphereGeometry(1, 96, 64), sphereMaterial);
  globe.add(sphere);

  const gridMaterial = new LineBasicMaterial({
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute("position", graticule());
  globe.add(new LineSegments(gridGeometry, gridMaterial));

  // Land as printed dots, fading towards the rim.
  const dotsMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new Color() },
      uSize: { value: 2.4 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uPixelRatio;
      varying float vFacing;
      void main() {
        vec3 n = normalize(normalMatrix * normalize(position));
        // Dots bunch up towards the rim; fading them early keeps the edge
        // from reading as a heavy outline.
        vFacing = smoothstep(0.06, 0.5, n.z);
        gl_PointSize = uSize * uPixelRatio * (0.45 + 0.55 * vFacing);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vFacing;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.3, d) * vFacing * 0.62;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const dotsGeometry = new BufferGeometry();
  dotsGeometry.setAttribute("position", landPositions());
  globe.add(new Points(dotsGeometry, dotsMaterial));

  // Arcs from home to every other place.
  const home =
    markers.find((marker) => marker.category === "home") ?? markers[0];
  const homeVector = toVector(...home.coordinates);
  const arcUniforms = {
    uColor: { value: new Color() },
    uPulseColor: { value: new Color() },
    uTime: { value: 0 },
    uPulse: { value: reducedMotion ? 0 : 1 },
    /** How far to pull the tube walls in, so arcs stay hairlines when zoomed. */
    uInset: { value: 0 },
  };
  const arcs: { mesh: Mesh; draw: { value: number }; delay: number }[] = [];
  markers.forEach((marker, index) => {
    if (marker === home) return;
    const target = toVector(...marker.coordinates);
    if (target.angleTo(homeVector) < 0.004) return;
    const curve = arcCurve(homeVector, target);
    const draw = { value: reducedMotion ? 1 : 0 };
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...arcUniforms,
        uDraw: draw,
        uOffset: { value: (index * 0.137) % 1 },
      },
      vertexShader: /* glsl */ `
        uniform float uInset;
        varying float vT;
        void main() {
          vT = uv.x;
          // A tube vertex sits one radius out from the curve, along its normal.
          vec3 p = position - normal * uInset;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uPulseColor;
        uniform float uTime;
        uniform float uPulse;
        uniform float uDraw;
        uniform float uOffset;
        varying float vT;
        void main() {
          if (vT > uDraw) discard;
          float head = fract(uTime * 0.09 + uOffset) * 1.6 - 0.3;
          float glow = smoothstep(0.1, 0.0, abs(vT - head)) * uPulse;
          vec3 color = mix(uColor, uPulseColor, glow);
          gl_FragColor = vec4(color, 0.62 + 0.38 * glow);
          #include <colorspace_fragment>
        }
      `,
    });
    const segments = Math.max(24, Math.round(curve.getLength() * 90));
    const mesh = new Mesh(
      new TubeGeometry(curve, segments, ARC_RADIUS, 5, false),
      material,
    );
    globe.add(mesh);
    arcs.push({ mesh, draw, delay: index * 0.07 });
  });

  // Place dots, each on a paper-coloured backing so it reads on the land.
  const markerMeshes = new Map<
    string,
    {
      marker: GlobeMarker;
      group: Group;
      dot: Mesh;
      backing: Mesh;
      position: Vector3;
    }
  >();
  const dotMaterials = {
    home: new MeshBasicMaterial(),
    activity: new MeshBasicMaterial(),
    education: new MeshBasicMaterial(),
    experience: new MeshBasicMaterial(),
  };
  const backingMaterial = new MeshBasicMaterial();
  for (const marker of markers) {
    const radius = Math.min(0.03, 0.012 + 0.0045 * Math.sqrt(marker.weight));
    const position = toVector(...marker.coordinates, 1.003);
    const group = new Group();
    group.position.copy(position);
    group.lookAt(position.clone().multiplyScalar(2));
    const backing = new Mesh(
      new CircleGeometry(radius * 1.45, 32),
      backingMaterial,
    );
    const dot = new Mesh(
      new CircleGeometry(radius, 32),
      dotMaterials[marker.category],
    );
    dot.position.z = 0.0005;
    group.add(backing, dot);
    globe.add(group);
    markerMeshes.set(marker.id, { marker, group, dot, backing, position });
  }

  // Home keeps a slow ring going out from it; the selected place gets a ring.
  const homeRingMaterial = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
  });
  const homeRing = new Mesh(new RingGeometry(0.9, 1, 48), homeRingMaterial);
  const homeEntry = markerMeshes.get(home.id);
  homeEntry?.group.add(homeRing);
  homeRing.position.z = 0.0003;

  const selectedMaterial = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
  });
  const selectedRing = new Mesh(
    new RingGeometry(0.78, 1, 48),
    selectedMaterial,
  );
  selectedRing.visible = false;
  let selectedAt = 0;

  function setTheme(theme: GlobeTheme) {
    sphereMaterial.uniforms.uFill.value.copy(color(theme.fill));
    sphereMaterial.uniforms.uEdge.value.copy(color(theme.edge));
    gridMaterial.color.copy(color(theme.grid));
    dotsMaterial.uniforms.uColor.value.copy(color(theme.land));
    arcUniforms.uColor.value.copy(color(theme.arc));
    arcUniforms.uPulseColor.value.copy(color(theme.pulse));
    dotMaterials.home.color.copy(color(theme.home));
    dotMaterials.activity.color.copy(color(theme.activity));
    dotMaterials.education.color.copy(color(theme.education));
    dotMaterials.experience.color.copy(color(theme.experience));
    backingMaterial.color.copy(color(theme.fill));
    homeRingMaterial.color.copy(color(theme.home));
    selectedMaterial.color.copy(color(theme.selected));
    requestRender();
  }

  // --- orientation -------------------------------------------------------
  const rotation = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  let easing = false;
  let dragging = false;

  function orientationFor(id: string) {
    const entry = markerMeshes.get(id);
    if (!entry) return null;
    const [longitude, latitude] = entry.marker.coordinates;
    return {
      x: Math.min(
        TILT_MAX,
        Math.max(TILT_MIN, latitude * DEG - VIEW_LAT_OFFSET),
      ),
      y: -longitude * DEG,
    };
  }

  function focus(id: string, instant = false) {
    const next = orientationFor(id);
    if (!next) return;
    target.x = next.x;
    target.y = shortestTurn(rotation.y, next.y);
    velocity.x = velocity.y = 0;
    if (instant || reducedMotion) {
      rotation.x = target.x;
      rotation.y = target.y;
      easing = false;
    } else {
      easing = true;
    }
    requestRender();
  }

  function select(id: string | null) {
    const entry = id ? markerMeshes.get(id) : undefined;
    selectedRing.removeFromParent();
    selectedRing.visible = Boolean(entry);
    if (entry) {
      const radius = (entry.dot.geometry as CircleGeometry).parameters.radius;
      selectedRing.scale.setScalar(radius * 2.3);
      selectedRing.position.z = 0.0006;
      entry.group.add(selectedRing);
      selectedAt = clock;
    }
    requestRender();
  }

  // --- zoom ----------------------------------------------------------------
  // 1 shows the whole globe; the camera closes in on the surface from there.
  // Places and arcs keep their size on screen, so zooming in pulls the
  // crowded dots around Delhi and Roorkee apart.
  let zoom = 1;
  let zoomTarget = 1;
  let dotSize = 2.4;

  function applyZoom() {
    camera.position.z = 1 + (DISTANCE - 1) / zoom;
    for (const entry of markerMeshes.values()) {
      entry.group.scale.setScalar(1 / zoom);
    }
    arcUniforms.uInset.value = ARC_RADIUS * (1 - 1 / zoom);
    // Land dots spread apart as the camera closes in. Growing them keeps the
    // coastlines readable, but slower than the zoom, so they stay smaller
    // than the places.
    dotsMaterial.uniforms.uSize.value = dotSize * Math.pow(zoom, 0.6);
  }

  /** `immediate` for pinches, which follow the fingers; the wheel eases. */
  function zoomTo(next: number, immediate = false) {
    zoomTarget = Math.min(MAX_ZOOM, Math.max(1, next));
    if (immediate || reducedMotion) zoom = zoomTarget;
    requestRender();
  }

  // --- pointer -------------------------------------------------------------
  let pointerId: number | null = null;
  let last = { x: 0, y: 0, time: 0 };
  let downAt = { x: 0, y: 0 };
  let hovered: string | null = null;
  let movedSinceDown = 0;
  let reportedDrag = false;
  // Fingers on the globe; two of them pinch.
  const touches = new Map<number, { x: number; y: number }>();
  let pinch: { spread: number; zoom: number } | null = null;

  const touchSpread = () => {
    const [a, b] = [...touches.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };

  /** Radians per pixel dragged, so the surface keeps up with the pointer at any zoom. */
  const turnPerPixel = () => {
    const height = canvas.clientHeight || 1;
    const halfHeight = Math.tan((camera.fov * DEG) / 2) * DISTANCE;
    return halfHeight / (height / 2) / zoom;
  };

  /** Whether a point on the canvas is over the globe, not the empty corners. */
  function overGlobe(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const half = rect.height / 2 || 1;
    const fromCentre = Math.hypot(
      clientX - rect.left - rect.width / 2,
      clientY - rect.top - rect.height / 2,
    );
    const outline =
      Math.tan(Math.asin(1 / camera.position.z)) /
      Math.tan((camera.fov * DEG) / 2);
    return fromCentre <= half * outline;
  }

  const projected = new Vector3();
  const normal = new Vector3();
  function pick(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: string | null = null;
    let bestDistance = 18;
    globe.updateMatrixWorld();
    for (const [id, entry] of markerMeshes) {
      entry.group.getWorldPosition(projected);
      normal.copy(projected).normalize();
      // Skip places on the far side.
      if (normal.dot(camera.position.clone().sub(projected).normalize()) < 0.15)
        continue;
      projected.project(camera);
      const px = ((projected.x + 1) / 2) * rect.width;
      const py = ((1 - projected.y) / 2) * rect.height;
      const distance = Math.hypot(px - x, py - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = id;
      }
    }
    return { id: best, x, y };
  }

  function setHovered(id: string | null, x: number, y: number) {
    if (id !== hovered) {
      hovered = id;
      canvas.style.cursor = id ? "pointer" : dragging ? "grabbing" : "grab";
    }
    options.onHover(id, x, y);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "touch") {
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.size === 2) {
        // A second finger turns the drag into a pinch, which doesn't turn
        // the globe or count as a tap.
        dragging = false;
        pointerId = null;
        velocity.x = velocity.y = 0;
        pinch = { spread: touchSpread(), zoom };
        return;
      }
      if (touches.size > 2) return;
    }
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    dragging = true;
    easing = false;
    movedSinceDown = 0;
    velocity.x = velocity.y = 0;
    last = { x: event.clientX, y: event.clientY, time: performance.now() };
    downAt = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    requestRender();
  }

  function onPointerMove(event: PointerEvent) {
    if (touches.has(event.pointerId)) {
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pinch) {
      if (touches.size >= 2) {
        zoomTo(pinch.zoom * (touchSpread() / pinch.spread), true);
      }
      return;
    }
    if (!dragging || event.pointerId !== pointerId) {
      if (event.pointerType === "mouse") {
        const hit = pick(event.clientX, event.clientY);
        setHovered(hit.id, hit.x, hit.y);
      }
      return;
    }
    const now = performance.now();
    const dt = Math.max(1, now - last.time) / 1000;
    const scale = turnPerPixel();
    const dx = (event.clientX - last.x) * scale;
    // Touch only turns the globe sideways; up and down scroll the page.
    const dy =
      event.pointerType === "mouse" ? (event.clientY - last.y) * scale : 0;
    rotation.y += dx;
    rotation.x = Math.min(TILT_MAX, Math.max(TILT_MIN, rotation.x + dy));
    velocity.x = velocity.x * 0.6 + (dy / dt) * 0.4;
    velocity.y = velocity.y * 0.6 + (dx / dt) * 0.4;
    last = { x: event.clientX, y: event.clientY, time: now };
    movedSinceDown = Math.max(
      movedSinceDown,
      Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y),
    );
    if (movedSinceDown > 6 && !reportedDrag) {
      reportedDrag = true;
      options.onDrag?.();
    }
    if (hovered) setHovered(null, 0, 0);
    requestRender();
  }

  function onPointerUp(event: PointerEvent) {
    touches.delete(event.pointerId);
    if (pinch) {
      // Lifting one finger ends the pinch; the other one doesn't start a drag.
      if (touches.size < 2) pinch = null;
      return;
    }
    if (event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (movedSinceDown < 6) {
      velocity.x = velocity.y = 0;
      const hit = pick(event.clientX, event.clientY);
      if (hit.id) options.onSelect(hit.id);
    } else if (performance.now() - last.time > 80) {
      // The pointer stopped before letting go: no fling.
      velocity.x = velocity.y = 0;
    }
    if (reducedMotion) velocity.x = velocity.y = 0;
    canvas.style.cursor = hovered ? "pointer" : "grab";
    requestRender();
  }

  function onPointerLeave() {
    if (!dragging && hovered) setHovered(null, 0, 0);
  }

  // The canvas lets the browser scroll the page with vertical swipes
  // (touch-pan-y), and two fingers moving together count as one; on the
  // globe they are a pinch.
  function onTouchMove(event: TouchEvent) {
    if (event.targetTouches.length > 1 && event.cancelable) {
      event.preventDefault();
    }
  }

  function onWheel(event: WheelEvent) {
    const pixels =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 40
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * 800
          : event.deltaY;
    if (!pixels || !overGlobe(event.clientX, event.clientY)) return;
    // Trackpad pinches arrive as wheel events with ctrlKey set; they are
    // what zooms the page, so they never get through to it.
    const pinching = event.ctrlKey;
    // Like a scrolling box on the page: once the globe is all the way in or
    // out, the wheel goes back to scrolling the page.
    const atLimit = pixels < 0 ? zoomTarget >= MAX_ZOOM : zoomTarget <= 1;
    if (atLimit && !pinching) return;
    event.preventDefault();
    // A pinch sends many small deltas; a wheel notch is about 100 pixels,
    // and a fast spin can arrive as one bigger event.
    const rate = pinching && Math.abs(pixels) < 50 ? 0.01 : 0.0022;
    const step = Math.min(0.7, Math.max(-0.7, -pixels * rate));
    zoomTo(zoomTarget * Math.exp(step));
    if (hovered) setHovered(null, 0, 0);
  }

  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // --- loop --------------------------------------------------------------
  let active = false;
  let frame = 0;
  let previous = 0;
  let clock = 0;
  let drawStartedAt: number | null = null;
  let dirty = true;

  function requestRender() {
    dirty = true;
    if (active && !frame) frame = requestAnimationFrame(tick);
  }

  function tick(now: number) {
    frame = 0;
    const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
    previous = now;
    clock += dt;

    let moving = dragging;

    if (
      !dragging &&
      (Math.abs(velocity.x) > 0.002 || Math.abs(velocity.y) > 0.002)
    ) {
      rotation.x = Math.min(
        TILT_MAX,
        Math.max(TILT_MIN, rotation.x + velocity.x * dt),
      );
      rotation.y += velocity.y * dt;
      const decay = Math.exp(-dt * 3.2);
      velocity.x *= decay;
      velocity.y *= decay;
      moving = true;
    } else if (easing) {
      const k = 1 - Math.exp(-dt * 3.4);
      rotation.x += (target.x - rotation.x) * k;
      rotation.y += (target.y - rotation.y) * k;
      if (
        Math.abs(target.x - rotation.x) < 0.0005 &&
        Math.abs(target.y - rotation.y) < 0.0005
      ) {
        rotation.x = target.x;
        rotation.y = target.y;
        easing = false;
      }
      moving = true;
    }

    if (zoom !== zoomTarget) {
      // Eased by ratio, so every wheel notch feels the same at any zoom.
      zoom *= Math.pow(zoomTarget / zoom, 1 - Math.exp(-dt * 12));
      if (Math.abs(Math.log(zoomTarget / zoom)) < 0.002) zoom = zoomTarget;
      moving = true;
    }
    applyZoom();

    // A slow sway so the globe never looks frozen; the same few pixels at
    // any zoom.
    const sway = reducedMotion ? 0 : (Math.sin(clock * 0.22) * 0.035) / zoom;
    // Zooming closes in on the focused place, which sits off the middle,
    // and keeps it where it is on screen.
    globe.rotation.set(
      rotation.x + VIEW_LAT_OFFSET * (1 - 1 / zoom),
      rotation.y + sway,
      0,
    );

    let drawing = false;
    if (drawStartedAt !== null) {
      // Real time, not the capped frame clock, so a slow device still sees
      // the arcs drawn in about two seconds.
      const elapsed = (now - drawStartedAt) / 1000;
      for (const arc of arcs) {
        arc.draw.value = easeOut((elapsed - arc.delay) / 0.9);
        if (arc.draw.value < 1) drawing = true;
      }
    }

    arcUniforms.uTime.value = clock;
    if (!reducedMotion) {
      const pulse = (clock % 3.2) / 3.2;
      homeRing.scale.setScalar(
        ((homeEntry?.dot.geometry as CircleGeometry | undefined)?.parameters
          .radius ?? 0.02) *
          (1.6 + pulse * 3.2),
      );
      homeRingMaterial.opacity = 0.55 * (1 - pulse);
      const grow = easeOut((clock - selectedAt) / 0.35);
      selectedMaterial.opacity = grow;
    } else {
      homeRing.visible = false;
      selectedMaterial.opacity = 1;
    }

    renderer.render(scene, camera);
    dirty = false;

    const keepGoing =
      active && (!reducedMotion || moving || drawing || easing || dirty);
    if (keepGoing) frame = requestAnimationFrame(tick);
    else previous = 0;
  }

  function setActive(next: boolean) {
    if (next === active) return;
    active = next;
    if (active) {
      if (drawStartedAt === null) {
        drawStartedAt = reducedMotion ? -Infinity : performance.now() + 150;
      }
      previous = 0;
      requestRender();
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    }
  }

  function resize(width: number, height: number) {
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dotsMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    // Denser dots on small globes would merge; lighter ones on big globes look sparse.
    dotSize = Math.min(3, Math.max(1.6, height / 230));
    applyZoom();
    requestRender();
  }

  setTheme(options.theme);
  focus(home.id, true);

  return {
    focus,
    select,
    setTheme,
    setActive,
    resize,
    dispose() {
      setActive(false);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("wheel", onWheel);
      scene.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      selectedRing.geometry.dispose();
      selectedMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
