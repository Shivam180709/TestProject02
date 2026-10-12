import * as THREE from 'three';
import { CelestialTarget, SolarSystem, PlanetData } from '../types/simulation';
import { STAR_TREK_SOLAR_SYSTEMS, createPlanetTexture } from './solarSystems';
import { ParticleExplosionManager } from './particleExplosion';
import { WarpEffectManager } from './warpEffect';
import {
  buildStarfleetOrbitalDrydock,
  buildMonumentalSpacedock,
  updateAllStarbaseAmbience,
} from './starbaseModels';

export interface WeaponProjectile {
  mesh: THREE.Object3D;
  prevPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  targetEnemyId: string | null;
  targetStaticPos: THREE.Vector3 | null;
  life: number;
  maxLife: number;
  type: 'torpedo';
  thrustPlume?: THREE.Mesh;
}

export interface SpaceEnvironment {
  scene: THREE.Scene;
  starfield: THREE.Points;
  warpTunnel: THREE.LineSegments | THREE.Group;
  warpEffect: WarpEffectManager;
  systems: SolarSystem[];
  planets: PlanetData[];
  targetMeshes: Map<string, THREE.Object3D>;
  explosionManager: ParticleExplosionManager;
  update: (
    delta: number,
    isWarping: boolean,
    warpFactor: number,
    shipPosition: THREE.Vector3,
    shipOrientation?: THREE.Quaternion,
    cameraPosition?: THREE.Vector3,
    onCheckTorpedoHit?: (pos: THREE.Vector3, prevPos: THREE.Vector3) => boolean,
    getLiveTargetPos?: (enemyId?: string | null, currentPos?: THREE.Vector3) => THREE.Vector3 | null
  ) => void;
  updateStarbaseAmbience: (
    delta: number,
    time: number,
    shipPos: THREE.Vector3,
    isDocked: boolean,
    isRepairing: boolean,
    dockedStationId: string | null
  ) => void;
  firePhasers: (fromLeft: THREE.Vector3, fromRight: THREE.Vector3, targetPos: THREE.Vector3 | null, forwardDir: THREE.Vector3) => void;
  stopPhasers: () => void;
  launchTorpedo: (origin: THREE.Vector3, direction: THREE.Vector3, targetEnemyId?: string | null, targetStaticPos?: THREE.Vector3 | null) => void;
  triggerExplosion: (pos: THREE.Vector3, scale?: number) => void;
  destructTarget: (id: string) => void;
  setActiveSystem?: (systemId: string) => void;
}

export function getSystemStarColor(systemId: string): number {
  if (systemId === 'sol_system') return 0xfef08a;
  if (systemId === 'vulcan_system') return 0xfdba74;
  if (systemId === 'andoria_system') return 0xffffff;
  if (systemId === 'kronos_system' || systemId === 'mempa_system') return 0xef4444;
  if (systemId === 'romulus_system' || systemId === 'krios_system') return 0x34d399;
  if (systemId === 'cardassia_system' || systemId === 'chintoka_system') return 0xf59e0b;
  if (systemId === 'bajor_system' || systemId === 'babel_system') return 0xfef08a;
  if (systemId === 'ferenginar_system' || systemId === 'briar_patch_sector') return 0xfbbf24;
  if (systemId === 'gorn_sector' || systemId === 'bolian_system' || systemId === 'cheron_system') return 0x60a5fa;
  if (systemId === 'mutara_sector' || systemId === 'tholian_sector') return 0xf97316;
  if (systemId === 'idran_system') return 0x818cf8;
  if (systemId === 'omarion_system') return 0xf472b6;
  if (systemId === 'delta_caretaker_system') return 0x06b6d4;
  if (systemId === 'borg_unicomplex_system') return 0x22c55e;
  if (systemId === 'galactic_barrier_sector') return 0xec4899;
  if (systemId === 'deneb_system') return 0xffffff;
  return 0xfde047;
}

export function buildSpaceEnvironment(scene: THREE.Scene): SpaceEnvironment {
  // 1. Ambient & Galactic Illumination
  const spaceAmbient = new THREE.AmbientLight(0x1e293b, 1.8);
  scene.add(spaceAmbient);

  // Key Galaxy Core Sun
  const keySun = new THREE.DirectionalLight(0xfff7ed, 2.5);
  keySun.position.set(2400, 3200, 1800);
  scene.add(keySun);

  // Rim Fill Light
  const fillSun = new THREE.DirectionalLight(0x38bdf8, 1.2);
  fillSun.position.set(-3000, -1500, -2500);
  scene.add(fillSun);

  // Dynamic Primary Stellar Point Light (Smoothly tracks and illuminates whichever star system Enterprise/camera is closest to)
  const localStellarLight = new THREE.PointLight(0xfef08a, 3.4, 8500);
  scene.add(localStellarLight);

  // 2. Vast Deep-Space Starfield (16,000 stars spanning up to 48,000 km)
  const starCount = 16000;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starColorPalette = [
    new THREE.Color(0xffffff), // Pure white
    new THREE.Color(0xdbeafe), // Cool A-type
    new THREE.Color(0x93c5fd), // Blue-white O/B
    new THREE.Color(0xfef08a), // Yellow dwarf G-type
    new THREE.Color(0xfdba74), // Orange K-type
    new THREE.Color(0xfca5a5), // Red M-type
    new THREE.Color(0xc084fc), // Rare ultraviolet flare
  ];

  for (let i = 0; i < starCount; i++) {
    const radius = 2400 + Math.random() * 46000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.42; // Galactic disc distribution
    starPositions[i * 3 + 2] = radius * Math.cos(phi);

    const c = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
  });

  const starfield = new THREE.Points(starGeo, starMat);
  scene.add(starfield);

  // 3. Distant Volumetric Cosmic Gas Clouds (10 Nebulae clusters, 3 lobes each for reduced fillrate)
  const nebulaeColors = [0x9333ea, 0x0284c7, 0xea580c, 0x10b981, 0xec4899, 0x38bdf8, 0xa855f7];
  for (let i = 0; i < 10; i++) {
    const cloudAngle = (i / 10) * Math.PI * 2 + 0.2;
    const cloudDist = 18000 + Math.random() * 26000;
    const cx = Math.cos(cloudAngle) * cloudDist;
    const cy = (Math.random() - 0.5) * 8000;
    const cz = Math.sin(cloudAngle) * cloudDist;

    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(cx, cy, cz);

    const cloudColor = nebulaeColors[i % nebulaeColors.length];
    for (let lobe = 0; lobe < 3; lobe++) {
      const lobeGeo = new THREE.SphereGeometry(2200 + Math.random() * 1600, 12, 12);
      const lobeMat = new THREE.MeshBasicMaterial({
        color: cloudColor,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const lobeMesh = new THREE.Mesh(lobeGeo, lobeMat);
      lobeMesh.position.set(
        (Math.random() - 0.5) * 1400,
        (Math.random() - 0.5) * 1400,
        (Math.random() - 0.5) * 1400
      );
      cloudGroup.add(lobeMesh);
    }
    scene.add(cloudGroup);
  }

  // 4. Cinematic Star Trek Warp Effect System (Streaks, Subspace Bubble, Flash, Spatial Distortion)
  const warpEffect = new WarpEffectManager(scene);
  const warpTunnel = warpEffect.group as any;

  // 5. Build Primary Stars, Planets, Space Stations, Nebulae & Anomalies across all 40 Systems
  // Core rule: Each solar system is isolated and separated. Only the active solar system is visible!
  const targetMeshes = new Map<string, THREE.Object3D>();
  const animatedAnomalies: { mesh: THREE.Object3D; speed: number; type: string }[] = [];
  const allPlanets: PlanetData[] = [];
  const systemDetailedGroups = new Map<string, THREE.Group>();
  let currentActiveSystemId = 'sol_system';

  const setActiveSystem = (systemId: string) => {
    currentActiveSystemId = systemId;
    for (const [id, group] of systemDetailedGroups) {
      group.visible = (id === currentActiveSystemId);
    }
  };

  for (const system of STAR_TREK_SOLAR_SYSTEMS) {
    const starColor = getSystemStarColor(system.id);
    const [cx, cy, cz] = system.centerCoordinates;

    // Isolated system group: Only the current active solar system is visible!
    const systemDetailedGroup = new THREE.Group();
    systemDetailedGroup.name = `system_${system.id}`;
    // Sol system is visible by default at launch; all other systems hidden until warp arrival
    systemDetailedGroup.visible = (system.id === currentActiveSystemId);
    scene.add(systemDetailedGroup);
    systemDetailedGroups.set(system.id, systemDetailedGroup);

    // 5A. Central Primary Star in System (Balanced astronomical proportion matching reference diagram)
    const starGroup = new THREE.Group();
    starGroup.position.set(cx, cy, cz);

    const starRadius = system.spectralType.includes('Supergiant')
      ? 165
      : system.spectralType.includes('Giant')
      ? 150
      : system.spectralType.includes('Dwarf')
      ? 120
      : 135;

    // Star Photosphere Core
    const starCoreGeo = new THREE.SphereGeometry(starRadius, 32, 24);
    const starCoreMat = new THREE.MeshBasicMaterial({ color: starColor });
    const starCoreMesh = new THREE.Mesh(starCoreGeo, starCoreMat);
    starGroup.add(starCoreMesh);

    // Tasteful, Glowing Solar Corona Shell
    const coronaGeo = new THREE.SphereGeometry(starRadius * 1.12, 24, 18);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: starColor,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    starGroup.add(coronaMesh);
    animatedAnomalies.push({ mesh: coronaMesh, speed: 0.05, type: 'corona' });

    // 5B. Concentric Planetary Orbit Trajectory Guides (Matching authentic solar system schematic)
    for (const planet of system.planets) {
      if (planet.type === 'moon' || planet.type === 'starbase') continue;
      const dx = planet.position[0] - cx;
      const dz = planet.position[2] - cz;
      const orbitR = Math.hypot(dx, dz);
      if (orbitR > 250) {
        const segCount = 64;
        const orbitPts: THREE.Vector3[] = [];
        for (let s = 0; s <= segCount; s++) {
          const a = (s / segCount) * Math.PI * 2;
          orbitPts.push(new THREE.Vector3(Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR));
        }
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
        const orbitMat = new THREE.LineBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        starGroup.add(orbitLine);
      }
    }

    // Secondary Lunar Orbit Guides around Host Planets
    for (const planet of system.planets) {
      if (planet.type === 'moon') {
        const parent = system.planets.find(
          (p) => p.id === (planet as any).parentPlanetId || (p.type !== 'moon' && p.type !== 'starbase')
        );
        if (parent) {
          const mdx = planet.position[0] - parent.position[0];
          const mdz = planet.position[2] - parent.position[2];
          const moonDist = Math.hypot(mdx, mdz);
          if (moonDist > 30) {
            const mPts: THREE.Vector3[] = [];
            for (let s = 0; s <= 36; s++) {
              const a = (s / 36) * Math.PI * 2;
              mPts.push(
                new THREE.Vector3(
                  parent.position[0] + Math.cos(a) * moonDist,
                  parent.position[1],
                  parent.position[2] + Math.sin(a) * moonDist
                )
              );
            }
            const mGeo = new THREE.BufferGeometry().setFromPoints(mPts);
            const mMat = new THREE.LineBasicMaterial({
              color: 0x64748b,
              transparent: true,
              opacity: 0.22,
              depthWrite: false,
            });
            const mLine = new THREE.Line(mGeo, mMat);
            systemDetailedGroup.add(mLine);
          }
        }
      }
    }

    systemDetailedGroup.add(starGroup);
    targetMeshes.set(system.id + '_primary_star', starGroup);

    // 5D. Build Planetary Bodies, Moons, Stations, Rings, Nebulae & Anomalies
    for (const planet of system.planets) {
      allPlanets.push(planet);
      const planetGroup = new THREE.Group();
      planetGroup.position.set(planet.position[0], planet.position[1], planet.position[2]);

      if (planet.type === 'starbase') {
        if (planet.id === 'deep_space_nine') {
          // Authentic Nor-Class Space Station (Deep Space 9 / Terok Nor)
          const hubCore = new THREE.Mesh(
            new THREE.CylinderGeometry(planet.radius * 0.45, planet.radius * 0.45, planet.radius * 1.4, 20),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
          );
          planetGroup.add(hubCore);

          // Outer Docking Ring
          const outerRing = new THREE.Mesh(
            new THREE.TorusGeometry(planet.radius * 1.7, planet.radius * 0.12, 16, 40),
            new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x0284c7, emissiveIntensity: 0.4 })
          );
          outerRing.rotation.x = Math.PI / 2;
          planetGroup.add(outerRing);

          // Inner Habitat Ring
          const innerRing = new THREE.Mesh(
            new THREE.TorusGeometry(planet.radius * 0.95, planet.radius * 0.1, 16, 32),
            new THREE.MeshStandardMaterial({ color: 0x475569, emissive: 0x38bdf8, emissiveIntensity: 0.6 })
          );
          innerRing.rotation.x = Math.PI / 2;
          planetGroup.add(innerRing);

          // 3 Upper Docking Pylons & 3 Lower Docking Pylons
          for (let pIdx = 0; pIdx < 3; pIdx++) {
            const angle = (pIdx / 3) * Math.PI * 2;

            // Upper pylon
            const upPylon = new THREE.Mesh(
              new THREE.CylinderGeometry(planet.radius * 0.08, planet.radius * 0.06, planet.radius * 1.6, 12),
              new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 })
            );
            upPylon.position.set(Math.cos(angle) * (planet.radius * 1.35), planet.radius * 0.75, Math.sin(angle) * (planet.radius * 1.35));
            upPylon.rotation.z = Math.cos(angle) * 0.35;
            upPylon.rotation.x = Math.sin(angle) * 0.35;
            planetGroup.add(upPylon);

            // Lower pylon
            const downPylon = upPylon.clone();
            downPylon.position.y = -planet.radius * 0.75;
            downPylon.rotation.z = -Math.cos(angle) * 0.35;
            downPylon.rotation.x = -Math.sin(angle) * 0.35;
            planetGroup.add(downPylon);
          }

          const ds9Beacon = new THREE.Mesh(
            new THREE.SphereGeometry(planet.radius * 0.12, 10, 8),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          planetGroup.add(ds9Beacon);
        } else if (planet.id.includes('spacedock')) {
          // Monumental Mushroom-Spacedock (Earth Spacedock One & Starbase 74)
          const complex = buildMonumentalSpacedock(planet.id, [0, 0, 0], planet.radius);
          planetGroup.add(complex.root);

          // In Sol System, Earth Spacedock One also features an adjacent San Francisco Orbital Drydock Frame
          if (planet.id === 'sol_spacedock') {
            const adjacentDrydock = buildStarfleetOrbitalDrydock('sol_drydock_frame', [110, 20, 180], planet.radius);
            planetGroup.add(adjacentDrydock.root);
          }
        } else {
          // Monumental Starfleet Orbital Drydock Frame (Utopia Planitia, Starbase 11, Tellarite Drydock, etc.)
          const complex = buildStarfleetOrbitalDrydock(planet.id, [0, 0, 0], planet.radius);
          planetGroup.add(complex.root);
        }
      } else if (planet.type === 'wormhole') {
        // The Celestial Temple / Bajoran Wormhole to the Gamma Quadrant
        const discRadius = planet.radius * 2.2;
        const outerDiscGeo = new THREE.RingGeometry(planet.radius * 0.4, discRadius, 36);
        const outerDiscMat = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        });
        const outerDisc = new THREE.Mesh(outerDiscGeo, outerDiscMat);
        outerDisc.rotation.x = Math.PI * 0.45;
        planetGroup.add(outerDisc);

        const innerDiscGeo = new THREE.RingGeometry(planet.radius * 0.1, planet.radius * 1.2, 28);
        const innerDiscMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        });
        const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
        innerDisc.rotation.x = Math.PI * 0.45;
        planetGroup.add(innerDisc);

        const coreFlareGeo = new THREE.SphereGeometry(planet.radius * 0.5, 16, 16);
        const coreFlare = new THREE.Mesh(coreFlareGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        planetGroup.add(coreFlare);

        animatedAnomalies.push({ mesh: outerDisc, speed: 0.8, type: 'wormhole_outer' });
        animatedAnomalies.push({ mesh: innerDisc, speed: -1.2, type: 'wormhole_inner' });
      } else if (planet.type === 'nebula') {
        // Volumetric Gas Nebula Cloud (Mutara / Badlands / Briar Patch)
        const cloudRadius = planet.radius * 1.8;
        const nebColor = new THREE.Color(planet.textureColor || '#9333ea');

        for (let lobe = 0; lobe < 4; lobe++) {
          const lGeo = new THREE.SphereGeometry(cloudRadius * (0.6 + (lobe % 3) * 0.25), 14, 12);
          const lMat = new THREE.MeshBasicMaterial({
            color: nebColor,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          });
          const lMesh = new THREE.Mesh(lGeo, lMat);
          lMesh.position.set(
            (Math.random() - 0.5) * (cloudRadius * 0.7),
            (Math.random() - 0.5) * (cloudRadius * 0.7),
            (Math.random() - 0.5) * (cloudRadius * 0.7)
          );
          planetGroup.add(lMesh);
        }

        // Particle Ion Dust Swarm
        const partCount = 100;
        const partGeo = new THREE.BufferGeometry();
        const partPos = new Float32Array(partCount * 3);
        for (let pIdx = 0; pIdx < partCount; pIdx++) {
          partPos[pIdx * 3] = (Math.random() - 0.5) * cloudRadius * 2.4;
          partPos[pIdx * 3 + 1] = (Math.random() - 0.5) * cloudRadius * 2.4;
          partPos[pIdx * 3 + 2] = (Math.random() - 0.5) * cloudRadius * 2.4;
        }
        partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
        const partMat = new THREE.PointsMaterial({
          color: planet.atmosphereColor ? new THREE.Color(planet.atmosphereColor) : nebColor,
          size: 4.5,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        });
        const particles = new THREE.Points(partGeo, partMat);
        planetGroup.add(particles);

        animatedAnomalies.push({ mesh: planetGroup, speed: 0.05, type: 'nebula' });
      } else if (planet.id === 'caretaker_array') {
        // The Caretaker Array Megastructure (Nacene Displacement Emitter)
        const coreGeo = new THREE.CylinderGeometry(planet.radius * 0.4, planet.radius * 0.6, planet.radius * 1.5, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, metalness: 0.85, roughness: 0.2 });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        planetGroup.add(coreMesh);

        // 3 Radial Collector Pylons
        for (let a = 0; a < 3; a++) {
          const ang = (a / 3) * Math.PI * 2;
          const armGeo = new THREE.BoxGeometry(planet.radius * 1.4, planet.radius * 0.15, planet.radius * 0.25);
          const armMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, metalness: 0.8 });
          const arm = new THREE.Mesh(armGeo, armMat);
          arm.position.set(Math.cos(ang) * planet.radius * 0.7, 0, Math.sin(ang) * planet.radius * 0.7);
          arm.rotation.y = ang;
          planetGroup.add(arm);
        }

        // Tetryon Displacement Emitter Ring
        const ringGeo = new THREE.TorusGeometry(planet.radius * 1.2, planet.radius * 0.08, 12, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        planetGroup.add(ringMesh);

        const emitterBeacon = new THREE.Mesh(
          new THREE.SphereGeometry(planet.radius * 0.18, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        planetGroup.add(emitterBeacon);
      } else if (planet.id === 'borg_unicomplex') {
        // Borg Unicomplex Central Node: Cluster of Cybernetic Cubes & Green Conduits
        for (let c = 0; c < 5; c++) {
          const cSize = planet.radius * (0.35 + (c % 3) * 0.15);
          const cGeo = new THREE.BoxGeometry(cSize, cSize, cSize);
          const cMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.35,
          });
          const cMesh = new THREE.Mesh(cGeo, cMat);
          const ang = (c / 5) * Math.PI * 2;
          const dist = (c === 0 ? 0 : planet.radius * 0.65);
          cMesh.position.set(Math.cos(ang) * dist, ((c % 3) - 1) * planet.radius * 0.3, Math.sin(ang) * dist);
          planetGroup.add(cMesh);
        }

        // Borg Green Shield Grid Shell
        const shieldGeo = new THREE.SphereGeometry(planet.radius * 1.15, 18, 14);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        planetGroup.add(shieldMesh);
      } else if (planet.id === 'galactic_barrier_rift') {
        // The Great Galactic Barrier: Shimmering Energetic Tachyon Veil
        const veilGeo = new THREE.CylinderGeometry(planet.radius * 1.5, planet.radius * 1.8, planet.radius * 2.5, 24, 1, true);
        const veilMat = new THREE.MeshBasicMaterial({
          color: 0xec4899,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
        const veilMesh = new THREE.Mesh(veilGeo, veilMat);
        veilMesh.rotation.z = Math.PI / 4;
        planetGroup.add(veilMesh);
      } else {
        // Natural Planet Sphere or Moon
        const isMoon = planet.type === 'moon';
        const isGasGiant = planet.type === 'gas_giant';
        const tex = createPlanetTexture(planet.type, planet.textureColor);
        const sphereGeo = new THREE.SphereGeometry(
          planet.radius,
          isGasGiant ? 32 : isMoon ? 22 : 28,
          isGasGiant ? 24 : isMoon ? 16 : 20
        );
        const sphereMat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: isGasGiant ? 0.9 : isMoon ? 0.85 : planet.type === 'ocean' ? 0.3 : 0.6,
          metalness: planet.type === 'ocean' ? 0.25 : 0.12,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        planetGroup.add(sphere);

        // Subtle Atmospheric Glow Shell for terrestrial planets with atmosphereColor
        if (planet.atmosphereColor && !isMoon) {
          const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.035, 24, 18);
          const atmoMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(planet.atmosphereColor),
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          });
          const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
          planetGroup.add(atmoMesh);
        }

        // Planetary Rings if applicable (e.g. Saturn, Ka'Thelan, Praxis, Ba'ku)
        if (planet.hasRings && planet.ringInner && planet.ringOuter) {
          const ringGeo = new THREE.RingGeometry(planet.ringInner, planet.ringOuter, 40);
          const ringMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(planet.ringColor || '#fed7aa'),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.72,
            roughness: 0.8,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI * 0.42;
          ring.rotation.y = Math.PI * 0.12;
          planetGroup.add(ring);
        }
      }

      systemDetailedGroup.add(planetGroup);
      targetMeshes.set(planet.id, planetGroup);
    }
  }

  // 6. Tactical Asteroids for Target Practice & Combat Drill
  const asteroidId = 'asteroid_target_alpha';
  const astGroup = new THREE.Group();
  astGroup.position.set(-180, 45, -340);

  const rockGeo = new THREE.DodecahedronGeometry(22, 2);
  const posAttr = rockGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const noise = 1 + (Math.sin(vx * 0.35) + Math.cos(vy * 0.35)) * 0.15;
    posAttr.setXYZ(i, vx * noise, vy * noise, vz * noise);
  }
  rockGeo.computeVertexNormals();

  const rockMesh = new THREE.Mesh(
    rockGeo,
    new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.95,
      metalness: 0.2,
    })
  );
  astGroup.add(rockMesh);
  scene.add(astGroup);
  targetMeshes.set(asteroidId, astGroup);

  // 7. Particle Explosion System
  const explosionManager = new ParticleExplosionManager(scene);

  // 8. Weapons: 3D Volumetric Dual Phaser Beams with High-Energy Nadion Plasma
  // Unlike flat 1-pixel WebGL lines (which vanish at glancing angles or along camera rays),
  // these 3D volumetric cylinder meshes retain visible thickness, emissive core, and outer glow sheath from ALL angles.
  const createPhaserBeamGroup = () => {
    const group = new THREE.Group();
    group.visible = false;

    // Unit cylinder centered at origin, height 1 along Y-axis
    // Inner high-temperature core (blinding white-yellow nadion burst)
    const innerGeo = new THREE.CylinderGeometry(0.45, 0.45, 1, 10, 1, true);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // Mid plasma corona (vibrant Starfleet high-yield orange)
    const midGeo = new THREE.CylinderGeometry(1.3, 1.3, 1, 10, 1, true);
    const midMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const midMesh = new THREE.Mesh(midGeo, midMat);
    group.add(midMesh);

    // Outer dissipation halo (soft deep red-orange energy wash)
    const outerGeo = new THREE.CylinderGeometry(2.6, 2.6, 1, 10, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    return group;
  };

  const phaserLeftBeamGroup = createPhaserBeamGroup();
  const phaserRightBeamGroup = createPhaserBeamGroup();
  scene.add(phaserLeftBeamGroup);
  scene.add(phaserRightBeamGroup);

  // Emitter Muzzle Flares (Ensures beams are brilliantly visible even when firing directly toward or away from camera)
  const muzzleGeo = new THREE.SphereGeometry(1.6, 12, 12);
  const muzzleMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleLeft = new THREE.Mesh(muzzleGeo, muzzleMat);
  const muzzleRight = new THREE.Mesh(muzzleGeo, muzzleMat.clone());
  muzzleLeft.visible = false;
  muzzleRight.visible = false;
  scene.add(muzzleLeft);
  scene.add(muzzleRight);

  // Target Impact Flare
  const phaserImpactGeo = new THREE.SphereGeometry(3.5, 16, 16);
  const phaserImpactMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const phaserImpact = new THREE.Mesh(phaserImpactGeo, phaserImpactMat);
  phaserImpact.visible = false;
  scene.add(phaserImpact);

  const yAxisUnit = new THREE.Vector3(0, 1, 0);
  const beamDirVec = new THREE.Vector3();
  const beamMidVec = new THREE.Vector3();

  const orientPhaserBeam = (group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3) => {
    const dist = start.distanceTo(end);
    if (dist < 0.2) return;

    beamMidVec.addVectors(start, end).multiplyScalar(0.5);
    group.position.copy(beamMidVec);

    beamDirVec.subVectors(end, start).normalize();
    group.quaternion.setFromUnitVectors(yAxisUnit, beamDirVec);

    // Scale cylinder along its Y axis to match distance, with subtle pulse
    const pulse = 1.0 + (Math.random() - 0.5) * 0.12;
    group.scale.set(pulse, dist, pulse);
    group.visible = true;
  };

  // 9. Weapons: Photon Torpedo Projectiles (Matching Authentic Sleek Missile Design)
  // Chrome silver tapered fuselage, pointed conical nose cone, 4 swept stabilizer fins,
  // red segmented propulsion collar with ribbed ring bands, and glowing fiery exhaust nozzle.
  function buildPhotonTorpedoMesh(): { group: THREE.Group; thrustPlume: THREE.Mesh } {
    const group = new THREE.Group();

    // Polished titanium / chrome silver metallic casing
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18,
    });

    const darkPanelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.35,
    });

    // 1. Pointed Nose Cone (Nose points towards -Z, the standard Three.js forward)
    const noseGeo = new THREE.ConeGeometry(0.58, 1.2, 16);
    const noseMesh = new THREE.Mesh(noseGeo, chromeMat);
    noseMesh.rotation.x = -Math.PI / 2;
    noseMesh.position.set(0, 0, -2.1);
    group.add(noseMesh);

    // Sharp forward apex tip
    const tipGeo = new THREE.ConeGeometry(0.2, 0.4, 12);
    const tipMesh = new THREE.Mesh(tipGeo, darkPanelMat);
    tipMesh.rotation.x = -Math.PI / 2;
    tipMesh.position.set(0, 0, -2.8);
    group.add(tipMesh);

    // 2. Streamlined Forward & Mid Cylindrical Fuselage
    const forwardHullGeo = new THREE.CylinderGeometry(0.58, 0.72, 1.1, 16);
    const forwardHullMesh = new THREE.Mesh(forwardHullGeo, chromeMat);
    forwardHullMesh.rotation.x = Math.PI / 2;
    forwardHullMesh.position.set(0, 0, -1.05);
    group.add(forwardHullMesh);

    // Mid fuselage body with aerodynamic taper
    const midHullGeo = new THREE.CylinderGeometry(0.72, 0.75, 1.3, 16);
    const midHullMesh = new THREE.Mesh(midHullGeo, chromeMat);
    midHullMesh.rotation.x = Math.PI / 2;
    midHullMesh.position.set(0, 0, 0.1);
    group.add(midHullMesh);

    // Circumferential panel joint seam
    const seamGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.08, 16);
    const seamMesh = new THREE.Mesh(seamGeo, darkPanelMat);
    seamMesh.rotation.x = Math.PI / 2;
    seamMesh.position.set(0, 0, -0.45);
    group.add(seamMesh);

    // 3. Four Lateral Swept Stabilizer Fins / Winglets
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.85, -0.35);
    finShape.quadraticCurveTo(0.95, -0.75, 0.55, -0.9);
    finShape.lineTo(0, -0.7);
    finShape.closePath();

    const finExtrudeSettings = {
      steps: 1,
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    };
    const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
    finGeo.center();

    for (let i = 0; i < 4; i++) {
      const finMesh = new THREE.Mesh(finGeo, chromeMat);
      const angle = (i * Math.PI) / 2;
      finMesh.rotation.z = angle;
      finMesh.position.set(
        Math.cos(angle) * 0.92,
        Math.sin(angle) * 0.92,
        -0.05
      );
      group.add(finMesh);
    }

    // 4. Rear Red Propulsion Housing / Rocket Booster Collar
    const redBoosterMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.55,
      roughness: 0.32,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.4,
    });

    const boosterGeo = new THREE.CylinderGeometry(0.76, 0.74, 1.15, 16);
    const boosterMesh = new THREE.Mesh(boosterGeo, redBoosterMat);
    boosterMesh.rotation.x = Math.PI / 2;
    boosterMesh.position.set(0, 0, 1.25);
    group.add(boosterMesh);

    // Segmented Ring Bands on the Red Collar
    const ringBandMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      metalness: 0.65,
      roughness: 0.25,
    });
    for (const zOffset of [0.9, 1.25, 1.6]) {
      const ringGeo = new THREE.CylinderGeometry(0.81, 0.81, 0.12, 16);
      const ringMesh = new THREE.Mesh(ringGeo, ringBandMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(0, 0, zOffset);
      group.add(ringMesh);
    }

    // 5. Thruster Exhaust Nozzle Rim (Aft)
    const nozzleRimGeo = new THREE.CylinderGeometry(0.66, 0.52, 0.35, 16);
    const nozzleRimMesh = new THREE.Mesh(nozzleRimGeo, darkPanelMat);
    nozzleRimMesh.rotation.x = Math.PI / 2;
    nozzleRimMesh.position.set(0, 0, 1.95);
    group.add(nozzleRimMesh);

    // 6. Glowing Incandescent Rocket Exhaust Core & Plume
    const coreFlameGeo = new THREE.SphereGeometry(0.38, 12, 12);
    const coreFlameMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const coreFlameMesh = new THREE.Mesh(coreFlameGeo, coreFlameMat);
    coreFlameMesh.position.set(0, 0, 2.05);
    group.add(coreFlameMesh);

    // Outer fiery plasma thrust plume (pointing backwards +Z)
    const thrustPlumeGeo = new THREE.ConeGeometry(0.68, 2.6, 12);
    const thrustPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const thrustPlumeMesh = new THREE.Mesh(thrustPlumeGeo, thrustPlumeMat);
    thrustPlumeMesh.rotation.x = Math.PI / 2;
    thrustPlumeMesh.position.set(0, 0, 3.2);
    group.add(thrustPlumeMesh);

    // Inner bright yellow flame core
    const innerPlumeGeo = new THREE.ConeGeometry(0.38, 1.8, 12);
    const innerPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerPlumeMesh = new THREE.Mesh(innerPlumeGeo, innerPlumeMat);
    innerPlumeMesh.rotation.x = Math.PI / 2;
    innerPlumeMesh.position.set(0, 0, 2.8);
    group.add(innerPlumeMesh);

    // Dynamic point light for spatial propulsion glow
    const light = new THREE.PointLight(0xff5500, 2.2, 35);
    light.position.set(0, 0, 2.2);
    group.add(light);

    return { group, thrustPlume: thrustPlumeMesh };
  }

  const projectiles: WeaponProjectile[] = [];

  const launchTorpedo = (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    targetEnemyId?: string | null,
    targetStaticPos?: THREE.Vector3 | null
  ) => {
    const { group: torpedoMesh, thrustPlume } = buildPhotonTorpedoMesh();
    torpedoMesh.position.copy(origin);

    const forward = direction.clone().normalize();
    torpedoMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward);
    scene.add(torpedoMesh);

    projectiles.push({
      mesh: torpedoMesh,
      prevPosition: origin.clone(),
      velocity: forward.clone().multiplyScalar(280),
      targetEnemyId: targetEnemyId || null,
      targetStaticPos: targetStaticPos ? targetStaticPos.clone() : null,
      life: 0,
      maxLife: 4.5,
      type: 'torpedo',
      thrustPlume,
    });
  };

  const triggerExplosion = (pos: THREE.Vector3, scale: number = 1.0) => {
    explosionManager.triggerExplosion(pos, scale);
  };

  const firePhasers = (
    fromLeft: THREE.Vector3,
    fromRight: THREE.Vector3,
    targetPos: THREE.Vector3 | null,
    forwardDir: THREE.Vector3
  ) => {
    const end = targetPos
      ? targetPos.clone()
      : fromLeft.clone().add(forwardDir.clone().normalize().multiplyScalar(450));

    orientPhaserBeam(phaserLeftBeamGroup, fromLeft, end);
    orientPhaserBeam(phaserRightBeamGroup, fromRight, end);

    muzzleLeft.visible = true;
    muzzleLeft.position.copy(fromLeft);
    muzzleLeft.scale.setScalar(1 + Math.random() * 0.4);

    muzzleRight.visible = true;
    muzzleRight.position.copy(fromRight);
    muzzleRight.scale.setScalar(1 + Math.random() * 0.4);

    if (targetPos) {
      phaserImpact.visible = true;
      phaserImpact.position.copy(targetPos);
      phaserImpact.scale.setScalar(1.2 + Math.random() * 0.9);
      if (Math.random() > 0.6) {
        explosionManager.triggerExplosion(targetPos, 0.45);
      }
    } else {
      phaserImpact.visible = false;
    }
  };

  const stopPhasers = () => {
    phaserLeftBeamGroup.visible = false;
    phaserRightBeamGroup.visible = false;
    muzzleLeft.visible = false;
    muzzleRight.visible = false;
    phaserImpact.visible = false;
  };

  const destructTarget = (id: string) => {
    const obj = targetMeshes.get(id);
    if (obj) {
      triggerExplosion(obj.position, 2.5);
      obj.scale.multiplyScalar(0.7);
    }
  };

  // Main Tick
  const update = (
    delta: number,
    isWarping: boolean,
    warpFactor: number,
    shipPosition: THREE.Vector3,
    shipOrientation?: THREE.Quaternion,
    cameraPosition?: THREE.Vector3,
    onCheckTorpedoHit?: (pos: THREE.Vector3, prevPos: THREE.Vector3) => boolean,
    getLiveTargetPos?: (enemyId?: string | null, currentPos?: THREE.Vector3) => THREE.Vector3 | null
  ) => {
    // Strictly isolate solar systems: only the active solar system is visible!
    // Distant solar systems are light-years away and never overlap in local flight view.
    const activeSys =
      STAR_TREK_SOLAR_SYSTEMS.find((s) => s.id === currentActiveSystemId) ||
      STAR_TREK_SOLAR_SYSTEMS[0];

    localStellarLight.position.set(
      activeSys.centerCoordinates[0],
      activeSys.centerCoordinates[1],
      activeSys.centerCoordinates[2]
    );
    localStellarLight.color.setHex(getSystemStarColor(activeSys.id));
    localStellarLight.intensity = 3.8;

    for (const [id, group] of systemDetailedGroups) {
      const isCurrent = (id === currentActiveSystemId);
      if (group.visible !== isCurrent) {
        group.visible = isCurrent;
      }
    }

    // Rotate nearby celestial bodies gently (within 9000 units of ship)
    const sx = shipPosition.x;
    const sz = shipPosition.z;
    for (const [, mesh] of targetMeshes) {
      const dx = mesh.position.x - sx;
      const dz = mesh.position.z - sz;
      if (dx * dx + dz * dz < 81000000) {
        mesh.rotation.y += delta * 0.012;
      }
    }

    // Animate wormholes and nebulae
    for (const anom of animatedAnomalies) {
      if (anom.type === 'wormhole_outer' || anom.type === 'wormhole_inner') {
        anom.mesh.rotation.z += delta * anom.speed;
      } else if (anom.type === 'corona') {
        anom.mesh.rotation.y += delta * anom.speed;
      }
    }

    // Update Cinematic Star Trek Warp Visuals (Star streaks, subspace bubble, rings, flashes)
    warpEffect.update(
      delta,
      isWarping,
      warpFactor,
      shipPosition,
      shipOrientation || new THREE.Quaternion(),
      cameraPosition
    );

    // Update active torpedoes & collision detection
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life += delta;

      const prevPos = p.prevPosition.clone();
      p.prevPosition.copy(p.mesh.position);

      if (getLiveTargetPos) {
        const livePos = getLiveTargetPos(p.targetEnemyId, p.mesh.position);
        if (livePos) {
          const toTarget = livePos.clone().sub(p.mesh.position).normalize();
          p.velocity.lerp(toTarget.multiplyScalar(320), delta * 7.5);
        } else if (p.targetStaticPos) {
          const toTarget = p.targetStaticPos.clone().sub(p.mesh.position).normalize();
          p.velocity.lerp(toTarget.multiplyScalar(280), delta * 5.0);
        }
      } else if (p.targetStaticPos) {
        const toTarget = p.targetStaticPos.clone().sub(p.mesh.position).normalize();
        p.velocity.lerp(toTarget.multiplyScalar(280), delta * 4.5);
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      // Orient torpedo model towards its current velocity and spin along longitudinal axis
      if (p.velocity.lengthSq() > 0.01) {
        const velDir = p.velocity.clone().normalize();
        p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), velDir);
        p.mesh.rotateZ(p.life * 14); // authentic missile spin in flight
      }

      // Animate fiery engine exhaust plume flicker
      if (p.thrustPlume) {
        const flicker = 1.0 + (Math.random() - 0.5) * 0.28;
        p.thrustPlume.scale.set(flicker, 1.0 + Math.random() * 0.35, flicker);
      }

      // Check hit on enemy ships
      if (onCheckTorpedoHit && onCheckTorpedoHit(p.mesh.position, prevPos)) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }

      // Check collision with nearby celestial target meshes (< 600 km)
      let collided = false;
      const px = p.mesh.position.x;
      const py = p.mesh.position.y;
      const pz = p.mesh.position.z;
      for (const [id, tMesh] of targetMeshes) {
        const dx = tMesh.position.x - px;
        const dy = tMesh.position.y - py;
        const dz = tMesh.position.z - pz;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq > 360000) continue; // 600^2

        const dist = Math.sqrt(dSq);
        const radius = id.startsWith('sol_earth') || id.includes('giant') ? 55 : 28;

        if (dist < radius) {
          triggerExplosion(p.mesh.position, 1.8);
          scene.remove(p.mesh);
          projectiles.splice(i, 1);
          collided = true;
          break;
        }
      }

      if (!collided && p.life >= p.maxLife) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }

    // Update particle explosions
    explosionManager.update(delta);
  };

  const updateStarbaseAmbience = (
    delta: number,
    time: number,
    shipPos: THREE.Vector3,
    isDocked: boolean,
    isRepairing: boolean,
    dockedStationId: string | null
  ) => {
    updateAllStarbaseAmbience(delta, time, shipPos, isDocked, isRepairing, dockedStationId);
  };

  return {
    scene,
    starfield,
    warpTunnel,
    warpEffect,
    systems: STAR_TREK_SOLAR_SYSTEMS,
    planets: allPlanets,
    targetMeshes,
    explosionManager,
    update,
    updateStarbaseAmbience,
    firePhasers,
    stopPhasers,
    launchTorpedo,
    triggerExplosion,
    destructTarget,
    setActiveSystem,
  };
}
