// Starfleet Starbase & Orbital Drydock 3D Mesh Models
// Enterprise Refit Orbital Drydock Frame & Spacedock One Super-Structures
import * as THREE from 'three';

interface StarbaseInstance {
  id: string;
  root: THREE.Group;
  rotatingParts?: THREE.Object3D[];
  beacons?: THREE.Mesh[];
  repairBeams?: THREE.Mesh[];
}

const activeStarbases: StarbaseInstance[] = [];

/**
 * Builds a Starfleet Orbital Drydock Frame
 * (Hexagonal lattice gantry cage with mooring arms and maintenance floodlights)
 */
export function buildStarfleetOrbitalDrydock(
  id: string,
  position: [number, number, number],
  scaleRadius: number
): { root: THREE.Group } {
  const root = new THREE.Group();
  root.position.set(...position);

  const baseScale = scaleRadius * 0.9;
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.35,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.3,
  });
  const beaconYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const beaconRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const glowCyan = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.7,
  });

  const rotatingParts: THREE.Object3D[] = [];
  const beacons: THREE.Mesh[] = [];

  // Main lengthwise structural gantries (4 heavy longitudinal beams)
  const gantryLength = baseScale * 4.5;
  const gantryRadius = baseScale * 0.05;
  const gantryDistance = baseScale * 1.5;

  const positions: [number, number][] = [
    [gantryDistance, gantryDistance * 0.6],
    [-gantryDistance, gantryDistance * 0.6],
    [gantryDistance, -gantryDistance * 0.6],
    [-gantryDistance, -gantryDistance * 0.6],
  ];

  positions.forEach(([gx, gy]) => {
    const beamGeo = new THREE.CylinderGeometry(gantryRadius, gantryRadius, gantryLength, 8);
    const beam = new THREE.Mesh(beamGeo, frameMat);
    beam.rotation.x = Math.PI / 2;
    beam.position.set(gx, gy, 0);
    root.add(beam);

    // Warning beacons at the ends of gantries
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(gantryRadius * 2, 8, 8), beaconYellow);
    b1.position.set(gx, gy, gantryLength / 2);
    root.add(b1);
    beacons.push(b1);

    const b2 = new THREE.Mesh(new THREE.SphereGeometry(gantryRadius * 2, 8, 8), beaconRed);
    b2.position.set(gx, gy, -gantryLength / 2);
    root.add(b2);
    beacons.push(b2);
  });

  // Cross-sectional arch ribs enclosing the drydock bay
  const ribCount = 7;
  for (let i = 0; i < ribCount; i++) {
    const zOffset = -gantryLength * 0.45 + (i * gantryLength * 0.9) / (ribCount - 1);
    const ribGroup = new THREE.Group();
    ribGroup.position.z = zOffset;

    // Top arch
    const topBarGeo = new THREE.CylinderGeometry(gantryRadius * 0.7, gantryRadius * 0.7, gantryDistance * 2, 6);
    const topBar = new THREE.Mesh(topBarGeo, frameMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = gantryDistance * 0.6;
    ribGroup.add(topBar);

    // Bottom arch
    const botBar = new THREE.Mesh(topBarGeo, frameMat);
    botBar.rotation.z = Math.PI / 2;
    botBar.position.y = -gantryDistance * 0.6;
    ribGroup.add(botBar);

    // Left and right vertical trusses
    const vertGeo = new THREE.CylinderGeometry(gantryRadius * 0.7, gantryRadius * 0.7, gantryDistance * 1.2, 6);
    const leftTruss = new THREE.Mesh(vertGeo, darkMetalMat);
    leftTruss.position.x = -gantryDistance;
    ribGroup.add(leftTruss);

    const rightTruss = new THREE.Mesh(vertGeo, darkMetalMat);
    rightTruss.position.x = gantryDistance;
    ribGroup.add(rightTruss);

    // Mooring clamp arms on middle ribs
    if (i === 2 || i === 4) {
      const clampGeo = new THREE.BoxGeometry(gantryDistance * 0.4, baseScale * 0.1, baseScale * 0.15);
      const leftClamp = new THREE.Mesh(clampGeo, darkMetalMat);
      leftClamp.position.set(-gantryDistance * 0.75, 0, 0);
      ribGroup.add(leftClamp);

      const rightClamp = new THREE.Mesh(clampGeo, darkMetalMat);
      rightClamp.position.set(gantryDistance * 0.75, 0, 0);
      ribGroup.add(rightClamp);
    }

    root.add(ribGroup);
  }

  // Office & engineering module pods mounted on top spine
  const controlPodGeo = new THREE.BoxGeometry(baseScale * 0.6, baseScale * 0.35, baseScale * 0.9);
  const controlPod = new THREE.Mesh(controlPodGeo, darkMetalMat);
  controlPod.position.set(0, gantryDistance * 0.85, 0);
  root.add(controlPod);

  // Communications array / sensor mast on the control pod
  const mastGeo = new THREE.CylinderGeometry(baseScale * 0.02, baseScale * 0.04, baseScale * 0.8, 6);
  const mast = new THREE.Mesh(mastGeo, frameMat);
  mast.position.set(0, gantryDistance * 0.85 + baseScale * 0.5, 0);
  root.add(mast);

  const beaconTop = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.06, 8, 8), glowCyan);
  beaconTop.position.set(0, gantryDistance * 0.85 + baseScale * 0.9, 0);
  root.add(beaconTop);
  beacons.push(beaconTop);

  activeStarbases.push({
    id,
    root,
    rotatingParts,
    beacons,
  });

  return { root };
}

/**
 * Builds a Starfleet Spacedock One Superstructure
 * (Mushroom-shaped monumental orbital station with internal cavernous docking bay)
 */
export function buildMonumentalSpacedock(
  id: string,
  position: [number, number, number],
  scaleRadius: number
): { root: THREE.Group } {
  const root = new THREE.Group();
  root.position.set(...position);

  const baseScale = scaleRadius * 1.1;
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    metalness: 0.65,
    roughness: 0.4,
  });
  const darkPlatingMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.75,
    roughness: 0.45,
  });
  const doorsCyanMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });
  const beaconYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  const rotatingParts: THREE.Object3D[] = [];
  const beacons: THREE.Mesh[] = [];

  // 1. Upper Mushroom Dome (Cap)
  const domeGeo = new THREE.SphereGeometry(baseScale * 1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const dome = new THREE.Mesh(domeGeo, hullMat);
  dome.rotation.x = Math.PI;
  dome.position.y = baseScale * 0.7;
  root.add(dome);

  // 2. Main Equator Docking Bay Outer Ring
  const equatorTorusGeo = new THREE.TorusGeometry(baseScale * 1.55, baseScale * 0.22, 12, 32);
  const equatorTorus = new THREE.Mesh(equatorTorusGeo, darkPlatingMat);
  equatorTorus.rotation.x = Math.PI / 2;
  equatorTorus.position.y = baseScale * 0.65;
  root.add(equatorTorus);

  // Spacedock Bay Main Space Doors (Cavernous blue entrance bay aperture)
  const bayDoorsGeo = new THREE.CylinderGeometry(baseScale * 0.9, baseScale * 0.9, baseScale * 0.15, 20);
  const bayDoors = new THREE.Mesh(bayDoorsGeo, doorsCyanMat);
  bayDoors.position.y = baseScale * 0.65;
  root.add(bayDoors);

  // 3. Lower Conical Neck / Middle Transition
  const neckGeo = new THREE.CylinderGeometry(baseScale * 1.4, baseScale * 0.45, baseScale * 1.2, 24);
  const neck = new THREE.Mesh(neckGeo, hullMat);
  neck.position.y = 0;
  root.add(neck);

  // Secondary Ring on Upper Stem
  const upperStemRingGeo = new THREE.TorusGeometry(baseScale * 0.6, baseScale * 0.08, 8, 24);
  const upperStemRing = new THREE.Mesh(upperStemRingGeo, darkPlatingMat);
  upperStemRing.rotation.x = Math.PI / 2;
  upperStemRing.position.y = -baseScale * 0.5;
  root.add(upperStemRing);

  // 4. Lower Engineering Spire / Secondary Hull Needle
  const spireGeo = new THREE.CylinderGeometry(baseScale * 0.45, baseScale * 0.1, baseScale * 2.8, 20);
  const spire = new THREE.Mesh(spireGeo, hullMat);
  spire.position.y = -baseScale * 1.8;
  root.add(spire);

  // Engineering Antenna & Subspace Relay array at bottom
  const arrayGeo = new THREE.ConeGeometry(baseScale * 0.35, baseScale * 0.6, 12);
  const arrayMesh = new THREE.Mesh(arrayGeo, darkPlatingMat);
  arrayMesh.rotation.x = Math.PI;
  arrayMesh.position.y = -baseScale * 3.3;
  root.add(arrayMesh);

  // Navigation marker beacons along perimeter
  const numBeacons = 8;
  for (let b = 0; b < numBeacons; b++) {
    const angle = (b / numBeacons) * Math.PI * 2;
    const bx = Math.cos(angle) * baseScale * 1.7;
    const bz = Math.sin(angle) * baseScale * 1.7;

    const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.04, 8, 8), beaconYellow);
    beaconMesh.position.set(bx, baseScale * 0.65, bz);
    root.add(beaconMesh);
    beacons.push(beaconMesh);
  }

  // Slow rotation for realism
  rotatingParts.push(root);

  activeStarbases.push({
    id,
    root,
    rotatingParts,
    beacons,
  });

  return { root };
}

/**
 * Updates lighting, slow rotational drift, and repair effects across all starbases
 */
export function updateAllStarbaseAmbience(
  delta: number,
  time: number,
  _shipPos: THREE.Vector3,
  _isDocked: boolean,
  _isRepairing: boolean,
  _dockedStationId: string | null
): void {
  const beaconPhase = Math.sin(time * 3);

  for (const base of activeStarbases) {
    // Gentle rotation of spacedocks
    if (base.rotatingParts) {
      for (const part of base.rotatingParts) {
        part.rotation.y += delta * 0.03;
      }
    }

    // Flash/pulse warning beacons
    if (base.beacons) {
      const scaleVal = 0.8 + 0.4 * (beaconPhase > 0 ? 1 : 0.2);
      for (const b of base.beacons) {
        b.scale.setScalar(scaleVal);
      }
    }
  }
}
