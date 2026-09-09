import * as THREE from 'three';

export type VisorType = 'standard' | 'recon' | 'apex';
export type FactionType = 'usmc' | 'apex';

export interface LobbyAvatarController {
  group: THREE.Group;
  update: (timeSec: number) => void;
  setFaction: (faction: FactionType) => void;
  setVisor: (visor: VisorType) => void;
  setWeapon: (weaponId: string) => void;
  destroy: () => void;
}

export function createLobbyAvatar(scene: THREE.Scene, basePos: THREE.Vector3): LobbyAvatarController {
  const root = new THREE.Group();
  root.position.copy(basePos);
  scene.add(root);

  let currentFaction: FactionType = 'usmc';
  let currentVisor: VisorType = 'standard';
  let currentWeapon: string = 'ar';

  // Staging Pedestal Platform
  const pedestalGroup = new THREE.Group();
  root.add(pedestalGroup);

  const basePlateMat = new THREE.MeshStandardMaterial({
    color: 0x15181d,
    roughness: 0.4,
    metalness: 0.8
  });
  const edgeGlowMat = new THREE.MeshStandardMaterial({
    color: 0x2de2e6,
    emissive: 0x2de2e6,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });
  const pedestalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.6, 0.12, 32),
    basePlateMat
  );
  pedestalBase.position.y = 0.06;
  pedestalBase.receiveShadow = true;
  pedestalGroup.add(pedestalBase);

  const pedestalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.52, 0.025, 16, 48),
    edgeGlowMat
  );
  pedestalRing.rotation.x = Math.PI / 2;
  pedestalRing.position.y = 0.12;
  pedestalGroup.add(pedestalRing);

  // Spotlights for dramatic character showcase
  const spotLight = new THREE.SpotLight(0xffffff, 2.5);
  spotLight.position.set(0, 4.5, 3.0);
  spotLight.target = root;
  spotLight.angle = 0.65;
  spotLight.penumbra = 0.5;
  spotLight.castShadow = true;
  root.add(spotLight);

  const rimLight = new THREE.DirectionalLight(0x2de2e6, 1.2);
  rimLight.position.set(-2, 3, -3);
  root.add(rimLight);

  // Character hierarchy
  const characterGroup = new THREE.Group();
  characterGroup.position.y = 0.12;
  root.add(characterGroup);

  // Dynamic mesh references
  let torsoGroup: THREE.Group | null = null;
  let chestMesh: THREE.Mesh | null = null;
  let headGroup: THREE.Group | null = null;
  let visorMeshes: THREE.Mesh[] = [];
  let armL: THREE.Group | null = null;
  let armR: THREE.Group | null = null;
  let weaponGroup: THREE.Group | null = null;

  function buildCharacter() {
    // Clear old character children
    while (characterGroup.children.length > 0) {
      characterGroup.remove(characterGroup.children[0]);
    }
    visorMeshes = [];

    // Faction palettes
    const isUSMC = currentFaction === 'usmc';
    const shirtColor = isUSMC ? 0x3e4a2d : 0x181a1e;
    const pantsColor = isUSMC ? 0x28331f : 0x121316;
    const vestColor = isUSMC ? 0x485834 : 0x1c1f24;
    const helmetColor = isUSMC ? 0x364228 : 0x141518;
    const skinColor = isUSMC ? 0xd2a482 : 0xcbb39e;
    const pouchesColor = isUSMC ? 0x6e6149 : 0x22262e;

    // Materials
    const matShirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
    const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
    const matVest = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.75 });
    const matHelmet = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.65, metalness: 0.2 });
    const matSkin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    const matBoots = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.9 });
    const matPouches = new THREE.MeshStandardMaterial({ color: pouchesColor, roughness: 0.85 });
    const matBeard = new THREE.MeshStandardMaterial({ color: 0x241c16, roughness: 0.95 });
    const matSkullMask = new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.7 });
    const matSocketRecess = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 });
    const matHoodFabric = new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.9 });

    // Visor color & material based on currentVisor
    let visorColorHex = 0x2de2e6;
    let visorGlowHex = 0x1ca2db;
    if (currentVisor === 'recon') {
      visorColorHex = 0x00ff66;
      visorGlowHex = 0x00cc55;
    } else if (currentVisor === 'apex') {
      visorColorHex = 0xff2a2a;
      visorGlowHex = 0xcc1111;
    }

    const matVisor = new THREE.MeshStandardMaterial({
      color: visorColorHex,
      emissive: visorGlowHex,
      emissiveIntensity: 2.4,
      roughness: 0.15,
      metalness: 0.85
    });

    // Update pedestal ring glow color to match equipped visor
    edgeGlowMat.color.setHex(visorColorHex);
    edgeGlowMat.emissive.setHex(visorGlowHex);
    rimLight.color.setHex(visorColorHex);

    // Legs
    // Left Leg
    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.16, 0.92, 0);
    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.17), matPants);
    thighL.position.y = -0.22;
    thighL.castShadow = true;
    const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.16), matPants);
    shinL.position.y = -0.62;
    shinL.castShadow = true;
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), matBoots);
    bootL.position.set(0, -0.86, 0.04);
    bootL.castShadow = true;
    legLGroup.add(thighL, shinL, bootL);

    // Right Leg
    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.16, 0.92, 0);
    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.17), matPants);
    thighR.position.y = -0.22;
    thighR.castShadow = true;
    const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.16), matPants);
    shinR.position.y = -0.62;
    shinR.castShadow = true;
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), matBoots);
    bootR.position.set(0, -0.86, 0.04);
    bootR.castShadow = true;
    legRGroup.add(thighR, shinR, bootR);

    characterGroup.add(legLGroup, legRGroup);

    // Torso
    torsoGroup = new THREE.Group();
    characterGroup.add(torsoGroup);

    // Lower abdomen
    const lowerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.22), matPants);
    lowerTorso.position.y = 0.98;
    lowerTorso.castShadow = true;
    torsoGroup.add(lowerTorso);

    // Chest / Upper Torso
    chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.26), matShirt);
    chestMesh.position.y = 1.28;
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Tactical Vest Plates
    const vestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.10), matVest);
    vestPlate.position.set(0, 1.28, 0.10);
    vestPlate.castShadow = true;
    torsoGroup.add(vestPlate);

    // Tactical Magazine Pouches
    [-0.12, 0, 0.12].forEach((px) => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.06), matPouches);
      pouch.position.set(px, 1.05, 0.14);
      pouch.castShadow = true;
      torsoGroup.add(pouch);
    });

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.20, 12), matSkin);
    neck.position.set(0, 1.48, 0);
    neck.castShadow = true;
    torsoGroup.add(neck);

    // Head
    headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);
    torsoGroup.add(headGroup);

    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), matSkin);
    headBase.position.y = 0.08;
    headBase.castShadow = true;
    headGroup.add(headBase);

    if (isUSMC) {
      // USMC Marine with 3D blocky tactical beard & combat PASGT helmet
      const beardJaw = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.09, 0.14), matBeard);
      beardJaw.position.set(0, 0.01, 0.10);
      const beardChin = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.08), matBeard);
      beardChin.position.set(0, -0.04, 0.13);
      headGroup.add(beardJaw, beardChin);

      const helmetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.16, 0.30), matHelmet);
      helmetMesh.position.set(0, 0.17, -0.01);
      helmetMesh.castShadow = true;
      headGroup.add(helmetMesh);

      const visorBrim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.024, 0.09), matHelmet);
      visorBrim.position.set(0, 0.12, 0.16);
      visorBrim.rotation.x = 0.16;
      headGroup.add(visorBrim);

      // Diegetic Visor Bar (colored pixels/glow)
      const visorBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.05), matVisor);
      visorBar.position.set(0, 0.10, 0.14);
      headGroup.add(visorBar);
      visorMeshes.push(visorBar);

      // Comms headset
      const commL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.07), matPouches);
      commL.position.set(-0.145, 0.09, 0);
      const commR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.07), matPouches);
      commR.position.set(0.145, 0.09, 0);
      headGroup.add(commL, commR);
    } else {
      // APEX Operator with 3D Skull Mask plate & Tactical Hood
      const skullPlate = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.19, 0.05), matSkullMask);
      skullPlate.position.set(0, 0.05, 0.14);
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.04), matSocketRecess);
      eyeL.position.set(-0.06, 0.09, 0.155);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.04), matSocketRecess);
      eyeR.position.set(0.06, 0.09, 0.155);
      const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.04), matSocketRecess);
      teeth.position.set(0, -0.015, 0.165);
      const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.28, 0.15), matHoodFabric);
      hoodBack.position.set(0, 0.07, -0.08);
      const hoodCollar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.24), matHoodFabric);
      hoodCollar.position.set(0, -0.05, 0);
      headGroup.add(skullPlate, eyeL, eyeR, teeth, hoodBack, hoodCollar);

      // Diegetic Visor Eye sensors (colored pixels/glow)
      const visorSensorL = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.022, 0.02), matVisor);
      visorSensorL.position.set(-0.06, 0.09, 0.17);
      const visorSensorR = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.022, 0.02), matVisor);
      visorSensorR.position.set(0.06, 0.09, 0.17);
      headGroup.add(visorSensorL, visorSensorR);
      visorMeshes.push(visorSensorL, visorSensorR);
    }

    // Arms & Weapon Ready Stance
    armL = new THREE.Group();
    armL.position.set(-0.28, 1.42, 0);
    torsoGroup.add(armL);

    const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.13), matShirt);
    upperArmL.position.y = -0.14;
    upperArmL.castShadow = true;
    const lowerArmL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.12), matShirt);
    lowerArmL.position.set(0.05, -0.36, 0.12);
    lowerArmL.rotation.x = 0.55;
    lowerArmL.rotation.z = -0.25;
    lowerArmL.castShadow = true;
    armL.add(upperArmL, lowerArmL);

    armR = new THREE.Group();
    armR.position.set(0.28, 1.42, 0);
    torsoGroup.add(armR);

    const upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.13), matShirt);
    upperArmR.position.y = -0.14;
    upperArmR.castShadow = true;
    const lowerArmR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.12), matShirt);
    lowerArmR.position.set(-0.06, -0.34, 0.15);
    lowerArmR.rotation.x = 0.65;
    lowerArmR.rotation.z = 0.25;
    lowerArmR.castShadow = true;
    armR.add(upperArmR, lowerArmR);

    // Weapon in hands
    weaponGroup = new THREE.Group();
    weaponGroup.position.set(0.10, 1.08, 0.35);
    weaponGroup.rotation.set(-0.15, -0.18, 0.05);
    torsoGroup.add(weaponGroup);

    buildWeaponMesh(weaponGroup, currentWeapon);
  }

  function buildWeaponMesh(targetGroup: THREE.Group, weaponId: string) {
    while (targetGroup.children.length > 0) {
      targetGroup.remove(targetGroup.children[0]);
    }

    const matGunMetal = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.45, metalness: 0.75 });
    const matGunDark = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.6, metalness: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: 0x3f8fe0, roughness: 0.4, metalness: 0.6 });

    // Stylized Weapon Representation
    if (weaponId === 'shotgun') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), matGunDark);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.65, 8), matGunMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, 0.18);
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.16), matGunMetal);
      pump.position.set(0, -0.01, 0.15);
      targetGroup.add(body, barrel, pump);
    } else if (weaponId === 'sniper') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.70), matGunDark);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 8), matGunMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, 0.32);
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.28, 8), matGunMetal);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.11, 0.02);
      targetGroup.add(body, barrel, scope);
    } else if (weaponId === 'pistol') {
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.24), matGunMetal);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.08), matGunDark);
      grip.position.set(0, -0.08, -0.06);
      grip.rotation.x = 0.22;
      targetGroup.add(slide, grip);
    } else if (weaponId === 'lmg' || weaponId === 'minigun') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.65), matGunDark);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12), matGunMetal);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, -0.12, 0.05);
      const barrels = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), matGunMetal);
      barrels.rotation.x = Math.PI / 2;
      barrels.position.set(0, 0.02, 0.35);
      targetGroup.add(body, drum, barrels);
    } else {
      // Default M4A1 Assault Rifle / Battle Rifle
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.45), matGunMetal);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.50, 8), matGunDark);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, 0.28);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.09), matGunDark);
      mag.position.set(0, -0.11, 0.05);
      mag.rotation.x = 0.22;
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.22), matGunDark);
      stock.position.set(0, -0.02, -0.24);
      const optic = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.12), matAccent);
      optic.position.set(0, 0.09, -0.02);
      targetGroup.add(receiver, barrel, mag, stock, optic);
    }
  }

  buildCharacter();

  return {
    group: root,
    update: (timeSec: number) => {
      // Idle organic breathing simulation
      const breathPhase = timeSec * 2.0;
      const breathScale = 1.0 + Math.sin(breathPhase) * 0.025;
      if (chestMesh) {
        chestMesh.scale.set(breathScale, breathScale, breathScale);
      }
      if (headGroup) {
        headGroup.position.y = 1.62 + Math.sin(breathPhase) * 0.008;
        headGroup.rotation.y = Math.sin(timeSec * 0.4) * 0.08;
      }
      if (torsoGroup) {
        torsoGroup.position.y = Math.sin(breathPhase) * 0.005;
      }
      if (weaponGroup) {
        weaponGroup.position.y = 1.08 + Math.sin(breathPhase + 0.3) * 0.008;
      }

      // Gentle pedestal rotation
      pedestalRing.rotation.z = timeSec * 0.25;
    },
    setFaction: (faction: FactionType) => {
      if (currentFaction !== faction) {
        currentFaction = faction;
        buildCharacter();
      }
    },
    setVisor: (visor: VisorType) => {
      if (currentVisor !== visor) {
        currentVisor = visor;
        buildCharacter();
      }
    },
    setWeapon: (weaponId: string) => {
      if (currentWeapon !== weaponId) {
        currentWeapon = weaponId;
        if (weaponGroup) buildWeaponMesh(weaponGroup, weaponId);
      }
    },
    destroy: () => {
      scene.remove(root);
    }
  };
}
