import * as THREE from 'three';
import { WorldCollider, Door, GroundPickup } from './types';
import { WEAPONS } from './weapons';

export const MAP_HALF = 72;

export function terrainHeight(x: number, z: number): number {
  return (
    Math.sin(x * 0.024) * 3.8 +
    Math.cos(z * 0.026) * 3.4 +
    Math.sin((x + z) * 0.016) * 2.2 +
    Math.cos(x * 0.045 - z * 0.035) * 1.1
  );
}

export function randomMapPoint(minDistFromCenter = 0): { x: number; z: number } {
  let x: number, z: number, d: number;
  do {
    x = (Math.random() * 2 - 1) * MAP_HALF * 0.88;
    z = (Math.random() * 2 - 1) * MAP_HALF * 0.88;
    d = Math.hypot(x, z);
  } while (minDistFromCenter > 0 && d < minDistFromCenter);
  return { x, z };
}

export interface WorldManager {
  terrainMesh: THREE.Mesh;
  worldColliders: WorldCollider[];
  doors: Door[];
  hittableObjects: THREE.Object3D[];
  groundPickups: GroundPickup[];
  structures: { center: THREE.Vector3 }[];
  registerHittable: (mesh: THREE.Object3D) => void;
  unregisterHittable: (mesh: THREE.Object3D) => void;
  createGroundPickup: (x: number, z: number, weaponTypeIndex: number, ammoAmount: number) => GroundPickup;
  collectPickup: (item: GroundPickup, onAcquire: (msg: string) => void, weaponStates: { count?: number; reserve?: number }[]) => void;
  updateDoors: (dt: number) => void;
  moveEntityWithCollision: (pos: THREE.Vector3, vel: THREE.Vector3, radius: number, footY: number, headY: number, dt: number) => void;
  getHighestSurface: (x: number, z: number, footY: number) => number;
  dispose: () => void;
}

export function createWorld(scene: THREE.Scene): WorldManager {
  const worldColliders: WorldCollider[] = [];
  const doors: Door[] = [];
  const hittableObjects: THREE.Object3D[] = [];
  const groundPickups: GroundPickup[] = [];
  const structures: { center: THREE.Vector3 }[] = [];

  function registerHittable(mesh: THREE.Object3D): void {
    hittableObjects.push(mesh);
  }
  function unregisterHittable(mesh: THREE.Object3D): void {
    const i = hittableObjects.indexOf(mesh);
    if (i >= 0) hittableObjects.splice(i, 1);
  }

  // Terrain
  const terrainGeo = new THREE.PlaneGeometry(MAP_HALF * 2, MAP_HALF * 2, 110, 110);
  {
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      pos.setZ(i, terrainHeight(lx, -ly));
    }
    terrainGeo.computeVertexNormals();
    terrainGeo.rotateX(-Math.PI / 2);
  }
  const terrainMat = new THREE.MeshStandardMaterial({ color: 0x537740, roughness: 0.95, metalness: 0 });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.userData = { type: 'terrain' };
  scene.add(terrainMesh);
  registerHittable(terrainMesh);

  // Flora and Rocks
  function makeTree(x: number, z: number): void {
    const g = new THREE.Group();
    const trunkH = 2.4 + Math.random() * 1.2;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, trunkH, 7),
      new THREE.MeshStandardMaterial({ color: 0x5b3d24, roughness: 1 })
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.5 + Math.random() * 0.6, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x2e5c30, roughness: 1 })
    );
    canopy.position.y = trunkH + 1.4;
    canopy.castShadow = true;
    g.add(trunk, canopy);
    g.position.set(x, terrainHeight(x, z), z);
    scene.add(g);
    trunk.userData = { type: 'tree' };
    registerHittable(trunk);

    worldColliders.push({
      minX: x - 0.32,
      maxX: x + 0.32,
      minY: terrainHeight(x, z),
      maxY: terrainHeight(x, z) + trunkH,
      minZ: z - 0.32,
      maxZ: z + 0.32,
      active: true
    });
  }

  function makeRock(x: number, z: number): void {
    const s = 1.0 + Math.random() * 1.3;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: 0x777c80, roughness: 1, flatShading: true })
    );
    rock.position.set(x, terrainHeight(x, z) + s * 0.4, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
    rock.userData = { type: 'rock' };
    registerHittable(rock);

    worldColliders.push({
      minX: x - s * 0.7,
      maxX: x + s * 0.7,
      minY: terrainHeight(x, z),
      maxY: terrainHeight(x, z) + s * 1.3,
      minZ: z - s * 0.7,
      maxZ: z + s * 0.7,
      active: true
    });
  }

  for (let i = 0; i < 28; i++) {
    const p = randomMapPoint(0);
    makeTree(p.x, p.z);
  }
  for (let i = 0; i < 16; i++) {
    const p = randomMapPoint(0);
    makeRock(p.x, p.z);
  }

  // Doors
  function createDoor(x: number, y: number, z: number, dw: number, dh: number, dt: number, buildingGroup: THREE.Group): Door {
    const hingeGroup = new THREE.Group();
    hingeGroup.position.set(x - dw / 2, y, z);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x6e452a, roughness: 0.82, metalness: 0.1 });
    const doorGeo = new THREE.BoxGeometry(dw, dh, dt);
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(dw / 2, dh / 2, 0);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    hingeGroup.add(doorMesh);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), handleMat);
    handleMesh.rotation.x = Math.PI / 2;
    handleMesh.position.set(dw - 0.16, dh / 2, 0);
    hingeGroup.add(handleMesh);

    doorMesh.userData = { type: 'building' };
    registerHittable(doorMesh);
    buildingGroup.add(hingeGroup);

    const doorCollider: WorldCollider = {
      minX: x - dw / 2,
      maxX: x + dw / 2,
      minY: y,
      maxY: y + dh,
      minZ: z - 0.25,
      maxZ: z + 0.25,
      active: true,
      isDoor: true
    };
    worldColliders.push(doorCollider);

    const doorObj: Door = {
      hingeGroup,
      mesh: doorMesh,
      pos: new THREE.Vector3(x, y + dh / 2, z),
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      collider: doorCollider
    };
    doors.push(doorObj);
    return doorObj;
  }

  // Buildings
  function addWorldBuilding(x: number, z: number, w: number, d: number, h: number, hasRoofSteps = false): void {
    const y = terrainHeight(x, z);
    const g = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8d8272, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5e4537, roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x44484d, roughness: 0.85 });

    const wt = 0.4;
    const dw = 1.6;
    const dh = 2.4;

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, wt), bodyMat);
    backWall.position.set(0, h / 2, -d / 2 + wt / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    g.add(backWall);
    registerHittable(backWall);
    worldColliders.push({ minX: x - w / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z - d / 2 + wt, active: true });

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wt, h, d), bodyMat);
    leftWall.position.set(-w / 2 + wt / 2, h / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    g.add(leftWall);
    registerHittable(leftWall);
    worldColliders.push({ minX: x - w / 2, maxX: x - w / 2 + wt, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2, active: true });

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wt, h, d), bodyMat);
    rightWall.position.set(w / 2 - wt / 2, h / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    g.add(rightWall);
    registerHittable(rightWall);
    worldColliders.push({ minX: x + w / 2 - wt, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2, active: true });

    const frontLeftW = (w - dw) / 2;
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontLeftW, h, wt), bodyMat);
    frontLeft.position.set(-w / 2 + frontLeftW / 2, h / 2, d / 2 - wt / 2);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;
    g.add(frontLeft);
    registerHittable(frontLeft);
    worldColliders.push({ minX: x - w / 2, maxX: x - dw / 2, minY: y, maxY: y + h, minZ: z + d / 2 - wt, maxZ: z + d / 2, active: true });

    const frontRightW = (w - dw) / 2;
    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontRightW, h, wt), bodyMat);
    frontRight.position.set(dw / 2 + frontRightW / 2, h / 2, d / 2 - wt / 2);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;
    g.add(frontRight);
    registerHittable(frontRight);
    worldColliders.push({ minX: x + dw / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z + d / 2 - wt, maxZ: z + d / 2, active: true });

    const lintelH = h - dh;
    if (lintelH > 0.1) {
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(dw, lintelH, wt), bodyMat);
      lintel.position.set(0, dh + lintelH / 2, d / 2 - wt / 2);
      lintel.castShadow = true;
      lintel.receiveShadow = true;
      g.add(lintel);
      registerHittable(lintel);
      worldColliders.push({ minX: x - dw / 2, maxX: x + dw / 2, minY: y + dh, maxY: y + h, minZ: z + d / 2 - wt, maxZ: z + d / 2, active: true });
    }

    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w - wt, 0.2, d - wt), floorMat);
    floorMesh.position.set(0, 0.1, 0);
    floorMesh.receiveShadow = true;
    g.add(floorMesh);
    registerHittable(floorMesh);
    worldColliders.push({ minX: x - w / 2 + wt / 2, maxX: x + w / 2 - wt / 2, minY: y, maxY: y + 0.2, minZ: z - d / 2 + wt / 2, maxZ: z + d / 2 - wt / 2, active: true });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.4, d + 0.6), roofMat);
    roof.position.set(0, h + 0.2, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    g.add(roof);
    registerHittable(roof);
    worldColliders.push({ minX: x - (w + 0.6) / 2, maxX: x + (w + 0.6) / 2, minY: y + h, maxY: y + h + 0.4, minZ: z - (d + 0.6) / 2, maxZ: z + (d + 0.6) / 2, active: true });

    if (hasRoofSteps) {
      const stepCount = 3;
      for (let s = 1; s <= stepCount; s++) {
        const stepH = (h * s) / stepCount;
        const stepBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, stepH, 1.4), new THREE.MeshStandardMaterial({ color: 0x4a443a, roughness: 0.85 }));
        stepBox.position.set(w / 2 + 0.9, stepH / 2, -d / 2 + s * 1.4);
        stepBox.castShadow = true;
        stepBox.receiveShadow = true;
        g.add(stepBox);
        stepBox.userData = { type: 'building' };
        registerHittable(stepBox);
        worldColliders.push({
          minX: x + w / 2 + 0.1,
          maxX: x + w / 2 + 1.7,
          minY: y,
          maxY: y + stepH,
          minZ: z - d / 2 + s * 1.4 - 0.7,
          maxZ: z - d / 2 + s * 1.4 + 0.7,
          active: true
        });
      }
    }

    createDoor(x, y, z + d / 2 - wt / 2, dw, dh, 0.12, g);

    g.position.set(x, y, z);
    scene.add(g);
    structures.push({ center: new THREE.Vector3(x, y + 0.5, z) });
  }

  function addTacticalObstacleCluster(x: number, z: number): void {
    const y = terrainHeight(x, z);
    const g = new THREE.Group();
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x3e5265, metalness: 0.3, roughness: 0.7 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x6b6e70, roughness: 0.9 });

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), crateMat);
    b1.position.set(0, 0.8, 0);
    b1.castShadow = true;
    b1.receiveShadow = true;

    const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 2.2), crateMat);
    b2.position.set(0.4, 2.3, 0.2);
    b2.castShadow = true;
    b2.receiveShadow = true;

    const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.4), barrierMat);
    barrier.position.set(-1.6, 0.6, 1.8);
    barrier.castShadow = true;
    barrier.receiveShadow = true;

    g.add(b1, b2, barrier);
    g.position.set(x, y, z);
    scene.add(g);

    [b1, b2, barrier].forEach(mesh => {
      mesh.userData = { type: 'building' };
      registerHittable(mesh);
    });

    worldColliders.push({ minX: x - 1.2, maxX: x + 1.2, minY: y, maxY: y + 1.6, minZ: z - 1.2, maxZ: z + 1.2, active: true });
    worldColliders.push({ minX: x + 0.4 - 1.1, maxX: x + 0.4 + 1.1, minY: y + 1.5, maxY: y + 3.05, minZ: z + 0.2 - 1.1, maxZ: z + 0.2 + 1.1, active: true });
    worldColliders.push({ minX: x - 1.6 - 1.8, maxX: x - 1.6 + 1.8, minY: y, maxY: y + 1.2, minZ: z + 1.8 - 0.2, maxZ: z + 1.8 + 0.2, active: true });
  }

  const buildingConfigs = [
    { x: 0, z: -14, w: 10, d: 8, h: 4.5, steps: true },
    { x: -18, z: 8, w: 8, d: 12, h: 5.0, steps: true },
    { x: 22, z: 12, w: 12, d: 8, h: 4.0, steps: false },
    { x: -32, z: -24, w: 9, d: 9, h: 6.2, steps: true },
    { x: 30, z: -28, w: 11, d: 7, h: 4.8, steps: false },
    { x: 8, z: 32, w: 10, d: 10, h: 5.5, steps: true }
  ];
  buildingConfigs.forEach(cfg => addWorldBuilding(cfg.x, cfg.z, cfg.w, cfg.d, cfg.h, cfg.steps));

  const obstacleSpawns = [
    { x: -8, z: 4 },
    { x: 10, z: -4 },
    { x: -16, z: -18 },
    { x: 14, z: 20 },
    { x: -24, z: 18 }
  ];
  obstacleSpawns.forEach(o => addTacticalObstacleCluster(o.x, o.z));

  // Ground Pickups - Updated to support Pistol (Type Index 3)
  function createGroundPickup(x: number, z: number, weaponTypeIndex: number, ammoAmount: number): GroundPickup {
    const g = new THREE.Group();
    const y = terrainHeight(x, z) + 0.55;

    let geo: THREE.BufferGeometry;
    let mat: THREE.MeshStandardMaterial;

    if (weaponTypeIndex === 0) {
      // AR
      geo = new THREE.BoxGeometry(0.12, 0.15, 0.7);
      mat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.4 });
    } else if (weaponTypeIndex === 1) {
      // Shotgun
      geo = new THREE.BoxGeometry(0.12, 0.18, 0.85);
      mat = new THREE.MeshStandardMaterial({ color: 0x553322, metalness: 0.4, roughness: 0.6 });
    } else if (weaponTypeIndex === 2) {
      // Sniper
      geo = new THREE.BoxGeometry(0.1, 0.14, 1.1);
      mat = new THREE.MeshStandardMaterial({ color: 0x223322, metalness: 0.7, roughness: 0.3 });
    } else if (weaponTypeIndex === 3) {
      // Combat Pistol
      geo = new THREE.BoxGeometry(0.09, 0.22, 0.36);
      mat = new THREE.MeshStandardMaterial({ color: 0x2e3238, metalness: 0.75, roughness: 0.4 });
    } else if (weaponTypeIndex === 4) {
      // SMG (Compact box with vertical mag)
      geo = new THREE.BoxGeometry(0.09, 0.24, 0.45);
      mat = new THREE.MeshStandardMaterial({ color: 0xd66820, metalness: 0.5, roughness: 0.4 });
    } else if (weaponTypeIndex === 5) {
      // LMG (Heavy chassis with drum)
      geo = new THREE.BoxGeometry(0.14, 0.25, 0.95);
      mat = new THREE.MeshStandardMaterial({ color: 0x1f2226, metalness: 0.8, roughness: 0.4 });
    } else if (weaponTypeIndex === 6) {
      // Battle Rifle (Bullpup with optic)
      geo = new THREE.BoxGeometry(0.11, 0.22, 0.78);
      mat = new THREE.MeshStandardMaterial({ color: 0x2a3644, metalness: 0.7, roughness: 0.35 });
    } else if (weaponTypeIndex === 7) {
      // Laser Gun (Covenant plasma purple)
      geo = new THREE.BoxGeometry(0.12, 0.20, 0.68);
      mat = new THREE.MeshStandardMaterial({ color: 0x7b2cbf, emissive: 0x240046, metalness: 0.85, roughness: 0.25 });
    } else if (weaponTypeIndex === 8) {
      // Grenade
      geo = new THREE.SphereGeometry(0.14, 10, 8);
      mat = new THREE.MeshStandardMaterial({ color: 0x2f3d2a, roughness: 0.6 });
    } else {
      // Mini Shield
      geo = new THREE.CylinderGeometry(0.12, 0.14, 0.35, 8);
      mat = new THREE.MeshStandardMaterial({ color: 0x3f8fe0, emissive: 0x1b4b7a, roughness: 0.2 });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    g.add(mesh);

    let ringColor = 0xf5a623;
    if (weaponTypeIndex === 9) ringColor = 0x3f8fe0; // Mini shield cyan
    else if (weaponTypeIndex === 8) ringColor = 0x55cc44; // Grenade green
    else if (weaponTypeIndex === 7) ringColor = 0xb5179e; // Laser magenta
    else if (weaponTypeIndex === 6) ringColor = 0x4cc9f0; // BR electric cyan
    else if (weaponTypeIndex === 5) ringColor = 0xf72585; // LMG hot pink
    else if (weaponTypeIndex === 4) ringColor = 0xf77f00; // SMG neon orange
    else if (weaponTypeIndex === 3) ringColor = 0x57d1c9; // Pistol crisp cyan

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.45, 16),
      new THREE.MeshBasicMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.4;
    g.add(glow);

    g.position.set(x, y, z);
    scene.add(g);

    let labelText = '';
    const targetW = WEAPONS[weaponTypeIndex];
    if (targetW?.type === 'consumable') {
      labelText = 'MINI SHIELD (+1)';
    } else if (targetW?.type === 'grenade') {
      labelText = 'GRENADES (+2)';
    } else if (targetW) {
      labelText = `${targetW.name} (+${ammoAmount} AMMO)`;
    } else {
      labelText = `AMMO (+${ammoAmount})`;
    }

    const pickup: GroundPickup = {
      group: g,
      typeIndex: weaponTypeIndex,
      ammo: ammoAmount,
      label: labelText
    };
    groundPickups.push(pickup);
    return pickup;
  }

  function collectPickup(
    item: GroundPickup,
    onAcquire: (msg: string) => void,
    weaponStates: { count?: number; reserve?: number }[]
  ): void {
    const idx = item.typeIndex;
    const w = WEAPONS[idx];
    if (!w || !weaponStates[idx]) return;

    if (w.type === 'consumable') {
      weaponStates[idx].count = Math.min(6, (weaponStates[idx].count ?? 0) + 1);
      onAcquire('+1 MINI SHIELD ACQUIRED');
    } else if (w.type === 'grenade') {
      weaponStates[idx].count = Math.min(6, (weaponStates[idx].count ?? 0) + item.ammo);
      onAcquire(`+${item.ammo} TACTICAL GRENADES`);
    } else {
      weaponStates[idx].reserve = (weaponStates[idx].reserve ?? 0) + item.ammo;
      onAcquire(`+${item.ammo} ${w.name} AMMO`);
    }
    scene.remove(item.group);
    const indexInArr = groundPickups.indexOf(item);
    if (indexInArr >= 0) groundPickups.splice(indexInArr, 1);
  }

  // Seed default ground pickups
  structures.forEach((st, idx) => {
    if (st.center && idx % 2 === 0) {
      const wType = idx % WEAPONS.length;
      const targetW = WEAPONS[wType];
      const ammo = targetW.mag ? targetW.mag * 2 : 2;
      createGroundPickup(st.center.x + (Math.random() * 2 - 1), st.center.z + (Math.random() * 2 - 1), wType, ammo);
    }
  });

  for (let i = 0; i < 8; i++) {
    const p = randomMapPoint(12);
    const wType = Math.floor(Math.random() * WEAPONS.length);
    const targetW = WEAPONS[wType];
    const ammo = targetW.mag ? Math.round(targetW.mag * 1.5) : 2;
    createGroundPickup(p.x, p.z, wType, ammo);
  }

  function updateDoors(dt: number): void {
    for (const d of doors) {
      d.currentAngle += (d.targetAngle - d.currentAngle) * Math.min(1, dt * 8.5);
      d.hingeGroup.rotation.y = d.currentAngle;
    }
  }

  function moveEntityWithCollision(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    radius: number,
    footY: number,
    headY: number,
    dt: number
  ): void {
    pos.x += vel.x * dt;
    for (let i = 0; i < worldColliders.length; i++) {
      const c = worldColliders[i];
      if (c.active === false) continue;
      if (footY >= c.maxY - 0.15 || headY <= c.minY + 0.1) continue;

      if (pos.z + radius > c.minZ && pos.z - radius < c.maxZ) {
        if (pos.x + radius > c.minX && pos.x - radius < c.maxX) {
          if (vel.x > 0) pos.x = c.minX - radius;
          else if (vel.x < 0) pos.x = c.maxX + radius;
          vel.x = 0;
        }
      }
    }

    pos.z += vel.z * dt;
    for (let i = 0; i < worldColliders.length; i++) {
      const c = worldColliders[i];
      if (c.active === false) continue;
      if (footY >= c.maxY - 0.15 || headY <= c.minY + 0.1) continue;

      if (pos.x + radius > c.minX && pos.x - radius < c.maxX) {
        if (pos.z + radius > c.minZ && pos.z - radius < c.maxZ) {
          if (vel.z > 0) pos.z = c.minZ - radius;
          else if (vel.z < 0) pos.z = c.maxZ + radius;
          vel.z = 0;
        }
      }
    }

    const bound = MAP_HALF - 2.5;
    if (pos.x < -bound + radius) {
      pos.x = -bound + radius;
      vel.x = 0;
    } else if (pos.x > bound - radius) {
      pos.x = bound - radius;
      vel.x = 0;
    }
    if (pos.z < -bound + radius) {
      pos.z = -bound + radius;
      vel.z = 0;
    } else if (pos.z > bound - radius) {
      pos.z = bound - radius;
      vel.z = 0;
    }
  }

  function getHighestSurface(x: number, z: number, footY: number): number {
    let topY = terrainHeight(x, z);
    for (const c of worldColliders) {
      if (c.active === false) continue;
      if (x >= c.minX - 0.05 && x <= c.maxX + 0.05 && z >= c.minZ - 0.05 && z <= c.maxZ + 0.05) {
        if (c.maxY <= footY + 0.65 && c.maxY > topY) {
          topY = c.maxY;
        }
      }
    }
    return topY;
  }

  function dispose(): void {
    groundPickups.forEach(p => scene.remove(p.group));
    groundPickups.length = 0;
  }

  return {
    terrainMesh,
    worldColliders,
    doors,
    hittableObjects,
    groundPickups,
    structures,
    registerHittable,
    unregisterHittable,
    createGroundPickup,
    collectPickup,
    updateDoors,
    moveEntityWithCollision,
    getHighestSurface,
    dispose
  };
}
