"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const routeNames = new Set([
  "home",
  "activities",
  "publications",
  "skills",
  "contact",
  "privacy",
]);

const routeColors: Record<string, [number, number]> = {
  home: [0x287d78, 0x9c633a],
  activities: [0x397a62, 0x527c8b],
  publications: [0x3f728d, 0x8a6258],
  skills: [0x9a6f37, 0x3d7882],
  contact: [0x387984, 0x8b5b66],
  privacy: [0x66717e, 0x526f68],
};

function line(
  points: THREE.Vector3[],
  color: number,
  opacity = 0.55,
  closed = false,
) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    closed ? [...points, points[0]] : points,
  );
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    }),
  );
}

function wireMesh(
  geometry: THREE.BufferGeometry,
  color: number,
  opacity = 0.34,
) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      wireframe: true,
    }),
  );
}

function addSatellite(group: THREE.Group, color: number) {
  const satellite = new THREE.Group();
  satellite.add(wireMesh(new THREE.BoxGeometry(0.55, 0.75, 0.5), color, 0.7));
  const left = wireMesh(new THREE.BoxGeometry(1.25, 0.45, 0.08), color, 0.5);
  const right = left.clone();
  left.position.x = -0.95;
  right.position.x = 0.95;
  satellite.add(left, right);
  satellite.rotation.set(0.45, -0.35, 0.12);
  group.add(satellite);
}

function buildHome(left: THREE.Group, right: THREE.Group, colors: number[]) {
  for (let index = 0; index < 3; index += 1) {
    const orbit = wireMesh(
      new THREE.TorusGeometry(1.25 + index * 0.52, 0.018, 5, 80),
      colors[0],
      0.28,
    );
    orbit.rotation.x = 1.1 + index * 0.15;
    orbit.rotation.y = index * 0.42;
    left.add(orbit);
  }
  addSatellite(left, colors[1]);

  const swaths = Array.from(
    { length: 7 },
    (_, index) =>
      new THREE.Vector3(
        Math.sin(index * 0.75) * 0.8,
        2.5 - index * 0.82,
        Math.cos(index * 0.55) * 0.35,
      ),
  );
  right.add(line(swaths, colors[0], 0.65));
  for (const point of swaths) {
    const marker = wireMesh(
      new THREE.OctahedronGeometry(0.1, 0),
      colors[1],
      0.55,
    );
    marker.position.copy(point);
    right.add(marker);
  }
}

function buildActivities(
  left: THREE.Group,
  right: THREE.Group,
  colors: number[],
) {
  const grid = new THREE.GridHelper(5.5, 11, colors[0], colors[0]);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  grid.rotation.x = 0.25;
  left.add(grid);

  const route = Array.from({ length: 28 }, (_, index) => {
    const progress = index / 27;
    return new THREE.Vector3(
      Math.sin(progress * Math.PI * 2.4) * 1.7,
      2.6 - progress * 5.2,
      Math.sin(progress * Math.PI) * 0.8,
    );
  });
  right.add(line(route, colors[1], 0.72));
  for (let index = 0; index < route.length; index += 4) {
    const point = wireMesh(
      new THREE.IcosahedronGeometry(0.12, 0),
      colors[0],
      0.62,
    );
    point.position.copy(route[index]);
    right.add(point);
  }
}

function buildPublications(
  left: THREE.Group,
  right: THREE.Group,
  colors: number[],
) {
  for (let index = 0; index < 6; index += 1) {
    const page = wireMesh(
      new THREE.BoxGeometry(2.25, 0.12, 1.45),
      colors[index % 2],
      0.28 + index * 0.035,
    );
    page.position.y = -1.2 + index * 0.42;
    page.rotation.y = -0.3 + index * 0.08;
    page.rotation.z = -0.08 + index * 0.025;
    left.add(page);
  }

  const helix = Array.from({ length: 80 }, (_, index) => {
    const progress = index / 79;
    return new THREE.Vector3(
      Math.cos(progress * Math.PI * 7) * (0.55 + progress),
      2.8 - progress * 5.6,
      Math.sin(progress * Math.PI * 7) * 0.35,
    );
  });
  right.add(line(helix, colors[0], 0.52));
}

function buildSkills(left: THREE.Group, right: THREE.Group, colors: number[]) {
  const axes = [
    [1, 0.15, 0.3],
    [0.2, 1, 0.45],
    [0.45, 0.1, 1],
  ];
  axes.forEach((axis, index) => {
    const ring = wireMesh(
      new THREE.TorusGeometry(1.15 + index * 0.38, 0.055, 5, 48),
      colors[index % 2],
      0.4,
    );
    ring.rotation.set(axis[0], axis[1], axis[2]);
    left.add(ring);
  });

  for (let index = 0; index < 5; index += 1) {
    const prism = wireMesh(
      new THREE.CylinderGeometry(0.45, 0.7, 0.95, 6),
      colors[index % 2],
      0.42,
    );
    prism.position.set(
      Math.sin(index * 1.7) * 1.15,
      2.1 - index * 1.05,
      Math.cos(index) * 0.3,
    );
    prism.rotation.z = index * 0.28;
    right.add(prism);
  }
}

function buildContact(left: THREE.Group, right: THREE.Group, colors: number[]) {
  [0.8, 1.35, 1.9, 2.45].forEach((radius, index) => {
    const signal = wireMesh(
      new THREE.TorusGeometry(radius, 0.025, 4, 70, Math.PI * 1.2),
      colors[index % 2],
      0.38,
    );
    signal.rotation.z = -0.95;
    left.add(signal);
  });
  const points = Array.from({ length: 9 }, (_, index) => {
    const angle = (index / 9) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * 1.65,
      Math.sin(angle) * 2.2,
      Math.sin(angle * 2) * 0.4,
    );
  });
  right.add(line(points, colors[0], 0.55, true));
}

function buildPrivacy(left: THREE.Group, right: THREE.Group, colors: number[]) {
  left.add(wireMesh(new THREE.OctahedronGeometry(1.75, 1), colors[0], 0.38));
  const core = wireMesh(new THREE.IcosahedronGeometry(0.7, 1), colors[1], 0.52);
  left.add(core);

  for (let index = 0; index < 4; index += 1) {
    const ring = wireMesh(
      new THREE.TorusGeometry(0.7 + index * 0.48, 0.025, 5, 70),
      colors[index % 2],
      0.34,
    );
    ring.rotation.x = 1.05;
    ring.position.y = -1.35 + index * 0.9;
    right.add(ring);
  }
}

function buildScene(route: string, scene: THREE.Scene) {
  const colors = routeColors[route] ?? routeColors.home;
  const left = new THREE.Group();
  const right = new THREE.Group();
  left.userData.side = -1;
  right.userData.side = 1;
  scene.add(left, right);

  switch (route) {
    case "activities":
      buildActivities(left, right, colors);
      break;
    case "publications":
      buildPublications(left, right, colors);
      break;
    case "skills":
      buildSkills(left, right, colors);
      break;
    case "contact":
      buildContact(left, right, colors);
      break;
    case "privacy":
      buildPrivacy(left, right, colors);
      break;
    default:
      buildHome(left, right, colors);
  }
  return { left, right };
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }
  });
}

export default function ResearchEdges() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const segment = pathname.split("/").filter(Boolean)[0] ?? "home";
  const route = routeNames.has(segment) ? segment : "home";

  useEffect(() => {
    const root = rootRef.current;
    const wide = window.matchMedia("(min-width: 1536px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !wide.matches || reducedMotion.matches) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.dataset.researchScene = route;
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;opacity:.62";
    root.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, -20, 20);
    camera.position.z = 10;
    const { left, right } = buildScene(route, scene);

    let targetScroll = window.scrollY;
    let currentScroll = targetScroll;
    let animationFrame = 0;
    let lastFrame = 0;

    const resize = () => {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      const aspect = width / height;
      renderer.setSize(width, height, false);
      camera.left = -5 * aspect;
      camera.right = 5 * aspect;
      camera.top = 5;
      camera.bottom = -5;
      camera.updateProjectionMatrix();

      const unitsPerPixel = 10 / height;
      const gutterPixels = Math.max(80, (width - 1_280) / 2);
      const contentHalfWidth = Math.min(640, width / 2) * unitsPerPixel;
      const gutterCenter = (gutterPixels / 2) * unitsPerPixel;
      const edgeScale = Math.min(1, Math.max(0.46, gutterPixels / 300));
      left.position.x = -contentHalfWidth - gutterCenter;
      right.position.x = contentHalfWidth + gutterCenter;
      left.scale.setScalar(edgeScale);
      right.scale.setScalar(edgeScale);
    };
    const updateScroll = () => {
      targetScroll = window.scrollY;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScroll, { passive: true });

    const render = (time: number) => {
      animationFrame = window.requestAnimationFrame(render);
      if (document.visibilityState === "hidden" || time - lastFrame < 32)
        return;
      lastFrame = time;
      currentScroll += (targetScroll - currentScroll) * 0.08;
      const progress = currentScroll / Math.max(1, document.body.scrollHeight);
      left.rotation.y = progress * Math.PI * 1.4;
      left.rotation.z = progress * 0.45;
      right.rotation.y = -progress * Math.PI * 1.6;
      right.rotation.z = -progress * 0.36;
      left.position.y = Math.sin(progress * Math.PI * 3) * 0.7;
      right.position.y = Math.cos(progress * Math.PI * 2.5) * 0.72;
      renderer.render(scene, camera);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [route]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <div
      ref={rootRef}
      className="research-edges"
      data-route={route}
      aria-hidden="true"
    />
  );
}
