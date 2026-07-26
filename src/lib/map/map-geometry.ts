const EARTH_RADIUS_KM = 6_371.0088;

type Coordinate = [longitude: number, latitude: number];

const toRadians = (value: number) => (value * Math.PI) / 180;
const toDegrees = (value: number) => (value * 180) / Math.PI;

export function distanceKm(first: Coordinate, second: Coordinate) {
  const latitudeDelta = toRadians(second[1] - first[1]);
  const longitudeDelta = toRadians(second[0] - first[0]);
  const firstLatitude = toRadians(first[1]);
  const secondLatitude = toRadians(second[1]);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
  );
}

function toVector([longitude, latitude]: Coordinate) {
  const phi = toRadians(latitude);
  const lambda = toRadians(longitude);
  return [
    Math.cos(phi) * Math.cos(lambda),
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi),
  ] as const;
}

function fromVector([x, y, z]: readonly number[]): Coordinate {
  return [
    toDegrees(Math.atan2(y, x)),
    toDegrees(Math.atan2(z, Math.hypot(x, y))),
  ];
}

export function greatCirclePoints(
  first: Coordinate,
  second: Coordinate,
  steps = 72,
) {
  const a = toVector(first);
  const b = toVector(second);
  const dot = Math.min(
    1,
    Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]),
  );
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  if (sinOmega < 1e-7) return [first, second];

  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps;
    const firstWeight = Math.sin((1 - progress) * omega) / sinOmega;
    const secondWeight = Math.sin(progress * omega) / sinOmega;
    return fromVector([
      a[0] * firstWeight + b[0] * secondWeight,
      a[1] * firstWeight + b[1] * secondWeight,
      a[2] * firstWeight + b[2] * secondWeight,
    ]);
  });
}

export function greatCircleMidpoint(first: Coordinate, second: Coordinate) {
  return greatCirclePoints(first, second, 2)[1];
}

export function formatDistance(distance: number) {
  return distance < 1
    ? `${Math.round(distance * 1_000)} m`
    : `${Math.round(distance).toLocaleString("en-IN")} km`;
}

export function footprintCircle(
  center: Coordinate,
  radiusKm: number,
  steps = 64,
) {
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const latitude = toRadians(center[1]);
  const longitude = toRadians(center[0]);

  return Array.from({ length: steps + 1 }, (_, index) => {
    const bearing = (index / steps) * Math.PI * 2;
    const targetLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const targetLongitude =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) -
          Math.sin(latitude) * Math.sin(targetLatitude),
      );
    return [
      toDegrees(targetLongitude),
      toDegrees(targetLatitude),
    ] as Coordinate;
  });
}
