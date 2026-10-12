// Starfleet Cinematic Warp Drive Visual Effects System
// High-fidelity relativistic star streaks, shimmering subspace warp bubble,
// spatial distortion rings, energy buildup, acceleration flash, and smooth streak contraction

import * as THREE from 'three';

export interface WarpEffectState {
  isWarping: boolean;
  warpFactor: number;
  shipPosition: THREE.Vector3;
  shipOrientation: THREE.Quaternion;
  shipForward: THREE.Vector3;
}

export class WarpEffectManager {
  public group: THREE.Group;

  // Star Streaks System
  private streakCount = 1000;
  private streakGeo: THREE.BufferGeometry;
  private streakMat: THREE.LineBasicMaterial;
  private streakLines: THREE.LineSegments;
  private baseStreakPositions: Float32Array; // [x, y, z, offset] in ship-local space
  private streakPositions: Float32Array;

  // Warp Bubble (Subspace Energy Field around Enterprise)
  private warpBubbleGroup: THREE.Group;
  private warpBubbleMesh: THREE.Mesh;
  private warpBubbleMat: THREE.MeshBasicMaterial;
  private outerBubbleMesh: THREE.Mesh;
  private outerBubbleMat: THREE.MeshBasicMaterial;

  // Subspace Distortion Compression Rings (Traveling aft)
  private distortionRings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; localZ: number; speed: number }[] = [];

  // Warp Acceleration & Deceleration Flash Flare
  private flashGroup: THREE.Group;
  private flashCoreMesh: THREE.Mesh;
  private flashCoreMat: THREE.MeshBasicMaterial;
  private flashHaloMesh: THREE.Mesh;
  private flashHaloMat: THREE.MeshBasicMaterial;
  private flashIntensity: number = 0;
  private flashScale: number = 1.0;

  // State Tracking & Transitions
  private prevWarping: boolean = false;
  private warpTransitionProgress: number = 0; // 0 (impulse) to 1 (full warp)
  private exitDecelProgress: number = 0; // 1 (just dropped) down to 0 (contracted back into stars)
  private buildupTimer: number = 0; // 0 to 1 during initial pre-warp surge
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'CinematicWarpSystem';
    scene.add(this.group);

    // 1. Build 1000 Relativistic Star Streaks
    this.streakGeo = new THREE.BufferGeometry();
    this.streakPositions = new Float32Array(this.streakCount * 6);
    this.baseStreakPositions = new Float32Array(this.streakCount * 3);

    for (let i = 0; i < this.streakCount; i++) {
      // Cylindrical distribution around ship flight path
      const r = 22 + Math.pow(Math.random(), 1.35) * 380;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = (Math.random() - 0.5) * 1200;

      this.baseStreakPositions[i * 3] = x;
      this.baseStreakPositions[i * 3 + 1] = y;
      this.baseStreakPositions[i * 3 + 2] = z;

      // Initial lines
      this.streakPositions[i * 6] = x;
      this.streakPositions[i * 6 + 1] = y;
      this.streakPositions[i * 6 + 2] = z;

      this.streakPositions[i * 6 + 3] = x;
      this.streakPositions[i * 6 + 4] = y;
      this.streakPositions[i * 6 + 5] = z;
    }

    this.streakGeo.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));

    // Dynamic vertex-blended line material
    this.streakMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.streakLines = new THREE.LineSegments(this.streakGeo, this.streakMat);
    this.group.add(this.streakLines);

    // 2. Build Shimmering Subspace Warp Bubble around Enterprise
    this.warpBubbleGroup = new THREE.Group();
    this.warpBubbleGroup.visible = false;

    // Inner Warp Bubble Shell
    const bubbleGeo = new THREE.SphereGeometry(1, 28, 20);
    this.warpBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.warpBubbleMesh = new THREE.Mesh(bubbleGeo, this.warpBubbleMat);
    this.warpBubbleMesh.scale.set(24, 15, 42); // Ellipsoidal sheath fitted to Enterprise
    this.warpBubbleGroup.add(this.warpBubbleMesh);

    // Outer Shimmering Subspace Boundary
    this.outerBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.outerBubbleMesh = new THREE.Mesh(bubbleGeo, this.outerBubbleMat);
    this.outerBubbleMesh.scale.set(27, 17, 46);
    this.warpBubbleGroup.add(this.outerBubbleMesh);

    this.group.add(this.warpBubbleGroup);

    // 3. Build Subspace Compression Distortion Rings
    const ringGeo = new THREE.TorusGeometry(45, 1.4, 12, 36);
    for (let r = 0; r < 5; r++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2; // Flat ring perpendicular to forward travel
      this.distortionRings.push({
        mesh: ringMesh,
        mat: ringMat,
        localZ: -200 + r * 150,
        speed: 1.0 + r * 0.25,
      });
      this.group.add(ringMesh);
    }

    // 4. Build Warp Flash Flare (Camera-facing acceleration burst & deceleration flash)
    this.flashGroup = new THREE.Group();
    this.flashGroup.visible = false;

    // Core Flash Disk
    const coreGeo = new THREE.CircleGeometry(24, 24);
    this.flashCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.flashCoreMesh = new THREE.Mesh(coreGeo, this.flashCoreMat);
    this.flashGroup.add(this.flashCoreMesh);

    // Outer Cyan Anamorphic Halo
    const haloGeo = new THREE.RingGeometry(18, 55, 32);
    this.flashHaloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.flashHaloMesh = new THREE.Mesh(haloGeo, this.flashHaloMat);
    this.flashGroup.add(this.flashHaloMesh);

    this.group.add(this.flashGroup);
  }

  // Trigger sudden Star Trek acceleration flash when jumping into warp
  public triggerWarpEngagementFlash() {
    this.flashIntensity = 1.0;
    this.flashScale = 1.0;
    this.buildupTimer = 0;
  }

  // Trigger soft deceleration flash when dropping from warp
  public triggerWarpExitFlash() {
    this.flashIntensity = 0.75;
    this.flashScale = 0.7;
    this.exitDecelProgress = 1.0;
  }

  // Main per-frame update
  public update(
    delta: number,
    isWarping: boolean,
    warpFactor: number,
    shipPos: THREE.Vector3,
    shipQuat: THREE.Quaternion,
    cameraPos?: THREE.Vector3
  ) {
    this.time += delta;

    // Detect state changes for triggers
    if (isWarping && !this.prevWarping) {
      this.triggerWarpEngagementFlash();
    } else if (!isWarping && this.prevWarping) {
      this.triggerWarpExitFlash();
    }
    this.prevWarping = isWarping;

    // Warp factor normalized parameter [0.1 .. 1.0]
    const factorNorm = Math.min(1.0, Math.max(0.1, warpFactor / 9.9));

    // Smooth transition progress
    if (isWarping) {
      this.warpTransitionProgress = THREE.MathUtils.lerp(this.warpTransitionProgress, 1.0, delta * 3.8);
      this.exitDecelProgress = 0;
      this.buildupTimer += delta;
    } else {
      this.warpTransitionProgress = THREE.MathUtils.lerp(this.warpTransitionProgress, 0.0, delta * 4.5);
      if (this.exitDecelProgress > 0) {
        this.exitDecelProgress = Math.max(0, this.exitDecelProgress - delta * 2.2);
      }
    }

    const isEffectActive = this.warpTransitionProgress > 0.01 || this.exitDecelProgress > 0.01 || this.flashIntensity > 0.01;
    this.group.visible = isEffectActive;

    if (!isEffectActive) return;

    // Align effect root to ship position and rotation
    this.group.position.copy(shipPos);
    this.group.quaternion.copy(shipQuat);

    // --- 1. Warp Flash Animation ---
    if (this.flashIntensity > 0.01) {
      this.flashGroup.visible = true;
      this.flashIntensity = Math.max(0, this.flashIntensity - delta * 3.4);
      this.flashScale += delta * 6.5;

      this.flashCoreMat.opacity = Math.min(1.0, this.flashIntensity * 1.2);
      this.flashHaloMat.opacity = Math.min(0.85, this.flashIntensity * 0.9);

      this.flashCoreMesh.scale.setScalar(this.flashScale);
      this.flashHaloMesh.scale.set(this.flashScale * 1.4, this.flashScale * 0.35, 1); // Anamorphic streak flare

      // Make flash face camera if camera position is available
      if (cameraPos) {
        const localCam = cameraPos.clone().sub(shipPos).applyQuaternion(shipQuat.clone().invert());
        this.flashGroup.lookAt(localCam);
      }
    } else {
      this.flashGroup.visible = false;
    }

    // --- 2. Shimmering Subspace Warp Bubble around Enterprise ---
    if (this.warpTransitionProgress > 0.02) {
      this.warpBubbleGroup.visible = true;

      // Base opacity scales with warp factor
      const baseBubbleOpacity = THREE.MathUtils.lerp(0.14, 0.44, factorNorm);
      const pulseRate = 12 + factorNorm * 24;
      const shimmer = Math.sin(this.time * pulseRate) * 0.08 + Math.cos(this.time * (pulseRate * 1.5)) * 0.04;

      this.warpBubbleMat.opacity = Math.max(0, (baseBubbleOpacity + shimmer) * this.warpTransitionProgress);

      // Wireframe ripple shell
      this.outerBubbleMat.opacity = Math.max(0, (baseBubbleOpacity * 0.6 + shimmer * 0.5) * this.warpTransitionProgress);

      // At maximum warp, bubble expands and color shifts towards brilliant sapphire/electric-white
      if (warpFactor >= 9.0) {
        this.warpBubbleMat.color.setHex(0x60a5fa);
        this.outerBubbleMat.color.setHex(0xe0f2fe);
      } else if (warpFactor >= 6.0) {
        this.warpBubbleMat.color.setHex(0x38bdf8);
        this.outerBubbleMat.color.setHex(0x93c5fd);
      } else {
        this.warpBubbleMat.color.setHex(0x0284c7);
        this.outerBubbleMat.color.setHex(0x38bdf8);
      }
    } else {
      this.warpBubbleGroup.visible = false;
    }

    // --- 3. Relativistic Star Streaks Animation & Deceleration Contraction ---
    // Speed multiplier scales non-linearly with warp factor
    const speedMult = Math.pow(factorNorm, 2.2) * 16.0 + 1.2;
    const baseSpeed = 450 * speedMult;

    // Streak length scales dramatically with warp factor:
    // Low warp (1-3): 45 - 110 units
    // Medium warp (4-6): 180 - 320 units
    // High warp (7-8.9): 460 - 720 units
    // Max warp (9-9.9): 950 - 1500 units
    let maxStreakLength = 40 + Math.pow(factorNorm, 2.5) * 1400;

    // Contraction on exit: smoothly shrink streak tail back to head into a point star!
    if (!isWarping && this.exitDecelProgress > 0) {
      maxStreakLength *= this.exitDecelProgress;
    }

    const currentStreakLength = maxStreakLength * Math.max(this.warpTransitionProgress, this.exitDecelProgress);

    // Opacity: high-warp factors are denser and brighter
    const targetStreakOpacity = THREE.MathUtils.lerp(0.55, 0.95, factorNorm);
    const effectiveOpacity = targetStreakOpacity * Math.max(this.warpTransitionProgress, this.exitDecelProgress);
    this.streakMat.opacity = effectiveOpacity;

    // Streak color tuning:
    if (warpFactor >= 9.0) {
      this.streakMat.color.setHex(0xf0f9ff); // Maximum warp: blinding electric white
    } else if (warpFactor >= 6.0) {
      this.streakMat.color.setHex(0x38bdf8); // High warp: vibrant sky cyan
    } else {
      this.streakMat.color.setHex(0x60a5fa); // Low warp: soft cobalt blue
    }

    const posAttr = this.streakGeo.attributes.position;
    const streamZSpeed = delta * baseSpeed;

    for (let i = 0; i < this.streakCount; i++) {
      const bx = this.baseStreakPositions[i * 3];
      const by = this.baseStreakPositions[i * 3 + 1];
      let bz = this.baseStreakPositions[i * 3 + 2];

      // Stream stars past the ship along forward Z-axis
      if (isWarping) {
        bz += streamZSpeed;
        if (bz > 450) {
          bz -= 1100;
        }
        this.baseStreakPositions[i * 3 + 2] = bz;
      }

      // Head of streak
      posAttr.setXYZ(i * 2, bx, by, bz);

      // Tail of streak (stretches along Z-axis backwards)
      const tailZ = bz - currentStreakLength;
      posAttr.setXYZ(i * 2 + 1, bx, by, tailZ);
    }

    posAttr.needsUpdate = true;

    // --- 4. Subspace Distortion Compression Rings ---
    const ringSpeedMult = 320 * (1 + factorNorm * 3.5);
    const ringOpacity = THREE.MathUtils.lerp(0.08, 0.45, factorNorm) * this.warpTransitionProgress;

    for (let r = 0; r < this.distortionRings.length; r++) {
      const ring = this.distortionRings[r];
      if (this.warpTransitionProgress > 0.05) {
        ring.localZ -= delta * ringSpeedMult * ring.speed;
        if (ring.localZ < -550) {
          ring.localZ += 950;
        }
        ring.mesh.position.set(0, 0, ring.localZ);
        ring.mat.opacity = ringOpacity;

        // Subtle scale pulse as ring travels
        const pulseScale = 1.0 + Math.sin(this.time * 8 + r) * 0.15;
        ring.mesh.scale.setScalar(pulseScale);
      } else {
        ring.mat.opacity = 0;
      }
    }
  }

  // Camera dynamic FOV offset for relativistic acceleration feel
  public getWarpFovOffset(warpFactor: number): number {
    const factorNorm = Math.min(1.0, Math.max(0.1, warpFactor / 9.9));
    const baseFovOffset = 4 + factorNorm * 22; // +4° at Warp 1, up to +26° at Warp 9.9
    const flashKick = this.flashIntensity * 12; // Extra momentary visual kick during the warp flash
    return (baseFovOffset + flashKick) * this.warpTransitionProgress;
  }
}
