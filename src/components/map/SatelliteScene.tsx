"use client";

import {
  satelliteFamily,
  satelliteLabel,
  type SatelliteFamily,
} from "@/lib/map/satellite-display";
import type { SatelliteSnapshot } from "@/lib/map/satellite-types";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
  map: MapLibreMap;
  snapshots: SatelliteSnapshot[];
  selectedId: number | null;
  onSelect: (noradId: number) => void;
};

type ModelHandle = {
  button: HTMLButtonElement;
  group: THREE.Group;
  orient: THREE.Group;
  ring: THREE.Mesh;
  stem: THREE.Line;
  groundPoint: THREE.Mesh;
  screenX: number;
  screenY: number;
};

/**
 * Public-domain spacecraft from NASA's 3D Resources collection. They are
 * fetched after the map is interactive and swapped in over the procedural
 * stand-ins, so nothing blocks first paint on four megabytes of geometry.
 */
const MODEL_URLS: Record<SatelliteFamily, string> = {
  landsat: "/models/landsat.glb",
  modis: "/models/modis.glb",
  sentinel: "/models/sentinel.glb",
  planet: "/models/cubesat.glb",
  spot: "/models/spot.glb",
  nisar: "/models/sentinel.glb",
};

/** Longest edge each loaded model is normalised to, in scene units. */
const MODEL_TARGET_SIZE = 3.4;

const modelCache = new Map<string, Promise<THREE.Group>>();

async function loadFamilyModel(family: SatelliteFamily): Promise<THREE.Group> {
  const url = MODEL_URLS[family];
  const cached = modelCache.get(url);
  if (cached) return cached;

  const pending = (async () => {
    const { GLTFLoader } = await import(
      "three/examples/jsm/loaders/GLTFLoader.js"
    );
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;

    // The collection has no shared unit convention, so each model is measured
    // and normalised to one on-screen size before it is ever displayed.
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const longest = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(MODEL_TARGET_SIZE / longest);
    model.position.sub(centre.multiplyScalar(MODEL_TARGET_SIZE / longest));

    return model;
  })();

  modelCache.set(url, pending);
  return pending;
}

// Multi-layer insulation reads gold; structure reads dark graphite rather than
// bare white, which was blowing out against bright imagery.
const busMaterial = new THREE.MeshStandardMaterial({
  color: 0xb8873f,
  roughness: 0.38,
  metalness: 0.72,
});
const silverMaterial = new THREE.MeshStandardMaterial({
  color: 0x7c878d,
  roughness: 0.34,
  metalness: 0.86,
});
const solarMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e657c,
  roughness: 0.34,
  metalness: 0.42,
});
const darkSolarMaterial = new THREE.MeshStandardMaterial({
  color: 0x173f55,
  roughness: 0.4,
  metalness: 0.5,
});

function box(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
}

function addSolarWing(
  group: THREE.Group,
  side: -1 | 1,
  length: number,
  rows: number,
) {
  const wing = box(length, 1.05, 0.12, solarMaterial);
  wing.position.x = side * (1.05 + length / 2);
  group.add(wing);

  const cellMaterial = new THREE.LineBasicMaterial({
    color: 0x8bc6d1,
    transparent: true,
    opacity: 0.72,
  });
  for (let index = 1; index < rows; index += 1) {
    const x = side * (1.05 + (length * index) / rows);
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -0.5, 0.08),
      new THREE.Vector3(x, 0.5, 0.08),
    ]);
    group.add(new THREE.Line(geometry, cellMaterial));
  }
}

/**
 * Each family gets a silhouette you can name without reading the label: a SAR
 * plank, a wide scanner paddle, a long optical barrel, a cubesat slab, a dish
 * on a boom. Shape carries the classification, not colour alone.
 */
function createSatelliteModel(family: SatelliteFamily) {
  const group = new THREE.Group();

  switch (family) {
    case "sentinel": {
      // Sentinel-1: single long SAR antenna plank, one asymmetric wing.
      group.add(box(0.95, 1.25, 0.85, busMaterial));
      const panel = box(3.4, 0.42, 0.12, silverMaterial);
      panel.position.set(0, -1.05, 0.1);
      group.add(panel);
      addSolarWing(group, -1, 2.4, 5);
      addSolarWing(group, 1, 2.4, 5);
      break;
    }
    case "modis": {
      // Terra/Aqua: deep bus with a broad cross-track scanner head.
      group.add(box(1.5, 1.9, 1.2, busMaterial));
      const scanner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.5, 20),
        darkSolarMaterial,
      );
      scanner.rotation.x = Math.PI / 2;
      scanner.position.y = -1.25;
      group.add(scanner);
      addSolarWing(group, 1, 3.4, 6);
      break;
    }
    case "landsat": {
      // Landsat: tall bus, long telescope barrel, one wing.
      group.add(box(1.15, 1.85, 1.0, busMaterial));
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.52, 1.5, 18),
        silverMaterial,
      );
      barrel.position.y = -1.5;
      group.add(barrel);
      const hood = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.42, 0.3, 18),
        darkSolarMaterial,
      );
      hood.position.y = -2.3;
      group.add(hood);
      addSolarWing(group, 1, 3.1, 6);
      break;
    }
    case "spot": {
      // SPOT: compact box, twin short wings, small forward optics.
      group.add(box(1.2, 1.3, 1.2, busMaterial));
      const optics = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.42, 0.8, 16),
        darkSolarMaterial,
      );
      optics.position.y = -1.1;
      group.add(optics);
      addSolarWing(group, -1, 1.7, 3);
      addSolarWing(group, 1, 1.7, 3);
      break;
    }
    case "planet": {
      // SuperDove: 3U cubesat slab, two thin deployed panels.
      group.add(box(0.5, 1.5, 0.5, silverMaterial));
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.42, 12),
        darkSolarMaterial,
      );
      lens.position.y = -0.95;
      group.add(lens);
      addSolarWing(group, -1, 1.35, 2);
      addSolarWing(group, 1, 1.35, 2);
      break;
    }
    default: {
      // NISAR: drum bus with a large deployable mesh reflector on a boom.
      group.add(box(1.25, 1.5, 1.05, busMaterial));
      const boom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 2.8, 8),
        silverMaterial,
      );
      boom.rotation.z = Math.PI / 3.2;
      boom.position.set(1.1, -1.1, 0);
      group.add(boom);
      const reflector = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.08, 8, 28),
        silverMaterial,
      );
      reflector.position.set(2.2, -2.1, 0);
      reflector.rotation.set(0.5, 0.4, 0);
      group.add(reflector);
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(1.1, 24),
        new THREE.MeshStandardMaterial({
          color: 0x9aa7ad,
          roughness: 0.7,
          metalness: 0.3,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.copy(reflector.position);
      mesh.rotation.copy(reflector.rotation);
      group.add(mesh);
      addSolarWing(group, -1, 2.3, 4);
      break;
    }
  }

  return group;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
    }
  });
}

export default function SatelliteScene({
  map,
  snapshots,
  selectedId,
  onSelect,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const snapshotsRef = useRef(snapshots);
  const selectedIdRef = useRef(selectedId);
  const modelKey = useMemo(
    () => snapshots.map((snapshot) => snapshot.noradId).join(","),
    [snapshots],
  );

  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !modelKey) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className =
      "pointer-events-none absolute inset-0 size-full";
    renderer.domElement.dataset.satelliteScene = "true";
    root.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -100, 100);
    camera.position.z = 20;
    // One warm key plus a cool rim keeps the panels legible without washing the
    // bus to white the way a single bright key did.
    scene.add(new THREE.HemisphereLight(0xdceaf5, 0x1a232b, 1.1));
    const keyLight = new THREE.DirectionalLight(0xfff0d6, 2.1);
    keyLight.position.set(-5, -7, 12);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8fc7ff, 0.9);
    rimLight.position.set(6, 5, -8);
    scene.add(rimLight);

    let disposed = false;
    const handles = new Map<number, ModelHandle>();
    for (const snapshot of snapshotsRef.current) {
      const family = satelliteFamily(snapshot.noradId, snapshot.name);

      // Outer group carries screen position and heading; the inner one holds
      // the fixed viewing tilt so the model can be replaced without disturbing
      // either.
      const group = new THREE.Group();
      const orient = new THREE.Group();
      orient.rotation.x = 0.52;
      orient.rotation.y = -0.34;
      const placeholder = createSatelliteModel(family);
      orient.add(placeholder);
      group.add(orient);
      scene.add(group);

      void loadFamilyModel(family)
        .then((model) => {
          if (disposed) return;
          orient.remove(placeholder);
          orient.add(model.clone(true));
        })
        .catch(() => {
          // The procedural stand-in is already on screen; nothing to do.
        });

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.7, 0.11, 8, 44),
        new THREE.MeshBasicMaterial({
          color: 0x8de3db,
          transparent: true,
          opacity: 0.88,
        }),
      );
      ring.visible = false;
      group.add(ring);

      const stem = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(),
        ]),
        new THREE.LineBasicMaterial({
          color: 0x8ddbd6,
          transparent: true,
          opacity: 0.58,
        }),
      );
      scene.add(stem);

      const groundPoint = new THREE.Mesh(
        new THREE.CircleGeometry(1.7, 18),
        new THREE.MeshBasicMaterial({
          color: 0x75d2cd,
          transparent: true,
          opacity: 0.8,
        }),
      );
      scene.add(groundPoint);

      const button = document.createElement("button");
      const label = satelliteLabel(snapshot.noradId, snapshot.name);
      button.type = "button";
      button.title = `Show ${label} orbit`;
      button.setAttribute("aria-label", `Show ${label} orbit`);
      button.className =
        "pointer-events-auto absolute size-8 -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300";
      const select = (event: Event) => {
        event.stopPropagation();
        onSelect(snapshot.noradId);
      };
      button.addEventListener("click", select);
      root.append(button);

      handles.set(snapshot.noradId, {
        button,
        group,
        orient,
        ring,
        stem,
        groundPoint,
        screenX: Number.NaN,
        screenY: Number.NaN,
      });
    }

    const resize = () => {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      renderer.setSize(width, height, false);
      camera.right = width;
      camera.top = 0;
      camera.bottom = height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    let animationFrame = 0;
    const render = (time: number) => {
      animationFrame = window.requestAnimationFrame(render);
      // Every frame. Throttling to 30fps left the models stepping while the
      // map itself panned at 60, which read as jitter.
      if (document.visibilityState === "hidden") return;

      const zoom = map.getZoom();
      for (const snapshot of snapshotsRef.current) {
        const handle = handles.get(snapshot.noradId);
        if (!handle) continue;
        const point = map.project([snapshot.longitude, snapshot.latitude]);
        const altitudePixels = Math.min(
          34,
          Math.max(7, (snapshot.altitudeKm / 95) * 2 ** ((zoom - 3) * 0.23)),
        );
        // Locked to the projected point, exactly like the location markers.
        // The old easing lagged a frame behind every pan, which is what made
        // the satellites look like they were sliding around on the map.
        handle.screenX = point.x;
        handle.screenY = point.y - altitudePixels;

        const visible =
          point.x > -45 &&
          point.x < root.clientWidth + 45 &&
          point.y > -45 &&
          point.y < root.clientHeight + 45;
        handle.group.visible = visible;
        handle.stem.visible = visible;
        handle.groundPoint.visible = visible;
        handle.button.hidden = !visible;
        if (!visible) continue;

        const selected = snapshot.noradId === selectedIdRef.current;
        // Genuinely tied to the map scale: barely a speck at world view, a
        // readable spacecraft once the visitor is down at city zoom.
        // Floor raised so the fleet still reads at globe zoom, where the old
        // 1.2 minimum left them as specks against the planet.
        const scale = Math.min(9, Math.max(2.7, 1.1 + zoom * 0.52));
        handle.group.position.set(handle.screenX, handle.screenY, 4);
        handle.group.scale.setScalar(scale * (selected ? 1.15 : 1));
        handle.group.rotation.z = (-snapshot.bearing * Math.PI) / 180;
        // A slow roll on the cross-track axis gives the model real depth
        // instead of reading as a flat sprite.
        handle.orient.rotation.y = -0.34 + Math.sin(time * 0.0004) * 0.22;
        handle.ring.visible = selected;
        handle.ring.rotation.z += 0.012;

        const positions = handle.stem.geometry.attributes.position;
        positions.setXYZ(0, point.x, point.y, 0);
        positions.setXYZ(1, handle.screenX, handle.screenY, 0);
        positions.needsUpdate = true;
        handle.groundPoint.position.set(point.x, point.y, 1);
        handle.groundPoint.scale.setScalar(selected ? 1.25 : 0.75);
        handle.button.style.left = `${handle.screenX}px`;
        handle.button.style.top = `${handle.screenY}px`;
      }

      renderer.render(scene, camera);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      for (const handle of handles.values()) handle.button.remove();
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [map, modelKey, onSelect]);

  return (
    <div
      ref={rootRef}
      aria-label="Earth-observation satellites"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    />
  );
}
