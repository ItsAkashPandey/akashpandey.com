import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
} from "maplibre-gl";
import { MercatorCoordinate } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type TrafficKind = "plane" | "drone" | "satellite";
type RoutePoint = [longitude: number, latitude: number, altitude: number];

type RoutePlan = {
  points: RoutePoint[];
  duration: number;
  gap: number;
};

type TrafficItem = {
  kind: TrafficKind;
  slot: number;
  group: THREE.Group;
  routes: RoutePlan[];
  routeIndex: number;
  startedAt: number;
  passes: number;
  cycle: number;
};

type TrafficPose = {
  item: TrafficItem;
  coordinate: MercatorCoordinate;
  heading: number;
  scale: number;
  visible: boolean;
};

const TRAFFIC_LAYER_ID = "research-traffic-3d";

const modelSources: Record<TrafficKind, string> = {
  plane: "/models/passenger-aircraft.glb",
  drone: "/models/survey-drone.glb",
  satellite: "/models/research-satellite.glb",
};

const planeRoutes: RoutePlan[] = [
  {
    points: [
      [77.1, 28.56, 9_800],
      [68.9, 22.4, 10_600],
      [55.36, 25.25, 9_900],
    ],
    duration: 58_000,
    gap: 5_500,
  },
  {
    points: [
      [72.88, 19.08, 10_200],
      [88.2, 15.4, 10_900],
      [103.99, 1.36, 10_100],
    ],
    duration: 72_000,
    gap: 6_500,
  },
  {
    points: [
      [2.55, 49.01, 10_700],
      [39.4, 43.2, 11_100],
      [77.1, 28.56, 10_200],
    ],
    duration: 88_000,
    gap: 7_000,
  },
  {
    points: [
      [139.78, 35.55, 10_500],
      [111.2, 33.5, 11_000],
      [77.1, 28.56, 10_300],
    ],
    duration: 82_000,
    gap: 6_000,
  },
  {
    points: [
      [100.75, 13.69, 9_700],
      [88.4, 15.2, 10_200],
      [77.7, 13.2, 9_600],
    ],
    duration: 54_000,
    gap: 5_000,
  },
  {
    points: [
      [36.93, -1.32, 10_100],
      [54.5, 10.4, 10_700],
      [72.88, 19.08, 10_200],
    ],
    duration: 69_000,
    gap: 7_500,
  },
  {
    points: [
      [-0.46, 51.47, 10_800],
      [-36.2, 53.2, 11_300],
      [-73.78, 40.64, 10_600],
    ],
    duration: 84_000,
    gap: 6_500,
  },
];

function surveyLoop(
  longitude: number,
  latitude: number,
  spread: number,
): RoutePoint[] {
  return [
    [longitude - spread, latitude - spread * 0.55, 118],
    [longitude + spread, latitude - spread * 0.45, 132],
    [longitude + spread * 0.8, latitude + spread * 0.62, 124],
    [longitude - spread * 0.85, latitude + spread * 0.58, 136],
    [longitude - spread, latitude - spread * 0.55, 118],
  ];
}

const droneRoutes: RoutePlan[] = [
  { points: surveyLoop(77.9, 29.86, 0.38), duration: 28_000, gap: 5_000 },
  { points: surveyLoop(77.21, 28.61, 0.42), duration: 30_000, gap: 6_000 },
  { points: surveyLoop(73.86, 18.52, 0.36), duration: 27_000, gap: 5_500 },
  { points: surveyLoop(77.59, 12.97, 0.4), duration: 26_000, gap: 6_500 },
  { points: surveyLoop(78.49, 17.38, 0.44), duration: 29_000, gap: 5_500 },
  { points: surveyLoop(91.74, 26.14, 0.37), duration: 27_000, gap: 7_000 },
];

const satelliteRoutes: RoutePlan[] = [
  {
    points: [
      [-168, -27, 62_000],
      [2, 8, 67_000],
      [168, 43, 62_000],
    ],
    duration: 52_000,
    gap: 8_000,
  },
  {
    points: [
      [-158, 55, 64_000],
      [12, 22, 69_000],
      [162, -18, 64_000],
    ],
    duration: 60_000,
    gap: 9_000,
  },
  {
    points: [
      [-145, 4, 66_000],
      [28, 42, 71_000],
      [155, 8, 65_000],
    ],
    duration: 56_000,
    gap: 7_500,
  },
  {
    points: [
      [-172, 31, 63_000],
      [35, -12, 68_000],
      [171, -42, 63_000],
    ],
    duration: 64_000,
    gap: 10_000,
  },
];

const routesByKind: Record<TrafficKind, RoutePlan[]> = {
  plane: planeRoutes,
  drone: droneRoutes,
  satellite: satelliteRoutes,
};

const targetPixelSize: Record<TrafficKind, number> = {
  // The custom layer renders into MapLibre's high-DPI framebuffer, so these
  // values are deliberately larger than the resulting CSS-pixel footprint.
  plane: 108,
  drone: 54,
  satellite: 76,
};

function createModelShadow(kind: TrafficKind) {
  const shape: Record<TrafficKind, [number, number]> = {
    plane: [0.56, 0.2],
    drone: [0.4, 0.29],
    satellite: [0.48, 0.23],
  };
  const [width, height] = shape[kind];
  const geometry = new THREE.CircleGeometry(0.5, 32);
  geometry.scale(width * 2, height * 2, 1);
  const material = new THREE.MeshBasicMaterial({
    color: kind === "plane" ? 0x0f172a : kind === "drone" ? 0x294d3d : 0x24475b,
    transparent: true,
    opacity: kind === "drone" ? 0.46 : 0.4,
    depthTest: false,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(geometry, material);
  shadow.name = `${kind}-soft-shadow`;
  shadow.position.set(0.07, 0.1, -0.18);
  shadow.renderOrder = -10;
  shadow.frustumCulled = false;
  return shadow;
}

function preparePrototype(source: THREE.Object3D, kind: TrafficKind) {
  const root = source.clone(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const centre = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const largestDimension = Math.max(size.x, size.y, size.z, 0.001);

  // Centre before normalising so large source-space offsets are scaled too.
  // Applying both transforms directly on `root` leaves its translation
  // unscaled (Object3D uses T·R·S), which can push an otherwise loaded model
  // well outside the map viewport.
  root.position.copy(centre).multiplyScalar(-1);
  const normalised = new THREE.Group();
  normalised.scale.setScalar(1 / largestDimension);
  normalised.add(root);
  const oriented = new THREE.Group();
  oriented.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  oriented.add(normalised);

  root.traverse((object) => {
    object.frustumCulled = false;
    if (!(object instanceof THREE.Mesh)) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const adjusted = materials.map((material) => {
      const clone = material.clone();
      if (clone instanceof THREE.MeshStandardMaterial) {
        const tint = new THREE.Color(
          kind === "plane" ? 0x64748b : kind === "drone" ? 0x3f6f5f : 0x315d78,
        );
        clone.color.lerp(tint, kind === "plane" ? 0.28 : 0.22);
        clone.roughness = Math.max(0.52, clone.roughness);
        clone.metalness = Math.min(0.48, clone.metalness + 0.06);
        clone.emissive.set(kind === "satellite" ? 0x071525 : 0x090d14);
        clone.emissiveIntensity = 0.06;
      }
      clone.depthTest = false;
      clone.depthWrite = false;
      return clone;
    });
    object.material = Array.isArray(object.material) ? adjusted : adjusted[0];
  });

  const holder = new THREE.Group();
  holder.name = `${kind}-model`;
  holder.add(createModelShadow(kind));
  holder.add(oriented);
  return holder;
}

function loadPrototype(loader: GLTFLoader, kind: TrafficKind) {
  return new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      modelSources[kind],
      (gltf) => resolve(preparePrototype(gltf.scene, kind)),
      undefined,
      reject,
    );
  });
}

function interpolateRoute(
  route: RoutePoint[],
  progress: number,
  passes: number,
) {
  const repeatedProgress = Math.min(0.999999, progress) * passes;
  const passProgress = repeatedProgress - Math.floor(repeatedProgress);
  const segmentLengths = route.slice(0, -1).map((point, index) => {
    const next = route[index + 1];
    const meanLatitude = ((point[1] + next[1]) * Math.PI) / 360;
    return Math.hypot(
      (next[0] - point[0]) * Math.cos(meanLatitude),
      next[1] - point[1],
    );
  });
  const totalLength = Math.max(
    0.000001,
    segmentLengths.reduce((total, length) => total + length, 0),
  );
  const targetDistance = passProgress * totalLength;
  let travelled = 0;
  let index = 0;
  for (; index < segmentLengths.length - 1; index++) {
    if (travelled + segmentLengths[index] >= targetDistance) break;
    travelled += segmentLengths[index];
  }
  const localProgress = Math.min(
    1,
    Math.max(
      0,
      (targetDistance - travelled) / Math.max(0.000001, segmentLengths[index]),
    ),
  );
  const current = route[index];
  const next = route[index + 1];

  return {
    longitude: THREE.MathUtils.lerp(current[0], next[0], localProgress),
    latitude: THREE.MathUtils.lerp(current[1], next[1], localProgress),
    altitude:
      THREE.MathUtils.lerp(current[2], next[2], localProgress) +
      Math.sin(localProgress * Math.PI) * current[2] * 0.045,
  };
}

function nextRoute(item: TrafficItem, now: number) {
  const previous = item.routes[item.routeIndex];
  item.routeIndex =
    (item.routeIndex + item.slot + 1 + item.cycle) % item.routes.length;
  item.startedAt = now + previous.gap + item.slot * 420;
  item.cycle += 1;
}

function updateTrafficItem(
  item: TrafficItem,
  now: number,
  zoom: number,
): TrafficPose | null {
  const route = item.routes[item.routeIndex];
  if (now < item.startedAt) return null;

  const progress = (now - item.startedAt) / route.duration;
  if (progress >= 1) {
    nextRoute(item, now);
    return null;
  }

  const point = interpolateRoute(route.points, progress, item.passes);
  const ahead = interpolateRoute(
    route.points,
    Math.min(0.9995, progress + 0.002),
    item.passes,
  );
  const mercator = MercatorCoordinate.fromLngLat(
    [point.longitude, point.latitude],
    point.altitude,
  );
  const aheadMercator = MercatorCoordinate.fromLngLat(
    [ahead.longitude, ahead.latitude],
    ahead.altitude,
  );
  const heading = Math.atan2(
    -(aheadMercator.y - mercator.y),
    aheadMercator.x - mercator.x,
  );
  const fade = Math.min(1, progress / 0.075, (1 - progress) / 0.09);
  const worldPixels = 512 * 2 ** zoom;
  const scale =
    (targetPixelSize[item.kind] / worldPixels) * Math.max(0.02, fade);
  const visible = item.group.children.length > 0;

  return { item, coordinate: mercator, heading, scale, visible };
}

function createTraffic(now: number) {
  const traffic: TrafficItem[] = [];
  const counts: Record<TrafficKind, number> = {
    plane: 3,
    drone: 2,
    satellite: 2,
  };
  const phases: Record<TrafficKind, number[]> = {
    plane: [0.46, 0.55, 0.42],
    drone: [0.18, 0.63],
    satellite: [0.62, 0.82],
  };
  const initialRoutes: Record<TrafficKind, number[]> = {
    plane: [0, 4, 1],
    drone: [0, 3],
    satellite: [1, 2],
  };

  (Object.keys(counts) as TrafficKind[]).forEach((kind) => {
    for (let slot = 0; slot < counts[kind]; slot++) {
      const routes = routesByKind[kind];
      const routeIndex = initialRoutes[kind][slot] % routes.length;
      traffic.push({
        kind,
        slot,
        group: new THREE.Group(),
        routes,
        routeIndex,
        startedAt: now - routes[routeIndex].duration * phases[kind][slot],
        passes: kind === "drone" ? 2 : 1,
        cycle: 0,
      });
    }
  });

  return traffic;
}

export function createResearchTrafficLayer(): CustomLayerInterface {
  let map: MapLibreMap;
  let camera: THREE.Camera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let traffic: TrafficItem[] = [];
  let disposed = false;

  return {
    id: TRAFFIC_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(nextMap, gl) {
      map = nextMap;
      camera = new THREE.Camera();
      scene = new THREE.Scene();
      traffic = createTraffic(performance.now());

      scene.add(new THREE.HemisphereLight(0xe6edf5, 0x263548, 2.25));
      const keyLight = new THREE.DirectionalLight(0xfff7e8, 2.6);
      keyLight.position.set(-0.45, -0.75, 1.6).normalize();
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x8fc9ed, 1.35);
      rimLight.position.set(0.8, 0.35, 0.8).normalize();
      scene.add(rimLight);
      traffic.forEach((item) => scene.add(item.group));

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
        alpha: true,
      });
      renderer.autoClear = false;
      map.getCanvas().dataset.researchTraffic = "models-loading";

      const loader = new GLTFLoader();
      void Promise.all(
        (Object.keys(modelSources) as TrafficKind[]).map(async (kind) => {
          const prototype = await loadPrototype(loader, kind);
          if (disposed) return;
          traffic
            .filter((item) => item.kind === kind)
            .forEach((item) => item.group.add(prototype.clone(true)));
        }),
      )
        .then(() => {
          if (disposed) return;
          map.getCanvas().dataset.researchTraffic = "ready";
          map.triggerRepaint();
        })
        .catch((error) => {
          console.error("Unable to load research traffic models", error);
          if (!disposed) {
            map.getCanvas().dataset.researchTraffic = "model-error";
          }
        });
    },
    render(_gl, options: CustomRenderMethodInput) {
      const zoom = map.getZoom();
      const now = performance.now();
      const poses = traffic
        .map((item) => updateTrafficItem(item, now, zoom))
        .filter((pose): pose is TrafficPose => Boolean(pose));
      const mapMatrix = new THREE.Matrix4().fromArray(
        options.defaultProjectionData.mainMatrix,
      );
      const visibleCounts: Record<TrafficKind, number> = {
        plane: 0,
        drone: 0,
        satellite: 0,
      };

      traffic.forEach((item) => {
        item.group.visible = false;
      });

      for (const pose of poses) {
        if (!pose.visible) continue;
        visibleCounts[pose.item.kind] += 1;

        const rotation = new THREE.Matrix4().makeRotationZ(pose.heading);
        const modelMatrix = new THREE.Matrix4()
          .makeTranslation(
            pose.coordinate.x,
            pose.coordinate.y,
            pose.coordinate.z,
          )
          .scale(new THREE.Vector3(pose.scale, -pose.scale, pose.scale))
          .multiply(rotation);

        const model = pose.item.group.children[0];
        if (model && pose.item.kind === "satellite") {
          model.rotation.z = now * 0.00008 + pose.item.slot * 0.7;
          model.rotation.y = Math.sin(now * 0.00012 + pose.item.slot) * 0.18;
        }

        pose.item.group.visible = true;
        camera.projectionMatrix = mapMatrix.clone().multiply(modelMatrix);
        renderer.resetState();
        renderer.render(scene, camera);
        pose.item.group.visible = false;
      }

      map.getCanvas().dataset.researchTrafficFrame = String(Math.round(now));
      map.getCanvas().dataset.researchTrafficVisible = `${visibleCounts.plane}/${visibleCounts.drone}/${visibleCounts.satellite}`;
      map.triggerRepaint();
    },
    onRemove() {
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const nextMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        nextMaterials.forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer?.dispose();
      delete map?.getCanvas().dataset.researchTraffic;
      delete map?.getCanvas().dataset.researchTrafficFrame;
      delete map?.getCanvas().dataset.researchTrafficVisible;
      traffic = [];
    },
  };
}

export const researchTrafficLayerId = TRAFFIC_LAYER_ID;
