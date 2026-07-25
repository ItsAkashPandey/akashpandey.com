import type { IconType } from "react-icons";
import {
  SiArcgis,
  SiAutocad,
  SiAutodeskrevit,
  SiDji,
  SiGoogleearthengine,
  SiQgis,
  SiR,
  SiTrimble,
} from "react-icons/si";

const brandIcons: Record<
  string,
  { Icon: IconType; color: string; label?: string }
> = {
  "DJI Matrice 100": { Icon: SiDji, color: "#374151" },
  "Trimble DA2": { Icon: SiTrimble, color: "#F3B61F" },
  R: { Icon: SiR, color: "#276DC3" },
  "Google Earth Engine": { Icon: SiGoogleearthengine, color: "#4285F4" },
  QGIS: { Icon: SiQgis, color: "#78A22F" },
  "ArcGIS Pro": { Icon: SiArcgis, color: "#007AC2" },
  "AutoCAD 3D": { Icon: SiAutocad, color: "#E51E25" },
  Revit: { Icon: SiAutodeskrevit, color: "#186B9E" },
};

export default function SkillGlyph({ name }: { name: string }) {
  const brand = brandIcons[name];
  if (brand) {
    const { Icon, color } = brand;
    return (
      <Icon
        aria-hidden
        className="size-[58%] transition-transform duration-300 group-hover/tool:scale-105"
        style={{ color }}
      />
    );
  }

  switch (name) {
    case "IdeaForge Q6":
      return <DroneGlyph color="#E56B1F" fixedWing={false} />;
    case "Trinity F90+":
      return <DroneGlyph color="#3156B8" fixedWing />;
    case "Agri-Spray Drone":
      return <SprayDroneGlyph />;
    case "PhenoCam":
      return <PhenoCamGlyph />;
    case "AWS":
      return <WeatherStationGlyph />;
    case "Spectroradiometer":
    case "Spectroradiometer SVC":
      return <SpectroradiometerGlyph />;
    case "FARO TLS":
      return <ScannerGlyph />;
    case "Emlid Reach":
    case "Emlid Reach RS2/RS3":
      return <GnssGlyph color="#2088D1" accent="#D9F0FF" />;
    case "Sokkia GRX2":
      return <GnssGlyph color="#C52B32" accent="#F6D7D9" />;
    case "Total Station":
      return <SurveyGlyph color="#4B6472" variant="station" />;
    case "Analytical Theodolite":
      return <SurveyGlyph color="#775548" variant="theodolite" />;
    case "Digital Level":
      return <SurveyGlyph color="#343A40" variant="level" />;
    case "Python":
      return <PythonGlyph />;
    case "LaTeX":
      return <LatexGlyph />;
    case "ERDAS IMAGINE":
      return <ErdasGlyph />;
    case "ENVI":
      return <EnviGlyph />;
    case "Pix4D Mapper":
      return <WordGlyph word="PIX4D" color="#D8242F" />;
    case "FARO Scene":
      return <FaroSceneGlyph />;
    case "CloudCompare":
      return <CloudCompareGlyph />;
    case "STAAD.Pro":
      return <StaadGlyph />;
    default:
      return (
        <WordGlyph word={name.slice(0, 6).toUpperCase()} color="#475569" />
      );
  }
}

function DroneGlyph({
  color,
  fixedWing,
}: {
  color: string;
  fixedWing: boolean;
}) {
  if (fixedWing) {
    return (
      <svg viewBox="0 0 72 52" className="h-[66%] w-[72%]" aria-hidden>
        <path
          d="M5 31.5 31 19l5-12 5 12 26 12-2.5 7-22-5.2-2 11.2h-9l-2-11.2L7.5 38Z"
          fill={color}
        />
        <path d="M33 21h6l4 9-7 4-7-4Z" fill="#DCE6FA" />
        <circle cx="17" cy="35" r="3.2" fill="#0F172A" opacity=".6" />
        <circle cx="55" cy="35" r="3.2" fill="#0F172A" opacity=".6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 72 52" className="h-[68%] w-[74%]" aria-hidden>
      <g fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round">
        <path d="m27 24-12-9M45 24l12-9M27 29l-12 9M45 29l12 9" />
        <circle cx="10" cy="11" r="7" />
        <circle cx="62" cy="11" r="7" />
        <circle cx="10" cy="41" r="7" />
        <circle cx="62" cy="41" r="7" />
      </g>
      <path d="M27 21h18l4 6-4 7H27l-4-7Z" fill={color} />
      <circle cx="36" cy="28" r="3" fill="#FDE68A" />
    </svg>
  );
}

function SprayDroneGlyph() {
  return (
    <svg viewBox="0 0 72 56" className="h-[70%] w-[74%]" aria-hidden>
      <g fill="none" stroke="#4C8B3B" strokeWidth="3" strokeLinecap="round">
        <path d="m27 22-13-9M45 22l13-9M27 28l-15 7M45 28l15 7" />
        <ellipse cx="9" cy="10" rx="7" ry="3.5" />
        <ellipse cx="63" cy="10" rx="7" ry="3.5" />
      </g>
      <path d="M26 19h20l3 8-5 8H28l-5-8Z" fill="#5E973D" />
      <path d="M29 35h14v7H29Z" fill="#D49A3A" />
      <path d="M21 42h30" stroke="#4C8B3B" strokeWidth="2.5" />
      <g fill="#38A7D8">
        <path d="M24 44c2 3 2 5 0 7-2-2-2-4 0-7Z" />
        <path d="M36 44c2 3 2 5 0 7-2-2-2-4 0-7Z" />
        <path d="M48 44c2 3 2 5 0 7-2-2-2-4 0-7Z" />
      </g>
    </svg>
  );
}

function PhenoCamGlyph() {
  return (
    <svg viewBox="0 0 64 56" className="h-[70%] w-[72%]" aria-hidden>
      <path
        d="M15 15h34a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5V20a5 5 0 0 1 5-5Z"
        fill="#2F6D4F"
      />
      <path d="m20 15 4-7h16l4 7Z" fill="#40916C" />
      <circle cx="32" cy="32" r="11" fill="#E8F4EC" />
      <circle cx="32" cy="32" r="7" fill="#5E9B68" />
      <path
        d="M31 36c-5-2-6-7-3-11 4 1 7 4 7 8 0 3-1 5-4 7 0-3 0-5 2-8-2 1-3 2-4 4Z"
        fill="#DCEB7C"
      />
      <circle cx="49" cy="20" r="2" fill="#F4C95D" />
    </svg>
  );
}

function WeatherStationGlyph() {
  return (
    <svg viewBox="0 0 64 58" className="h-[72%] w-[72%]" aria-hidden>
      <path
        d="M31 14v38M20 52h22M25 52l6-12 7 12"
        fill="none"
        stroke="#5B6573"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M21 22h20M26 29h10"
        stroke="#5B6573"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M19 19c-6 0-6-9 0-9 2-6 11-5 12 1 6-1 8 8 2 8Z" fill="#8FC6DA" />
      <circle cx="45" cy="12" r="7" fill="#E9B949" />
      <path d="M43 28h10l-2 10h-6Z" fill="#D47732" />
      <path d="M48 38v6" stroke="#5B6573" strokeWidth="2" />
    </svg>
  );
}

function SpectroradiometerGlyph() {
  return (
    <svg viewBox="0 0 68 56" className="h-[72%] w-[76%]" aria-hidden>
      <path
        d="M9 15h27a5 5 0 0 1 5 5v27H9a5 5 0 0 1-5-5V20a5 5 0 0 1 5-5Z"
        fill="#4B5563"
      />
      <rect x="10" y="21" width="19" height="11" rx="2" fill="#D7F1F5" />
      <path
        d="M15 42h14"
        stroke="#CBD5E1"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M41 24h8l5-6"
        fill="none"
        stroke="#4B5563"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="m48 27 16-13" stroke="#EA4C4C" strokeWidth="2.6" />
      <path d="m49 29 16-7" stroke="#F59E0B" strokeWidth="2.6" />
      <path d="m49 32 16 0" stroke="#84CC16" strokeWidth="2.6" />
      <path d="m49 35 16 7" stroke="#0EA5E9" strokeWidth="2.6" />
      <path d="m48 37 16 13" stroke="#6366F1" strokeWidth="2.6" />
    </svg>
  );
}

function ScannerGlyph() {
  return (
    <svg viewBox="0 0 64 58" className="h-[74%] w-[70%]" aria-hidden>
      <path d="M22 8h20l5 8-3 20H20l-3-20Z" fill="#2F5BBB" />
      <rect x="22" y="13" width="20" height="9" rx="2" fill="#D9E8FF" />
      <circle cx="32" cy="29" r="4.5" fill="#34B5D9" />
      <path
        d="M26 36 15 54M38 36l11 18M32 36v18"
        stroke="#475569"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M48 15c5 4 5 13 0 17M53 11c8 7 8 20 0 27"
        fill="none"
        stroke="#34B5D9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GnssGlyph({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 64 58" className="h-[72%] w-[70%]" aria-hidden>
      <path d="M18 24c0-10 6-16 14-16s14 6 14 16Z" fill={color} />
      <rect
        x="16"
        y="23"
        width="32"
        height="9"
        rx="3"
        fill={accent}
        stroke={color}
        strokeWidth="2.5"
      />
      <path d="M25 32h14l-2 12H27Z" fill={color} />
      <path
        d="M32 44v11"
        stroke="#4B5563"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 13c3-5 13-5 16 0M20 8c6-8 18-8 24 0"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".68"
      />
    </svg>
  );
}

function SurveyGlyph({
  color,
  variant,
}: {
  color: string;
  variant: "station" | "theodolite" | "level";
}) {
  const body =
    variant === "level" ? (
      <path d="M10 18h42l6 8-6 8H10l-5-8Z" fill={color} />
    ) : (
      <>
        <path d="M17 14h31l7 7-7 8H17l-7-8Z" fill={color} />
        <circle
          cx="50"
          cy="21.5"
          r="8"
          fill="#DCE7EB"
          stroke={color}
          strokeWidth="3"
        />
      </>
    );

  return (
    <svg viewBox="0 0 64 58" className="h-[72%] w-[72%]" aria-hidden>
      {body}
      <rect
        x="25"
        y="31"
        width="14"
        height="8"
        rx="2"
        fill={color}
        opacity=".86"
      />
      <path
        d="M27 38 13 55M37 38l14 17M32 39v16"
        stroke={color}
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      {variant === "theodolite" && <path d="m27 13 5-6 5 6Z" fill="#D6A56C" />}
      {variant === "level" && <circle cx="22" cy="26" r="3" fill="#A3E635" />}
    </svg>
  );
}

function PythonGlyph() {
  return (
    <svg viewBox="0 0 64 56" className="h-[68%] w-[68%]" aria-hidden>
      <path
        d="M31 5C19 5 18 10 18 18v5h15v4H13c-8 0-10 6-10 13s4 11 10 11h8v-8c0-8 5-12 12-12h13c7 0 12-5 12-12v-4C58 8 52 5 45 5Z"
        fill="#3776AB"
      />
      <circle cx="24" cy="13" r="2" fill="white" />
      <path
        d="M33 51c12 0 13-5 13-13v-5H31v-4h20c8 0 10-6 10-13S57 5 51 5h-8v8c0 8-5 12-12 12H18C11 25 6 30 6 37v4c0 7 6 10 13 10Z"
        fill="#FFD343"
        opacity=".98"
      />
      <circle cx="40" cy="43" r="2" fill="white" />
    </svg>
  );
}

function LatexGlyph() {
  return (
    <svg viewBox="0 0 76 52" className="h-[68%] w-[78%]" aria-hidden>
      <text
        x="38"
        y="34"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="24"
        fontWeight="700"
        fill="#087F7B"
      >
        LaTeX
      </text>
      <path
        d="M14 41h48"
        stroke="#42A5A1"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ErdasGlyph() {
  return (
    <svg viewBox="0 0 72 54" className="h-[68%] w-[74%]" aria-hidden>
      <g fill="#C61D34">
        <rect x="6" y="7" width="22" height="17" rx="2" opacity=".9" />
        <rect x="30" y="7" width="13" height="17" rx="2" opacity=".65" />
        <rect x="45" y="7" width="21" height="17" rx="2" opacity=".4" />
        <rect x="6" y="26" width="13" height="17" rx="2" opacity=".45" />
        <rect x="21" y="26" width="25" height="17" rx="2" opacity=".75" />
        <rect x="48" y="26" width="18" height="17" rx="2" />
      </g>
      <text
        x="36"
        y="51"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="8"
        fontWeight="700"
        fill="#7F1D1D"
      >
        ERDAS
      </text>
    </svg>
  );
}

function EnviGlyph() {
  return (
    <svg viewBox="0 0 76 54" className="h-[70%] w-[78%]" aria-hidden>
      <text
        x="38"
        y="31"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="23"
        fontWeight="800"
        fill="#126783"
      >
        ENVI
      </text>
      <path
        d="M8 39c10-11 18 11 29 0s19 10 31-1"
        fill="none"
        stroke="#22A06B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8 44c10-9 19 8 29 0s20 7 31-1"
        fill="none"
        stroke="#E4A11B"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".85"
      />
    </svg>
  );
}

function WordGlyph({ word, color }: { word: string; color: string }) {
  return (
    <svg viewBox="0 0 82 52" className="h-[68%] w-[80%]" aria-hidden>
      <text
        x="41"
        y="33"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={word.length > 5 ? 15 : 21}
        fontWeight="800"
        fill={color}
      >
        {word}
      </text>
      <path
        d="M15 40h52"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".36"
      />
    </svg>
  );
}

function FaroSceneGlyph() {
  return (
    <svg viewBox="0 0 78 54" className="h-[70%] w-[78%]" aria-hidden>
      <text
        x="32"
        y="29"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="20"
        fontWeight="800"
        fill="#2856B6"
      >
        FARO
      </text>
      <g fill="#34B5D9">
        <circle cx="57" cy="14" r="2" />
        <circle cx="65" cy="19" r="2.5" />
        <circle cx="58" cy="26" r="1.8" />
        <circle cx="69" cy="30" r="2" />
        <circle cx="60" cy="36" r="2.6" />
        <circle cx="50" cy="39" r="1.8" />
      </g>
      <path
        d="M9 38h36"
        stroke="#2856B6"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".45"
      />
    </svg>
  );
}

function CloudCompareGlyph() {
  return (
    <svg viewBox="0 0 72 56" className="h-[72%] w-[76%]" aria-hidden>
      <g fill="#2774B8">
        <circle cx="18" cy="17" r="3" />
        <circle cx="26" cy="12" r="2.5" />
        <circle cx="31" cy="20" r="3.4" />
        <circle cx="14" cy="27" r="2.5" />
        <circle cx="25" cy="29" r="3" />
        <circle cx="35" cy="13" r="2" />
      </g>
      <g fill="#E17A22">
        <circle cx="42" cy="32" r="3.2" />
        <circle cx="52" cy="25" r="2.7" />
        <circle cx="59" cy="34" r="3" />
        <circle cx="48" cy="42" r="3.4" />
        <circle cx="60" cy="45" r="2.2" />
        <circle cx="37" cy="44" r="2.6" />
      </g>
      <path
        d="M29 37 43 22"
        stroke="#64748B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

function StaadGlyph() {
  return (
    <svg viewBox="0 0 74 56" className="h-[72%] w-[76%]" aria-hidden>
      <g fill="none" stroke="#19727A" strokeWidth="3.2" strokeLinejoin="round">
        <path d="M11 42h52M16 42V13h42v29M16 25h42M29 13v29M45 13v29" />
        <path d="m16 13 13 12 16-12 13 12" opacity=".52" />
      </g>
      <rect x="24" y="35" width="26" height="14" rx="7" fill="#E7F3F1" />
      <text
        x="37"
        y="45"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontWeight="800"
        fill="#155E75"
      >
        STAAD
      </text>
    </svg>
  );
}
