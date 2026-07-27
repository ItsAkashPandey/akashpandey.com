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
  ring: THREE.Mesh;
  stem: THREE.Line;
  groundPoint: THREE.Mesh;
  screenX: number;
  screenY: number;
};

const busMaterial = new THREE.MeshStandardMaterial({
  color: 0xc99b55,
  roughness: 0.46,
  metalness: 0.58,
});
const silverMaterial = new THREE.MeshStandardMaterial({
  color: 0xb7c1c5,
  roughness: 0.3,
  metalness: 0.78,
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

function createSatelliteModel(family: SatelliteFamily) {
  const group = new THREE.Group();
  const bus =
    family === "planet"
      ? box(0.8, 1.2, 0.8, busMaterial)
      : box(1.35, 1.55, 1.05, busMaterial);
  group.add(bus);

  const wingLength = family === "modis" ? 2.8 : family === "nisar" ? 2.5 : 2.15;
  addSolarWing(group, -1, wingLength, family === "planet" ? 2 : 4);
  addSolarWing(group, 1, wingLength, family === "planet" ? 2 : 4);

  if (family === "nisar") {
    const boom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8),
      silverMaterial,
    );
    boom.rotation.z = Math.PI / 2;
    boom.position.y = -1.15;
    group.add(boom);

    const reflector = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.09, 8, 32),
      silverMaterial,
    );
    reflector.position.y = -2;
    reflector.rotation.x = 0.35;
    group.add(reflector);
  } else if (family === "modis") {
    const sensor = box(0.72, 0.55, 0.72, darkSolarMaterial);
    sensor.position.y = -1.02;
    group.add(sensor);
  } else if (family === "sentinel") {
    const radar = box(1.55, 0.32, 0.55, silverMaterial);
    radar.position.y = -1.12;
    group.add(radar);
  } else {
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.38, 0.65, 16),
      darkSolarMaterial,
    );
    lens.position.y = -1.05;
    group.add(lens);
  }

  group.rotation.x = 0.52;
  group.rotation.y = -0.34;
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
    scene.add(new THREE.HemisphereLight(0xf5fbff, 0x223039, 2.25));
    const keyLight = new THREE.DirectionalLight(0xfff1d2, 2.5);
    keyLight.position.set(-4, -6, 12);
    scene.add(keyLight);

    const handles = new Map<number, ModelHandle>();
    for (const snapshot of snapshotsRef.current) {
      const family = satelliteFamily(snapshot.noradId, snapshot.name);
      const group = createSatelliteModel(family);
      scene.add(group);

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
    let lastFrame = 0;
    const render = (time: number) => {
      animationFrame = window.requestAnimationFrame(render);
      if (document.visibilityState === "hidden" || time - lastFrame < 32)
        return;
      lastFrame = time;

      const zoom = map.getZoom();
      for (const snapshot of snapshotsRef.current) {
        const handle = handles.get(snapshot.noradId);
        if (!handle) continue;
        const point = map.project([snapshot.longitude, snapshot.latitude]);
        const altitudePixels = Math.min(
          34,
          Math.max(7, (snapshot.altitudeKm / 95) * 2 ** ((zoom - 3) * 0.23)),
        );
        const targetX = point.x;
        const targetY = point.y - altitudePixels;
        if (!Number.isFinite(handle.screenX)) {
          handle.screenX = targetX;
          handle.screenY = targetY;
        } else {
          handle.screenX += (targetX - handle.screenX) * 0.16;
          handle.screenY += (targetY - handle.screenY) * 0.16;
        }

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
        const scale = Math.min(3.4, Math.max(1.7, 1.6 + zoom * 0.15));
        handle.group.position.set(handle.screenX, handle.screenY, 4);
        handle.group.scale.setScalar(scale * (selected ? 1.12 : 1));
        handle.group.rotation.z = (-snapshot.bearing * Math.PI) / 180;
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
