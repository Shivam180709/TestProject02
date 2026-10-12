import * as THREE from 'three';
import { SolarSystem, PlanetData } from '../types/simulation';

// Texture cache to prevent redundant procedural canvas creation and eliminate lag
const textureCache = new Map<string, THREE.CanvasTexture>();

// Procedural Canvas Texture Builders for High-Fidelity Planets & Celestial Anomalies
export function createPlanetTexture(type: PlanetData['type'], baseColor: string): THREE.CanvasTexture {
  const cacheKey = `${type}_${baseColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 256);

  if (type === 'terran') {
    // Ocean base
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, 512, 256);

    // Continents
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 22; i++) {
      const cx = (i * 26 + 36) % 512;
      const cy = 55 + ((i * 19) % 145);
      const r = 20 + (i % 7) * 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Sub-blobs for coastlines & highlands
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc((cx + 18) % 512, cy - 10, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
    }

    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 22);
    ctx.fillRect(0, 234, 512, 22);

    // Dynamic cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let c = 0; c < 25; c++) {
      const y = 25 + (c * 8);
      const x = (c * 34) % 512;
      ctx.fillRect(x, y, 80 + (c % 5) * 20, 10);
    }
  } else if (type === 'ocean') {
    // Deep Pacific / Bajoran / Pelios azure oceans
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 512, 256);

    // Shimmering turquoise shelf waters
    ctx.fillStyle = '#0284c7';
    for (let i = 0; i < 18; i++) {
      const cx = (i * 31 + 18) % 512;
      const cy = 45 + ((i * 22) % 165);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 35 + (i % 5) * 8, 18, (i * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Tropical island archipelagos
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < 30; i++) {
      const cx = (i * 19 + 60) % 512;
      const cy = 65 + ((i * 15) % 125);
      ctx.beginPath();
      ctx.arc(cx, cy, 4 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sweeping cyclonic hurricane clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
    for (let c = 0; c < 20; c++) {
      const y = 30 + (c * 10);
      const x = (c * 40) % 512;
      ctx.beginPath();
      ctx.arc(x, y, 16 + (c % 4) * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'gas_giant') {
    // Jupiter/Saturn/Ka'Thelan multi-tier atmospheric bands
    const bands = 36;
    for (let b = 0; b < bands; b++) {
      const y = (b / bands) * 256;
      const h = 256 / bands;
      ctx.fillStyle = b % 2 === 0 ? baseColor : '#d97706';
      if (b % 4 === 0) ctx.fillStyle = '#b45309';
      if (b % 6 === 0) ctx.fillStyle = '#fed7aa';
      if (b % 8 === 0) ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, y, 512, h);
    }
    // Great storm vortex
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(210, 155, 38, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (type === 'desert' || type === 'volcanic') {
    // Vulcan / Mars / Cardassia / Qo'noS terrain
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = type === 'volcanic' ? '#7f1d1d' : '#9a3412';
    for (let i = 0; i < 25; i++) {
      const cx = (i * 36) % 512;
      const cy = 30 + (i * 10) % 196;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + (i % 6) * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Craggy magma / canyon fissures
    ctx.strokeStyle = type === 'volcanic' ? '#ef4444' : '#c2410c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      const sx = (i * 34) % 512;
      const sy = (i * 16) % 256;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 65, sy + 32);
      ctx.stroke();
    }
  } else if (type === 'ice') {
    // Andorian glacial cracks & subterranean heat vents
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#e0f2fe';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 23) % 512, (i * 10) % 256, 75, 13);
    }
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 27) % 512, (i * 14) % 256);
      ctx.lineTo(((i * 27) % 512) + 45, ((i * 14) % 256) + 22);
      ctx.stroke();
    }
  } else if (type === 'nebula') {
    // Cosmic gaseous nebula clouds
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);
    const grad = ctx.createRadialGradient(256, 128, 20, 256, 128, 240);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Ion discharges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc((i * 21 + 9) % 512, (i * 12 + 22) % 256, 1.5 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'wormhole') {
    // Swirling Bajoran Wormhole
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 256);

    for (let r = 120; r > 5; r -= 10) {
      ctx.strokeStyle = r % 20 === 0 ? '#38bdf8' : '#a855f7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(256, 128, r * 1.8, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 128, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'moon' || type === 'anomaly') {
    // Craters & impact highlands
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#334155';
    for (let i = 0; i < 28; i++) {
      const cx = (i * 45) % 512;
      const cy = (i * 24) % 256;
      const r = 4 + (i % 8) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Starbase / Outpost metallic hull plates
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#475569';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * 22) % 512, (i * 12) % 256, 3 + (i % 5) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

export const STAR_TREK_SOLAR_SYSTEMS: SolarSystem[] = [
  {
    "id": "sol_system",
    "name": "Sol System (Sector 001)",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Sol (Yellow Dwarf G2V)",
    "spectralType": "Class G",
    "centerCoordinates": [
      0,
      0,
      0
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Capital sector of the United Federation of Planets and Starfleet Command Headquarters.",
    "planets": [
      {
        "id": "sol_earth",
        "name": "Earth (Class-M)",
        "systemId": "sol_system",
        "type": "terran",
        "radius": 36,
        "position": [
          0,
          0,
          -1300
        ],
        "textureColor": "#1e40af",
        "atmosphereColor": "#60a5fa",
        "description": "Birthplace of humanity, seat of the Federation Council and Starfleet Command."
      },
      {
        "id": "sol_moon",
        "name": "The Moon (Luna / Class-D)",
        "systemId": "sol_system",
        "type": "moon",
        "radius": 11,
        "position": [
          65,
          12,
          -1260
        ],
        "parentPlanetId": "sol_earth",
        "textureColor": "#94a3b8",
        "description": "Earth cratered natural satellite, home to Armstrong Base and Lunar observatories."
      },
      {
        "id": "sol_spacedock",
        "name": "Earth Spacedock One",
        "systemId": "sol_system",
        "type": "starbase",
        "radius": 20,
        "position": [
          36,
          8,
          -1280
        ],
        "parentPlanetId": "sol_earth",
        "textureColor": "#cbd5e1",
        "description": "Massive orbital starbase providing 100% hull repair and full photon torpedo refits."
      },
      {
        "id": "sol_mars",
        "name": "Mars (Class-N)",
        "systemId": "sol_system",
        "type": "desert",
        "radius": 26,
        "position": [
          1200,
          15,
          -1450
        ],
        "textureColor": "#c2410c",
        "atmosphereColor": "#fb923c",
        "description": "Home of the Utopia Planitia Fleet Yards, where legendary starships are built."
      },
      {
        "id": "sol_utopia_planitia",
        "name": "Utopia Planitia Orbital Fleet Yards",
        "systemId": "sol_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          1240,
          22,
          -1430
        ],
        "parentPlanetId": "sol_mars",
        "textureColor": "#cbd5e1",
        "description": "Premier Martian starship construction and maintenance drydock."
      },
      {
        "id": "sol_jupiter",
        "name": "Jupiter (Class-J Gas Giant)",
        "systemId": "sol_system",
        "type": "gas_giant",
        "radius": 75,
        "position": [
          -2400,
          30,
          1900
        ],
        "textureColor": "#ea580c",
        "atmosphereColor": "#fed7aa",
        "description": "Colossal gas giant with the Great Red Spot and deep hydrogen atmosphere."
      },
      {
        "id": "sol_europa",
        "name": "Europa (Class-P Ice Moon)",
        "systemId": "sol_system",
        "type": "moon",
        "radius": 10,
        "position": [
          -2310,
          38,
          1960
        ],
        "parentPlanetId": "sol_jupiter",
        "textureColor": "#e0f2fe",
        "description": "Icy Jovian moon with deep subterranean oceans and research stations."
      },
      {
        "id": "sol_saturn",
        "name": "Saturn (Ringed Jewel)",
        "systemId": "sol_system",
        "type": "gas_giant",
        "radius": 65,
        "position": [
          3100,
          -25,
          3000
        ],
        "textureColor": "#ca8a04",
        "atmosphereColor": "#fef08a",
        "hasRings": true,
        "ringInner": 80,
        "ringOuter": 135,
        "ringColor": "#fef08a",
        "description": "Spectacular planetary ring system composed of billions of water-ice fragments."
      },
      {
        "id": "sol_titan",
        "name": "Titan (Methane Moon)",
        "systemId": "sol_system",
        "type": "moon",
        "radius": 12,
        "position": [
          3200,
          -18,
          3070
        ],
        "parentPlanetId": "sol_saturn",
        "textureColor": "#f59e0b",
        "description": "Saturn massive shrouded moon with liquid hydrocarbon lakes."
      }
    ]
  },
  {
    "id": "vulcan_system",
    "name": "40 Eridani / Vulcan System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "40 Eridani A (Orange Dwarf K1V)",
    "spectralType": "Class K",
    "centerCoordinates": [
      38000,
      700,
      -48000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Founding member world of the Federation, homeworld of the logical Vulcan species.",
    "planets": [
      {
        "id": "vulcan_prime",
        "name": "Vulcan (Class-M)",
        "systemId": "vulcan_system",
        "type": "desert",
        "radius": 35,
        "position": [
          38259,
          573,
          -46732
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#f59e0b",
        "description": "Arid, mountainous world with higher gravity and thinner atmosphere than Earth."
      },
      {
        "id": "vulcan_tkhut",
        "name": "T'Khut (Sister Planet)",
        "systemId": "vulcan_system",
        "type": "volcanic",
        "radius": 24,
        "position": [
          37561,
          915,
          -50145
        ],
        "parentPlanetId": "vulcan_prime",
        "textureColor": "#78350f",
        "atmosphereColor": "#f97316",
        "description": "Massive geologically active companion planet dominating Vulcan red-orange sky."
      },
      {
        "id": "vulcan_spacedock",
        "name": "40 Eridani Orbital Refit Complex",
        "systemId": "vulcan_system",
        "type": "starbase",
        "radius": 18,
        "position": [
          38309,
          581,
          -46718
        ],
        "parentPlanetId": "vulcan_prime",
        "textureColor": "#cbd5e1",
        "description": "Major Federation-Vulcan joint space station offering full hull repair and photon torpedo reloading."
      }
    ]
  },
  {
    "id": "andoria_system",
    "name": "Procyon / Andorian System",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Procyon (Luminous Subgiant F5)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -42000,
      -500,
      -48000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Home territory of the passionate Andorian Imperial Guard and founding Federation member.",
    "planets": [
      {
        "id": "andoria_gas_giant",
        "name": "Ka'Thelan (Ringed Giant)",
        "systemId": "andoria_system",
        "type": "gas_giant",
        "radius": 72,
        "position": [
          -43197,
          -525,
          -47492
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#38bdf8",
        "hasRings": true,
        "ringInner": 88,
        "ringOuter": 140,
        "ringColor": "#7dd3fc",
        "description": "Majestic turquoise gas giant orbited by inhabited ice moon Andoria."
      },
      {
        "id": "andoria_moon",
        "name": "Andoria (Class-P Ice World)",
        "systemId": "andoria_system",
        "type": "ice",
        "radius": 12,
        "position": [
          -39975,
          -457,
          -48859
        ],
        "parentPlanetId": "andoria_gas_giant",
        "textureColor": "#0369a1",
        "atmosphereColor": "#bae6fd",
        "description": "Glacial moon with underground geothermal cities fueled by subterranean heat veins."
      },
      {
        "id": "andoria_starbase",
        "name": "Starbase 11 Andorian Deep Space Dock",
        "systemId": "andoria_system",
        "type": "starbase",
        "radius": 18,
        "position": [
          -43201,
          -517,
          -47440
        ],
        "parentPlanetId": "andoria_gas_giant",
        "textureColor": "#94a3b8",
        "description": "Armed Starfleet orbital drydock providing critical frontline repairs."
      }
    ]
  },
  {
    "id": "tellar_system",
    "name": "61 Cygni / Tellar Prime System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "61 Cygni (Binary Star K-V)",
    "spectralType": "Class K Binary",
    "centerCoordinates": [
      -32000,
      400,
      -32000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Homeworld of the formidable Tellarite founders, renowned master shipwrights and debaters.",
    "planets": [
      {
        "id": "tellar_prime",
        "name": "Tellar Prime (Class-M)",
        "systemId": "tellar_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -32793,
          400,
          -33154
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#fbbf24",
        "description": "Mountainous world of expansive iron-rich peaks and geothermal valleys."
      },
      {
        "id": "tellar_spacedock",
        "name": "Tellarite Heavy Fleet Drydock",
        "systemId": "tellar_system",
        "type": "starbase",
        "radius": 22,
        "position": [
          -32845,
          408,
          -33147
        ],
        "textureColor": "#78350f",
        "description": "Renowned structural repair slips specialized in reinforcing duranium starship hulls.",
        "parentPlanetId": "tellar_prime"
      }
    ]
  },
  {
    "id": "betazed_system",
    "name": "Beta Zeta / Betazed System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Beta Zeta (Yellow Main Sequence)",
    "spectralType": "Class G",
    "centerCoordinates": [
      -46000,
      800,
      -26000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Serene Federation world of the empathic Betazoids, celebrated for its pristine oceans and art.",
    "planets": [
      {
        "id": "betazed_prime",
        "name": "Betazed (Class-M Telepathic Haven)",
        "systemId": "betazed_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -45028,
          750,
          -27006
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#34d399",
        "description": "Lush paradise of the Opal Sea and Lake El-Nar. Federation Council cultural center."
      }
    ]
  },
  {
    "id": "trill_system",
    "name": "Trillius / Trill System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Trillius Prime (Blue-White F2V)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -58000,
      -600,
      -24000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Enlightened world of Joined Trill symbionts and the Symbiosis Commission.",
    "planets": [
      {
        "id": "trill_prime",
        "name": "Trill (Class-M Joined World)",
        "systemId": "trill_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -56819,
          -525,
          -23252
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#38bdf8",
        "description": "Temperate sapphire ocean world containing the ancient subterranean Caves of Mak'ala."
      },
      {
        "id": "trill_spacedock",
        "name": "Trill Symbiosis Science Station",
        "systemId": "trill_system",
        "type": "starbase",
        "radius": 22,
        "position": [
          -56774,
          -517,
          -23278
        ],
        "textureColor": "#cbd5e1",
        "description": "Advanced medical and warp propulsion research dock with full replenishment supplies.",
        "parentPlanetId": "trill_prime"
      }
    ]
  },
  {
    "id": "risa_system",
    "name": "Epsilon Ceti / Risa System",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Epsilon Ceti B (Warm Orange Star)",
    "spectralType": "Class K",
    "centerCoordinates": [
      34000,
      300,
      -22000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Famed subtropical pleasure resort world transformed by planetary weather-control grids.",
    "planets": [
      {
        "id": "risa_prime",
        "name": "Risa (Class-M Pleasure Planet)",
        "systemId": "risa_system",
        "type": "terran",
        "radius": 35,
        "position": [
          33499,
          495,
          -20707
        ],
        "textureColor": "#0d9488",
        "atmosphereColor": "#2dd4bf",
        "description": "Subtropical island world where Starfleet crews seek R&R under artificial balmy breezes."
      },
      {
        "id": "risa_resort_dock",
        "name": "Suraya Bay Orbital Haven",
        "systemId": "risa_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          33534,
          503,
          -20668
        ],
        "textureColor": "#5eead4",
        "description": "Civilian and Starfleet leisure transport port with full vessel servicing facilities.",
        "parentPlanetId": "risa_prime"
      }
    ]
  },
  {
    "id": "wolf359_sector",
    "name": "Wolf 359 Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Wolf 359 (Red Flare Dwarf M6V)",
    "spectralType": "Class M Dwarf",
    "centerCoordinates": [
      18000,
      -500,
      -22000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Catastrophic battleground of 2367 where 39 Starfleet vessels fell to a single Borg Cube.",
    "planets": [
      {
        "id": "wolf359_memorial_buoy",
        "name": "Wolf 359 Starfleet Memorial Buoy",
        "systemId": "wolf359_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          16588,
          -458,
          -22186
        ],
        "textureColor": "#e2e8f0",
        "description": "Permanent deep-space memorial and subspace beacon honoring the 11,000 lost Starfleet personnel.",
        "parentPlanetId": "saratoga_wreckage"
      },
      {
        "id": "saratoga_wreckage",
        "name": "USS Saratoga Graveyard Hulk",
        "systemId": "wolf359_sector",
        "type": "anomaly",
        "radius": 24,
        "position": [
          16619,
          -466,
          -22228
        ],
        "textureColor": "#475569",
        "description": "Preserved battle-scarred hull drifting in solemn orbit as a historical warning."
      }
    ]
  },
  {
    "id": "starbase74_sector",
    "name": "Tarsas / Starbase 74 Sector",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Tarsas Prime (White Star A3V)",
    "spectralType": "Class A",
    "centerCoordinates": [
      52000,
      600,
      -32000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Home of Starbase 74, a colossal mega-spacedock capable of servicing dozens of heavy cruisers.",
    "planets": [
      {
        "id": "starbase_74_megadock",
        "name": "Starbase 74 Mega-Spacedock",
        "systemId": "starbase74_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          51903,
          748,
          -33414
        ],
        "textureColor": "#0ea5e9",
        "description": "Immense Spacedock One variant equipped with automated computerized maintenance cores.",
        "parentPlanetId": "tarsas_iii"
      },
      {
        "id": "tarsas_iii",
        "name": "Tarsas III (Class-M)",
        "systemId": "starbase74_sector",
        "type": "terran",
        "radius": 35,
        "position": [
          51950,
          740,
          -33392
        ],
        "textureColor": "#15803d",
        "atmosphereColor": "#86efac",
        "description": "Thriving agricultural Federation colony world nestled near the Beta Quadrant frontier."
      }
    ]
  },
  {
    "id": "deneb_system",
    "name": "Deneb IV / Farpoint Sector",
    "quadrant": "Alpha Quadrant Frontier",
    "primaryStar": "Deneb Kaitos (Luminous Supergiant A2Ia)",
    "spectralType": "Class A Supergiant",
    "centerCoordinates": [
      -42000,
      700,
      -62000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Frontier outpost sector visited on the maiden voyage of the USS Enterprise-D, home to the sentient spaceborne entity at Farpoint Station.",
    "planets": [
      {
        "id": "deneb_iv",
        "name": "Deneb IV (Class-M Bandi World)",
        "systemId": "deneb_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -40639,
          716,
          -62327
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#6ee7b7",
        "description": "Vast temperate world colonized by the Bandi people, surrounded by geo-thermal crystal valleys."
      },
      {
        "id": "farpoint_station",
        "name": "Farpoint Starbase Station",
        "systemId": "deneb_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -40627,
          724,
          -62378
        ],
        "textureColor": "#38bdf8",
        "description": "Advanced Starfleet frontier starbase offering comprehensive starship maintenance and warp drive diagnostics.",
        "parentPlanetId": "deneb_iv"
      }
    ]
  },
  {
    "id": "babel_system",
    "name": "Babel Neutral System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Babel Primary (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      22000,
      400,
      -32000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Designated neutral diplomatic world where the historic Babel Conferences united Federation founders.",
    "planets": [
      {
        "id": "babel_prime",
        "name": "Babel Planetoid (Class-M Diplomatic World)",
        "systemId": "babel_system",
        "type": "terran",
        "radius": 35,
        "position": [
          22593,
          400,
          -30732
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#7dd3fc",
        "description": "Demilitarized planetoid hosting high-level peace accords and multi-species negotiations."
      },
      {
        "id": "babel_council_dock",
        "name": "Federation Diplomatic Spacedock",
        "systemId": "babel_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          22645,
          408,
          -30730
        ],
        "textureColor": "#cbd5e1",
        "description": "Heavily protected orbital facility equipped for diplomatic envoy transports and VIP fleet maintenance.",
        "parentPlanetId": "babel_prime"
      }
    ]
  },
  {
    "id": "bolian_system",
    "name": "Bolarus IX / Bolian Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Bolarus Star (Class F)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -34000,
      -400,
      -46000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Homeworld of the amiable and cooperative Bolian species, celebrated for its expansive azure oceanic archipelagos and financial exchanges.",
    "planets": [
      {
        "id": "bolarus_ix",
        "name": "Bolarus IX (Azure Archipelago World)",
        "systemId": "bolian_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -35125,
          -358,
          -45167
        ],
        "textureColor": "#0369a1",
        "atmosphereColor": "#38bdf8",
        "description": "Pristine ocean world with hundreds of tropical island cities and deep-sea geothermal power taps."
      },
      {
        "id": "bolian_spacedock",
        "name": "Bolian Trade & Fleet Repair Port",
        "systemId": "bolian_system",
        "type": "starbase",
        "radius": 22,
        "position": [
          -35116,
          -350,
          -45116
        ],
        "textureColor": "#60a5fa",
        "description": "Major commercial nexus offering drydock hull refits, antimatter replenishment, and civilian trade.",
        "parentPlanetId": "bolarus_ix"
      }
    ]
  },
  {
    "id": "benzar_system",
    "name": "Benzar / Benzite Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Benzar Sun (Class K)",
    "spectralType": "Class K",
    "centerCoordinates": [
      -42000,
      -500,
      -40000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "High-gravity world of the meticulous Benzites, known for its crystalline spires and nitrogen-heavy atmosphere.",
    "planets": [
      {
        "id": "benzar_prime",
        "name": "Benzar (Geothermal Spire World)",
        "systemId": "benzar_system",
        "type": "desert",
        "radius": 35,
        "position": [
          -43041,
          -593,
          -40931
        ],
        "textureColor": "#7c2d12",
        "atmosphereColor": "#fdba74",
        "description": "Mineral-rich world studded with towering silica spires and geothermally regulated subterranean habitations."
      },
      {
        "id": "benzar_platform",
        "name": "Benzite Orbital Gas Research Platform",
        "systemId": "benzar_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -43090,
          -585,
          -40912
        ],
        "textureColor": "#94a3b8",
        "description": "Atmospheric research orbital providing warp coil maintenance and sensor recalibration.",
        "parentPlanetId": "benzar_prime"
      }
    ]
  },
  {
    "id": "ceti_alpha_system",
    "name": "Ceti Alpha Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Ceti Alpha (Red Dwarf M1V)",
    "spectralType": "Class M Dwarf",
    "centerCoordinates": [
      28000,
      -300,
      -38000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Desolate system where Ceti Alpha VI exploded in 2267, shifting the orbit of Ceti Alpha V and creating a harsh wasteland.",
    "planets": [
      {
        "id": "ceti_alpha_v",
        "name": "Ceti Alpha V (Harsh Desert Wasteland)",
        "systemId": "ceti_alpha_system",
        "type": "desert",
        "radius": 35,
        "position": [
          28659,
          -467,
          -39108
        ],
        "textureColor": "#78350f",
        "atmosphereColor": "#ea580c",
        "description": "Barren planet swept by intense sandstorms, exile world of Khan Noonien Singh and his followers."
      },
      {
        "id": "botany_bay_relic",
        "name": "SS Botany Bay Derelict Relic",
        "systemId": "ceti_alpha_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          26885,
          -17,
          -36125
        ],
        "textureColor": "#475569",
        "description": "Preserved orbital debris and historical beacon marking the 20th-century sleeper ship discovery site."
      }
    ]
  },
  {
    "id": "kronos_system",
    "name": "Qo'noS / Klingon Imperial Territory",
    "quadrant": "Beta Quadrant Combat Zone",
    "primaryStar": "Klingon Prime (Volcanic Star)",
    "spectralType": "Class K (Klingon Territory)",
    "centerCoordinates": [
      76000,
      1400,
      -82000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Sovereign heart of the Klingon Empire. Hostile Birds-of-Prey and Negh'Var Flagships patrol this frontier and aggressively engage Federation intruders.",
    "planets": [
      {
        "id": "qonos_prime",
        "name": "Qo'noS (Klingon Homeworld)",
        "systemId": "kronos_system",
        "type": "volcanic",
        "radius": 35,
        "position": [
          77230,
          1337,
          -81583
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#f97316",
        "description": "Capital homeworld of the Klingon Empire, First City, and the Great Hall of the Klingon High Council."
      },
      {
        "id": "praxis_remnant",
        "name": "Praxis (Shattered Dilithium Remnant)",
        "systemId": "kronos_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          75286,
          1089,
          -79942
        ],
        "textureColor": "#78350f",
        "hasRings": true,
        "ringInner": 33,
        "ringOuter": 55,
        "ringColor": "#d97706",
        "description": "Cataclysmically fractured dilithium celestial remnant surrounded by high-energy volcanic rings."
      },
      {
        "id": "rura_penthe",
        "name": "Rura Penthe (Dilithium Penal World)",
        "systemId": "kronos_system",
        "type": "ice",
        "radius": 32,
        "position": [
          72879,
          1560,
          -83059
        ],
        "textureColor": "#64748b",
        "atmosphereColor": "#94a3b8",
        "description": "Notorious sub-zero Klingon penal world shielded by a magnetic dampening barrier. Dilithium mines manned by prisoners."
      },
      {
        "id": "boreth_monastery",
        "name": "Boreth (Sacred Monastery of Kahless)",
        "systemId": "kronos_system",
        "type": "terran",
        "radius": 32,
        "position": [
          77460,
          2036,
          -86209
        ],
        "textureColor": "#92400e",
        "atmosphereColor": "#fbbf24",
        "description": "Sacred planetary sanctuary of the Klingon Empire housing the holy clerics and sacred Monastery of Kahless the Unforgettable."
      },
      {
        "id": "kronos_dock",
        "name": "Ty'Gokor Imperial Orbital Shipyards",
        "systemId": "kronos_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          77267,
          1345,
          -81619
        ],
        "textureColor": "#78350f",
        "description": "Fortified orbital shipyard with docking bays. Honors starship repairs and rearmament in neutral combat accords.",
        "parentPlanetId": "qonos_prime"
      }
    ]
  },
  {
    "id": "khitomer_system",
    "name": "Khitomer Sector",
    "quadrant": "Beta Quadrant Border Zone",
    "primaryStar": "Khitomer Binary Sun",
    "spectralType": "Class F/K Binary",
    "centerCoordinates": [
      62000,
      1000,
      -68000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Site of the historic Khitomer Accords and Camp Khitomer peace conference.",
    "planets": [
      {
        "id": "khitomer_colony",
        "name": "Khitomer (Class-M Colony)",
        "systemId": "khitomer_system",
        "type": "terran",
        "radius": 35,
        "position": [
          61819,
          861,
          -66619
        ],
        "textureColor": "#15803d",
        "atmosphereColor": "#4ade80",
        "description": "Lush colony world guarded by both Starfleet and Klingon border patrols."
      },
      {
        "id": "camp_khitomer_relay",
        "name": "Camp Khitomer Diplomatic Outpost",
        "systemId": "khitomer_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          61862,
          869,
          -66590
        ],
        "textureColor": "#94a3b8",
        "description": "Neutral diplomatic orbital station maintaining peace communications along the border.",
        "parentPlanetId": "khitomer_colony"
      }
    ]
  },
  {
    "id": "narendra_system",
    "name": "Narendra Sector",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Narendra Star (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      68000,
      1100,
      -64000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Site of the legendary defense where the Enterprise-C sacrificed herself protecting a Klingon outpost against Romulans.",
    "planets": [
      {
        "id": "narendra_iii",
        "name": "Narendra III (Class-M Sacred Outpost)",
        "systemId": "narendra_system",
        "type": "desert",
        "radius": 35,
        "position": [
          66604,
          1095,
          -63901
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#f59e0b",
        "description": "Venerated Klingon outpost world where warrior blood and Starfleet valor united the two powers."
      }
    ]
  },
  {
    "id": "mempa_system",
    "name": "Mempa Sector / Fleet Staging Ground",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Mempa Sun (Class K Red Giant)",
    "spectralType": "Class K Giant",
    "centerCoordinates": [
      84000,
      1200,
      -90000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Strategic bastion sector where the Klingon Defense Force stages heavy Battlecruisers for empire defense.",
    "planets": [
      {
        "id": "mempa_prime",
        "name": "Mempa Prime (Class-M Fortress World)",
        "systemId": "mempa_system",
        "type": "terran",
        "radius": 35,
        "position": [
          83624,
          1200,
          -91349
        ],
        "textureColor": "#854d0e",
        "atmosphereColor": "#ca8a04",
        "description": "Heavily fortified redoubt world containing subterranean weapons caches and training academies for Klingon warriors."
      },
      {
        "id": "mempa_battle_station",
        "name": "Klingon High Council Battle Station",
        "systemId": "mempa_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          83573,
          1208,
          -91359
        ],
        "textureColor": "#78350f",
        "description": "Armored orbital dreadnought station armed with heavy disruptor batteries and starship repair docks.",
        "parentPlanetId": "mempa_prime"
      }
    ]
  },
  {
    "id": "krios_system",
    "name": "Kriosian System / Frontier World",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Krios Primary (Class F)",
    "spectralType": "Class F",
    "centerCoordinates": [
      54000,
      800,
      -74000
    ],
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Ancestral world of the empathic metamorphs, historic border dispute territory between Klingons and neighboring powers.",
    "planets": [
      {
        "id": "krios_prime",
        "name": "Krios Prime (Tropical Jungle World)",
        "systemId": "krios_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          55157,
          770,
          -74591
        ],
        "textureColor": "#047857",
        "atmosphereColor": "#34d399",
        "description": "Lush tropical paradise world of vast green seas, ancient stone temples, and exotic flora."
      },
      {
        "id": "valt_minor",
        "name": "Valt Minor (Sister Colony)",
        "systemId": "krios_system",
        "type": "terran",
        "radius": 32,
        "position": [
          52041,
          850,
          -73000
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#6ee7b7",
        "description": "Neighboring agrarian world settled by Valtese colonists under treaty accords."
      }
    ]
  },
  {
    "id": "romulus_system",
    "name": "Romulus / Romulan Star Empire",
    "quadrant": "Beta Quadrant Combat Zone",
    "primaryStar": "Romulan Binary Sun",
    "spectralType": "Class F Binary",
    "centerCoordinates": [
      82000,
      1500,
      -46000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Guarded frontier of the Romulan Star Empire. Cloaked Warbirds and Scimitar Dreadnought Motherships strike without warning.",
    "planets": [
      {
        "id": "romulus_prime",
        "name": "Romulus (Ch'Rihan Emerald Homeworld)",
        "systemId": "romulus_system",
        "type": "terran",
        "radius": 35,
        "position": [
          82811,
          1601,
          -44989
        ],
        "textureColor": "#065f46",
        "atmosphereColor": "#34d399",
        "description": "Emerald twin homeworld of the Romulan people, seat of the Romulan Senate and Imperial Palace."
      },
      {
        "id": "remus_prime",
        "name": "Remus (Ch'Havran Dilithium Mining World)",
        "systemId": "romulus_system",
        "type": "desert",
        "radius": 32,
        "position": [
          80628,
          1328,
          -47711
        ],
        "textureColor": "#1e293b",
        "atmosphereColor": "#10b981",
        "description": "Tidally locked harsh world of dilithium mining pits and heavy defense stations."
      },
      {
        "id": "romulus_starbase",
        "name": "Starbase 234 Romulan Frontier Dock",
        "systemId": "romulus_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          82862,
          1609,
          -44999
        ],
        "textureColor": "#047857",
        "description": "Massive orbital drydock structure with high-output plasma conduits, repairs, and ordnance reloading.",
        "parentPlanetId": "romulus_prime"
      }
    ]
  },
  {
    "id": "neutral_zone_sector",
    "name": "Romulan Neutral Zone & Outpost 4",
    "quadrant": "Beta Quadrant Neutral Zone",
    "primaryStar": "Zeta Pictoris Star",
    "spectralType": "Class A",
    "centerCoordinates": [
      64000,
      900,
      -54000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Neutral Zone",
    "description": "Tense demilitarized corridor separating Federation space and the Romulan Star Empire.",
    "planets": [
      {
        "id": "outpost_4",
        "name": "Federation Asteroid Outpost 4",
        "systemId": "neutral_zone_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          63122,
          1068,
          -52890
        ],
        "textureColor": "#64748b",
        "description": "Heavily fortified sub-surface asteroid monitoring station watching the Neutral Zone perimeter.",
        "parentPlanetId": "galorndon_core"
      },
      {
        "id": "galorndon_core",
        "name": "Galorndon Core (Class-L Storm World)",
        "systemId": "neutral_zone_sector",
        "type": "desert",
        "radius": 35,
        "position": [
          63102,
          1060,
          -52938
        ],
        "textureColor": "#78350f",
        "atmosphereColor": "#ea580c",
        "description": "Treacherous world wracked by severe magnetic electromagnetic storms that scramble subspace scanners."
      }
    ]
  },
  {
    "id": "hobus_system",
    "name": "Hobus Supernova Sector",
    "quadrant": "Beta Quadrant Deep Space",
    "primaryStar": "Hobus Volatile Giant",
    "spectralType": "Supernova Precursor",
    "centerCoordinates": [
      92000,
      1700,
      -48000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Unstable cosmic sector radiating exotic subspace flux and dark matter shockwaves.",
    "planets": [
      {
        "id": "hobus_prime",
        "name": "Hobus Prime (Volcanic Extraction World)",
        "systemId": "hobus_system",
        "type": "volcanic",
        "radius": 35,
        "position": [
          90768,
          1800,
          -48658
        ],
        "textureColor": "#b91c1c",
        "atmosphereColor": "#ef4444",
        "description": "Superheated resource world threatened by stellar instability."
      }
    ]
  },
  {
    "id": "devron_system",
    "name": "Devron Sector / Neutral Frontier",
    "quadrant": "Beta Quadrant Neutral Zone",
    "primaryStar": "Devron Sun (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      72000,
      1200,
      -38000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Contested sector located at the edge of Romulan territory, location of the tri-temporal anti-time rift anomaly.",
    "planets": [
      {
        "id": "devron_iii",
        "name": "Devron III (Barren Dust World)",
        "systemId": "devron_system",
        "type": "desert",
        "radius": 35,
        "position": [
          72378,
          1324,
          -39238
        ],
        "textureColor": "#57534e",
        "atmosphereColor": "#a8a29e",
        "description": "Lifeless mineral world scarred by past conflicts and orbital bombardments."
      },
      {
        "id": "temporal_anomaly",
        "name": "Anti-Time Subspace Rift Anomaly",
        "systemId": "devron_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          71361,
          990,
          -35905
        ],
        "textureColor": "#c084fc",
        "description": "Pulsing multi-dimensional tear radiating tachyon particles that grow backwards through spacetime."
      }
    ]
  },
  {
    "id": "cheron_system",
    "name": "Cheron Battleground Sector",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Cheron Star (Class B Blue Subgiant)",
    "spectralType": "Class B",
    "centerCoordinates": [
      88000,
      1400,
      -36000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Location of the decisive 2160 Battle of Cheron that ended the Earth-Romulan War and led to the creation of the Neutral Zone.",
    "planets": [
      {
        "id": "cheron_prime",
        "name": "Cheron (Historic War Planetoid)",
        "systemId": "cheron_system",
        "type": "ice",
        "radius": 35,
        "position": [
          89294,
          1394,
          -35878
        ],
        "textureColor": "#1e3a8a",
        "atmosphereColor": "#60a5fa",
        "description": "Frozen iron-crusted world surrounded by centuries-old navigational debris from the Earth-Romulan War."
      },
      {
        "id": "romulan_minefield",
        "name": "Cloaked Plasma Minefield Relay",
        "systemId": "cheron_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          85810,
          1410,
          -36206
        ],
        "textureColor": "#10b981",
        "description": "Automated cloaked ordnance grid warning Starfleet vessels against penetrating deeper into Romulan space."
      }
    ]
  },
  {
    "id": "cardassia_system",
    "name": "Cardassia System / Cardassian Union",
    "quadrant": "Alpha Quadrant Combat Zone",
    "primaryStar": "Cardassia Star (Orange Giant)",
    "spectralType": "Class K Giant",
    "centerCoordinates": [
      -92000,
      -1000,
      -42000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Cardassian Union",
    "description": "Authoritarian capital of the Cardassian Union and Obsidian Order, guarded by Galor-class warships.",
    "planets": [
      {
        "id": "cardassia_prime",
        "name": "Cardassia Prime (Class-M Arid World)",
        "systemId": "cardassia_system",
        "type": "desert",
        "radius": 35,
        "position": [
          -91862,
          -1000,
          -40707
        ],
        "textureColor": "#a16207",
        "atmosphereColor": "#ca8a04",
        "description": "Heavily fortified homeworld of the Cardassians, characterized by obsidian spires and harsh sun."
      },
      {
        "id": "cardassia_iv",
        "name": "Cardassia IV (Military Outpost & Shipyards)",
        "systemId": "cardassia_system",
        "type": "volcanic",
        "radius": 32,
        "position": [
          -92234,
          -1000,
          -44187
        ],
        "textureColor": "#854d0e",
        "atmosphereColor": "#eab308",
        "description": "Strategic military shipyard and fortified fleet construction complex."
      }
    ]
  },
  {
    "id": "chintoka_system",
    "name": "Chin'toka Sector / Dominion War Front",
    "quadrant": "Alpha Quadrant Combat Zone",
    "primaryStar": "Chin'toka Sun (Class F)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -102000,
      -1200,
      -48000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Cardassian Union",
    "description": "Fiercely contested system where Allied Federation-Klingon-Romulan fleets clashed against Cardassian automated platforms and the Breen.",
    "planets": [
      {
        "id": "chintoka_iii",
        "name": "Chin'toka III (Class-M Fortress World)",
        "systemId": "chintoka_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -103239,
          -1180,
          -47607
        ],
        "textureColor": "#713f12",
        "atmosphereColor": "#eab308",
        "description": "Strategic planet garrisoned by heavy Cardassian planetary defense fortifications."
      },
      {
        "id": "orbital_weapon_platform",
        "name": "Automated Weapon Platform Array",
        "systemId": "chintoka_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          -99903,
          -1233,
          -48665
        ],
        "textureColor": "#dc2626",
        "description": "Self-powered uncrewed orbital weapons platforms armed with regenerating shields and spinal plasma torpedoes."
      }
    ]
  },
  {
    "id": "celtris_system",
    "name": "Celtris Sector / Obsidian Stronghold",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Celtris Star (Class M Red Star)",
    "spectralType": "Class M",
    "centerCoordinates": [
      -96000,
      -900,
      -32000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Cardassian Union",
    "description": "Secret Cardassian intelligence sector housing covert testing grounds and cavern bases in the obsidian mountain ranges.",
    "planets": [
      {
        "id": "celtris_iii",
        "name": "Celtris III (Subterranean Cavern World)",
        "systemId": "celtris_system",
        "type": "desert",
        "radius": 35,
        "position": [
          -96681,
          -1022,
          -33217
        ],
        "textureColor": "#44403c",
        "atmosphereColor": "#78716c",
        "description": "Barren planet concealing labyrinthine subterranean military research complexes deep beneath its mantle."
      },
      {
        "id": "obsidian_sensor_base",
        "name": "Obsidian Subspace Surveillance Hub",
        "systemId": "celtris_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -96733,
          -1014,
          -33215
        ],
        "textureColor": "#1c1917",
        "description": "Heavily encrypted intelligence platform tapping into Alpha Quadrant subspace comm traffic.",
        "parentPlanetId": "celtris_iii"
      }
    ]
  },
  {
    "id": "bajor_system",
    "name": "Bajoran System & Deep Space Nine",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Bajor-B'hava'el (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      -80000,
      -800,
      -34000
    ],
    "territory": "federation",
    "affiliation": "Bajoran Republic / Starfleet",
    "description": "Sacred territory guarding the only stable wormhole to the Gamma Quadrant, protected by Starfleet and Deep Space 9.",
    "planets": [
      {
        "id": "bajor_prime",
        "name": "Bajor (Class-M Spiritual World)",
        "systemId": "bajor_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -79013,
          -927,
          -34837
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#38bdf8",
        "description": "Verdant, spiritual world deeply devoted to the Prophets and ancient celestial orbs."
      },
      {
        "id": "deep_space_nine",
        "name": "Deep Space 9 (Terok Nor Station)",
        "systemId": "bajor_system",
        "type": "starbase",
        "radius": 24,
        "position": [
          -79025,
          -919,
          -34888
        ],
        "textureColor": "#94a3b8",
        "description": "Cardassian-built Nor-class space station with Promenade, upper pylons, and full fleet support for Starfleet.",
        "parentPlanetId": "bajor_prime"
      },
      {
        "id": "bajoran_wormhole",
        "name": "The Celestial Temple (Bajoran Wormhole)",
        "systemId": "bajor_system",
        "type": "wormhole",
        "radius": 40,
        "position": [
          -78875,
          -894,
          -34968
        ],
        "textureColor": "#a855f7",
        "atmosphereColor": "#c084fc",
        "description": "Swirling subspace singularity leading directly to the Idran system in the Gamma Quadrant."
      }
    ]
  },
  {
    "id": "badlands_sector",
    "name": "The Badlands Sector",
    "quadrant": "Alpha Quadrant Plasma Frontier",
    "primaryStar": "Plasma Core Anomaly",
    "spectralType": "Plasma Storm Field",
    "centerCoordinates": [
      -98000,
      -700,
      -54000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Contested Plasma Zone",
    "description": "Violent subspace storms and fiery plasma vortices that render sensors nearly blind. Haven for Maquis raiders.",
    "planets": [
      {
        "id": "badlands_storm_core",
        "name": "Badlands Plasma Storm Nebula",
        "systemId": "badlands_sector",
        "type": "nebula",
        "radius": 110,
        "position": [
          -96895,
          -828,
          -53150
        ],
        "textureColor": "#ea580c",
        "atmosphereColor": "#f97316",
        "description": "Swirling tempest of fiery plasma eddies that disrupt shields and warp drive."
      },
      {
        "id": "maquis_haven",
        "name": "Maquis Hollow Asteroid Haven",
        "systemId": "badlands_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          -96848,
          -820,
          -53172
        ],
        "textureColor": "#78350f",
        "description": "Hidden resistance sanctuary built inside a hollowed-out nickel-iron asteroid.",
        "parentPlanetId": "badlands_storm_core"
      }
    ]
  },
  {
    "id": "ferenginar_system",
    "name": "Ferenginar / Ferengi Alliance",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Ferengi Sun (Yellow-Orange Dwarf)",
    "spectralType": "Class K",
    "centerCoordinates": [
      -62000,
      600,
      -46000
    ],
    "territory": "non_federation",
    "affiliation": "Ferengi Alliance",
    "description": "Capital world of the profit-driven Ferengi Alliance and seat of the Grand Nagus.",
    "planets": [
      {
        "id": "ferenginar_prime",
        "name": "Ferenginar (Class-M Torrential Rain World)",
        "systemId": "ferenginar_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -62622,
          475,
          -44752
        ],
        "textureColor": "#047857",
        "atmosphereColor": "#34d399",
        "description": "Damp, perpetually rain-soaked world famous for the 40-story Tower of Commerce."
      },
      {
        "id": "ferengi_nagus_dock",
        "name": "Grand Nagus Commercial Spacedock",
        "systemId": "ferenginar_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -62591,
          483,
          -44710
        ],
        "textureColor": "#f59e0b",
        "description": "Bustling interstellar trading complex offering high-price repair slips and gold-pressed latinum markets.",
        "parentPlanetId": "ferenginar_prime"
      }
    ]
  },
  {
    "id": "breen_system",
    "name": "Breen Confederacy / Sub-Zero Frontier",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Breen Sun (Frozen White Dwarf)",
    "spectralType": "Class D Dwarf",
    "centerCoordinates": [
      -74000,
      800,
      -70000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Breen Confederacy",
    "description": "Mysterious, xenophobic species encased in refrigerated environmental suits. Infamous for energy-dampening weapon technology.",
    "planets": [
      {
        "id": "breen_homeworld",
        "name": "Breen (Sub-Zero Refrigerated Glacial World)",
        "systemId": "breen_system",
        "type": "ice",
        "radius": 35,
        "position": [
          -75353,
          818,
          -70359
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#bae6fd",
        "description": "Glacial tundra world containing subterranean cryogenic cities and orbital defense bunkers."
      },
      {
        "id": "breen_cryo_dock",
        "name": "Breen Cryo-Spacedock Fortress",
        "systemId": "breen_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -75388,
          826,
          -70320
        ],
        "textureColor": "#38bdf8",
        "description": "Fortified naval staging slip housing Breen Warships equipped with energy-dampening weapon emitters.",
        "parentPlanetId": "breen_homeworld"
      }
    ]
  },
  {
    "id": "mutara_sector",
    "name": "Mutara Sector & Genesis Range",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Mutara Nebula Core",
    "spectralType": "Class B Stellar Nursery",
    "centerCoordinates": [
      -36000,
      1400,
      -74000
    ],
    "territory": "non_federation",
    "affiliation": "Contested Neutral Zone",
    "description": "Dense subspace nebula containing intense electromagnetic discharges and the historic Genesis testing ground.",
    "planets": [
      {
        "id": "mutara_nebula_cloud",
        "name": "Mutara Ion Nebula",
        "systemId": "mutara_sector",
        "type": "nebula",
        "radius": 110,
        "position": [
          -35924,
          1400,
          -75298
        ],
        "textureColor": "#9333ea",
        "atmosphereColor": "#c084fc",
        "description": "Volatile violet gas nebula that completely neutralizes shields and blinds optical sensors."
      },
      {
        "id": "regula_planetoid",
        "name": "Regula (Class-D Planetoid)",
        "systemId": "mutara_sector",
        "type": "desert",
        "radius": 32,
        "position": [
          -34162,
          1400,
          -72790
        ],
        "textureColor": "#475569",
        "atmosphereColor": "#94a3b8",
        "description": "Lifeless astronomical rock selected for secret Federation terraforming experimentation."
      },
      {
        "id": "regula_one_station",
        "name": "Regula I Orbital Laboratory",
        "systemId": "mutara_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          -35969,
          1408,
          -75324
        ],
        "textureColor": "#cbd5e1",
        "description": "Advanced Federation science outpost where Dr. Carol Marcus developed Project Genesis.",
        "parentPlanetId": "mutara_nebula_cloud"
      },
      {
        "id": "genesis_planet",
        "name": "Genesis World (Prototype Evolution)",
        "systemId": "mutara_sector",
        "type": "terran",
        "radius": 32,
        "position": [
          -38949,
          1400,
          -72520
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#6ee7b7",
        "description": "Vibrant rapidly evolving experimental paradise world formed by Genesis Matrix reaction."
      }
    ]
  },
  {
    "id": "briar_patch_sector",
    "name": "Sector 44140 / The Briar Patch",
    "quadrant": "Beta Quadrant Isolated Space",
    "primaryStar": "Ba'ku Sun (Golden Luminary)",
    "spectralType": "Metaphasic Source",
    "centerCoordinates": [
      44000,
      800,
      -76000
    ],
    "territory": "non_federation",
    "affiliation": "Ba'ku Sanctuary",
    "description": "Enigmatic region of false vacuum pockets and metaphasic radiation clouds that regenerate organic cells.",
    "planets": [
      {
        "id": "baku_homeworld",
        "name": "Ba'ku (Metaphasic Paradise World)",
        "systemId": "briar_patch_sector",
        "type": "terran",
        "radius": 35,
        "position": [
          45287,
          791,
          -76184
        ],
        "textureColor": "#16a34a",
        "atmosphereColor": "#86efac",
        "hasRings": true,
        "ringInner": 44,
        "ringOuter": 74,
        "ringColor": "#facc15",
        "description": "Peaceful world whose planetary rings emit metaphasic radiation granting eternal biological youth."
      },
      {
        "id": "briar_patch_nebula",
        "name": "Briar Patch Metaphasic Cloud",
        "systemId": "briar_patch_sector",
        "type": "nebula",
        "radius": 130,
        "position": [
          41822,
          816,
          -75688
        ],
        "textureColor": "#eab308",
        "atmosphereColor": "#facc15",
        "description": "Golden luminous gas cloud with high sensor dispersion that suffocates conventional warp manifolds."
      }
    ]
  },
  {
    "id": "gorn_sector",
    "name": "Gorn Hegemony / Cestus Expanse",
    "quadrant": "Beta / Alpha Border",
    "primaryStar": "Gornar Prime (Deep Blue Giant)",
    "spectralType": "Class B Giant",
    "centerCoordinates": [
      62000,
      -900,
      -108000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Gorn Hegemony",
    "description": "Hostile territory claimed by the reptilian Gorn Hegemony. Enormous deep-blue Dominator Dreadnoughts defend these border outposts.",
    "planets": [
      {
        "id": "gornar_homeworld",
        "name": "Gornar (Class-M Reptilian World)",
        "systemId": "gorn_sector",
        "type": "volcanic",
        "radius": 35,
        "position": [
          62437,
          -778,
          -106782
        ],
        "textureColor": "#1e3a8a",
        "atmosphereColor": "#38bdf8",
        "description": "Sweltering jungle and craggy fortress world inhabited by the formidable Gorn military."
      },
      {
        "id": "cestus_outpost",
        "name": "Cestus III Border Planetoid",
        "systemId": "gorn_sector",
        "type": "desert",
        "radius": 32,
        "position": [
          61260,
          -1107,
          -110061
        ],
        "textureColor": "#172554",
        "atmosphereColor": "#0ea5e9",
        "description": "Border planetoid site of historical clashes between Starfleet and Gorn landing forces."
      },
      {
        "id": "gorn_outpost_dock",
        "name": "Deep Space Station K-7 Frontier Dock",
        "systemId": "gorn_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          62489,
          -770,
          -106775
        ],
        "textureColor": "#60a5fa",
        "description": "Historic border quadrant station equipped with civilian and naval repair docks and torpedo armories.",
        "parentPlanetId": "gornar_homeworld"
      }
    ]
  },
  {
    "id": "tholian_sector",
    "name": "Tholian Assembly / Lathan Sector",
    "quadrant": "Alpha / Beta Frontier",
    "primaryStar": "Tholia Sun (Superheated Orange Star)",
    "spectralType": "Class Y Star",
    "centerCoordinates": [
      108000,
      -1000,
      -30000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Tholian Assembly",
    "description": "Xenophobic, punctilious crystalline species. Tholian vessels spin lethal energy webs to trap intruders.",
    "planets": [
      {
        "id": "tholia_prime",
        "name": "Tholia (Class-Y Crystalline World)",
        "systemId": "tholian_sector",
        "type": "volcanic",
        "radius": 35,
        "position": [
          106888,
          -899,
          -29335
        ],
        "textureColor": "#ea580c",
        "atmosphereColor": "#fb923c",
        "description": "Superheated world of molten silica and crystalline hive spires."
      },
      {
        "id": "tholian_web_beacon",
        "name": "Tholian Spatial Web Perimeter Beacon",
        "systemId": "tholian_sector",
        "type": "anomaly",
        "radius": 26,
        "position": [
          109883,
          -1170,
          -31126
        ],
        "textureColor": "#fb923c",
        "description": "Pulsing energy beacon projecting a high-tensile tractor web perimeter."
      }
    ]
  },
  {
    "id": "idran_system",
    "name": "Idran System / Gamma Quadrant Terminal",
    "quadrant": "Gamma Quadrant (Via Wormhole)",
    "primaryStar": "Idran Binary (Blue-White Subgiants)",
    "spectralType": "Class B Binary",
    "centerCoordinates": [
      -148000,
      -1300,
      -118000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Dominion Space",
    "description": "Terminus of the Bajoran Wormhole in the Gamma Quadrant, located 70,000 light-years from Bajor.",
    "planets": [
      {
        "id": "idran_prime",
        "name": "Idran I (Supermassive Gas Giant)",
        "systemId": "idran_system",
        "type": "gas_giant",
        "radius": 70,
        "position": [
          -148881,
          -1157,
          -118945
        ],
        "textureColor": "#4338ca",
        "atmosphereColor": "#818cf8",
        "hasRings": true,
        "ringInner": 88,
        "ringOuter": 147,
        "ringColor": "#a5b4fc",
        "description": "Immense indigo gas giant whose gravitational field stabilizes the Gamma Quadrant wormhole aperture."
      },
      {
        "id": "gamma_wormhole_terminus",
        "name": "Gamma Quadrant Wormhole Aperture",
        "systemId": "idran_system",
        "type": "wormhole",
        "radius": 40,
        "position": [
          -146509,
          -1542,
          -116401
        ],
        "textureColor": "#a855f7",
        "atmosphereColor": "#c084fc",
        "description": "Subspace aperture connecting back to the Bajor sector in the Alpha Quadrant."
      },
      {
        "id": "jemhadar_staging_dock",
        "name": "Jem'Hadar Staging Orbital Redoubt",
        "systemId": "idran_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -148931,
          -1149,
          -118931
        ],
        "textureColor": "#4f46e5",
        "description": "Fortified Dominion patrol station garrisoned by Jem'Hadar attack craft and Vorta overseers.",
        "parentPlanetId": "idran_prime"
      }
    ]
  },
  {
    "id": "omarion_system",
    "name": "Omarion Sector / Founders' Homeworld",
    "quadrant": "Gamma Quadrant",
    "primaryStar": "Omarion Sun (Pale Violet Star)",
    "spectralType": "Class A Star",
    "centerCoordinates": [
      -172000,
      -1500,
      -142000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Dominion Space",
    "description": "Guarded heart of the Dominion empire and sacred home of the Changeling Great Link.",
    "planets": [
      {
        "id": "founders_homeworld",
        "name": "The Great Link Sanctuary (Founders)",
        "systemId": "omarion_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -171181,
          -1387,
          -143129
        ],
        "textureColor": "#831843",
        "atmosphereColor": "#f472b6",
        "description": "Shimmering ocean world where billions of Changelings merge into the collective consciousness of the Great Link."
      },
      {
        "id": "dominion_cloning_array",
        "name": "Vorta Subspace Cloning Array",
        "systemId": "omarion_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          -171205,
          -1379,
          -143175
        ],
        "textureColor": "#be185d",
        "description": "High-security biotechnology installation sustaining the administrative ranks of the Dominion.",
        "parentPlanetId": "founders_homeworld"
      }
    ]
  },
  {
    "id": "delta_caretaker_system",
    "name": "Delta Quadrant / Caretaker Array Sector",
    "quadrant": "Delta Quadrant Frontier",
    "primaryStar": "Nacene Tri-Star System",
    "spectralType": "Exotic Flare Star",
    "centerCoordinates": [
      138000,
      1600,
      -158000
    ],
    "territory": "non_federation",
    "affiliation": "Unexplored Delta Space",
    "description": "Location 70,000 light-years in the Delta Quadrant where the Nacene Caretaker Array pulled starships across the galaxy.",
    "planets": [
      {
        "id": "caretaker_array",
        "name": "The Caretaker Array Megastructure",
        "systemId": "delta_caretaker_system",
        "type": "anomaly",
        "radius": 24,
        "position": [
          139185,
          1573,
          -157465
        ],
        "textureColor": "#06b6d4",
        "atmosphereColor": "#67e8f9",
        "description": "Immense alien space station generating coherent tetryon displacement waves across galactic space."
      },
      {
        "id": "ocampa_v",
        "name": "Ocampa V (Subterranean Sanctuary World)",
        "systemId": "delta_caretaker_system",
        "type": "desert",
        "radius": 32,
        "position": [
          135995,
          1645,
          -158905
        ],
        "textureColor": "#c2410c",
        "atmosphereColor": "#fb923c",
        "description": "Arid surface world protecting the telepathic Ocampa civilization living in energy-sustained underground cities."
      },
      {
        "id": "talaxian_colony",
        "name": "Talaxian Asteroid Enclave",
        "systemId": "delta_caretaker_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          139226,
          1581,
          -157498
        ],
        "textureColor": "#eab308",
        "description": "Ingenious civilian habitat hollowed out of a massive asteroid providing repairs, supplies, and trade.",
        "parentPlanetId": "caretaker_array"
      }
    ]
  },
  {
    "id": "borg_unicomplex_system",
    "name": "Borg Collective Transwarp Perimeter",
    "quadrant": "Delta Quadrant / Borg Space",
    "primaryStar": "Subspace Dark Core",
    "spectralType": "Class X Singularity",
    "centerCoordinates": [
      178000,
      2000,
      -188000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Borg Collective",
    "description": "Domain of the cybernetic Borg Collective. Massive Cubes, Spheres, and Transwarp hubs patrol this lethal zone.",
    "planets": [
      {
        "id": "borg_unicomplex",
        "name": "Borg Unicomplex Central Node",
        "systemId": "borg_unicomplex_system",
        "type": "anomaly",
        "radius": 24,
        "position": [
          177712,
          2000,
          -186732
        ],
        "textureColor": "#166534",
        "atmosphereColor": "#22c55e",
        "description": "Trillions of interconnected cybernetic structures housing the Borg Queen and hive mind nexus."
      },
      {
        "id": "transwarp_hub",
        "name": "Transwarp Conduit Hub 01",
        "systemId": "borg_unicomplex_system",
        "type": "wormhole",
        "radius": 40,
        "position": [
          178488,
          2000,
          -190145
        ],
        "textureColor": "#22c55e",
        "atmosphereColor": "#86efac",
        "description": "Vast artificial subspace gateway enabling instantaneous deployment across all four quadrants."
      },
      {
        "id": "borg_cube_dock",
        "name": "Assimilation Fleet Staging Grid",
        "systemId": "borg_unicomplex_system",
        "type": "starbase",
        "radius": 16,
        "position": [
          177752,
          2008,
          -186699
        ],
        "textureColor": "#1e293b",
        "description": "Gigantic hexagonal docking cradle recharging tactical Cubes with tachyon plasma.",
        "parentPlanetId": "borg_unicomplex"
      }
    ]
  },
  {
    "id": "galactic_barrier_sector",
    "name": "The Galactic Barrier / Galactic Rim",
    "quadrant": "Galactic Rim & Great Barrier",
    "primaryStar": "Galactic Rim Tachyon Anomaly",
    "spectralType": "Cosmic Field Boundary",
    "centerCoordinates": [
      22000,
      1200,
      -218000
    ],
    "territory": "non_federation",
    "affiliation": "Edge of Known Universe",
    "description": "Shimmering purplish field of negative energy and psionic radiation surrounding the perimeter of the Milky Way Galaxy.",
    "planets": [
      {
        "id": "galactic_barrier_rift",
        "name": "Galactic Barrier Negative Energy Rift",
        "systemId": "galactic_barrier_sector",
        "type": "nebula",
        "radius": 110,
        "position": [
          20600,
          1198,
          -218032
        ],
        "textureColor": "#ec4899",
        "atmosphereColor": "#f472b6",
        "description": "Massive energetic phenomenon at the galactic boundary known to trigger extreme extrasensory and psionic mutations in sentient species."
      },
      {
        "id": "aegis_deep_array",
        "name": "Starfleet Deep Space Array 'Aegis'",
        "systemId": "galactic_barrier_sector",
        "type": "starbase",
        "radius": 16,
        "position": [
          20575,
          1206,
          -217986
        ],
        "textureColor": "#cbd5e1",
        "description": "The outermost Starfleet scientific outpost observing extragalactic deep space and monitoring barrier stability.",
        "parentPlanetId": "galactic_barrier_rift"
      }
    ]
  }
];

// --- UNIVERSAL 3D COORDINATE SYSTEM HELPERS ---
export interface UniversalCelestialBody {
  id: string;
  name: string;
  systemId: string;
  systemName: string;
  type: string;
  radius: number;
  hasRings?: boolean;
  ringOuter?: number;
  position: [number, number, number]; // Coordinates relative to current active solar system frame
  worldPosition: [number, number, number]; // Absolute universal coordinates
}

// Returns a flattened list of all known celestial objects in the galaxy with both local and universal world positions
export function getAllUniversalCelestialBodies(): UniversalCelestialBody[] {
  const list: UniversalCelestialBody[] = [];
  for (const sys of STAR_TREK_SOLAR_SYSTEMS) {
    const [scx, scy, scz] = sys.centerCoordinates;
    // Central Primary Star
    const starRadius = sys.spectralType.includes('Supergiant')
      ? 165
      : sys.spectralType.includes('Giant')
      ? 150
      : sys.spectralType.includes('Dwarf')
      ? 120
      : 135;

    list.push({
      id: sys.id + "_primary_star",
      name: sys.primaryStar,
      systemId: sys.id,
      systemName: sys.name,
      type: 'star',
      radius: starRadius,
      position: [scx, scy, scz],
      worldPosition: [scx, scy, scz],
    });

    // Planetary Bodies, Moons, Outposts & Starbases
    for (const p of sys.planets) {
      list.push({
        id: p.id,
        name: p.name,
        systemId: sys.id,
        systemName: sys.name,
        type: p.type,
        radius: p.radius || 35,
        hasRings: p.hasRings,
        ringOuter: p.ringOuter,
        position: p.position,
        worldPosition: [p.position[0] + scx, p.position[1] + scy, p.position[2] + scz],
      });
    }
  }
  return list;
}

// Safety Collision Calculation:
// Evaluates any arbitrary target coordinates [x, y, z] against all nearby stars, planets, moons, and stations.
// If the destination falls inside or dangerously close to an object (even its exact center),
// this function computes a safe standoff position outside the object's surface along the ship's approach direction.
export function calculateSafeCoordinates(
  targetPos: [number, number, number],
  shipPos: [number, number, number],
  activeSystemId: string,
  extraBuffer: number = 140
): {
  safePos: [number, number, number];
  isOffsetApplied: boolean;
  clearanceDistance: number;
  standoffObject?: UniversalCelestialBody;
  approachVector: [number, number, number];
} {
  const bodies = getAllUniversalCelestialBodies();
  const tx = targetPos[0];
  const ty = targetPos[1];
  const tz = targetPos[2];

  let closestBody: UniversalCelestialBody | null = null;
  let minSurfaceDist = Infinity;
  let computedSafeRadius = 0;

  for (const b of bodies) {
    // Only check bodies in the target context / system frame
    const bx = b.position[0];
    const by = b.position[1];
    const bz = b.position[2];

    const dx = tx - bx;
    const dy = ty - by;
    const dz = tz - bz;
    const distToCenter = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Physical radius plus ring clearance and buffer
    const baseRadius = b.radius || 40;
    const ringRadius = (b.hasRings && b.ringOuter) ? b.ringOuter : 0;
    // Standard safety zone: surface + buffer
    const safeRadius = Math.max(baseRadius * 2.5 + extraBuffer, ringRadius + extraBuffer, 220);

    const surfaceDist = distToCenter - safeRadius;
    if (distToCenter < safeRadius && surfaceDist < minSurfaceDist) {
      minSurfaceDist = surfaceDist;
      closestBody = b;
      computedSafeRadius = safeRadius;
    }
  }

  // Calculate approach direction from ship position towards destination
  let appX = shipPos[0] - tx;
  let appY = shipPos[1] - ty;
  let appZ = shipPos[2] - tz;
  let appLen = Math.sqrt(appX * appX + appY * appY + appZ * appZ);

  if (appLen < 0.001) {
    // Ship is already exactly at coordinate, default approach from elevated diagonal
    appX = 0;
    appY = 0.3;
    appZ = 1;
    appLen = Math.sqrt(appX * appX + appY * appY + appZ * appZ);
  }

  // Normalize approach vector (from destination towards approaching ship)
  appX /= appLen;
  appY /= appLen;
  appZ /= appLen;

  // Ensure pleasant viewing angle: don't approach precisely along the flat equator if planet has rings
  if (Math.abs(appY) < 0.18) {
    appY = 0.22;
    const reNorm = Math.sqrt(appX * appX + appY * appY + appZ * appZ);
    appX /= reNorm;
    appY /= reNorm;
    appZ /= reNorm;
  }

  if (closestBody) {
    // The requested coordinates are inside or too close to a celestial body!
    // Standoff point: object center + offset along approach direction by safeRadius
    const bx = closestBody.position[0];
    const by = closestBody.position[1];
    const bz = closestBody.position[2];

    // Compute direction from body center to ship approach
    let fromBodyX = shipPos[0] - bx;
    let fromBodyY = shipPos[1] - by;
    let fromBodyZ = shipPos[2] - bz;
    let fromBodyLen = Math.sqrt(fromBodyX * fromBodyX + fromBodyY * fromBodyY + fromBodyZ * fromBodyZ);

    if (fromBodyLen < 1) {
      fromBodyX = appX;
      fromBodyY = appY;
      fromBodyZ = appZ;
      fromBodyLen = 1;
    } else {
      fromBodyX /= fromBodyLen;
      fromBodyY /= fromBodyLen;
      fromBodyZ /= fromBodyLen;
    }

    if (Math.abs(fromBodyY) < 0.18) {
      fromBodyY = 0.22;
      const reNorm = Math.sqrt(fromBodyX * fromBodyX + fromBodyY * fromBodyY + fromBodyZ * fromBodyZ);
      fromBodyX /= reNorm;
      fromBodyY /= reNorm;
      fromBodyZ /= reNorm;
    }

    const safePos: [number, number, number] = [
      Math.round(bx + fromBodyX * computedSafeRadius),
      Math.round(by + fromBodyY * computedSafeRadius),
      Math.round(bz + fromBodyZ * computedSafeRadius),
    ];

    return {
      safePos,
      isOffsetApplied: true,
      clearanceDistance: Math.round(computedSafeRadius),
      standoffObject: closestBody,
      approachVector: [fromBodyX, fromBodyY, fromBodyZ],
    };
  }

  // Destination is in deep open space, no celestial body collision danger detected
  return {
    safePos: [Math.round(tx), Math.round(ty), Math.round(tz)],
    isOffsetApplied: false,
    clearanceDistance: 0,
    approachVector: [appX, appY, appZ],
  };
}
