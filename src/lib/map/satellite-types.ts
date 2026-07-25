export type SatelliteOmm = {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number | string;
  ECCENTRICITY: number | string;
  INCLINATION: number | string;
  RA_OF_ASC_NODE: number | string;
  ARG_OF_PERICENTER: number | string;
  MEAN_ANOMALY: number | string;
  EPHEMERIS_TYPE?: 0 | "0";
  CLASSIFICATION_TYPE?: "U" | "C";
  NORAD_CAT_ID: number | string;
  ELEMENT_SET_NO: number | string;
  REV_AT_EPOCH?: number | string;
  BSTAR: number | string;
  MEAN_MOTION_DOT: number | string;
  MEAN_MOTION_DDOT: number | string;
};

export type SatelliteFeed = {
  provider: "CelesTrak";
  mode: "celestrak" | "fallback";
  sourceUrl: string;
  updatedAt: string;
  servedAt: string;
  stale: boolean;
  records: SatelliteOmm[];
};

export type SatelliteSnapshot = {
  noradId: number;
  name: string;
  longitude: number;
  latitude: number;
  altitudeKm: number;
  speedKmS: number;
  bearing: number;
  observedAt: Date;
};
