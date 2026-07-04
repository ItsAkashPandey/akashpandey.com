import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
} from "maplibre-gl";
import { MercatorCoordinate } from "maplibre-gl";
import * as THREE from "three";

type RoutePoint = [longitude: number, latitude: number, altitude: number];

type TrafficItem = {
  kind: "plane" | "drone" | "satellite";
  route: RoutePoint[];
  duration: number;
  phase: number;
  group: THREE.Group;
};

type TrafficPose = {
  item: TrafficItem;
  coordinate: MercatorCoordinate;
  heading: number;
  scale: number;
  visible: boolean;
};

const TRAFFIC_LAYER_ID = "research-traffic-3d";

const matte = (color: number, roughness = 0.78, metalness = 0.12) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
}

function addGroundShadow(group: THREE.Group, width: number, height: number) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 28),
    new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  shadow.scale.set(width, height, 1);
  shadow.position.set(-2.2, 2.8, -4.4);
  group.add(shadow);
}

function prepareModel(group: THREE.Group) {
  group.traverse((object) => {
    object.frustumCulled = false;
  });
  return group;
}

function createPlane() {
  const group = new THREE.Group();
  const bodyMaterial = matte(0x465569, 0.72, 0.18);
  const lowerMaterial = matte(0x253244, 0.82, 0.12);
  const glassMaterial = matte(0x7aa2b8, 0.34, 0.42);

  const fuselage = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.65, 17, 5, 12),
    bodyMaterial,
  );
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(1.65, 4.6, 18),
    bodyMaterial,
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 11.4;
  group.add(nose);

  const wings = box(8.5, 27, 0.5, lowerMaterial);
  wings.position.x = -0.7;
  group.add(wings);

  const tailWing = box(4.2, 10.5, 0.42, lowerMaterial);
  tailWing.position.x = -9;
  tailWing.position.z = 0.6;
  group.add(tailWing);

  const tail = box(3.7, 0.5, 5, bodyMaterial);
  tail.position.set(-8.9, 0, 2.2);
  tail.rotation.y = -0.24;
  group.add(tail);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(1.32, 16, 10),
    glassMaterial,
  );
  cockpit.scale.set(1.55, 0.72, 0.55);
  cockpit.position.set(8.5, 0, 1.05);
  group.add(cockpit);

  const engineGeometry = new THREE.CylinderGeometry(0.85, 0.96, 3.5, 14);
  for (const y of [-6.8, 6.8]) {
    const engine = new THREE.Mesh(engineGeometry, bodyMaterial);
    engine.rotation.z = Math.PI / 2;
    engine.position.set(0.7, y, -0.8);
    group.add(engine);
  }

  addGroundShadow(group, 13, 5.2);
  return prepareModel(group);
}

function createDrone() {
  const group = new THREE.Group();
  const bodyMaterial = matte(0x39463f, 0.86, 0.08);
  const armMaterial = matte(0x222b28, 0.92, 0.06);
  const rotorMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.68,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });

  const body = box(4.4, 3.2, 1.8, bodyMaterial);
  body.rotation.z = Math.PI / 4;
  group.add(body);

  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const arm = box(10.5, 0.62, 0.52, armMaterial);
    arm.rotation.z = angle;
    group.add(arm);
  }

  for (const [x, y] of [
    [3.7, 3.7],
    [3.7, -3.7],
    [-3.7, 3.7],
    [-3.7, -3.7],
  ]) {
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.74, 0.68, 14),
      bodyMaterial,
    );
    motor.rotation.x = Math.PI / 2;
    motor.position.set(x, y, 0.36);
    group.add(motor);

    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.15, 2.15, 0.08, 28),
      rotorMaterial,
    );
    rotor.rotation.x = Math.PI / 2;
    rotor.position.set(x, y, 0.8);
    group.add(rotor);
  }

  const sensor = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 14, 10),
    matte(0x8b7355, 0.58, 0.2),
  );
  sensor.position.set(1.1, 0, -1.15);
  group.add(sensor);

  addGroundShadow(group, 5.8, 3.4);
  return prepareModel(group);
}

function createSatellite() {
  const group = new THREE.Group();
  const bodyMaterial = matte(0x8a7151, 0.62, 0.28);
  const panelMaterial = matte(0x284961, 0.48, 0.34);
  const frameMaterial = matte(0xb7a47b, 0.52, 0.4);

  const body = box(4.8, 4.8, 4.6, bodyMaterial);
  body.rotation.x = 0.14;
  group.add(body);

  for (const y of [-8.1, 8.1]) {
    const panel = box(3.8, 9.4, 0.28, panelMaterial);
    panel.position.y = y;
    group.add(panel);

    for (const offset of [-1.25, 0, 1.25]) {
      const grid = box(0.08, 9.2, 0.34, frameMaterial);
      grid.position.set(offset, y, 0);
      group.add(grid);
    }
  }

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 3.8, 10),
    frameMaterial,
  );
  mast.rotation.z = Math.PI / 2;
  mast.position.x = 4.2;
  group.add(mast);

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 1.25, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xc7b98f,
      roughness: 0.62,
      metalness: 0.42,
      side: THREE.DoubleSide,
    }),
  );
  dish.rotation.z = -Math.PI / 2;
  dish.position.x = 6;
  group.add(dish);

  addGroundShadow(group, 7.5, 4.2);
  return prepareModel(group);
}

function interpolateRoute(route: RoutePoint[], progress: number) {
  const scaled = progress * route.length;
  const index = Math.floor(scaled) % route.length;
  const nextIndex = (index + 1) % route.length;
  const localProgress = scaled - Math.floor(scaled);
  const eased = localProgress * localProgress * (3 - 2 * localProgress);
  const current = route[index];
  const next = route[nextIndex];

  return {
    longitude: THREE.MathUtils.lerp(current[0], next[0], eased),
    latitude: THREE.MathUtils.lerp(current[1], next[1], eased),
    altitude:
      THREE.MathUtils.lerp(current[2], next[2], eased) +
      Math.sin(localProgress * Math.PI) * current[2] * 0.1,
    nextLongitude: next[0],
    nextLatitude: next[1],
  };
}

function updateTrafficItem(
  item: TrafficItem,
  now: number,
  zoom: number,
): TrafficPose {
  const progress = (((now / item.duration + item.phase) % 1) + 1) % 1;
  const point = interpolateRoute(item.route, progress);
  const mercator = MercatorCoordinate.fromLngLat(
    [point.longitude, point.latitude],
    point.altitude,
  );
  const ahead = MercatorCoordinate.fromLngLat(
    [point.nextLongitude, point.nextLatitude],
    point.altitude,
  );

  const heading = Math.atan2(-(ahead.y - mercator.y), ahead.x - mercator.x);
  const visualCompensation = Math.pow(2, Math.max(2, 16.2 - zoom));
  const kindScale =
    item.kind === "plane" ? 1.08 : item.kind === "drone" ? 1.55 : 1.22;
  const scale =
    mercator.meterInMercatorCoordinateUnits() * visualCompensation * kindScale;
  const visible =
    item.kind === "plane" ||
    (item.kind === "satellite" && zoom < 8.5) ||
    (item.kind === "drone" && zoom >= 8.5);

  return { item, coordinate: mercator, heading, scale, visible };
}

export function createResearchTrafficLayer(): CustomLayerInterface {
  let map: MapLibreMap;
  let camera: THREE.Camera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let traffic: TrafficItem[] = [];

  return {
    id: TRAFFIC_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(nextMap, gl) {
      map = nextMap;
      camera = new THREE.Camera();
      scene = new THREE.Scene();

      scene.add(new THREE.HemisphereLight(0xf4f7fb, 0x263241, 2.2));
      const keyLight = new THREE.DirectionalLight(0xfff7e6, 2.8);
      keyLight.position.set(0.4, -0.8, 1.4);
      scene.add(keyLight);

      traffic = [
        {
          kind: "plane",
          route: [
            [74.2, 28.2, 9300],
            [79.4, 28.8, 10600],
            [82.5, 32.2, 9800],
            [75.6, 32.8, 10400],
          ],
          duration: 46_000,
          phase: 0.17,
          group: createPlane(),
        },
        {
          kind: "satellite",
          route: [
            [71.8, 26.2, 45_000],
            [85.4, 34.1, 45_000],
          ],
          duration: 64_000,
          phase: 0.61,
          group: createSatellite(),
        },
        {
          kind: "drone",
          route: [
            [77.858, 29.827, 115],
            [77.946, 29.846, 128],
            [77.921, 29.909, 105],
            [77.872, 29.893, 122],
          ],
          duration: 29_000,
          phase: 0.34,
          group: createDrone(),
        },
      ];

      traffic.forEach((item) => scene.add(item.group));

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
        alpha: true,
      });
      renderer.autoClear = false;
      map.getCanvas().dataset.researchTraffic = "ready";
    },
    render(_gl, options: CustomRenderMethodInput) {
      const zoom = map.getZoom();
      const now = performance.now();
      const poses = traffic.map((item) => updateTrafficItem(item, now, zoom));
      const mapMatrix = new THREE.Matrix4().fromArray(
        options.defaultProjectionData.mainMatrix,
      );

      traffic.forEach((item) => {
        item.group.visible = false;
      });

      for (const pose of poses) {
        if (!pose.visible) continue;

        const rotation = new THREE.Matrix4().makeRotationZ(pose.heading);
        const modelMatrix = new THREE.Matrix4()
          .makeTranslation(
            pose.coordinate.x,
            pose.coordinate.y,
            pose.coordinate.z,
          )
          .scale(new THREE.Vector3(pose.scale, -pose.scale, pose.scale))
          .multiply(rotation);

        pose.item.group.visible = true;
        camera.projectionMatrix = mapMatrix.clone().multiply(modelMatrix);
        renderer.resetState();
        renderer.render(scene, camera);
        pose.item.group.visible = false;
      }

      map.getCanvas().dataset.researchTrafficFrame = String(
        Math.round(performance.now()),
      );
      map.triggerRepaint();
    },
    onRemove() {
      scene?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer?.dispose();
      delete map?.getCanvas().dataset.researchTraffic;
      delete map?.getCanvas().dataset.researchTrafficFrame;
      traffic = [];
    },
  };
}

export const researchTrafficLayerId = TRAFFIC_LAYER_ID;
