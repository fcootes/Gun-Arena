import * as THREE from 'three';
import { GearTier } from './FactionContext';

export type VisorType = 'standard' | 'recon' | 'apex';
export type FactionType = 'usmc' | 'apex';

export interface LobbyAvatarController {
  group: THREE.Group;
  update: (timeSec: number) => void;
  setFaction: (faction: FactionType) => void;
  setGearTier: (tier: GearTier) => void;
  setVisor: (visor: VisorType) => void;
  setHeadgear: (headgear: import('./FactionContext').HeadgearOption) => void;
  setTorsoConfig: (torso: import('./FactionContext').TorsoOption) => void;
  setLowerConfig: (lower: import('./FactionContext').LowerOption) => void;
  setWeapon: (weaponId: string) => void;
  destroy: () => void;
}

export function createLobbyAvatar(scene: THREE.Scene, basePos: THREE.Vector3): LobbyAvatarController {
  const root = new THREE.Group();
  root.position.copy(basePos);
  scene.add(root);

  let currentFaction: FactionType = 'usmc';
  let currentGearTier: GearTier = 'standard';
  let currentVisor: VisorType = 'standard';
  let currentWeapon: string = 'ar';
  
  let currentHeadgear: import('./FactionContext').HeadgearOption = 'fast';
  let currentTorsoConfig: import('./FactionContext').TorsoOption = 'chest_rig';
  let currentLowerConfig: import('./FactionContext').LowerOption = 'pouches';

  // Staging Tactical Pedestal (Rugged Matte Military Deck)
  const pedestalGroup = new THREE.Group();
  root.add(pedestalGroup);

  const basePlateMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d22,
    roughness: 0.65,
    metalness: 0.5
  });
  const edgeTrimMat = new THREE.MeshStandardMaterial({
    color: 0x4a5568,
    roughness: 0.5,
    metalness: 0.7
  });

  const pedestalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.6, 0.12, 32),
    basePlateMat
  );
  pedestalBase.position.y = 0.06;
  pedestalBase.receiveShadow = true;
  pedestalGroup.add(pedestalBase);

  const pedestalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.52, 0.02, 16, 48),
    edgeTrimMat
  );
  pedestalRing.rotation.x = Math.PI / 2;
  pedestalRing.position.y = 0.12;
  pedestalGroup.add(pedestalRing);

  // Tactical Turntable Key & Fill Lighting
  const spotLight = new THREE.SpotLight(0xf5f7fa, 3.2);
  spotLight.position.set(0, 4.8, 3.2);
  spotLight.target = root;
  spotLight.angle = 0.65;
  spotLight.penumbra = 0.45;
  spotLight.castShadow = true;
  root.add(spotLight);

  const rimLight = new THREE.DirectionalLight(0xdde4ed, 1.2);
  rimLight.position.set(-2.5, 3.2, -3.0);
  root.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x8a929e, 0.6);
  fillLight.position.set(2.5, 2.0, 2.5);
  root.add(fillLight);

  // Character hierarchy
  const characterGroup = new THREE.Group();
  characterGroup.position.y = 0.12;
  root.add(characterGroup);

  // Dynamic mesh references
  let torsoGroup: THREE.Group | null = null;
  let chestMesh: THREE.Mesh | null = null;
  let headGroup: THREE.Group | null = null;
  let armL: THREE.Group | null = null;
  let armR: THREE.Group | null = null;
  let weaponGroup: THREE.Group | null = null;

  function buildCharacter() {
    // Clear old character children
    while (characterGroup.children.length > 0) {
      characterGroup.remove(characterGroup.children[0]);
    }

    const isUSMC = currentFaction === 'usmc';
    const isSpecialized = currentGearTier === 'specialized';

    // Gritty, realistic modern military palettes
    // USMC: Olive drab fatigues, woodland accents, coyote tan webbing
    // Apex: Matte charcoal / black carbon weave, dark tactical slate
    const shirtColor = isUSMC ? 0x3e4a2d : 0x181a1e;
    const pantsColor = isUSMC ? 0x28331f : 0x121316;
    const vestColor = isUSMC 
      ? (isSpecialized ? 0x3b4629 : 0x485834) // Battle-worn heavy olive drab for breacher
      : (isSpecialized ? 0x1c1f26 : 0x191c21); // Multicam-black for recon rig
    const helmetColor = isUSMC ? 0x343e26 : 0x131518;
    const skinColor = isUSMC ? 0xd2a482 : 0xcab5a2;
    const pouchesColor = isUSMC ? 0x6e6149 : 0x242830; // Coyote tan for USMC, charcoal for Apex
    const plateArmorColor = isUSMC ? 0x303a22 : 0x16181c;

    // Materials
    const matShirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.82 });
    const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
    const matVest = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.72 });
    const matPlateArmor = new THREE.MeshStandardMaterial({ color: plateArmorColor, roughness: 0.65, metalness: 0.25 });
    const matHelmet = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.65, metalness: 0.15 });
    const matSkin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.72 });
    const matBoots = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.9 });
    const matPouches = new THREE.MeshStandardMaterial({ color: pouchesColor, roughness: 0.85 });
    const matGloves = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.85 });
    const matHeadset = new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.6, metalness: 0.3 });
    const matVisorSmoked = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.2, metalness: 0.85 });
    const matBeard = new THREE.MeshStandardMaterial({ color: 0x261e18, roughness: 0.95 });

    // Dynamic pedestal tint
    if (isUSMC) {
      edgeTrimMat.color.setHex(0x6e6149); // Coyote tan trim
    } else {
      edgeTrimMat.color.setHex(0x4a5568); // Matte gunmetal trim
    }

    // 1. LEGS (Standard Combat Fatigues with Kneepads)
    // Left Leg
    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.16, 0.92, 0);
    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.17), matPants);
    thighL.position.y = -0.22;
    thighL.castShadow = true;
    const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.16), matPants);
    shinL.position.y = -0.62;
    shinL.castShadow = true;
    // Ballistic Kneepad
    const kneeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.05), matPlateArmor);
    kneeL.position.set(0, -0.42, 0.09);
    kneeL.castShadow = true;
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), matBoots);
    bootL.position.set(0, -0.86, 0.04);
    bootL.castShadow = true;
    legLGroup.add(thighL, shinL, kneeL, bootL);

    // Right Leg
    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.16, 0.92, 0);
    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.17), matPants);
    thighR.position.y = -0.22;
    thighR.castShadow = true;
    const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.16), matPants);
    shinR.position.y = -0.62;
    shinR.castShadow = true;
    const kneeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.05), matPlateArmor);
    kneeR.position.set(0, -0.42, 0.09);
    kneeR.castShadow = true;
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), matBoots);
    bootR.position.set(0, -0.86, 0.04);
    bootR.castShadow = true;
    legRGroup.add(thighR, shinR, kneeR, bootR);

    characterGroup.add(legLGroup, legRGroup);

    // 2. TORSO HIERARCHY
    torsoGroup = new THREE.Group();
    characterGroup.add(torsoGroup);

    // Lower abdomen / waist
    const lowerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.22), matPants);
    lowerTorso.position.y = 0.98;
    lowerTorso.castShadow = true;
    torsoGroup.add(lowerTorso);

    // Tactical Webbing Duty Belt
    const dutyBelt = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.08, 0.24), matPouches);
    dutyBelt.position.y = 0.94;
    torsoGroup.add(dutyBelt);

    // Chest / Upper Torso
    chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.26), matShirt);
    chestMesh.position.y = 1.28;
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    if (currentTorsoConfig === 'molle_vest') {
      // Heavy battle-worn olive drab modular plate carrier (IOTV style)
      const iotvCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.32), matVest);
      iotvCarrier.position.set(0, 1.29, 0.01);
      iotvCarrier.castShadow = true;
      torsoGroup.add(iotvCarrier);

      // Attached Neck Ballistic Guard Collar
      const neckGuard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.30), matPlateArmor);
      neckGuard.position.set(0, 1.50, 0.01);
      neckGuard.castShadow = true;
      torsoGroup.add(neckGuard);

      // Heavy Quad Ammo Pouches + Side Ballistic Plates
      [-0.14, -0.05, 0.05, 0.14].forEach((px) => {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), matPouches);
        pouch.position.set(px, 1.20, 0.19);
        pouch.castShadow = true;
        torsoGroup.add(pouch);
      });
    } else {
      // Low-profile modular chest rig / plate carrier
      const standardPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.28), matVest);
      standardPlate.position.set(0, 1.28, 0.02);
      standardPlate.castShadow = true;
      torsoGroup.add(standardPlate);

      // Modular cross-harness straps
      const harnessL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.28), matPouches);
      harnessL.position.set(-0.16, 1.28, 0.01);
      const harnessR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.28), matPouches);
      harnessR.position.set(0.16, 1.28, 0.01);
      torsoGroup.add(harnessL, harnessR);

      // Triple Mag Pouch on front
      [-0.12, 0, 0.12].forEach((px) => {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.06), matPouches);
        pouch.position.set(px, 1.18, 0.17);
        pouch.castShadow = true;
        torsoGroup.add(pouch);
      });
    }

    if (currentLowerConfig === 'pouches') {
      // Groin Ballistic Protector Flap
      const groinFlap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.06), matPlateArmor);
      groinFlap.position.set(0, 0.84, 0.14);
      groinFlap.castShadow = true;
      torsoGroup.add(groinFlap);
      
      const sidePouchL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), matPouches);
      sidePouchL.position.set(-0.22, 0.94, 0);
      const sidePouchR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), matPouches);
      sidePouchR.position.set(0.22, 0.94, 0);
      torsoGroup.add(sidePouchL, sidePouchR);
    } else {
      // Thigh Holster on Right Leg
      const holsterDrop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.14), matPlateArmor);
      holsterDrop.position.set(0.12, -0.05, 0);
      holsterDrop.castShadow = true;
      legRGroup.add(holsterDrop); // Attach to legRGroup!
      
      const sidearm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.10), new THREE.MeshStandardMaterial({color: 0x111111}));
      sidearm.position.set(0.15, -0.05, 0.02);
      legRGroup.add(sidearm);
    }

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.18, 12), matSkin);
    neck.position.set(0, 1.48, 0);
    neck.castShadow = true;
    torsoGroup.add(neck);

    // 3. HEAD & HELMET / HEADSET ASSEMBLY
    headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);
    torsoGroup.add(headGroup);

    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), matSkin);
    headBase.position.y = 0.08;
    headBase.castShadow = true;
    headGroup.add(headBase);

    // Tactical Communications Headset & Ear Cups (common to most configs)
    const commL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.08), matHeadset);
    commL.position.set(-0.145, 0.09, 0);
    const commR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.08), matHeadset);
    commR.position.set(0.145, 0.09, 0);
    headGroup.add(commL, commR);

    // Tactical Throat Mic / Boom Mic
    const boomMic = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.14), matHeadset);
    boomMic.position.set(-0.10, 0.03, 0.10);
    boomMic.rotation.y = 0.45;
    headGroup.add(boomMic);

    if (currentHeadgear === 'fast') {
      // Ballistic FAST Helmet
      const helmetMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.29, 0.19, 0.30), 
        matHelmet
      );
      helmetMesh.position.set(0, 0.17, -0.01);
      helmetMesh.castShadow = true;
      headGroup.add(helmetMesh);

      // NVG Shroud Bracket
      const nvgBracket = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), matPlateArmor);
      nvgBracket.position.set(0, 0.16, 0.15);
      headGroup.add(nvgBracket);
    } else if (currentHeadgear === 'boonie') {
      // Boonie Hat (Soft fabric rim)
      const hatBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.26), matVest);
      hatBase.position.set(0, 0.18, 0);
      const hatRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16), matVest);
      hatRim.position.set(0, 0.14, 0);
      headGroup.add(hatBase, hatRim);
    } else if (currentHeadgear === 'skull') {
      // Skull Mask Mandible Guard over lower jaw
      const skullMask = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.13), new THREE.MeshStandardMaterial({color: 0xcccccc}));
      skullMask.position.set(0, 0.02, 0.10);
      skullMask.castShadow = true;
      headGroup.add(skullMask);
      
      // Add a beanie or soft cap
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.10, 0.25), matShirt);
      cap.position.set(0, 0.22, 0);
      headGroup.add(cap);
    } else {
      // Base config (no headgear), just add a headband for the headset
      const headband = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.03, 0.06), matHeadset);
      headband.position.set(0, 0.21, 0);
      headGroup.add(headband);
    }

    if (currentVisor === 'recon') {
      // Dark ballistic visor shield plate
      const visorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, 0.05), matVisorSmoked);
      visorPlate.position.set(0, 0.11, 0.14);
      headGroup.add(visorPlate);
    } else if (currentVisor === 'apex') {
      const visorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.06), new THREE.MeshStandardMaterial({color: 0xff4400, emissive: 0x551100}));
      visorPlate.position.set(0, 0.11, 0.14);
      headGroup.add(visorPlate);
    }

    // 4. ARMS & WEAPON READY STANCE
    // Rolled Combat Sleeves Logic for Apex Specialized:
    // If Apex specialized: rolled combat sleeves -> upper arm has shirt, lower arm has bare skin with tactical gloves!
    const isRolledSleeves = !isUSMC && isSpecialized;
    const lowerArmMat = isRolledSleeves ? matSkin : matShirt;

    // Left Arm
    armL = new THREE.Group();
    armL.position.set(-0.28, 1.42, 0);
    torsoGroup.add(armL);

    const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.13), matShirt);
    upperArmL.position.y = -0.14;
    upperArmL.castShadow = true;

    // Rolled sleeve cuff if rolled
    if (isRolledSleeves) {
      const cuffL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.14), matShirt);
      cuffL.position.set(0.02, -0.27, 0.06);
      armL.add(cuffL);
    }

    const lowerArmL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.12), lowerArmMat);
    lowerArmL.position.set(0.05, -0.36, 0.12);
    lowerArmL.rotation.x = 0.55;
    lowerArmL.rotation.z = -0.25;
    lowerArmL.castShadow = true;

    const gloveL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.12), matGloves);
    gloveL.position.set(0.07, -0.47, 0.17);
    gloveL.rotation.x = 0.55;
    gloveL.rotation.z = -0.25;
    armL.add(upperArmL, lowerArmL, gloveL);

    // Right Arm
    armR = new THREE.Group();
    armR.position.set(0.28, 1.42, 0);
    torsoGroup.add(armR);

    const upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.13), matShirt);
    upperArmR.position.y = -0.14;
    upperArmR.castShadow = true;

    if (isRolledSleeves) {
      const cuffR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.14), matShirt);
      cuffR.position.set(-0.02, -0.27, 0.06);
      armR.add(cuffR);
    }

    const lowerArmR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.12), lowerArmMat);
    lowerArmR.position.set(-0.06, -0.34, 0.15);
    lowerArmR.rotation.x = 0.65;
    lowerArmR.rotation.z = 0.25;
    lowerArmR.castShadow = true;

    const gloveR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.12), matGloves);
    gloveR.position.set(-0.08, -0.45, 0.21);
    gloveR.rotation.x = 0.65;
    gloveR.rotation.z = 0.25;
    armR.add(upperArmR, lowerArmR, gloveR);

    // 5. WEAPON IN HANDS
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

    const matGunMetal = new THREE.MeshStandardMaterial({ color: 0x25282d, roughness: 0.45, metalness: 0.8 });
    const matGunDark = new THREE.MeshStandardMaterial({ color: 0x121315, roughness: 0.7, metalness: 0.3 });
    const matAccent = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.4, metalness: 0.5 });

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
      // Organic breathing simulation
      const breathPhase = timeSec * 2.0;
      const breathScale = 1.0 + Math.sin(breathPhase) * 0.022;
      if (chestMesh) {
        chestMesh.scale.set(breathScale, breathScale, breathScale);
      }
      if (headGroup) {
        headGroup.position.y = 1.62 + Math.sin(breathPhase) * 0.007;
        headGroup.rotation.y = Math.sin(timeSec * 0.4) * 0.06;
      }
      if (torsoGroup) {
        torsoGroup.position.y = Math.sin(breathPhase) * 0.004;
      }
      if (weaponGroup) {
        weaponGroup.position.y = 1.08 + Math.sin(breathPhase + 0.3) * 0.006;
      }

      // Smooth turntable base rotation
      pedestalRing.rotation.z = timeSec * 0.15;
    },
    setFaction: (faction: FactionType) => {
      if (currentFaction !== faction) {
        currentFaction = faction;
        buildCharacter();
      }
    },
    setGearTier: (tier: GearTier) => {
      if (currentGearTier !== tier) {
        currentGearTier = tier;
        buildCharacter();
      }
    },
    setVisor: (visor: VisorType) => {
      if (currentVisor !== visor) {
        currentVisor = visor;
        buildCharacter();
      }
    },
    setHeadgear: (h) => {
      if (currentHeadgear !== h) {
        currentHeadgear = h;
        buildCharacter();
      }
    },
    setTorsoConfig: (t) => {
      if (currentTorsoConfig !== t) {
        currentTorsoConfig = t;
        buildCharacter();
      }
    },
    setLowerConfig: (l) => {
      if (currentLowerConfig !== l) {
        currentLowerConfig = l;
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
