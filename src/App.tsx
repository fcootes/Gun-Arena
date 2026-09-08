import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Bot,
  WeaponDef,
  WeaponSlotState,
  ActiveGrenade,
  ExplosionEffect,
  MatchConfig,
  DifficultyConfig,
  ClassId,
  ClassConfig,
  ArmoryOption
} from './types';
import { WEAPONS, createViewmodelManager } from './weapons';
import {
  AUDIO,
  unlockAudioEngine,
  getSpatialVolume,
  grenadeThrowSound,
  grenadeExplosionSound,
  PISTOL_AUDIO_FILENAMES,
  updateRailgunChargeAudio,
  playRailgunSlugBlast,
  updateMinigunSpinAudio,
  playMinigunFireShot,
  playMinigunVentHiss
} from './audio';
import { createWorld, terrainHeight, randomMapPoint } from './world';

export const CLASSES: Record<ClassId, ClassConfig> = {
  assault: {
    id: 'assault',
    name: 'ASSAULT',
    tagline: 'RAPID RELOAD EXPERT',
    perkName: 'TACTICAL SLEIGHT OF HAND',
    perkDesc: '+25% Faster Weapon Reload Animation Speed across all guns',
    color: '#57d1c9',
    defaultPrimary: 'ar',
    defaultSecondary: 'pistol',
    reloadMultiplier: 0.75, // 25% faster reload duration
    speedMultiplier: 1.0,
    maxHealth: 100,
    initialHealth: 100,
    maxShield: 100,
    initialShield: 100
  },
  recon: {
    id: 'recon',
    name: 'RECON',
    tagline: 'HIGH-VELOCITY FLANKER',
    perkName: 'LIGHTWEIGHT AGILITY',
    perkDesc: '+20% Base Walking & Sprinting Velocity',
    color: '#00e5ff',
    defaultPrimary: 'sniper',
    defaultSecondary: 'smg',
    reloadMultiplier: 1.0,
    speedMultiplier: 1.20, // +20% movement velocity
    maxHealth: 100,
    initialHealth: 100,
    maxShield: 100,
    initialShield: 100
  },
  breacher: {
    id: 'breacher',
    name: 'BREACHER',
    tagline: 'FORTIFIED POINTMAN',
    perkName: 'OVERCHARGED ENERGY SHIELD',
    perkDesc: 'Initializes match with 150 Blue Shield points (Cap: 150)',
    color: '#3f8fe0',
    defaultPrimary: 'shotgun',
    defaultSecondary: 'laser',
    reloadMultiplier: 1.0,
    speedMultiplier: 1.0,
    maxHealth: 100,
    initialHealth: 100,
    maxShield: 150,
    initialShield: 150
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'JUGGERNAUT',
    tagline: 'HEAVY SUPPRESSION TANK',
    perkName: 'TITAN ARMORED PLATING',
    perkDesc: 'Boosts max White Health pool to 200 points (-15% Movement Velocity penalty)',
    color: '#e0473f',
    defaultPrimary: 'minigun',
    defaultSecondary: 'lmg',
    reloadMultiplier: 1.0,
    speedMultiplier: 0.85, // -15% movement velocity
    maxHealth: 200,
    initialHealth: 200,
    maxShield: 100,
    initialShield: 100
  },
  vanguard: {
    id: 'vanguard',
    name: 'VANGUARD',
    tagline: 'ALL-ROUND STRIKE SPECIALIST',
    perkName: 'STANDARDIZED PRECISION',
    perkDesc: 'Standard balanced 100 HP / 100 Shield military loadout',
    color: '#f5a623',
    defaultPrimary: 'br',
    defaultSecondary: 'railgun',
    reloadMultiplier: 1.0,
    speedMultiplier: 1.0,
    maxHealth: 100,
    initialHealth: 100,
    maxShield: 100,
    initialShield: 100
  }
};

export const ARMORY_OPTIONS: ArmoryOption[] = [
  { id: 'ar', label: 'Assault Rifle', slotNum: '1' },
  { id: 'shotgun', label: 'Pump Shotgun', slotNum: '2' },
  { id: 'sniper', label: 'Bolt-Action Sniper', slotNum: '3' },
  { id: 'pistol', label: 'Combat Pistol', slotNum: '4' },
  { id: 'smg', label: 'Rapid SMG', slotNum: '5' },
  { id: 'lmg', label: 'Heavy Drum LMG', slotNum: '6' },
  { id: 'br', label: 'Battle Rifle (Burst)', slotNum: '7' },
  { id: 'laser', label: 'Covenant Laser', slotNum: '8' },
  { id: 'minigun', label: 'Heavy Minigun', slotNum: '9' },
  { id: 'railgun', label: 'Tactical Railgun', slotNum: '0' }
];

const PLAYER_EYE = 1.65;
const PLAYER_EYE_CROUCH = 1.0;
const PLAYER_RADIUS = 0.42;
const GRAVITY = -22;
const JUMP_SPEED = 7.2;
const WALK_SPEED = 5.2;
const SPRINT_SPEED = 8.6;
const CROUCH_SPEED = 2.6;
const HIP_FOV = 74;
const STORM_SAFE_TIME = 28;
const STORM_SHRINK_TIME = 220;
const STORM_START_R = 70;
const STORM_MIN_R = 8;
const STORM_DPS = 4.5;
const BOT_BASE_HEALTH = 85;

const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy:   { label: 'EASY',   botHealthMult: 0.75, botDamageMult: 0.6,  botFireRateMult: 1.35, botAccuracy: 0.28 },
  medium: { label: 'MEDIUM', botHealthMult: 1.0,  botDamageMult: 1.0,  botFireRateMult: 1.0,  botAccuracy: 0.40 },
  hard:   { label: 'HARD',   botHealthMult: 1.3,  botDamageMult: 1.5,  botFireRateMult: 0.75, botAccuracy: 0.58 }
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  // React UI state for overlays and audio guidance
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'ended'>('start');
  const [endResult, setEndResult] = useState<{ victory: boolean; title: string; sub: string }>({ victory: true, title: 'VICTORY', sub: '' });
  const [showAudioHelper, setShowAudioHelper] = useState(false);

  // Match Config & Difficulty UI
  const [matchMode, setMatchMode] = useState<'ffa' | 'team' | 'zombie'>('ffa');
  const [friendlyCount, setFriendlyCount] = useState(3);
  const [enemyCount, setEnemyCount] = useState(5);
  const [targetScore, setTargetScore] = useState(20);
  const [difficultyKey, setDifficultyKey] = useState<string>('medium');
  const [sensitivityVal, setSensitivityVal] = useState(11);

  // Battlefront-Style 5-Class Selection & Armory Customization
  const [selectedClassId, setSelectedClassId] = useState<ClassId>('assault');
  const [selectedPrimary, setSelectedPrimary] = useState<string>('ar');
  const [selectedSecondary, setSelectedSecondary] = useState<string>('pistol');

  // Game stats for UI readout
  const [stats, setStats] = useState({
    health: 100,
    shield: 100,
    kills: 0,
    funds: 0,
    time: '00:00',
    wave: 1,
    zombies: 0,
    blueScore: 0,
    redScore: 0,
    zoneStatus: 'SAFE'
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const matchModeRef = useRef(matchMode);
  matchModeRef.current = matchMode;
  const friendlyCountRef = useRef(friendlyCount);
  friendlyCountRef.current = friendlyCount;
  const enemyCountRef = useRef(enemyCount);
  enemyCountRef.current = enemyCount;
  const targetScoreRef = useRef(targetScore);
  targetScoreRef.current = targetScore;
  const difficultyKeyRef = useRef(difficultyKey);
  difficultyKeyRef.current = difficultyKey;
  const sensitivityValRef = useRef(sensitivityVal);
  sensitivityValRef.current = sensitivityVal;

  const selectedClassIdRef = useRef(selectedClassId);
  selectedClassIdRef.current = selectedClassId;
  const selectedPrimaryRef = useRef(selectedPrimary);
  selectedPrimaryRef.current = selectedPrimary;
  const selectedSecondaryRef = useRef(selectedSecondary);
  selectedSecondaryRef.current = selectedSecondary;

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up Three.js Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const viewport = containerRef.current.querySelector('#viewport') as HTMLDivElement;
    if (viewport) {
      viewport.innerHTML = '';
      viewport.appendChild(renderer.domElement);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(HIP_FOV, window.innerWidth / window.innerHeight, 0.05, 500);
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    // Sky & Lighting
    const hemiLight = new THREE.HemisphereLight(0xbfd9ff, 0x3a3226, 0.65);
    scene.add(hemiLight);
    const sunLight = new THREE.DirectionalLight(0xfff2d9, 1.05);
    sunLight.position.set(120, 180, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -140;
    sunLight.shadow.camera.right = 140;
    sunLight.shadow.camera.top = 140;
    sunLight.shadow.camera.bottom = -140;
    sunLight.shadow.camera.far = 450;
    scene.add(sunLight);
    scene.fog = new THREE.Fog(0xbfd6e6, 80, 360);

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(420, 20, 20);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x2f6fb0) },
        bottomColor: { value: new THREE.Color(0xdcecf6) },
        offset: { value: 18 },
        exponent: { value: 0.75 }
      },
      vertexShader: `varying vec3 vWorldPosition; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main(){ float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0), exponent), 0.0)), 1.0); }`,
      side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // World & Colliders
    const world = createWorld(scene);

    // Muzzle flash particle sprite
    function buildFlashTexture(): THREE.CanvasTexture {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.22, 'rgba(255,224,160,0.95)');
      grad.addColorStop(0.5, 'rgba(255,150,40,0.55)');
      grad.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    }
    const flashTexture = buildFlashTexture();
    function makeFlashSprite(depthTest: boolean): THREE.Sprite {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: flashTexture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest
        })
      );
      sprite.scale.set(0, 0, 0);
      return sprite;
    }

    const playerFlash = makeFlashSprite(false);
    playerFlash.position.set(0.2, -0.16, -0.65);
    camera.add(playerFlash);
    let playerFlashT = 0;
    function triggerPlayerFlash() {
      playerFlashT = 0.07;
      playerFlash.material.rotation = Math.random() * Math.PI * 2;
    }

    // 3D Laser Plasma Beam mesh for continuous fire
    const laserBeamGeo = new THREE.CylinderGeometry(0.015, 0.024, 1, 8);
    laserBeamGeo.translate(0, 0.5, 0);
    laserBeamGeo.rotateX(Math.PI / 2);
    const laserBeamMat = new THREE.MeshBasicMaterial({
      color: 0x3ae2ff,
      transparent: true,
      opacity: 0.85
    });
    const laserBeamMesh = new THREE.Mesh(laserBeamGeo, laserBeamMat);
    laserBeamMesh.visible = false;
    scene.add(laserBeamMesh);

    // Viewmodels
    const vmManager = createViewmodelManager();
    camera.add(vmManager.root);

    // Storm
    const storm = {
      center: new THREE.Vector3(0, 0, 0),
      radius: STORM_START_R,
      elapsed: 0,
      mesh: new THREE.Mesh(
        new THREE.CylinderGeometry(STORM_START_R, STORM_START_R, 260, 48, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x7a4adf, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
      ),
      finished: false
    };
    storm.mesh.position.set(0, 100, 0);
    scene.add(storm.mesh);

    // Match Config
    const matchConfig: MatchConfig = {
      mode: matchMode,
      friendlyCount,
      enemyCount,
      targetScore,
      startingWave: 1
    };
    let currentDifficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.medium;

    // Player State
    const player = {
      pos: new THREE.Vector3(0, terrainHeight(0, 0) + PLAYER_EYE, 0),
      vel: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      onGround: false,
      crouching: false,
      sprinting: false,
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      classReloadMultiplier: 1.0,
      classSpeedMultiplier: 1.0,
      kills: 0,
      alive: true,
      slotIndex: 0,
      fireHeld: false,
      aiming: false,
      isDrinking: false,
      drinkTimer: 0,
      isMeleeing: false,
      meleeTimer: 0,
      continuousShots: 0,
      team: 'player'
    };

    // Player's hard-locked 3-slot tactical loadout:
    // Slot 0: Primary (chosen in lobby dropdown)
    // Slot 1: Secondary (chosen in lobby dropdown)
    // Slot 2: Grenades (tactical explosives)
    let playerLoadout: WeaponDef[] = [];
    let playerWeaponState: WeaponSlotState[] = [];

    function setupPlayerLoadout() {
      const prim = WEAPONS.find(w => w.id === selectedPrimaryRef.current) || WEAPONS[0];
      const sec = WEAPONS.find(w => w.id === selectedSecondaryRef.current) || WEAPONS[3];
      const gren = WEAPONS.find(w => w.type === 'grenade') || WEAPONS[10];

      const heal = WEAPONS.find(w => w.id === 'medkit') || WEAPONS[11]; playerLoadout = [prim, sec, gren, heal];

      playerWeaponState = playerLoadout.map(w => {
        if (w.type === 'grenade' || w.type === 'consumable') {
          return { count: w.count ?? 3, using: false };
        }
        return {
          ammo: w.mag,
          reserve: w.reserve,
          reloading: false,
          reloadT: 0,
          totalReloadT: 0,
          lastFired: -999,
          heat: 0,
          overheated: false,
          burstRemaining: 0,
          burstTimer: 0,
          spinWarmup: 0,
          spinSpeed: 0,
          ventTimer: 0,
          chargeTimer: 0,
          charging: false
        };
      });

      player.slotIndex = 0;
    }
    setupPlayerLoadout();

    let teamScoreBlue = 0;
    let teamScoreRed = 0;
    let playerPoints = 0;
    let currentWave = 1;
    let zombiesRemaining = 0;
    let waveIntermission = false;
    let intermissionTimer = 0;
    let zombieTypeIndex = 0;
    let recoilPitch = 0;
    let recoilKick = 0;
    let mouseSensitivity = sensitivityVal / 5000;
    let bobPhase = 0;
    const keys: Record<string, boolean> = {};

    const activeGrenades: ActiveGrenade[] = [];
    const explosionEffects: ExplosionEffect[] = [];
    const sparkPool: { mesh: THREE.Mesh; life: number; vel?: THREE.Vector3 }[] = [];
    const smokePool: { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }[] = [];
    const smokeGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 0.85 });

    function spawnYellowSmoke(point: THREE.Vector3, velSpread = 0.35) {
      const m = new THREE.Mesh(smokeGeo, smokeMat.clone());
      m.position.copy(point);
      scene.add(m);
      smokePool.push({
        mesh: m,
        life: 0.85,
        maxLife: 0.85,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * velSpread,
          0.65 + Math.random() * 0.6,
          (Math.random() - 0.5) * velSpread
        )
      });
    }

    interface RailgunKineticProjectile {
      group: THREE.Group;
      slugMesh: THREE.Mesh;
      trailMesh: THREE.Mesh;
      start: THREE.Vector3;
      dir: THREE.Vector3;
      dist: number;
      life: number;
      maxLife: number;
    }
    const railgunProjectiles: RailgunKineticProjectile[] = [];

    function spawnRailgunBeam(start: THREE.Vector3, end: THREE.Vector3) {
      const dist = Math.max(0.5, start.distanceTo(end));
      const dir = end.clone().sub(start).normalize();

      const group = new THREE.Group();

      // Rugged solid silver metallic kinetic slug sabot block cutting through the screen instantly
      const slugGeo = new THREE.BoxGeometry(0.062, 0.062, 1.8);
      const slugMat = new THREE.MeshStandardMaterial({
        color: 0xd8dfe6,
        metalness: 0.96,
        roughness: 0.12,
        emissive: 0x90a2b0,
        emissiveIntensity: 0.35
      });
      const slugMesh = new THREE.Mesh(slugGeo, slugMat);
      slugMesh.position.copy(start);
      slugMesh.lookAt(end);
      group.add(slugMesh);

      // High-velocity shockwave vapor trail dissipating behind the kinetic slug
      const trailGeo = new THREE.CylinderGeometry(0.018, 0.024, dist, 6);
      trailGeo.rotateX(Math.PI / 2);
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0xdde5ee,
        transparent: true,
        opacity: 0.85
      });
      const trailMesh = new THREE.Mesh(trailGeo, trailMat);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      trailMesh.position.copy(mid);
      trailMesh.lookAt(end);
      group.add(trailMesh);

      scene.add(group);
      railgunProjectiles.push({
        group,
        slugMesh,
        trailMesh,
        start: start.clone(),
        dir,
        dist,
        life: 0.22,
        maxLife: 0.22
      });
    }

    // Global Weapon Damage Range Falloff Calculation
    function getDamageRangeFalloff(weaponId: string, distance: number): number {
      // Sniper & Railgun: Zero damage falloff (100% maximum lethal damage across any distance)
      if (weaponId === 'sniper' || weaponId === 'railgun') {
        return 1.0;
      }
      // Pump Shotgun: High base damage close up, but damage aggressively falls off to 0 if target is > 25 units away
      if (weaponId === 'shotgun') {
        if (distance >= 25) return 0.0;
        if (distance <= 8) return 1.0;
        return Math.max(0.0, 1.0 - (distance - 8) / (25 - 8));
      }
      // SMG & Pistol: Steady damage falloff starting after 40 units of distance
      if (weaponId === 'pistol' || weaponId === 'smg') {
        if (distance <= 40) return 1.0;
        const over = distance - 40;
        return Math.max(0.35, 1.0 - (over / 60) * 0.65);
      }
      // AR & Minigun: Steady damage falloff starting after 90 units of distance
      if (weaponId === 'ar' || weaponId === 'minigun') {
        if (distance <= 90) return 1.0;
        const over = distance - 90;
        return Math.max(0.40, 1.0 - (over / 70) * 0.60);
      }
      if (weaponId === 'lmg') {
        if (distance <= 75) return 1.0;
        return Math.max(0.45, 1.0 - ((distance - 75) / 65) * 0.55);
      }
      if (weaponId === 'br') {
        if (distance <= 85) return 1.0;
        return Math.max(0.50, 1.0 - ((distance - 85) / 75) * 0.50);
      }
      if (weaponId === 'laser') {
        if (distance <= 60) return 1.0;
        return Math.max(0.40, 1.0 - ((distance - 60) / 60) * 0.60);
      }
      return 1.0;
    }

    const bots: Bot[] = [];
    const botHealthLayer = document.createElement('div');
    botHealthLayer.style.cssText = 'position:fixed; inset:0; pointer-events:none; z-index:5;';
    document.body.appendChild(botHealthLayer);
    let botIdCounter = 0;

    function addPoints(pts: number) {
      playerPoints += pts;
    }

    function pushKillFeed(msg: string) {
      const feed = containerRef.current?.querySelector('#killfeed');
      if (!feed) return;
      const el = document.createElement('div');
      el.className = 'kill-msg';
      el.textContent = msg;
      feed.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }, 2400);
    }

    function showHitmarker(isHeadshot: boolean) {
      AUDIO.hitmarkerTic.play(1.0);
      const el = containerRef.current?.querySelector('#hitmarker');
      if (!el) return;
      el.classList.toggle('headshot', !!isHeadshot);
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 50);
    }

    function flashVignette() {
      const v = containerRef.current?.querySelector('#vignette');
      if (!v) return;
      v.classList.add('hit');
      setTimeout(() => v.classList.remove('hit'), 90);
    }

    function spawnImpactSpark(point: THREE.Vector3, isBlood = false) {
      if (isBlood) {
        for (let i = 0; i < 6; i++) {
          const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
          const mat = new THREE.MeshBasicMaterial({ color: 0x5a0808 });
          const m = new THREE.Mesh(geo, mat);
          m.position.copy(point);
          scene.add(m);
          sparkPool.push({
            mesh: m,
            life: 0.4 + Math.random() * 0.2,
            vel: new THREE.Vector3(
              (Math.random() - 0.5) * 4,
              Math.random() * 3 + 1,
              (Math.random() - 0.5) * 4
            )
          });
        }
      } else {
        const geo = new THREE.SphereGeometry(0.05, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(point);
        scene.add(m);
        sparkPool.push({ mesh: m, life: 0.15 });
      }
    }

    // Grenade throw (Slot 2 of hard-locked loadout)
    let lastGrenadeThrow = 0;
    function throwGrenade() {
      const ws = playerWeaponState[2];
      if (!ws || (ws.count ?? 0) <= 0) {
        pushKillFeed('NO GRENADES REMAINING');
        return;
      }
      const now = performance.now() / 1000;
      if (now - lastGrenadeThrow < 0.6) return;
      lastGrenadeThrow = now;

      ws.count = (ws.count ?? 1) - 1;
      grenadeThrowSound.play(1.0);
      recoilKick += 0.04;
      recoilPitch += 0.015;

      const origin = camera.position.clone();
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const spawnPos = origin.clone()
        .add(dir.clone().multiplyScalar(0.45))
        .add(right.clone().multiplyScalar(0.14))
        .add(new THREE.Vector3(0, -0.08, 0));

      const gGroup = new THREE.Group();
      const bodyGeo = new THREE.SphereGeometry(0.12, 12, 10);
      bodyGeo.scale(1, 1.25, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2f3d2a, roughness: 0.65, metalness: 0.35 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.castShadow = true;
      gGroup.add(bodyMesh);

      const capMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.06, 8),
        new THREE.MeshStandardMaterial({ color: 0x1f221e, metalness: 0.7, roughness: 0.4 })
      );
      capMesh.position.y = 0.16;
      gGroup.add(capMesh);
      gGroup.position.copy(spawnPos);
      scene.add(gGroup);

      const throwSpeed = player.sprinting ? 22.0 : 18.0;
      const vel = dir.clone().multiplyScalar(throwSpeed);
      vel.y += 3.6;

      activeGrenades.push({
        group: gGroup,
        pos: spawnPos,
        vel,
        radius: 0.14,
        rotAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        rotSpeed: 14 + Math.random() * 8,
        timeAlive: 0,
        maxFuse: 2.7,
        hasHitGround: false,
        ownerTeam: player.team
      });
    }

    function detonateGrenade(pos: THREE.Vector3, ownerTeam: string) {
      const spatialVol = getSpatialVolume(camera.position, pos);
      grenadeExplosionSound.play(spatialVol);
      const distToPlayer = camera.position.distanceTo(pos);
      if (distToPlayer < 24) {
        const shake = (1 - distToPlayer / 24) * 0.12;
        recoilKick += shake * 1.5;
        recoilPitch += shake * 0.6;
      }

      const BLAST_RADIUS = 7.5;
      const MAX_DAMAGE = 130;

      for (const bot of bots) {
        if (!bot.alive) continue;
        if (matchConfig.mode === 'team' && bot.team === ownerTeam) continue;
        if (matchConfig.mode === 'zombie' && bot.team === 'blue' && ownerTeam === 'blue') continue;

        const bDist = bot.pos.distanceTo(pos);
        if (bDist < BLAST_RADIUS) {
          const factor = 1 - (bDist / BLAST_RADIUS);
          const splashDmg = Math.round(MAX_DAMAGE * Math.max(0.2, factor));
          damageBot(bot, splashDmg, false, 'player');
          flashHit(bot);
          showHitmarker(false);
        }
      }

      if (player.alive && (matchConfig.mode === 'ffa' || ownerTeam !== player.team)) {
        const pDist = player.pos.distanceTo(pos);
        if (pDist < BLAST_RADIUS) {
          const pFactor = 1 - (pDist / BLAST_RADIUS);
          const pDmg = Math.round(MAX_DAMAGE * Math.max(0.18, pFactor));
          applyDamageToPlayer(pDmg, false, false, null);
          pushKillFeed('HIT BY EXPLOSION BLAST!');
        }
      }

      const flashSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.95 })
      );
      flashSphere.position.copy(pos);
      scene.add(flashSphere);

      const shockLight = new THREE.PointLight(0xff6611, 4.5, 18);
      shockLight.position.copy(pos);
      shockLight.position.y += 0.5;
      scene.add(shockLight);

      for (let s = 0; s < 10; s++) {
        spawnImpactSpark(
          pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, Math.random() * 1.2, (Math.random() - 0.5) * 1.4))
        );
      }

      explosionEffects.push({
        mesh: flashSphere,
        light: shockLight,
        scale: 0.6,
        life: 0.32
      });
    }

    function flashHit(bot: Bot) {
      bot.flashMats.forEach(m => {
        m.emissive.setHex(0xffffff);
        m.emissiveIntensity = 1;
      });
    }

    function applyDamageToPlayer(amount: number, ignoreShield: boolean, skipFlash: boolean, attackerBot: Bot | null) {
      if (!player.alive) return;
      if (!ignoreShield && player.shield > 0) {
        const absorbed = Math.min(player.shield, amount);
        player.shield -= absorbed;
        amount -= absorbed;
      }
      if (amount > 0) player.health -= amount;
      if (!skipFlash) {
        flashVignette();
        AUDIO.bulletHit.play(1.0);
      }
      if (player.health <= 0) {
        player.health = 0;
        player.alive = false;
        AUDIO.arSpray.stop();

        if (matchConfig.mode === 'team') {
          teamScoreRed++;
          pushKillFeed('YOU WERE ELIMINATED! RED TEAM SCORES');
          checkMatchOutcome();
        } else if (matchConfig.mode === 'zombie') {
          pushKillFeed('YOU HAVE BEEN OVERWHELMED BY THE HORDE!');
          triggerGameOver(false);
        } else {
          if (attackerBot) {
            attackerBot.kills = (attackerBot.kills || 0) + 1;
            pushKillFeed(`YOU WERE ELIMINATED BY BOT #${attackerBot.id}! (${attackerBot.kills}/${matchConfig.targetScore})`);
          } else {
            pushKillFeed('YOU WERE ELIMINATED!');
          }
          checkMatchOutcome();
          if (player.health <= 0 && gameStateRef.current === 'playing') {
            triggerGameOver(false);
          }
        }
      }
    }

    function damageBot(bot: Bot, amount: number, isHeadshot: boolean, attacker: 'player' | Bot) {
      if (!bot.alive) return;
      bot.health -= amount;
      if (bot.health <= 0) {
        bot.health = 0;
        bot.alive = false;
        bot.deathT = 2.2;
        bot.fallAxis = Math.random() < 0.5 ? 'x' : 'z';
        bot.fallDir = Math.random() < 0.5 ? 1 : -1;

        const deathVol = getSpatialVolume(camera.position, bot.pos);
        AUDIO.bulletHit.play(deathVol);

        if (attacker === 'player') {
          player.kills++;
          if (matchConfig.mode === 'zombie') {
            addPoints(100);
            zombiesRemaining--;
            pushKillFeed(isHeadshot ? 'HEADSHOT ELIMINATION! (+ $100)' : 'ZOMBIE KILLED! (+ $100)');
          } else if (matchConfig.mode === 'team') {
            teamScoreBlue++;
            pushKillFeed(isHeadshot ? 'HEADSHOT ELIMINATION! (+1 BLUE)' : 'ELIMINATED ENEMY! (+1 BLUE)');
          } else {
            pushKillFeed(isHeadshot ? `HEADSHOT ELIMINATION! (${player.kills}/${matchConfig.targetScore})` : `ELIMINATED BOT #${bot.id}! (${player.kills}/${matchConfig.targetScore})`);
          }
        } else if (typeof attacker === 'object') {
          attacker.kills = (attacker.kills || 0) + 1;
          if (matchConfig.mode === 'zombie') {
            if (bot.isZombie) {
              zombiesRemaining--;
              pushKillFeed('SURVIVOR ALLY ELIMINATED A ZOMBIE!');
            } else {
              pushKillFeed('A SURVIVOR ALLY HAS FALLEN TO THE HORDE!');
            }
          } else if (matchConfig.mode === 'team') {
            if (attacker.team === 'blue') {
              teamScoreBlue++;
              pushKillFeed('BLUE ALLY ELIMINATED RED COMBATANT');
            } else if (attacker.team === 'red') {
              teamScoreRed++;
              pushKillFeed('RED ENEMY ELIMINATED BLUE COMBATANT');
            }
          }
        }

        if (!bot.isZombie) {
          const droppedAmmo = bot.weaponTypeIndex === 0 ? 30 : (bot.weaponTypeIndex === 1 ? 8 : (bot.weaponTypeIndex === 2 ? 4 : 24));
          world.createGroundPickup(bot.pos.x, bot.pos.z, bot.weaponTypeIndex, droppedAmmo);
        }
        if (Math.random() < 0.25) world.createGroundPickup(bot.pos.x + (Math.random() - 0.5) * 1.5, bot.pos.z + (Math.random() - 0.5) * 1.5, 5, 1);
        if (Math.random() < 0.20) world.createGroundPickup(bot.pos.x + (Math.random() - 0.5) * 1.5, bot.pos.z + (Math.random() - 0.5) * 1.5, 4, 2);

        bot.hitParts.forEach(part => world.unregisterHittable(part));
        checkMatchOutcome();
      }
    }

    function checkMatchOutcome() {
      if (matchConfig.mode === 'zombie') {
        if (zombiesRemaining <= 0 && !waveIntermission) {
          waveIntermission = true;
          intermissionTimer = 5.0;
          addPoints(250);
        }
      } else if (matchConfig.mode === 'team') {
        if (teamScoreBlue >= matchConfig.targetScore) triggerGameOver(true);
        else if (teamScoreRed >= matchConfig.targetScore) triggerGameOver(false);
      } else {
        if (player.kills >= matchConfig.targetScore) {
          triggerGameOver(true);
          return;
        }
        for (const b of bots) {
          if (b.kills >= matchConfig.targetScore) {
            triggerGameOver(false, b);
            return;
          }
        }
      }
    }

    function triggerGameOver(victory: boolean, winningBot: Bot | null = null) {
      AUDIO.arSpray.stop();
      if (document.pointerLockElement) {
        try { document.exitPointerLock?.(); } catch {}
      }

      const tSec = Math.floor(storm.elapsed);
      setStats({
        health: Math.ceil(Math.max(0, player.health)),
        shield: Math.ceil(Math.max(0, player.shield)),
        kills: player.kills,
        funds: playerPoints,
        time: `${String(Math.floor(tSec / 60)).padStart(2, '0')}:${String(tSec % 60).padStart(2, '0')}`,
        wave: currentWave,
        zombies: Math.max(0, zombiesRemaining),
        blueScore: teamScoreBlue,
        redScore: teamScoreRed,
        zoneStatus: matchConfig.mode === 'zombie' ? 'ACTIVE' : (Math.hypot(player.pos.x, player.pos.z) > storm.radius ? 'DANGER' : 'SAFE')
      });

      let subText = '';
      if (matchConfig.mode === 'zombie') {
        subText = `OVERWHELMED ON WAVE ${currentWave}`;
      } else if (matchConfig.mode === 'team') {
        subText = victory ? 'BLUE TEAM HIT SCORE LIMIT FIRST' : 'RED TEAM OUTPERFORMED YOUR SQUAD';
      } else {
        if (victory) subText = 'YOU REACHED THE TARGET SCORE FIRST';
        else if (winningBot) subText = `BOT #${winningBot.id} REACHED ${matchConfig.targetScore} KILLS FIRST`;
        else subText = 'ZONE / OPPONENT ELIMINATED YOU';
      }

      setEndResult({
        victory,
        title: matchConfig.mode === 'zombie' ? 'SURVIVAL TERMINATED' : (victory ? 'VICTORY' : 'DEFEAT'),
        sub: subText
      });
      setGameState('ended');
    }

    // Bot factory
    function makeBot(assignedTeam: string | null = null, zombieTypeOverride: 'walker' | 'runner' | 'tank' | null = null): Bot {
      const p = randomMapPoint(14);
      const y = terrainHeight(p.x, p.z);
      const botId = botIdCounter++;
      const rootGroup = new THREE.Group();

      const isZombie = (matchConfig.mode === 'zombie' && assignedTeam !== 'blue');
      let team = assignedTeam;
      if (isZombie) team = 'zombie';
      else if (matchConfig.mode === 'ffa') team = 'ffa_' + botId;
      else if (!team) team = Math.random() < 0.5 ? 'blue' : 'red';

      let zType: 'walker' | 'runner' | 'tank' = 'walker';
      if (isZombie) {
        if (zombieTypeOverride) zType = zombieTypeOverride;
        else {
          const types: ('walker' | 'runner' | 'tank')[] = ['walker', 'walker', 'runner', 'walker', 'tank'];
          zType = types[(zombieTypeIndex++) % types.length];
        }
      }

      // Weapon types: AR (0), Shotgun (1), Sniper (2), Combat Pistol (3), SMG (4), LMG (5), BR (6)
      const roll = Math.random();
      let weaponTypeIndex = 0;
      if (roll < 0.22) weaponTypeIndex = 0; // AR
      else if (roll < 0.38) weaponTypeIndex = 1; // Shotgun
      else if (roll < 0.50) weaponTypeIndex = 3; // Combat Pistol
      else if (roll < 0.65) weaponTypeIndex = 4; // SMG
      else if (roll < 0.78) weaponTypeIndex = 5; // LMG
      else if (roll < 0.90) weaponTypeIndex = 6; // Battle Rifle
      else weaponTypeIndex = 2; // Sniper
      const weaponType = WEAPONS[weaponTypeIndex].id;

      let vestColor = 0x2a3e2b, helmetColor = 0x384833, shirtColor = 0x334633, pantsColor = 0x272a27, skinColor = 0xd2a482;
      let isMarine = false;

      if (isZombie) {
        if (zType === 'walker') {
          skinColor = 0x5a5c55; shirtColor = 0x3d3935; pantsColor = 0x2b2825; vestColor = 0x3a3d35; helmetColor = 0x4a4d45;
        } else if (zType === 'runner') {
          skinColor = 0x4d423d; shirtColor = 0x2a2220; pantsColor = 0x1f1a18; vestColor = 0x3a2a26; helmetColor = 0x47342e;
        } else {
          skinColor = 0x3a3c3f; shirtColor = 0x252525; pantsColor = 0x1c1c1c; vestColor = 0x2a2a2a; helmetColor = 0x222222;
        }
      } else {
        isMarine = Math.random() < 0.25;
        if (isMarine) {
          skinColor = 0xd2a482; shirtColor = 0x454b29; pantsColor = 0x454b29; vestColor = 0x4b5320; helmetColor = 0x3b4218;
        } else if (matchConfig.mode === 'team' || assignedTeam === 'blue') {
          if (team === 'blue') {
            vestColor = 0x224982; helmetColor = 0x2c61aa; shirtColor = 0x1d3658; pantsColor = 0x1b2430;
          } else {
            vestColor = 0x8a2323; helmetColor = 0xb02e2e; shirtColor = 0x5a1818; pantsColor = 0x2a1a1a;
          }
        }
      }

      const matVest = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.75 });
      const matPouches = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.85 });
      const matShirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
      const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
      const matHelmet = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.65, metalness: 0.2 });
      const matSkin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
      const matGun = new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.5, metalness: 0.5 });

      const flashMats = [matVest, matPouches, matShirt, matPants, matHelmet, matSkin];
      const hitParts: THREE.Mesh[] = [];
      const headParts = new Set<THREE.Mesh>();

      const torsoGroup = new THREE.Group();
      rootGroup.add(torsoGroup);
      if (isZombie && zType === 'runner') torsoGroup.rotation.x = 0.61; // 35 degrees forward lean

      // Kit materials
      const matTacticalHelmet = new THREE.MeshStandardMaterial({
        color: (team === 'blue' ? 0x1f3c5f : (team === 'red' ? 0x6e2222 : 0x273b28)),
        roughness: 0.65,
        metalness: 0.25
      });
      const matSkullMask = new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.7 });
      const matSocketRecess = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 });
      const matHoodFabric = new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.9 });
      const matNvgGlow = new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 2.2, roughness: 0.15 });

      const matInnerCavity = new THREE.MeshStandardMaterial({ color: 0x070303, roughness: 0.95 });
      const matBoneRibs = new THREE.MeshStandardMaterial({ color: 0xd8d3bc, roughness: 0.55 });
      const matZombieEyes = new THREE.MeshStandardMaterial({ color: 0xff0022, emissive: 0xff0022, emissiveIntensity: 2.8, roughness: 0.1 });
      const matZombieSocket = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0 });
      const matZombieClaw = new THREE.MeshStandardMaterial({ color: 0x140808, roughness: 0.4 });

      flashMats.push(
        matTacticalHelmet, matSkullMask, matSocketRecess, matHoodFabric, matNvgGlow,
        matInnerCavity, matBoneRibs, matZombieEyes, matZombieSocket, matZombieClaw
      );

      // Torso Base
      const torsoBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.26), matShirt);
      torsoBase.position.y = 1.16;
      torsoBase.castShadow = true;
      torsoGroup.add(torsoBase);
      hitParts.push(torsoBase);

      if (!isZombie) {
        // TACTICAL CHEST RIGS: Ammunition vest plate with front & side pouches
        const vestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.48, 0.31), matVest);
        vestPlate.position.y = 1.18;
        vestPlate.castShadow = true;
        torsoGroup.add(vestPlate);
        hitParts.push(vestPlate);

        // 3 Mag pouch blocks across front lower torso
        [-0.13, 0, 0.13].forEach(px => {
          const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.14, 0.065), matPouches);
          pouch.position.set(px, 1.07, 0.185);
          pouch.castShadow = true;
          torsoGroup.add(pouch);
          hitParts.push(pouch);
        });

        // Utility / comms gear pouches on sides
        const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.10), matPouches);
        sideL.position.set(-0.28, 1.12, 0.02);
        const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.10), matPouches);
        sideR.position.set(0.28, 1.12, 0.02);
        const chestAdmin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.05), matPouches);
        chestAdmin.position.set(0, 1.28, 0.175);
        torsoGroup.add(sideL, sideR, chestAdmin);
        hitParts.push(sideL, sideR, chestAdmin);
      } else {
        // HOLLOW SHREDDED TORSO & EXPOSED RIB CAGE BLOCKS
        const chestCavity = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.40, 0.09), matInnerCavity);
        chestCavity.position.set(0, 1.18, 0.11);
        torsoGroup.add(chestCavity);

        // Exposed horizontal rib cage bone bars protruding forward through shredded flesh
        [1.06, 1.13, 1.20, 1.27].forEach((ry, idx) => {
          const ribW = idx === 0 || idx === 3 ? 0.24 : 0.30;
          const rib = new THREE.Mesh(new THREE.BoxGeometry(ribW, 0.024, 0.052), matBoneRibs);
          rib.position.set(0, ry, 0.155);
          rib.castShadow = true;
          torsoGroup.add(rib);
          hitParts.push(rib);
        });
      }

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.62, 0);
      torsoGroup.add(headGroup);

      if (!isZombie) {
        // Human Neck Connector
        const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), matSkin);
        neckMesh.position.set(0, -0.08, 0);
        neckMesh.castShadow = true;
        headGroup.add(neckMesh);
        hitParts.push(neckMesh);
        headParts.add(neckMesh);

        // Human Head Base
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), matSkin);
        headMesh.position.y = 0.08;
        headMesh.castShadow = true;
        
        if (isZombie) {
          const numSplatters = 5 + Math.floor(Math.random() * 5);
          for (let i = 0; i < numSplatters; i++) {
            const splat = new THREE.Mesh(
              new THREE.BoxGeometry(0.02 + Math.random() * 0.03, 0.02 + Math.random() * 0.03, 0.01),
              new THREE.MeshBasicMaterial({ color: 0x5a0808 })
            );
            const side = Math.random();
            let x = 0, y = 0, z = 0;
            // Place randomly on the faces of the head block
            if (side < 0.25) { z = 0.125; x = (Math.random() - 0.5) * 0.22; y = (Math.random() - 0.5) * 0.22; }
            else if (side < 0.5) { z = -0.125; x = (Math.random() - 0.5) * 0.22; y = (Math.random() - 0.5) * 0.22; }
            else if (side < 0.75) { x = 0.125; z = (Math.random() - 0.5) * 0.22; y = (Math.random() - 0.5) * 0.22; }
            else { x = -0.125; z = (Math.random() - 0.5) * 0.22; y = (Math.random() - 0.5) * 0.22; }
            splat.position.set(x, y + 0.08, z);
            // Rotate slightly for organic look
            splat.rotation.z = Math.random() * Math.PI;
            headGroup.add(splat);
          }
        }
        
        headGroup.add(headMesh);
        hitParts.push(headMesh);
        headParts.add(headMesh);

        // TACTICAL HELMETS: Separate FAST-helmet box mesh wrapped over top of head
        const helmetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.29), matTacticalHelmet);
        helmetMesh.position.set(0, 0.17, -0.01);
        helmetMesh.castShadow = true;
        headGroup.add(helmetMesh);
        hitParts.push(helmetMesh);
        headParts.add(helmetMesh);

        // Protruding front sun-visor brim
        const visorBrim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.024, 0.08), matTacticalHelmet);
        visorBrim.position.set(0, 0.13, 0.16);
        visorBrim.rotation.x = 0.16;
        headGroup.add(visorBrim);
        hitParts.push(visorBrim);
        headParts.add(visorBrim);

        // Tiny side radio headset blocks
        const earcupL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.07), matPouches);
        earcupL.position.set(-0.15, 0.08, 0);
        const earcupR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.07), matPouches);
        earcupR.position.set(0.15, 0.08, 0);
        const micBoom = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.12), matGun);
        micBoom.position.set(-0.13, 0.03, 0.07);
        micBoom.rotation.y = 0.35;
        headGroup.add(earcupL, earcupR, micBoom);

        const isAssaultOrInfiltrator = weaponTypeIndex === 0 || weaponTypeIndex === 4 || weaponTypeIndex === 6 || Math.random() < 0.5;
        if (isAssaultOrInfiltrator) {
          // NIGHT VISION LENSES: 3D quad-lens NVG mount extending forward with glowing neon-green circular lenses
          const nvgGroup = new THREE.Group();
          nvgGroup.position.set(0, 0.16, 0.15);
          const nvgMountArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.08), matPouches);
          nvgMountArm.position.set(0, 0.01, 0.03);
          const nvgBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.028), matPouches);
          nvgBar.position.set(0, -0.01, 0.07);
          nvgGroup.add(nvgMountArm, nvgBar);

          [-0.065, -0.022, 0.022, 0.065].forEach(lx => {
            const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8), matNvgGlow);
            lens.rotation.x = Math.PI / 2;
            lens.position.set(lx, -0.01, 0.085);
            nvgGroup.add(lens);
            hitParts.push(lens);
            headParts.add(lens);
          });
          headGroup.add(nvgGroup);
        }

        const isGhost = weaponTypeIndex === 2 || (!isAssaultOrInfiltrator && Math.random() < 0.7) || Math.random() < 0.35;
        if (isGhost) {
          // GHOST OPERATOR SKULL MASK: 3D overlay plate jutting forward with dark hollow eye socket recesses
          const skullPlate = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.19, 0.05), matSkullMask);
          skullPlate.position.set(0, 0.05, 0.14);
          
          const jawRidge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.05), matSkullMask);
          jawRidge.position.set(0, -0.02, 0.15);
          
          const eyeSocketL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.03), matSocketRecess);
          eyeSocketL.position.set(-0.06, 0.09, 0.155);
          const eyeSocketR = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.03), matSocketRecess);
          eyeSocketR.position.set(0.06, 0.09, 0.155);
          const noseSocket = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.035, 0.03), matSocketRecess);
          noseSocket.position.set(0, 0.04, 0.155);
          const teethJaw = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.03), matSocketRecess);
          teethJaw.position.set(0, -0.015, 0.165);
          headGroup.add(skullPlate, jawRidge, eyeSocketL, eyeSocketR, noseSocket, teethJaw);
          hitParts.push(skullPlate, jawRidge);
          headParts.add(skullPlate);
          headParts.add(jawRidge);

          // Draping fabric block behind head for tactical hood
          const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.28, 0.14), matHoodFabric);
          hoodBack.position.set(0, 0.07, -0.08);
          const hoodCollar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.22), matHoodFabric);
          hoodCollar.position.set(0, -0.05, 0);
          headGroup.add(hoodBack, hoodCollar);
          hitParts.push(hoodBack);
          headParts.add(hoodBack);
        }
      } else {
        // HOLLOW SHREDDED ZOMBIE FACE & GLOWING HOLLOW EYE SOCKETS
        // Upper skull
        const skullTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), matSkin);
        skullTop.position.y = 0.13;
        skullTop.castShadow = true;
        headGroup.add(skullTop);
        hitParts.push(skullTop);
        headParts.add(skullTop);

        // Recessed dark grey secondary box layer inside skull creating optical screaming maw
        const innerMawBox = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.18), matInnerCavity);
        innerMawBox.position.set(0, 0.03, 0.02);
        headGroup.add(innerMawBox);

        // Torn-open screaming jawline dropped down and angled
        const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.20), matSkin);
        lowerJaw.position.set(0, -0.06, 0.06);
        lowerJaw.rotation.x = 0.38;
        headGroup.add(lowerJaw);
        hitParts.push(lowerJaw);
        headParts.add(lowerJaw);

        // Jagged teeth lining maw
        const upperTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.03), matBoneRibs);
        upperTeeth.position.set(0, 0.06, 0.115);
        const lowerTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.03), matBoneRibs);
        lowerTeeth.position.set(0, -0.025, 0.115);
        headGroup.add(upperTeeth, lowerTeeth);

        // GLOWING HOLLOW EYE SOCKETS: Two tiny hollowed-out black square gaps embedded with micro-glowing crimson red pixels
        const socketL = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.048, 0.035), matZombieSocket);
        socketL.position.set(-0.055, 0.11, 0.125);
        const socketR = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.048, 0.035), matZombieSocket);
        socketR.position.set(0.055, 0.11, 0.125);
        headGroup.add(socketL, socketR);

        const crimsonPixelL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.025), matZombieEyes);
        crimsonPixelL.position.set(-0.055, 0.11, 0.136);
        const crimsonPixelR = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.025), matZombieEyes);
        crimsonPixelR.position.set(0.055, 0.11, 0.136);
        headGroup.add(crimsonPixelL, crimsonPixelR);
      }

      // ARMS SETUP
      const armLPivot = new THREE.Group();
      armLPivot.position.set(-0.33, 1.42, 0);
      torsoGroup.add(armLPivot);

      const armRPivot = new THREE.Group();
      armRPivot.position.set(0.33, 1.42, 0);
      torsoGroup.add(armRPivot);

      if (!isZombie) {
        // Standard human arms
        const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.15), matShirt);
        armLMesh.position.set(0, -0.27, 0);
        armLMesh.castShadow = true;
        armLPivot.add(armLMesh);
        hitParts.push(armLMesh);

        const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.15), matShirt);
        armRMesh.position.set(0, -0.27, 0);
        armRMesh.castShadow = true;
        armRPivot.add(armRMesh);
        hitParts.push(armRMesh);
      } else {
        // ASYMMETRICAL MUTATIONS: One arm withered, the other arm twice as long, jagged, and bent like broken bone
        const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.13), matSkin);
        armLMesh.position.set(0, -0.20, 0);
        armLMesh.castShadow = true;
        armLPivot.add(armLMesh);
        hitParts.push(armLMesh);

        // Mutated compound right arm (twice as long!)
        const armRUpper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.16), matSkin);
        armRUpper.position.set(0, -0.21, 0);
        armRUpper.castShadow = true;
        armRPivot.add(armRUpper);
        hitParts.push(armRUpper);

        // Jagged bone fracture spur protruding from elbow
        const boneSpur = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.05), matBoneRibs);
        boneSpur.position.set(0.08, -0.40, 0);
        boneSpur.rotation.z = -0.6;
        armRPivot.add(boneSpur);
        hitParts.push(boneSpur);

        // Jagged elongated forearm bent downward like broken bone structure
        const armRForearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.14), matSkin);
        armRForearm.position.set(0.06, -0.66, 0.06);
        armRForearm.rotation.z = -0.22;
        armRForearm.rotation.x = -0.32;
        armRForearm.castShadow = true;
        armRPivot.add(armRForearm);
        hitParts.push(armRForearm);

        // Mutated clawed hand with sharp talons
        const clawHand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), matSkin);
        clawHand.position.set(0.08, -0.98, 0.10);
        const talon1 = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.14, 0.024), matZombieClaw);
        talon1.position.set(0.05, -1.10, 0.08);
        const talon2 = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.14, 0.024), matZombieClaw);
        talon2.position.set(0.11, -1.10, 0.12);
        armRPivot.add(clawHand, talon1, talon2);
        hitParts.push(clawHand);
      }

      let gunMeshRef: THREE.Group | null = null;
      let muzzleFlashRef: THREE.Sprite | null = null;

      if (!isZombie) {
        armRPivot.rotation.set(-0.45, -0.15, 0);
        const gGun = new THREE.Group();
        const barrelLen = weaponType === 'shotgun' ? 0.26 : (weaponType === 'sniper' ? 0.58 : (weaponType === 'pistol' ? 0.18 : 0.32));
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, weaponType === 'pistol' ? 0.22 : 0.32), matGun);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, barrelLen, 6), matGun);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.015, barrelLen / 2 + 0.14);
        gGun.add(receiver, barrel);

        gGun.position.set(0, -0.48, 0.22);
        gGun.rotation.x = 0.45;
        armRPivot.add(gGun);
        gunMeshRef = gGun;

        const muzzleFlash = makeFlashSprite(true);
        muzzleFlash.position.set(0, 0.015, barrelLen + 0.16);
        gGun.add(muzzleFlash);
        muzzleFlashRef = muzzleFlash;
      } else {
        armLPivot.rotation.set(-1.35, 0.12, 0);
        armRPivot.rotation.set(-1.35, -0.12, 0);
      }

      const legLPivot = new THREE.Group();
      legLPivot.position.set(-0.14, 0.88, 0);
      rootGroup.add(legLPivot);
      const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.86, 0.2), matPants);
      legLMesh.position.set(0, -0.43, 0);
      legLMesh.castShadow = true;
      legLPivot.add(legLMesh);
      hitParts.push(legLMesh);

      const legRPivot = new THREE.Group();
      legRPivot.position.set(0.14, 0.88, 0);
      rootGroup.add(legRPivot);
      const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.86, 0.2), matPants);
      legRMesh.position.set(0, -0.43, 0);
      legRPivot.add(legRMesh);
      hitParts.push(legRMesh);

      if (isZombie && zType === 'tank') {
        rootGroup.scale.set(1.8, 1.8, 1.8);
      }

      rootGroup.position.set(p.x, y, p.z);
      scene.add(rootGroup);

      const healthEl = document.createElement('div');
      healthEl.className = 'panel';
      healthEl.style.cssText = 'position:absolute; width:54px; height:6px; padding:0; transform:translate(-50%,-100%); overflow:hidden; display:none;';
      const fillEl = document.createElement('div');
      let barGradient = 'linear-gradient(90deg, #5a2320, #e0473f)';
      if (team === 'blue') barGradient = 'linear-gradient(90deg, #1f4e79, #3f8fe0)';
      else if (isZombie) barGradient = zType === 'tank' ? 'linear-gradient(90deg, #2b1616, #b71c1c)' : 'linear-gradient(90deg, #1b5e20, #4caf50)';
      fillEl.style.cssText = `height:100%; width:100%; background:${barGradient}; transition:width 0.1s ease-out;`;
      healthEl.appendChild(fillEl);
      botHealthLayer.appendChild(healthEl);

      let baseHealth = BOT_BASE_HEALTH * currentDifficulty.botHealthMult;
      let moveSpeed = 3.6 + Math.random() * 1.2;
      let meleeDmg = 16 * currentDifficulty.botDamageMult;

      if (isZombie) {
        const waveScale = Math.pow(1.18, Math.max(0, currentWave - 1));
        const speedScale = 1 + Math.min(0.75, (currentWave - 1) * 0.05);
        if (zType === 'walker') {
          baseHealth = 85 * waveScale;
          moveSpeed = (3.8 + Math.random() * 0.6) * speedScale;
          meleeDmg = 16;
        } else if (zType === 'runner') {
          baseHealth = 48 * waveScale;
          moveSpeed = (6.8 + Math.random() * 1.1) * speedScale;
          meleeDmg = 12;
        } else {
          baseHealth = 290 * waveScale;
          moveSpeed = (2.4 + Math.random() * 0.3) * speedScale;
          meleeDmg = 34;
        }
      }

      const bot: Bot = {
        id: botId,
        team,
        isZombie,
        zType,
        kills: 0,
        meleeDmg,
        meleeCooldown: 0,
        group: rootGroup,
        torsoGroup,
        armLPivot,
        armRPivot,
        legLPivot,
        legRPivot,
        gunMesh: gunMeshRef,
        muzzleFlash: muzzleFlashRef,
        muzzleFlashT: 0,
        weaponTypeIndex,
        weaponType,
        flashMats,
        hitParts,
        healthEl,
        fillEl,
        pos: new THREE.Vector3(p.x, y, p.z),
        vel: new THREE.Vector3(0, 0, 0),
        facing: 0,
        health: baseHealth,
        maxHealth: baseHealth,
        speed: moveSpeed,
        walkPhase: Math.random() * Math.PI * 2,
        preferredRange: isZombie ? 0.8 : (weaponType === 'shotgun' ? 7 : (weaponType === 'sniper' ? 24 : (weaponType === 'pistol' ? 9 : 13))),
        strafeDir: Math.random() < 0.5 ? 1 : -1,
        strafeTimer: 1 + Math.random() * 2,
        target: null,
        waypoint: null,
        waypointTimer: 0,
        fireTimer: 0.5 + Math.random() * 1.0,
        alive: true,
        deathT: 0,
        fallAxis: 'x',
        fallDir: 1
      };

      hitParts.forEach(part => {
        const isHead = headParts.has(part);
        part.userData = { type: 'botpart', part: isHead ? 'head' : 'body', ref: bot };
        world.registerHittable(part);
      });

      bots.push(bot);
      return bot;
    }

    function removeBot(bot: Bot) {
      scene.remove(bot.group);
      bot.healthEl.remove();
      const i = bots.indexOf(bot);
      if (i >= 0) bots.splice(i, 1);
    }

    function clearMatchEntities() {
      for (const b of [...bots]) removeBot(b);
      for (const g of activeGrenades) scene.remove(g.group);
      activeGrenades.length = 0;
      for (const fx of explosionEffects) {
        scene.remove(fx.mesh);
        if (fx.light) scene.remove(fx.light);
      }
      explosionEffects.length = 0;
      const banner = containerRef.current?.querySelector('#wave-banner') as HTMLElement | null;
      if (banner) banner.style.display = 'none';
    }

    function startNextZombieWave(waveNum: number) {
      currentWave = waveNum;
      const banner = containerRef.current?.querySelector('#wave-banner') as HTMLElement | null;
      const bannerTitle = containerRef.current?.querySelector('#wave-banner-title');
      const bannerSub = containerRef.current?.querySelector('#wave-banner-sub');
      if (banner && bannerTitle && bannerSub) {
        banner.style.display = 'block';
        bannerTitle.textContent = `WAVE ${currentWave}`;
        bannerSub.textContent = `SURVIVE THE HORDE`;
        setTimeout(() => { if (!waveIntermission) banner.style.display = 'none'; }, 2400);
      }

      const count = Math.floor(matchConfig.enemyCount * Math.pow(1.25, currentWave - 1) + currentWave * 2);
      zombiesRemaining = count;
      for (let i = 0; i < count; i++) {
        makeBot(null);
      }
    }

    function initMatch() {
      clearMatchEntities();
      teamScoreBlue = 0;
      teamScoreRed = 0;
      player.kills = 0;
      playerPoints = 0;

      // Apply selected Battlefront-style class configuration and stat overrides
      const activeClass = CLASSES[selectedClassIdRef.current] || CLASSES.assault;
      player.health = activeClass.initialHealth;
      player.maxHealth = activeClass.maxHealth;
      player.shield = activeClass.initialShield;
      player.maxShield = activeClass.maxShield;
      player.classReloadMultiplier = activeClass.reloadMultiplier;
      player.classSpeedMultiplier = activeClass.speedMultiplier;

      player.pos.set(0, terrainHeight(0, 0) + PLAYER_EYE, 0);
      player.vel.set(0, 0, 0);
      player.yaw = 0;
      player.pitch = 0;
      player.alive = true;
      player.aiming = false;
      player.isDrinking = false;
      player.team = (matchConfig.mode === 'team' || matchConfig.mode === 'zombie') ? 'blue' : 'player';

      // Initialize strictly isolated 3-slot loadout (Primary, Secondary, Grenades)
      setupPlayerLoadout();
      pushKillFeed(`DEPLOYED: ${activeClass.name.toUpperCase()} [${activeClass.perkName}]`);

      storm.elapsed = 0;
      storm.radius = (matchConfig.mode === 'zombie') ? 9999 : STORM_START_R;
      storm.finished = false;

      if (matchConfig.mode === 'zombie') {
        for (let i = 0; i < matchConfig.friendlyCount; i++) makeBot('blue');
        waveIntermission = false;
        currentWave = matchConfig.startingWave || 1;
        startNextZombieWave(currentWave);
      } else if (matchConfig.mode === 'team') {
        for (let i = 0; i < matchConfig.friendlyCount; i++) makeBot('blue');
        for (let i = 0; i < matchConfig.enemyCount; i++) makeBot('red');
      } else {
        for (let i = 0; i < matchConfig.enemyCount; i++) makeBot();
      }
    }

    // Weapons firing and reload: hard-locked to active 3-slot loadout
    function currentSlot(): WeaponDef { return playerLoadout[player.slotIndex] || playerLoadout[0] || WEAPONS[0]; }
    function currentSlotState(): WeaponSlotState { return playerWeaponState[player.slotIndex] || playerWeaponState[0] || { ammo: 30, reserve: 90 }; }

    function fireWeapon() {
      const w = currentSlot();
      if (w.type === 'consumable') {
        const ws = currentSlotState();
        if ((ws.count ?? 0) <= 0) return;
        if (player.isDrinking) return;

        if (w.id === 'mini') {
          if (player.shield >= 50) {
            pushKillFeed('SHIELD ALREADY AT MAX CAP FOR MINIS (50)');
            return;
          }
          player.isDrinking = true;
          player.drinkTimer = 2.0;
          AUDIO.miniDrink.play(1.0);
          pushKillFeed('DRINKING MINI SHIELD...');
        } else if (w.id === 'medkit') {
          if (player.health >= player.maxHealth && player.shield >= player.maxShield) {
            pushKillFeed('HEALTH AND SHIELD ALREADY FULL');
            return;
          }
          player.isDrinking = true;
          player.drinkTimer = 3.0;
          AUDIO.miniDrink.play(1.0); // using the same sound for simplicity or if they added one
          pushKillFeed('APPLYING TACTICAL HEAL...');
        }
        return;
      }
      if (w.type === 'grenade') {
        throwGrenade();
        return;
      }

      // Minigun and Railgun have distinct state-driven firing loops (spin warmup & charge sequence)
      if (w.id === 'minigun' || w.id === 'railgun') {
        return;
      }

      const ws = currentSlotState();
      if (ws.reloading) return;

      // Laser gun heat & overheat check
      if (w.id === 'laser') {
        if (ws.overheated) return;
      }

      const now = performance.now() / 1000;
      if (now - (ws.lastFired ?? 0) < (w.fireRate ?? 0.2)) return;

      if (w.id !== 'laser' && (ws.ammo ?? 0) <= 0) {
        reloadWeapon();
        return;
      }

      ws.lastFired = now;
      if (w.id !== 'laser') {
        ws.ammo = (ws.ammo ?? 1) - 1;
      }
      player.continuousShots++;

      // Weapon specific recoil & sound execution
      if (w.id === 'pistol') {
        // Combat Pistol: slide recoil + crisp shot
        vmManager.triggerPistolSlideFire();
        vmManager.addRecoil(0.045, 0.055);
        AUDIO.pistolShot.play(1.0, true);
      } else if (w.id === 'smg') {
        // SMG: rapid bolt cycle + smg fire sound
        vmManager.triggerSmgBoltFire();
        vmManager.addRecoil(0.038, 0.045);
        AUDIO.smgFire.play(1.0, true);
      } else if (w.id === 'lmg') {
        // Heavy LMG: high recoil + heavy shot sound
        vmManager.addRecoil(0.052, 0.062);
        AUDIO.lmgFire.play(1.0, true);
      } else if (w.id === 'br') {
        // Battle Rifle: tight burst recoil + burst sound
        vmManager.addRecoil(0.038, 0.044);
        AUDIO.brBurst.play(1.0, true);
        ws.burstRemaining = (w.burstCount ?? 3) - 1;
        ws.burstTimer = w.burstRate ?? 0.075;
      } else if (w.id === 'laser') {
        // Covenant Laser Gun: plasma hum/beam + heat accumulation
        vmManager.addRecoil(0.016, 0.022);
        AUDIO.laserBeam.playContinuous(1.0);
        ws.heat = Math.min(100, (ws.heat ?? 0) + 1.9);
        if (ws.heat >= 100) {
          ws.heat = 100;
          ws.overheated = true;
          AUDIO.laserBeam.stop();
          laserBeamMesh.visible = false;
          AUDIO.laserVent.play(1.0);
          reloadWeapon();
        }
      } else if (w.id === 'sniper') {
        vmManager.addRecoil(0.09, 0.12);
        AUDIO.sniperShot.play(1.0, true);
      } else if (w.id === 'shotgun') {
        vmManager.addRecoil(0.075, 0.095);
        vmManager.triggerShotgunPump();
        AUDIO.shotgunShot.play(1.0, true);
      } else {
        vmManager.addRecoil(0.038, 0.045);
        if (player.continuousShots <= 1) AUDIO.arSingle.play(1.0, true);
        else AUDIO.arSpray.playContinuous(1.0);
      }

      recoilKick += (w.kick ?? 0.02) * 1.5;
      recoilPitch += (w.kick ?? 0.02);
      triggerPlayerFlash();

      const spread = player.aiming ? (w.adsSpread ?? 0.01) : (w.spread ?? 0.02);
      const pellets = w.pellets ?? 1;
      for (let p = 0; p < pellets; p++) {
        const ndcX = (Math.random() - 0.5) * spread * 2;
        const ndcY = (Math.random() - 0.5) * spread * 2;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        raycaster.far = w.range ?? 100;
        const hits = raycaster.intersectObjects(world.hittableObjects, false);
        if (hits.length > 0) {
          const hit = hits[0];
          const ud = hit.object.userData;
          spawnImpactSpark(hit.point, ud.type === 'botpart');
          if (ud.type === 'botpart' && ud.ref) {
            const bot = ud.ref as Bot;
            if (matchConfig.mode === 'team' && bot.team === player.team) continue;
            if (matchConfig.mode === 'zombie' && bot.team === 'blue') continue;

            const dist = camera.position.distanceTo(hit.point);
            const falloff = getDamageRangeFalloff(w.id, dist);
            if (falloff <= 0) continue;

            const isHead = ud.part === 'head';
            let finalDamage = (w.damage ?? 25) * falloff;
            if (isHead) finalDamage *= (w.headshotMult ?? 2.0);

            damageBot(bot, finalDamage, isHead, 'player');
            flashHit(bot);
            showHitmarker(isHead);
            if (bot.isZombie) addPoints(10);
            if (['sniper', 'laser', 'lmg', 'minigun'].includes(w.id)) { const d = camera.position.distanceTo(hit.point); const v = Math.max(0, 1.0 - d / 50); AUDIO.bulletHit.play(v); }
          }
        }
      }
    }

    // Heavy Minigun firing logic: high rate of fire with distance falloff
    function fireMinigunBullet() {
      const w = currentSlot();
      if (w.id !== 'minigun') return;
      const ws = currentSlotState();
      if (ws.overheated) return;

      const now = performance.now() / 1000;
      if (now - (ws.lastFired ?? 0) < (w.fireRate ?? 0.045)) return;
      ws.lastFired = now;

      player.continuousShots++;
      vmManager.addRecoil(0.012, 0.016);
      recoilKick += 0.007;
      recoilPitch += (Math.random() - 0.48) * 0.006;
      triggerPlayerFlash();

      playMinigunFireShot(1.0);
      AUDIO.minigunFire.playContinuous(1.0);

      const spread = player.aiming ? (w.adsSpread ?? 0.024) : (w.spread ?? 0.034);
      const ndcX = (Math.random() - 0.5) * spread * 2;
      const ndcY = (Math.random() - 0.5) * spread * 2;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      raycaster.far = w.range ?? 160;
      const hits = raycaster.intersectObjects(world.hittableObjects, false);
      if (hits.length > 0) {
        const hit = hits[0];
        const ud = hit.object.userData;
        spawnImpactSpark(hit.point, ud.type === 'botpart');
        if (ud.type === 'botpart' && ud.ref) {
          const bot = ud.ref as Bot;
          if (matchConfig.mode === 'team' && bot.team === player.team) return;
          if (matchConfig.mode === 'zombie' && bot.team === 'blue') return;

          const dist = camera.position.distanceTo(hit.point);
          const falloff = getDamageRangeFalloff('minigun', dist);
          if (falloff <= 0) return;

          const isHead = ud.part === 'head';
          let finalDamage = (w.damage ?? 16) * falloff;
          if (isHead) finalDamage *= (w.headshotMult ?? 1.8);

          damageBot(bot, finalDamage, isHead, 'player');
          flashHit(bot);
          showHitmarker(isHead);
          if (bot.isZombie) addPoints(10);
          if (['sniper', 'laser', 'lmg', 'minigun'].includes(w.id)) { const d = camera.position.distanceTo(hit.point); const v = Math.max(0, 1.0 - d / 50); AUDIO.bulletHit.play(v); }
        }
      }
    }

    // Tactical Railgun Slug: Pierces solid building walls and doors, zero distance falloff
    function fireRailgunSlug() {
      const w = currentSlot();
      if (w.id !== 'railgun') return;
      const ws = currentSlotState();

      ws.lastFired = performance.now() / 1000;
      vmManager.addRecoil(0.12, 0.16);
      recoilKick += 0.08;
      recoilPitch += 0.055;
      triggerPlayerFlash();

      playRailgunSlugBlast();
      AUDIO.railgunFire.play(1.0, true);

      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const raycaster = new THREE.Raycaster(camera.position, dir, 0.1, w.range ?? 500);
      const allHits = raycaster.intersectObjects(world.hittableObjects, false);

      // Compute muzzle origin for beam visual
      const origin = camera.position.clone();
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const muzzlePt = origin.clone()
        .add(dir.clone().multiplyScalar(0.42))
        .add(right.clone().multiplyScalar(0.16))
        .add(new THREE.Vector3(0, -0.09, 0));

      let endPt = origin.clone().add(dir.clone().multiplyScalar(w.range ?? 300));
      if (allHits.length > 0) {
        endPt = allHits[allHits.length - 1].point.clone().add(dir.clone().multiplyScalar(2.5));
      }
      spawnRailgunBeam(muzzlePt, endPt);

      // Pierce Physics: pierce through solid building walls and doors, dealing full lethal damage with NO falloff
      const hitBotIds = new Set<number>();
      for (const hit of allHits) {
        const ud = hit.object.userData;
        spawnImpactSpark(hit.point, ud.type === 'botpart');

        if (ud.type === 'botpart' && ud.ref) {
          const bot = ud.ref as Bot;
          if (hitBotIds.has(bot.id)) continue;
          hitBotIds.add(bot.id);

          if (matchConfig.mode === 'team' && bot.team === player.team) continue;
          if (matchConfig.mode === 'zombie' && bot.team === 'blue') continue;

          // Railgun has ZERO falloff: 100% full lethal damage across any distance
          const dist = camera.position.distanceTo(hit.point);
          const falloff = getDamageRangeFalloff('railgun', dist); // 1.0
          const isHead = ud.part === 'head';
          let finalDamage = (w.damage ?? 160) * falloff;
          if (isHead) finalDamage *= (w.headshotMult ?? 2.5);

          damageBot(bot, finalDamage, isHead, 'player');
          flashHit(bot);
          showHitmarker(isHead);
          if (bot.isZombie) addPoints(25);
          if (['sniper', 'laser', 'lmg', 'minigun'].includes(w.id)) { const d = camera.position.distanceTo(hit.point); const v = Math.max(0, 1.0 - d / 50); AUDIO.bulletHit.play(v); }
          pushKillFeed(isHead ? 'RAILGUN HEADSHOT COVER PIERCE!' : 'RAILGUN SOLID COVER PIERCE HIT!');
        }
      }
    }

    function reloadWeapon() {
      const w = currentSlot();
      if (w.type !== 'weapon') return;
      const ws = currentSlotState();

      // Minigun manual overheat vent
      if (w.id === 'minigun') {
        if (ws.overheated || (ws.heat ?? 0) <= 0) return;
        ws.overheated = true;
        ws.ventTimer = 2.0;
        ws.spinWarmup = 0;
        ws.spinSpeed = 0;
        AUDIO.minigunFire.stop();
        updateMinigunSpinAudio(false, 0);
        playMinigunVentHiss();
        AUDIO.minigunOverheat.play(1.0);
        pushKillFeed('MANUAL VENTING MINIGUN CORES...');
        return;
      }

      // Laser gun venting reload
      if (w.id === 'laser') {
        if (ws.reloading || (ws.heat ?? 0) <= 0) return;
        ws.reloading = true;
        AUDIO.laserBeam.stop();
        laserBeamMesh.visible = false;
        
        ws.heat = 0;
        ws.overheated = false;

        const reloadDur = (w.reloadTime ?? 2.2) * player.classReloadMultiplier;
        ws.reloadT = reloadDur;
        ws.totalReloadT = reloadDur;
        AUDIO.laserVent.play(1.0);
        
        for (let s = 0; s < 12; s++) {
          const pt = new THREE.Vector3(0, 0, -0.6);
          pt.applyMatrix4(vmManager.weaponGroup.matrixWorld);
          const sm = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.02, 0.02),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
          );
          sm.position.copy(pt);
          const vel = new THREE.Vector3((Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5 - 2);
          vel.applyQuaternion(camera.quaternion);
          smokePool.push({ mesh: sm, life: 0.3 + Math.random()*0.3, maxLife: 0.6, vel });
          scene.add(sm);
        }
        return;
      }

      if (ws.reloading || ws.ammo === w.mag || (ws.reserve ?? 0) <= 0) return;

      ws.reloading = true;
      
      const isTactical = (ws.ammo ?? 0) > 0;
      ws.isTacticalReload = isTactical;
      
      AUDIO.arSpray.stop();
      AUDIO.laserBeam.stop();
      AUDIO.minigunFire.stop();
      laserBeamMesh.visible = false;
      player.continuousShots = 0;

      let reloadDur = (w.reloadTime ?? 2.4) * player.classReloadMultiplier;
      if (!isTactical && ['pistol', 'smg', 'ar', 'lmg', 'br'].includes(w.id)) {
        reloadDur *= 1.4; // 40% slower empty reload
      }
      ws.reloadT = reloadDur;
      ws.totalReloadT = reloadDur;

      if (['pistol', 'smg', 'ar', 'lmg', 'br'].includes(w.id)) {
        if (isTactical) AUDIO.reloadTactical.play(1.0);
        else AUDIO.reloadEmpty.play(1.0);
      } else if (w.id === 'shotgun') {
        setTimeout(() => {
          if (player.alive && currentSlot().id === 'shotgun' && ws.reloading) {
            AUDIO.shotgunReload.play(1.0);
          }
        }, 150);
      } else if (w.id === 'sniper') {
        AUDIO.sniperReload.play(1.0);
      } else if (w.id === 'smg') {
        AUDIO.smgReload.play(1.0);
      } else if (w.id === 'lmg') {
        AUDIO.lmgReload.play(1.0);
      } else if (w.id === 'br') {
        AUDIO.brReload.play(1.0);
      } else if (w.id === 'railgun') {
        AUDIO.sniperReload.play(1.0);
      }
    }

    function switchSlot(index: number) {
      if (index < 0 || index > 3) return; // Strictly truncated: only index 0, 1, 2
      if (player.slotIndex !== index) {
        AUDIO.arSpray.stop();
        AUDIO.laserBeam.stop();
        AUDIO.minigunFire.stop();
        AUDIO.minigunWindup.stop();
        AUDIO.railgunCharge.stop();
        updateMinigunSpinAudio(false, 0);
        updateRailgunChargeAudio(false, 0);
        laserBeamMesh.visible = false;
        player.continuousShots = 0;
        player.isDrinking = false;
        AUDIO.arReload.stop();
        AUDIO.shotgunReload.stop();
        AUDIO.sniperReload.stop();
        AUDIO.pistolReload.stop();
        AUDIO.smgReload.stop();
        AUDIO.lmgReload.stop();
        AUDIO.brReload.stop();
        AUDIO.laserVent.stop();
        const oldWs = playerWeaponState[player.slotIndex];
        if (oldWs) {
          if (oldWs.reloading !== undefined) oldWs.reloading = false;
          oldWs.charging = false;
          oldWs.chargeTimer = 0;
          oldWs.spinWarmup = 0;
        }
        vmManager.setRailgunChargeProgress(0);
        player.slotIndex = index;
      }
    }

    // Safe pointer lock helper that catches permission errors in iframes
    const requestGamePointerLock = () => {
      try {
        const p = renderer.domElement.requestPointerLock?.();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            // Pointer lock rejected or not supported in current iframe context
          });
        }
      } catch {
        // Fallback
      }
    };

    // Input listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;

      // Escape or P to toggle pause menu cleanly
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
          AUDIO.arSpray.stop();
          player.continuousShots = 0;
          if (document.pointerLockElement) {
            try { document.exitPointerLock?.(); } catch {}
          }
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
          requestGamePointerLock();
        }
        return;
      }

      if (gameStateRef.current !== 'playing') return;
      if (e.code === 'ShiftLeft') player.aiming = true;
      if (e.code === 'ControlLeft') player.crouching = true;
      if (e.code === 'Space' && player.onGround) player.vel.y = JUMP_SPEED;
      if (e.code === 'KeyR') reloadWeapon();
      if (e.code === 'KeyG') throwGrenade();
      if (e.code === 'KeyF') {
        // Melee punch
        if (player.isMeleeing || !player.alive) return;
        player.isMeleeing = true;
        player.meleeTimer = 0.28;
        const arm = containerRef.current?.querySelector('#melee-arm');
        arm?.classList.add('punch');
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        raycaster.far = 2.8;
        const hits = raycaster.intersectObjects(world.hittableObjects, false);
        if (hits.length > 0) {
          const hit = hits[0];
          const ud = hit.object.userData;
          spawnImpactSpark(hit.point, ud.type === 'botpart');
          if (ud.type === 'botpart' && ud.ref) {
            const bot = ud.ref as Bot;
            if (matchConfig.mode === 'team' && bot.team === player.team) return;
            if (matchConfig.mode === 'zombie' && bot.team === 'blue') return;
            damageBot(bot, 45, false, 'player');
            flashHit(bot);
            showHitmarker(false);
            if (['sniper', 'laser', 'lmg', 'minigun'].includes(w.id)) { const d = camera.position.distanceTo(hit.point); const v = Math.max(0, 1.0 - d / 50); AUDIO.bulletHit.play(v); }
            if (bot.isZombie) addPoints(10);
          }
        }
      }

      // Hard-locked slot selection: ONLY keys 1, 2, and 3 (Primary, Secondary, Grenades)
      if (e.code === 'Digit1') switchSlot(0); // Primary
      if (e.code === 'Digit2') switchSlot(1); // Secondary
      if (e.code === 'Digit3') switchSlot(2); // Grenades
      if (e.code === 'KeyH') switchSlot(3); // Heal
      // Digits 4 through 0 are completely eradicated to eliminate ghost inventories
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
      if (e.code === 'ShiftLeft') player.aiming = false;
      if (e.code === 'ControlLeft') player.crouching = false;
    };

    let isMouseDown = false;
    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      if (gameStateRef.current !== 'playing') return;

      // In browser preview, attempt pointer lock on click if not already locked
      if (document.pointerLockElement !== renderer.domElement) {
        requestGamePointerLock();
      }

      if (e.button === 0) {
        player.fireHeld = true;
        fireWeapon();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      isMouseDown = false;
      if (e.button === 0) {
        player.fireHeld = false;
        AUDIO.arSpray.stop();
        AUDIO.laserBeam.stop();
        AUDIO.minigunFire.stop();
        AUDIO.minigunWindup.stop();
        AUDIO.railgunCharge.stop();
        updateMinigunSpinAudio(false, 0);
        updateRailgunChargeAudio(false, 0);
        laserBeamMesh.visible = false;
        player.continuousShots = 0;

        const curWs = currentSlotState();
        if (curWs && curWs.charging) {
          curWs.charging = false;
          curWs.chargeTimer = 0;
          vmManager.setRailgunChargeProgress(0);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (gameStateRef.current !== 'playing') return;
      const isLocked = document.pointerLockElement === renderer.domElement;
      // Allow aiming when pointer locked, OR when dragging with mouse if pointer lock is restricted
      if (!isLocked && !isMouseDown) return;

      const sens = (sensitivityValRef.current || 11) / 5000;
      player.yaw -= e.movementX * sens;
      player.pitch -= e.movementY * sens;
      player.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, player.pitch));
    };

    const onWheel = (e: WheelEvent) => {
      if (gameStateRef.current !== 'playing') return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = (player.slotIndex + dir + 3) % 3; // Strictly cycle active 3 slots
      switchSlot(next);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel);

    const onPointerLockChange = () => {
      // NOTE: We deliberately DO NOT force pause when pointer lock is released!
      // In web previews/iframes, browser pointer lock focus jitter was causing
      // the game to rapid-toggle between playing and paused (flashing the screen).
      if (document.pointerLockElement !== renderer.domElement) {
        AUDIO.arSpray.stop();
        player.continuousShots = 0;
      }
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const onBottomCenterClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('.hotbar-slot') as HTMLElement | null;
      if (!target || !target.id) return;
      const match = target.id.match(/slot-(\d+)/);
      if (match) {
        const slotIdx = parseInt(match[1], 10) - 1;
        if (slotIdx >= 0 && slotIdx < 3) {
          switchSlot(slotIdx);
        }
      }
    };
    const bottomCenterEl = containerRef.current?.querySelector('#bottom-center');
    bottomCenterEl?.addEventListener('click', onBottomCenterClick as EventListener);

    // Global action triggers from UI buttons
    const deployHandler = () => {
      unlockAudioEngine();
      matchConfig.mode = matchModeRef.current;
      matchConfig.friendlyCount = friendlyCountRef.current;
      matchConfig.enemyCount = enemyCountRef.current;
      matchConfig.targetScore = targetScoreRef.current;
      currentDifficulty = DIFFICULTIES[difficultyKeyRef.current] || DIFFICULTIES.medium;
      mouseSensitivity = (sensitivityValRef.current || 11) / 5000;
      initMatch();
      switchSlot(player.slotIndex);
      setGameState('playing');
      requestGamePointerLock();
    };

    const resumeHandler = () => {
      setGameState('playing');
      requestGamePointerLock();
    };

    const restartHandler = () => {
      initMatch();
      switchSlot(player.slotIndex);
      setGameState('playing');
      requestGamePointerLock();
    };

    const lobbyHandler = () => {
      setGameState('start');
      AUDIO.arSpray.stop();
      if (document.pointerLockElement) {
        try { document.exitPointerLock?.(); } catch {}
      }
      clearMatchEntities();
    };

    const deployBtn = containerRef.current?.querySelector('#btn-deploy');
    const resumeBtn = containerRef.current?.querySelector('#btn-resume');
    const restartBtn = containerRef.current?.querySelector('#btn-restart-end');
    const toLobbyPauseBtn = containerRef.current?.querySelector('#btn-to-lobby-pause');
    const toLobbyEndBtn = containerRef.current?.querySelector('#btn-to-lobby-end');

    deployBtn?.addEventListener('click', deployHandler);
    resumeBtn?.addEventListener('click', resumeHandler);
    restartBtn?.addEventListener('click', restartHandler);
    toLobbyPauseBtn?.addEventListener('click', lobbyHandler);
    toLobbyEndBtn?.addEventListener('click', lobbyHandler);

    // Main Game Loop
    const clock = new THREE.Clock();
    let animId = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());

      if (gameStateRef.current === 'playing') {
        // 1. Player movement & physics
        if (player.alive) {
          const eyeHeight = player.crouching ? PLAYER_EYE_CROUCH : PLAYER_EYE;
          let speed = player.crouching ? CROUCH_SPEED : (player.sprinting ? SPRINT_SPEED : WALK_SPEED);
          speed *= player.classSpeedMultiplier; // Recon: +20% (1.20), Juggernaut: -15% (0.85)
          if (currentSlot().id === 'lmg') {
            speed *= 0.85; // LMG heavy frame: -15% movement speed penalty
          }
          const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
          const right = new THREE.Vector3(Math.sin(player.yaw + Math.PI / 2), 0, Math.cos(player.yaw + Math.PI / 2));
          let moveX = 0, moveZ = 0;
          if (keys['KeyW']) { moveX += forward.x; moveZ += forward.z; }
          if (keys['KeyS']) { moveX -= forward.x; moveZ -= forward.z; }
          if (keys['KeyD']) { moveX += right.x; moveZ += right.z; }
          if (keys['KeyA']) { moveX -= right.x; moveZ -= right.z; }
          const moveLen = Math.hypot(moveX, moveZ);
          if (moveLen > 0.001) { moveX /= moveLen; moveZ /= moveLen; }

          player.vel.x = moveX * speed;
          player.vel.z = moveZ * speed;
          world.moveEntityWithCollision(player.pos, player.vel, PLAYER_RADIUS, player.pos.y - eyeHeight, player.pos.y + 0.25, dt);

          player.vel.y += GRAVITY * dt;
          player.pos.y += player.vel.y * dt;
          const ground = world.getHighestSurface(player.pos.x, player.pos.z, player.pos.y - eyeHeight) + eyeHeight;
          if (player.pos.y <= ground) {
            player.pos.y = ground;
            player.vel.y = 0;
            player.onGround = true;
          } else {
            player.onGround = false;
          }

          if (moveLen > 0.001 && player.onGround) {
            bobPhase += dt * (player.sprinting ? 14 : 9);
          } else {
            bobPhase *= 0.9;
          }
          const bobY = Math.sin(bobPhase) * (player.crouching ? 0.02 : 0.045);
          const bobX = Math.cos(bobPhase * 0.5) * (player.crouching ? 0.01 : 0.03);

          recoilPitch = Math.max(0, recoilPitch - dt * 0.8);
          camera.position.set(player.pos.x + bobX, player.pos.y + bobY, player.pos.z);
          camera.rotation.y = player.yaw;
          camera.rotation.x = player.pitch + recoilPitch;

          if (player.isMeleeing) {
            player.meleeTimer -= dt;
            if (player.meleeTimer <= 0) {
              player.isMeleeing = false;
              containerRef.current?.querySelector('#melee-arm')?.classList.remove('punch');
            }
          }

          if (player.isDrinking) {
            player.drinkTimer -= dt;
            if (player.drinkTimer <= 0) {
              player.isDrinking = false;
              const w = currentSlot();
              const ws = currentSlotState();
              if (w.id === 'mini') {
                player.shield = Math.min(50, player.shield + 25);
                pushKillFeed('+25 SHIELD APPLIED');
                ws.count = Math.max(0, (ws.count ?? 0) - 1);
              } else if (w.id === 'medkit') {
                if (player.health < player.maxHealth) {
                  player.health = Math.min(player.maxHealth, player.health + 50);
                  pushKillFeed('+50 HEALTH APPLIED');
                } else {
                  player.shield = Math.min(player.maxShield, player.shield + 50);
                  pushKillFeed('+50 SHIELD APPLIED');
                }
                ws.count = Math.max(0, (ws.count ?? 0) - 1);
              }
            }
          }

          // Storm damage
          if (matchConfig.mode !== 'zombie') {
            const distFromCenter = Math.hypot(player.pos.x - storm.center.x, player.pos.z - storm.center.z);
            if (distFromCenter > storm.radius) {
              applyDamageToPlayer(STORM_DPS * dt, true, true, null);
              containerRef.current?.querySelector('#stormvignette')?.classList.add('active');
            } else {
              containerRef.current?.querySelector('#stormvignette')?.classList.remove('active');
            }
          }
        }

        // 2. Weapon reload progress, cooling, & auto fire for the active 3-slot loadout
        playerLoadout.forEach((w, i) => {
          if (w.type !== 'weapon') return;
          const ws = playerWeaponState[i];
          if (!ws) return;

          if (w.id === 'laser') {
            // Passive cooling when not firing
            if (!player.fireHeld || player.slotIndex !== i) {
              if (ws.heat && ws.heat > 0) {
                ws.heat = Math.max(0, ws.heat - dt * 26);
              }
            }
            if (ws.reloading) {
              ws.reloadT = (ws.reloadT ?? 0) - dt;
              if (ws.reloadT <= 0) {
                ws.heat = 0;
                ws.overheated = false;
                ws.reloading = false;
                ws.reloadT = 0;
              }
            }
            return;
          }

          if (ws.reloading) {
            ws.reloadT = (ws.reloadT ?? 0) - dt;
            if (ws.reloadT <= 0) {
              const need = (w.mag ?? 30) - (ws.ammo ?? 0);
              const take = Math.min(need, ws.reserve ?? 0);
              ws.ammo = (ws.ammo ?? 0) + take;
              ws.reserve = (ws.reserve ?? 0) - take;
              ws.reloading = false;
              ws.reloadT = 0;
            }
          }
        });

        const curW = currentSlot();
        const curWs = currentSlotState();
        if (player.fireHeld && curW.auto && curW.type === 'weapon') {
          fireWeapon();
        }

        // Minigun update logic: spin warmup, hyper-auto fire, 4s overheat, 2s vent
        if (curW.id === 'minigun') {
          if (curWs.overheated) {
            curWs.ventTimer = (curWs.ventTimer ?? 2) - dt;
            curWs.spinWarmup = Math.max(0, (curWs.spinWarmup ?? 0) - dt * 2);
            curWs.spinSpeed = Math.max(0, (curWs.spinSpeed ?? 0) - dt * 15);
            updateMinigunSpinAudio(false, 0);

            // Vent yellow particle smoke from Minigun vents
            const origin = camera.position.clone();
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            const ventPt = origin.clone()
              .add(dir.clone().multiplyScalar(0.40))
              .add(right.clone().multiplyScalar(0.18))
              .add(new THREE.Vector3(0, -0.12, 0));
            spawnYellowSmoke(ventPt, 0.4);

            if ((curWs.ventTimer ?? 0) <= 0) {
              curWs.overheated = false;
              curWs.heat = 0;
              curWs.ventTimer = 0;
              pushKillFeed('MINIGUN SYSTEM COOLED');
            }
          } else if (player.fireHeld && player.alive) {
            // Warmup barrel spin (0.5s delay)
            curWs.spinWarmup = Math.min(0.5, (curWs.spinWarmup ?? 0) + dt);
            const spinProgress = (curWs.spinWarmup ?? 0) / 0.5;
            curWs.spinSpeed = spinProgress * 28.0;
            updateMinigunSpinAudio(true, spinProgress);

            // If 0.5s spin warmup complete, fire hyper-auto bullets
            if ((curWs.spinWarmup ?? 0) >= 0.5) {
              fireMinigunBullet();
              // Heat increases: 4 seconds continuous fire -> 100%
              curWs.heat = Math.min(100, (curWs.heat ?? 0) + (dt / 4.0) * 100);
              if ((curWs.heat ?? 0) >= 100) {
                curWs.heat = 100;
                curWs.overheated = true;
                curWs.ventTimer = 2.0;
                AUDIO.minigunFire.stop();
                updateMinigunSpinAudio(false, 0);
                playMinigunVentHiss();
                AUDIO.minigunOverheat.play(1.0);
                pushKillFeed('MINIGUN OVERHEATED! 2s EMERGENCY VENT...');
              }
            }
          } else {
            // Spool down and cool down
            curWs.spinWarmup = Math.max(0, (curWs.spinWarmup ?? 0) - dt * 1.5);
            curWs.spinSpeed = Math.max(0, (curWs.spinSpeed ?? 0) - dt * 20);
            updateMinigunSpinAudio(false, (curWs.spinWarmup ?? 0) / 0.5);
            AUDIO.minigunFire.stop();
            // Cool down: ~22% per sec
            curWs.heat = Math.max(0, (curWs.heat ?? 0) - dt * 22);
          }

          vmManager.setMinigunSpin((curWs.spinSpeed ?? 0) * dt, !!curWs.overheated);
        } else {
          updateMinigunSpinAudio(false, 0);
          AUDIO.minigunFire.stop();
        }

        // Tactical Railgun: 1.2s charge cycle, auto-unleash slug, cancel if released early
        if (curW.id === 'railgun') {
          if (player.alive && player.fireHeld && !curWs.reloading && (curWs.ammo ?? 0) > 0) {
            curWs.charging = true;
            curWs.chargeTimer = Math.min(1.2, (curWs.chargeTimer ?? 0) + dt);
            const prog = (curWs.chargeTimer ?? 0) / 1.2;
            updateRailgunChargeAudio(true, prog);
            vmManager.setRailgunChargeProgress(prog);

            if ((curWs.chargeTimer ?? 0) >= 1.2) {
              // At exactly 1.2s, auto-unleash slug
              curWs.charging = false;
              curWs.chargeTimer = 0;
              curWs.ammo = (curWs.ammo ?? 1) - 1;
              updateRailgunChargeAudio(false, 0);
              vmManager.setRailgunChargeProgress(0);
              fireRailgunSlug();
              if ((curWs.ammo ?? 0) <= 0) {
                reloadWeapon();
              }
            }
          } else {
            if (curWs.charging || (curWs.chargeTimer ?? 0) > 0) {
              curWs.charging = false;
              curWs.chargeTimer = 0;
              updateRailgunChargeAudio(false, 0);
              vmManager.setRailgunChargeProgress(0);
            }
          }
        } else {
          updateRailgunChargeAudio(false, 0);
        }

        // Battle Rifle 3-round burst continuation
        if (curW.id === 'br' && (curWs.burstRemaining ?? 0) > 0) {
          curWs.burstTimer = (curWs.burstTimer ?? 0) - dt;
          if ((curWs.burstTimer ?? 0) <= 0) {
            curWs.burstRemaining = (curWs.burstRemaining ?? 1) - 1;
            curWs.burstTimer = curW.burstRate ?? 0.075;
            if ((curWs.ammo ?? 0) > 0) {
              curWs.ammo = (curWs.ammo ?? 1) - 1;
              vmManager.addRecoil(0.035, 0.040);
              AUDIO.brBurst.play(1.0, true);
              triggerPlayerFlash();

              const spread = player.aiming ? (curW.adsSpread ?? 0.008) : (curW.spread ?? 0.018);
              const ndcX = (Math.random() - 0.5) * spread * 2;
              const ndcY = (Math.random() - 0.5) * spread * 2;
              const raycaster = new THREE.Raycaster();
              raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
              raycaster.far = curW.range ?? 120;
              const hits = raycaster.intersectObjects(world.hittableObjects, false);
              if (hits.length > 0) {
                const hit = hits[0];
                const ud = hit.object.userData;
                spawnImpactSpark(hit.point, ud.type === 'botpart');
                if (ud.type === 'botpart' && ud.ref) {
                  const bot = ud.ref as Bot;
                  if (!(matchConfig.mode === 'team' && bot.team === player.team) &&
                      !(matchConfig.mode === 'zombie' && bot.team === 'blue')) {
                    const isHead = ud.part === 'head';
                    const dist = camera.position.distanceTo(hit.point);
                    const falloff = getDamageRangeFalloff(curW.id, dist);
                    let finalDamage = (curW.damage ?? 32) * falloff;
                    if (isHead) finalDamage *= (curW.headshotMult ?? 2.1);
                    damageBot(bot, finalDamage, isHead, 'player');
                    flashHit(bot);
                    showHitmarker(isHead);
                    if (bot.isZombie) addPoints(10);
                    if (['sniper', 'laser', 'lmg', 'minigun'].includes(curW.id)) { const d = camera.position.distanceTo(hit.point); const v = Math.max(0, 1.0 - d / 50); AUDIO.bulletHit.play(v); }
                  }
                }
              }
            }
          }
        }

        // Covenant Laser Gun continuous plasma beam positioning
        if (player.alive && curW.id === 'laser' && player.fireHeld && !curWs.overheated && !curWs.reloading) {
          laserBeamMesh.visible = true;
          const origin = camera.position.clone();
          const dir = new THREE.Vector3();
          camera.getWorldDirection(dir);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          const startPt = origin.clone()
            .add(dir.clone().multiplyScalar(0.35))
            .add(right.clone().multiplyScalar(0.12))
            .add(new THREE.Vector3(0, -0.09, 0));

          const raycaster = new THREE.Raycaster(camera.position, dir, 0.1, curW.range ?? 95);
          const hits = raycaster.intersectObjects(world.hittableObjects, false);
          let endPt = camera.position.clone().add(dir.clone().multiplyScalar(curW.range ?? 95));
          if (hits.length > 0) {
            endPt = hits[0].point;
            spawnImpactSpark(endPt, hits[0].object.userData.type === 'botpart');
          }
          const beamLen = startPt.distanceTo(endPt);
          laserBeamMesh.position.copy(startPt);
          laserBeamMesh.lookAt(endPt);
          laserBeamMesh.scale.set(1, 1, Math.max(0.1, beamLen));
        } else {
          laserBeamMesh.visible = false;
        }

        // 3. Aim FoV transition
        const targetFov = player.aiming ? (curW.adsFov ?? HIP_FOV) : HIP_FOV;
        camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10);
        camera.updateProjectionMatrix();
        const showScope = player.aiming && !!curW.scoped;
        const scopeEl = containerRef.current?.querySelector('#scope-overlay') as HTMLElement | null;
        const crossEl = containerRef.current?.querySelector('#crosshair') as HTMLElement | null;
        if (scopeEl) scopeEl.style.display = showScope ? 'block' : 'none';
        if (crossEl) crossEl.style.display = showScope ? 'none' : 'block';

        // 4. Muzzle flash fade
        if (playerFlashT > 0) {
          playerFlashT -= dt;
          const k = Math.max(0, playerFlashT / 0.07);
          const s = 0.55 * k + 0.12;
          playerFlash.scale.set(s, s, 1);
          playerFlash.material.opacity = k;
        } else {
          playerFlash.scale.set(0, 0, 0);
        }

        // 5. Viewmodels update
        const isMoving = player.onGround && (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);
        vmManager.update(
          dt,
          curW,
          curWs,
          player.aiming,
          player.sprinting,
          player.onGround,
          isMoving,
          player.isMeleeing,
          player.isDrinking,
          player.drinkTimer,
          player.alive,
          true
        );

        // 6. World doors & interactions
        world.updateDoors(dt);

        let nearestDoor = null;
        let nearestDoorDist = 999;
        for (const d of world.doors) {
          const dist = player.pos.distanceTo(d.pos);
          if (dist < 2.9 && dist < nearestDoorDist) {
            nearestDoor = d;
            nearestDoorDist = dist;
          }
        }

        let nearestPickup = null;
        let nearestPickupDist = 999;
        for (let i = world.groundPickups.length - 1; i >= 0; i--) {
          const item = world.groundPickups[i];
          item.group.rotation.y += dt * 1.6;
          item.group.position.y = terrainHeight(item.group.position.x, item.group.position.z) + 0.55 + Math.sin(storm.elapsed * 3 + i) * 0.08;
          const dist = Math.hypot(player.pos.x - item.group.position.x, player.pos.z - item.group.position.z);
          if (dist < 2.3 && dist < nearestPickupDist) {
            nearestPickup = item;
            nearestPickupDist = dist;
          }
        }

        const promptEl = containerRef.current?.querySelector('#pickup-prompt') as HTMLElement | null;
        if (promptEl) {
          if (nearestDoor) {
            promptEl.style.display = 'block';
            promptEl.textContent = nearestDoor.isOpen ? 'Press E to Close Door' : 'Press E to Open Door';
            if (keys['KeyE']) {
              keys['KeyE'] = false;
              nearestDoor.isOpen = !nearestDoor.isOpen;
              nearestDoor.targetAngle = nearestDoor.isOpen ? -Math.PI / 2 : 0;
              nearestDoor.collider.active = !nearestDoor.isOpen;
            }
          } else if (nearestPickup) {
            promptEl.style.display = 'block';
            promptEl.textContent = `[E] ${nearestPickup.label}`;
            if (keys['KeyE']) {
              keys['KeyE'] = false;
              const pItem = nearestPickup;
              const wType = WEAPONS[pItem.typeIndex];
              if (wType) {
                if (wType.type === 'grenade') {
                  playerWeaponState[2].count = Math.min(6, (playerWeaponState[2].count ?? 0) + pItem.ammo);
                  pushKillFeed(`+${pItem.ammo} TACTICAL GRENADES`);
                } else if (wType.id === playerLoadout[0].id) {
                  playerWeaponState[0].reserve = (playerWeaponState[0].reserve ?? 0) + pItem.ammo;
                  pushKillFeed(`+${pItem.ammo} ${playerLoadout[0].name} AMMO`);
                } else if (wType.id === playerLoadout[1].id) {
                  playerWeaponState[1].reserve = (playerWeaponState[1].reserve ?? 0) + pItem.ammo;
                  pushKillFeed(`+${pItem.ammo} ${playerLoadout[1].name} AMMO`);
                } else {
                  pushKillFeed(`COLLECTED ${wType.name} AMMO (+ $50 CONVERTED)`);
                  addPoints(50);
                }
                scene.remove(pItem.group);
                const idxInArr = world.groundPickups.indexOf(pItem);
                if (idxInArr >= 0) world.groundPickups.splice(idxInArr, 1);
              }
            }
          } else {
            promptEl.style.display = 'none';
          }
        }

        // 7. Active Grenades physics
        for (let i = activeGrenades.length - 1; i >= 0; i--) {
          const g = activeGrenades[i];
          g.timeAlive += dt;
          g.group.rotation.x += g.rotAxis.x * g.rotSpeed * dt;
          g.group.rotation.y += g.rotAxis.y * g.rotSpeed * dt;
          g.group.rotation.z += g.rotAxis.z * g.rotSpeed * dt;
          g.vel.y += GRAVITY * dt;
          g.pos.x += g.vel.x * dt;
          g.pos.z += g.vel.z * dt;
          g.pos.y += g.vel.y * dt;

          const surfaceY = world.getHighestSurface(g.pos.x, g.pos.z, g.pos.y);
          const groundLimit = surfaceY + g.radius;
          let isHighImpact = false;
          if (g.pos.y <= groundLimit) {
            const impactSpeed = Math.abs(g.vel.y);
            g.pos.y = groundLimit;
            g.hasHitGround = true;
            if (impactSpeed > 7.5 && g.timeAlive > 0.25) isHighImpact = true;
            g.vel.y = -g.vel.y * 0.42;
            g.vel.x *= 0.76;
            g.vel.z *= 0.76;
            if (Math.abs(g.vel.y) < 0.28) g.vel.y = 0;
          }
          g.group.position.copy(g.pos);

          if (isHighImpact || (g.timeAlive >= g.maxFuse && g.hasHitGround)) {
            detonateGrenade(g.pos, g.ownerTeam);
            scene.remove(g.group);
            activeGrenades.splice(i, 1);
          }
        }

        // 8. Explosion particles
        for (let i = explosionEffects.length - 1; i >= 0; i--) {
          const fx = explosionEffects[i];
          fx.life -= dt;
          fx.scale += dt * 14.0;
          fx.mesh.scale.set(fx.scale, fx.scale, fx.scale);
          (fx.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, fx.life / 0.32);
          if (fx.light) fx.light.intensity = (fx.life / 0.32) * 4.5;
          if (fx.life <= 0) {
            scene.remove(fx.mesh);
            if (fx.light) scene.remove(fx.light);
            explosionEffects.splice(i, 1);
          }
        }

        // 9. Sparks
        for (let i = sparkPool.length - 1; i >= 0; i--) {
          const s = sparkPool[i];
          s.life -= dt;
          if (s.vel) {
            s.mesh.position.addScaledVector(s.vel, dt);
            s.vel.y -= 9.8 * dt; // gravity
          } else {
            s.mesh.scale.multiplyScalar(1 + dt * 4);
          }
          if (s.life <= 0) {
            scene.remove(s.mesh);
            sparkPool.splice(i, 1);
          }
        }

        // Update yellow smoke particles (Minigun venting)
        for (let i = smokePool.length - 1; i >= 0; i--) {
          const sm = smokePool[i];
          sm.life -= dt;
          sm.mesh.position.addScaledVector(sm.vel, dt);
          const s = 1.0 + (1.0 - sm.life / sm.maxLife) * 2.2;
          sm.mesh.scale.set(s, s, s);
          (sm.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (sm.life / sm.maxLife) * 0.75);
          if (sm.life <= 0) {
            scene.remove(sm.mesh);
            smokePool.splice(i, 1);
          }
        }

        // Update Railgun solid silver kinetic projectile tracers
        for (let i = railgunProjectiles.length - 1; i >= 0; i--) {
          const rp = railgunProjectiles[i];
          rp.life -= dt;
          const progress = 1 - Math.max(0, rp.life / rp.maxLife); // 0 to 1
          // Projectile slug cuts through the screen at hypersonic speed (~0.05s)
          const travelP = Math.min(1, progress * 4.5);
          rp.slugMesh.position.copy(rp.start).addScaledVector(rp.dir, travelP * rp.dist);
          if (travelP >= 1) {
            rp.slugMesh.visible = false;
          }

          // Shockwave trail dissipates rapidly
          const trailAlpha = Math.max(0, rp.life / rp.maxLife);
          (rp.trailMesh.material as THREE.MeshBasicMaterial).opacity = trailAlpha * 0.85;
          const trailScale = 1.0 + (1 - trailAlpha) * 0.5;
          rp.trailMesh.scale.set(trailScale, trailScale, 1);

          if (rp.life <= 0) {
            scene.remove(rp.group);
            railgunProjectiles.splice(i, 1);
          }
        }

        // 10. Bots & AI logic
        for (const bot of bots) {
          bot.flashMats.forEach(m => {
            if (m.emissiveIntensity > 0) m.emissiveIntensity = Math.max(0, m.emissiveIntensity - dt * 4);
          });
          if (bot.muzzleFlashT > 0 && bot.muzzleFlash) {
            bot.muzzleFlashT -= dt;
            const k = Math.max(0, bot.muzzleFlashT / 0.07);
            const s = 0.4 * k + 0.08;
            bot.muzzleFlash.scale.set(s, s, 1);
            bot.muzzleFlash.material.opacity = k;
          } else if (bot.muzzleFlash) {
            bot.muzzleFlash.scale.set(0, 0, 0);
          }

          if (bot.meleeCooldown > 0) bot.meleeCooldown -= dt;

          if (!bot.alive) {
            if (Math.abs(bot.group.rotation[bot.fallAxis]) < 1.55) {
              bot.group.rotation[bot.fallAxis] += bot.fallDir * dt * 3.2;
            }
            bot.deathT -= dt;
            if (bot.deathT <= 0) removeBot(bot);
            continue;
          }

          const curSpeed = Math.hypot(bot.vel.x, bot.vel.z);
          if (curSpeed > 0.2) {
            bot.walkPhase += dt * curSpeed * (bot.isZombie && bot.zType === 'runner' ? 3.8 : 2.8);
            const stride = Math.sin(bot.walkPhase);
            bot.legLPivot.rotation.x = stride * 0.65;
            bot.legRPivot.rotation.x = -stride * 0.65;
            if (!bot.isZombie) {
              bot.armLPivot.rotation.x = -stride * 0.45;
              bot.armRPivot.rotation.x = -0.45 + stride * 0.16;
            } else if (bot.zType === 'runner') {
              // RUNNER SPRINT MATRICES: Aggressive 35-degree forward torso lean and arms flung wildly backward
              bot.torsoGroup.rotation.x = 0.61 + Math.sin(bot.walkPhase * 2) * 0.08;
              bot.armLPivot.rotation.x = 1.15 + stride * 0.35;
              bot.armRPivot.rotation.x = 1.15 - stride * 0.35;
              bot.armLPivot.rotation.z = -0.28;
              bot.armRPivot.rotation.z = 0.28;
            } else {
              bot.armLPivot.rotation.x = -1.35 + Math.sin(bot.walkPhase * 0.8) * 0.15;
              bot.armRPivot.rotation.x = -1.35 - Math.sin(bot.walkPhase * 0.8) * 0.15;
            }
          } else if (bot.isZombie && bot.zType === 'runner') {
            bot.torsoGroup.rotation.x = 0.61;
            bot.armLPivot.rotation.x = 1.0;
            bot.armRPivot.rotation.x = 1.0;
            bot.armLPivot.rotation.z = -0.25;
            bot.armRPivot.rotation.z = 0.25;
          }

          if (bot.isZombie && bot.meleeCooldown > 0) {
            const slash = Math.sin((bot.meleeCooldown / 0.9) * Math.PI);
            bot.armRPivot.rotation.x = -1.6 - slash * 0.7;
          }

          // Target acquisition
          let targetPos: THREE.Vector3 | null = null;
          let targetObj: Bot | 'player' | null = null;
          let bestDist = 999;

          if (matchConfig.mode === 'zombie') {
            if (bot.isZombie) {
              if (player.alive) {
                bestDist = bot.pos.distanceTo(player.pos);
                targetObj = 'player';
                targetPos = camera.position.clone();
              }
              for (const other of bots) {
                if (!other.alive || other.team !== 'blue') continue;
                const d = bot.pos.distanceTo(other.pos);
                if (d < bestDist) {
                  bestDist = d;
                  targetObj = other;
                  targetPos = other.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
                }
              }
            } else {
              for (const other of bots) {
                if (!other.alive || !other.isZombie) continue;
                const d = bot.pos.distanceTo(other.pos);
                if (d < 60 && d < bestDist) {
                  bestDist = d;
                  targetObj = other;
                  targetPos = other.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
                }
              }
            }
          } else {
            if (player.alive) {
              const dPlayer = bot.pos.distanceTo(player.pos);
              if (dPlayer < 55) {
                bestDist = dPlayer;
                targetObj = 'player';
                targetPos = camera.position.clone();
              }
            }
            for (const other of bots) {
              if (!other.alive || other === bot || other.team === bot.team) continue;
              const d = bot.pos.distanceTo(other.pos);
              if (d < 50 && d < bestDist) {
                bestDist = d;
                targetObj = other;
                targetPos = other.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
              }
            }
          }

          if (targetPos) {
            const dx = targetPos.x - bot.pos.x;
            const dz = targetPos.z - bot.pos.z;
            const dist = Math.hypot(dx, dz) || 0.001;
            const ndx = dx / dist;
            const ndz = dz / dist;

            if (bot.isZombie) {
              const vx = ndx * bot.speed;
              const vz = ndz * bot.speed;
              
              if (dist < 6) {
                // Close proximity: charge directly along straight-line vector (no steering delay)
                bot.vel.x = vx;
                bot.vel.z = vz;
              } else {
                bot.vel.x += (vx - bot.vel.x) * Math.min(1, dt * 6);
                bot.vel.z += (vz - bot.vel.z) * Math.min(1, dt * 6);
              }
              
              world.moveEntityWithCollision(bot.pos, bot.vel, bot.zType === 'tank' ? 0.65 : 0.38, bot.pos.y, bot.pos.y + 1.8, dt);
              bot.pos.y = world.getHighestSurface(bot.pos.x, bot.pos.z, bot.pos.y);
              bot.group.position.copy(bot.pos);
              bot.group.rotation.y = Math.atan2(dx, dz);

              const reach = bot.zType === 'tank' ? 2.2 : 1.5;
              if (dist <= reach && bot.meleeCooldown <= 0) {
                bot.meleeCooldown = 0.9;
                if (targetObj === 'player') applyDamageToPlayer(bot.meleeDmg, false, false, bot);
                else if (targetObj && targetObj.alive) damageBot(targetObj, bot.meleeDmg, false, bot);
              }
            } else {
              bot.strafeTimer -= dt;
              if (bot.strafeTimer <= 0) {
                bot.strafeDir *= -1;
                bot.strafeTimer = 1.2 + Math.random() * 1.4;
              }
              let moveX = -ndz * bot.strafeDir * 0.75;
              let moveZ = ndx * bot.strafeDir * 0.75;
              if (dist > bot.preferredRange + 2) { moveX += ndx; moveZ += ndz; }
              else if (dist < bot.preferredRange - 2) { moveX -= ndx; moveZ -= ndz; }

              const vx = moveX * bot.speed * 0.65;
              const vz = moveZ * bot.speed * 0.65;
              bot.vel.x += (vx - bot.vel.x) * Math.min(1, dt * 6);
              bot.vel.z += (vz - bot.vel.z) * Math.min(1, dt * 6);
              world.moveEntityWithCollision(bot.pos, bot.vel, 0.38, bot.pos.y, bot.pos.y + 1.8, dt);
              bot.pos.y = world.getHighestSurface(bot.pos.x, bot.pos.z, bot.pos.y);
              bot.group.position.copy(bot.pos);
              bot.group.rotation.y = Math.atan2(dx, dz);

              bot.fireTimer -= dt;
              if (bot.fireTimer <= 0) {
                bot.fireTimer = (
                  bot.weaponType === 'smg' ? 0.35 :
                  bot.weaponType === 'lmg' ? 0.55 :
                  bot.weaponType === 'br' ? 0.8 :
                  bot.weaponType === 'pistol' ? 0.7 :
                  bot.weaponType === 'shotgun' ? 1.4 : 1.0
                ) * currentDifficulty.botFireRateMult;
                bot.muzzleFlashT = 0.07;
                const shotVol = getSpatialVolume(camera.position, bot.pos);
                if (bot.weaponType === 'pistol') AUDIO.pistolShot.play(shotVol);
                else if (bot.weaponType === 'smg') AUDIO.smgFire.play(shotVol);
                else if (bot.weaponType === 'lmg') AUDIO.lmgFire.play(shotVol);
                else if (bot.weaponType === 'br') AUDIO.brBurst.play(shotVol);
                else if (bot.weaponType === 'ar') AUDIO.arSingle.play(shotVol);
                else if (bot.weaponType === 'shotgun') AUDIO.shotgunShot.play(shotVol);
                else if (bot.weaponType === 'sniper') AUDIO.sniperShot.play(shotVol);

                if (Math.random() < currentDifficulty.botAccuracy) {
                  let hitDmg = 12;
                  if (bot.weaponType === 'pistol') hitDmg = 14;
                  else if (bot.weaponType === 'smg') hitDmg = 10;
                  else if (bot.weaponType === 'lmg') hitDmg = 16;
                  else if (bot.weaponType === 'br') hitDmg = 18;
                  else if (bot.weaponType === 'shotgun') hitDmg = 18;
                  else if (bot.weaponType === 'sniper') hitDmg = 34;

                  const distToTgt = targetPos ? bot.pos.distanceTo(targetPos) : 20;
                  const falloff = getDamageRangeFalloff(bot.weaponType, distToTgt);
                  hitDmg *= falloff;

                  if (targetObj === 'player') applyDamageToPlayer(hitDmg * currentDifficulty.botDamageMult, false, false, bot);
                  else if (targetObj && targetObj.alive) {
                    damageBot(targetObj, hitDmg * currentDifficulty.botDamageMult, false, bot);
                    flashHit(targetObj);
                  }
                }
              }
            }
          }

          // Health bar in screen space
          const eyePos = bot.pos.clone().add(new THREE.Vector3(0, bot.zType === 'tank' ? 2.4 : 1.8, 0)).project(camera);
          if (eyePos.z < 1 && bot.health < bot.maxHealth) {
            bot.healthEl.style.display = 'block';
            bot.healthEl.style.left = `${(eyePos.x * 0.5 + 0.5) * window.innerWidth}px`;
            bot.healthEl.style.top = `${(-eyePos.y * 0.5 + 0.5) * window.innerHeight}px`;
            bot.fillEl.style.width = `${Math.max(0, (bot.health / bot.maxHealth) * 100)}%`;
          } else {
            bot.healthEl.style.display = 'none';
          }
        }

        // Zombie wave intermission
        if (matchConfig.mode === 'zombie' && waveIntermission) {
          intermissionTimer -= dt;
          const banner = containerRef.current?.querySelector('#wave-banner') as HTMLElement | null;
          const bannerTitle = containerRef.current?.querySelector('#wave-banner-title');
          const bannerSub = containerRef.current?.querySelector('#wave-banner-sub');
          if (banner && bannerTitle && bannerSub) {
            banner.style.display = 'block';
            bannerTitle.textContent = 'WAVE COMPLETED!';
            bannerSub.textContent = `NEXT WAVE IN ${Math.max(1, Math.ceil(intermissionTimer))}...`;
          }
          if (intermissionTimer <= 0) {
            waveIntermission = false;
            if (banner) banner.style.display = 'none';
            startNextZombieWave(currentWave + 1);
          }
        }

        // Storm shrink
        if (matchConfig.mode !== 'zombie') {
          storm.elapsed += dt;
          const t = Math.max(0, Math.min(1, (storm.elapsed - STORM_SAFE_TIME) / STORM_SHRINK_TIME));
          storm.radius = STORM_START_R - (STORM_START_R - STORM_MIN_R) * t;
          storm.mesh.scale.set(storm.radius / STORM_START_R, 1, storm.radius / STORM_START_R);

          // Continuous bot spawning to maintain counts
          if (matchConfig.mode === 'team') {
            let blueAlive = 0;
            let redAlive = 0;
            for (let i = 0; i < bots.length; i++) {
              if (bots[i].alive) {
                if (bots[i].team === 'blue') blueAlive++;
                if (bots[i].team === 'red') redAlive++;
              }
            }
            if (blueAlive < matchConfig.friendlyCount) makeBot('blue');
            if (redAlive < matchConfig.enemyCount) makeBot('red');
          } else if (matchConfig.mode === 'ffa') {
            let aliveCount = 0;
            for (let i = 0; i < bots.length; i++) {
              if (bots[i].alive) aliveCount++;
            }
            if (aliveCount < matchConfig.enemyCount) makeBot();
          }
        }

        // Direct DOM update for zero React re-render, 60fps responsiveness & no screen flashing
        const tSec = Math.floor(storm.elapsed);
        const timeStr = `${String(Math.floor(tSec / 60)).padStart(2, '0')}:${String(tSec % 60).padStart(2, '0')}`;
        const zoneStr = matchConfig.mode === 'zombie' ? 'ACTIVE' : (Math.hypot(player.pos.x, player.pos.z) > storm.radius ? 'DANGER' : 'SAFE');
        const hpVal = Math.ceil(Math.max(0, player.health));
        const shVal = Math.ceil(Math.max(0, player.shield));

        const hpFillEl = containerRef.current?.querySelector('#bar-fill-health') as HTMLElement | null;
        const hpNumEl = containerRef.current?.querySelector('#bar-num-health');
        const shFillEl = containerRef.current?.querySelector('#bar-fill-shield') as HTMLElement | null;
        const shNumEl = containerRef.current?.querySelector('#bar-num-shield');
        if (hpFillEl) hpFillEl.style.width = `${Math.min(100, (hpVal / (player.maxHealth || 100)) * 100)}%`;
        if (hpNumEl) hpNumEl.textContent = `${hpVal}`;
        if (shFillEl) shFillEl.style.width = `${Math.min(100, (shVal / (player.maxShield || 100)) * 100)}%`;
        if (shNumEl) shNumEl.textContent = `${shVal}`;

        const fundsEl = containerRef.current?.querySelector('#currency-val');
        if (fundsEl) fundsEl.textContent = `$${playerPoints}`;

        const teleKills = containerRef.current?.querySelector('#telemetry-kills');
        const teleTime = containerRef.current?.querySelector('#telemetry-time');
        const teleZone = containerRef.current?.querySelector('#telemetry-zone');
        const teleDiff = containerRef.current?.querySelector('#telemetry-diff');
        if (teleKills) teleKills.textContent = `${player.kills}`;
        if (teleTime) teleTime.textContent = timeStr;
        if (teleZone) teleZone.textContent = zoneStr;
        if (teleDiff) teleDiff.textContent = currentDifficulty.label;

        const scoreBoardEl = containerRef.current?.querySelector('#match-scoreboard');
        if (scoreBoardEl) {
          if (matchConfig.mode === 'zombie') {
            scoreBoardEl.innerHTML = `<span class="score-zombie">WAVE ${currentWave}</span> <span> | </span> <span class="score-red">ZOMBIES: ${Math.max(0, zombiesRemaining)}</span>`;
          } else if (matchConfig.mode === 'team') {
            scoreBoardEl.innerHTML = `<span class="score-blue">BLUE ${teamScoreBlue}</span> <span> vs </span> <span class="score-red">${teamScoreRed} RED</span> <span class="score-target-tag">(TARGET: ${matchConfig.targetScore})</span>`;
          } else {
            scoreBoardEl.innerHTML = `<span class="score-blue">YOU ${player.kills}</span> <span> | </span> <span class="score-target-tag">(TARGET: ${matchConfig.targetScore})</span>`;
          }
        }

        // Update DOM Crosshair recoil scale & Ammo UI directly for maximum 60fps responsiveness
        recoilKick = Math.max(0, recoilKick - 0.06);
        const cross = containerRef.current?.querySelector('#crosshair') as HTMLElement | null;
        if (cross) cross.style.transform = `translate(-50%,-50%) scale(${1 + recoilKick * 3})`;

        const activeWs = currentSlotState();
        const ammoEl = containerRef.current?.querySelector('#ammo-readout');
        const reloadTagEl = containerRef.current?.querySelector('#reload-tag');
        const weaponNameEl = containerRef.current?.querySelector('#weapon-name');

        if (weaponNameEl) weaponNameEl.textContent = curW.name;
        if (ammoEl) {
          if (curW.id === 'laser') {
            const heatPct = Math.round(activeWs.heat ?? 0);
            ammoEl.innerHTML = `${100 - heatPct}% <span class="reserve">CHARGE (HEAT ${heatPct}%)</span>`;
          } else if (curW.id === 'minigun') {
            const heatPct = Math.round(activeWs.heat ?? 0);
            ammoEl.innerHTML = `${heatPct}% <span class="reserve">HEAT (MAX 100%)</span>`;
          } else if (curW.id === 'railgun') {
            ammoEl.innerHTML = `${activeWs.ammo ?? 1} <span class="reserve">/ ${activeWs.reserve ?? 30} SLUGS</span>`;
          } else if (curW.type === 'weapon') {
            ammoEl.innerHTML = `${activeWs.ammo ?? 0} <span class="reserve">/ ${activeWs.reserve ?? 0}</span>`;
          } else if (curW.type === 'grenade') {
            ammoEl.innerHTML = `${activeWs.count ?? 0} <span class="reserve">GRENADES</span>`;
          } else {
            ammoEl.innerHTML = `${activeWs.count ?? 0} <span class="reserve">MINIS</span>`;
          }
        }
        if (reloadTagEl) {
          if (curW.id === 'laser') {
            reloadTagEl.textContent = activeWs.overheated
              ? 'OVERHEATED! [R] TO VENT'
              : (activeWs.reloading ? 'VENTING CORE…' : (player.fireHeld ? 'FIRING CONTINUOUS BEAM' : ''));
          } else if (curW.id === 'minigun') {
            reloadTagEl.textContent = activeWs.overheated
              ? `OVERHEATED! VENTING ${(activeWs.ventTimer ?? 0).toFixed(1)}s`
              : ((activeWs.spinWarmup ?? 0) > 0 && (activeWs.spinWarmup ?? 0) < 0.5
                ? 'SPINNING UP BARRELS...'
                : (player.fireHeld && (activeWs.spinWarmup ?? 0) >= 0.5 ? 'FIRING HYPER-AUTO' : 'HOLD LMB TO SPIN & FIRE'));
          } else if (curW.id === 'railgun') {
            reloadTagEl.textContent = activeWs.reloading
              ? 'RELOADING SLUG...'
              : (activeWs.charging
                ? `CHARGING RAILGUN ${Math.round(((activeWs.chargeTimer ?? 0) / 1.2) * 100)}%`
                : 'HOLD LMB (1.2s) TO FIRE PIERCING SLUG');
          } else if (curW.type === 'weapon') {
            reloadTagEl.textContent = activeWs.reloading ? 'RELOADING…' : '';
          } else if (curW.type === 'grenade') {
            reloadTagEl.textContent = 'LMB OR [G] TO THROW';
          } else {
            reloadTagEl.textContent = player.isDrinking ? `DRINKING ${player.drinkTimer.toFixed(1)}s` : 'LMB OR [X] TO DRINK';
          }
        }

        // Highlight selected inventory slot across the 3 locked loadout assets
        for (let s = 0; s < 3; s++) {
          const slotEl = containerRef.current?.querySelector(`#slot-${s + 1}`);
          if (slotEl) {
            slotEl.classList.toggle('selected', player.slotIndex === s);
            const labelEl = slotEl.children[1] as HTMLElement;
            if (labelEl) {
              const itemW = playerLoadout[s];
              const itemWs = playerWeaponState[s];
              if (!itemW || !itemWs) continue;
              if (itemW.type === 'grenade') labelEl.textContent = `GRENADES (x${itemWs?.count ?? 0})`;
              else if (itemW.id === 'laser') labelEl.textContent = `LASER (${Math.round(itemWs?.heat ?? 0)}%)`;
              else if (itemW.id === 'minigun') labelEl.textContent = `MINIGUN (${Math.round(itemWs?.heat ?? 0)}%)`;
              else if (itemW.id === 'railgun') labelEl.textContent = `RAILGUN (${itemWs?.ammo ?? 0})`;
              else labelEl.textContent = `${itemW.name.toUpperCase()} (${itemWs?.ammo ?? 0})`;
            }
          }
        }

        // Update compass
        const deg = ((player.yaw * 180 / Math.PI) % 360 + 360) % 360;
        const strip = containerRef.current?.querySelector('#compass-strip') as HTMLElement | null;
        if (strip) {
          const pxPerDeg = 40 / 45;
          strip.style.left = `${140 - deg * pxPerDeg}px`;
        }
      } else if (gameStateRef.current === 'start') {
        vmManager.root.visible = false;
        const t = performance.now() * 0.0001;
        camera.position.set(Math.sin(t) * 32, terrainHeight(0, 0) + 16, Math.cos(t) * 32 + 25);
        camera.lookAt(0, terrainHeight(0, 0) + 2, 0);
      } else {
        vmManager.root.visible = false;
      }

      renderer.render(scene, camera);
    }
    animate();

    // Setup compass DOM once
    const compassStrip = containerRef.current?.querySelector('#compass-strip');
    if (compassStrip && compassStrip.children.length === 0) {
      const labels = ['N', '', 'E', '', 'S', '', 'W', ''];
      let html = '';
      for (let cycle = 0; cycle < 2; cycle++) {
        for (let d = 0; d < 360; d += 45) {
          const idx = d / 45;
          html += `<span class="${labels[idx] ? 'card' : ''}">${labels[idx] || d}</span>`;
        }
      }
      compassStrip.innerHTML = html;
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);
      bottomCenterEl?.removeEventListener('click', onBottomCenterClick as EventListener);
      world.dispose();
      botHealthLayer.remove();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden font-mono bg-black text-[#e8edf0]">
      {/* 3D Viewport */}
      <div id="viewport" className="fixed inset-0" />

      {/* HUD Layer */}
      <div id="hud" className={gameState === 'playing' ? 'block' : 'hidden'}>
        <div id="vignette" />
        <div id="stormvignette" />

        {/* Quick Pause & Controls */}
        <div id="hud-top-actions" className="absolute top-3 left-4 z-40 flex items-center gap-2">
          <button
            onClick={() => {
              setGameState('paused');
              AUDIO.arSpray.stop();
              if (document.pointerLockElement) {
                try { document.exitPointerLock?.(); } catch {}
              }
            }}
            className="panel px-3 py-1 text-xs text-[#57d1c9] hover:bg-[#57d1c9]/20 cursor-pointer flex items-center gap-1.5 border border-[#57d1c9]/50 rounded-sm"
          >
            <span>⏸ PAUSE</span>
            <span className="text-[10px] text-[#8b98a1]">(ESC / P)</span>
          </button>
        </div>

        {/* Currency Display */}
        <div id="currency-hud" className="panel">
          <span className="text-[12px] text-[#8b98a1]">FUNDS</span>
          <span id="currency-val" className="text-[#f5a623]">${stats.funds}</span>
        </div>

        {/* Wave Banner */}
        <div id="wave-banner">
          <div id="wave-banner-title">WAVE 1</div>
          <div id="wave-banner-sub">SURVIVE THE HORDE</div>
        </div>

        {/* Crosshair & Scopes */}
        <div id="crosshair">
          <div className="tick t" />
          <div className="tick b" />
          <div className="tick l" />
          <div className="tick r" />
          <div className="dot" />
        </div>
        <div id="scope-overlay">
          <div id="scope-hole">
            <div id="scope-dot" />
          </div>
        </div>
        <div id="hitmarker">
          <div className="l1" />
          <div className="l2" />
        </div>
        <div id="melee-arm" />
        <div id="pickup-prompt">[E] PICK UP</div>

        {/* Tactical Class HUD Badge */}
        <div
          id="hud-class-badge"
          className="absolute bottom-[92px] left-5 z-20 flex items-center gap-1.5 px-2 py-0.5 bg-black/70 border rounded text-[10px] font-mono pointer-events-none"
          style={{ borderColor: `${CLASSES[selectedClassId]?.color || '#57d1c9'}60` }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: CLASSES[selectedClassId]?.color || '#57d1c9' }}
          />
          <span
            className="font-bold tracking-wider"
            style={{ color: CLASSES[selectedClassId]?.color || '#57d1c9' }}
          >
            {CLASSES[selectedClassId]?.name || 'ASSAULT'}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-[#8b98a1]">{CLASSES[selectedClassId]?.perkName}</span>
        </div>

        {/* Health & Shield Bars */}
        <div id="bars">
          <div className="bar-row">
            <div className="bar-label">HP</div>
            <div className="bar-track">
              <div id="bar-fill-health" className="bar-fill health" style={{ width: `${stats.health}%` }} />
              <div id="bar-num-health" className="bar-num">{stats.health}</div>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">SH</div>
            <div className="bar-track">
              <div id="bar-fill-shield" className="bar-fill shield" style={{ width: `${stats.shield}%` }} />
              <div id="bar-num-shield" className="bar-num">{stats.shield}</div>
            </div>
          </div>
        </div>

        {/* Bottom Right Ammo & Weapon Readout */}
        <div id="bottom-right" className="panel">
          <div id="weapon-name">COMBAT PISTOL</div>
          <div id="ammo-readout">15 <span className="reserve">/ 60</span></div>
          <div id="reload-tag" />
        </div>

        {/* Bottom Center Hotbar Slots: Locked down to exactly 3 active assets */}
        <div id="bottom-center">
          <div className="hotbar-slot panel selected" id="slot-1">
            <div className="key">1</div>
            <div>{ARMORY_OPTIONS.find((o) => o.id === selectedPrimary)?.label?.toUpperCase() || 'PRIMARY'}</div>
          </div>
          <div className="hotbar-slot panel" id="slot-2">
            <div className="key">2</div>
            <div>{ARMORY_OPTIONS.find((o) => o.id === selectedSecondary)?.label?.toUpperCase() || 'SECONDARY'}</div>
          </div>
          <div className="hotbar-slot panel" id="slot-3">
            <div className="key">3 / G</div>
            <div>GRENADES (x3)</div>
          </div>
        </div>

        {/* Match Scoreboard */}
        <div id="match-scoreboard" className="panel">
          {matchMode === 'zombie' ? (
            <>
              <span className="score-zombie">WAVE <span>{stats.wave}</span></span>
              <span> | </span>
              <span className="score-red">ZOMBIES: <span>{stats.zombies}</span></span>
            </>
          ) : matchMode === 'team' ? (
            <>
              <span className="score-blue">BLUE <span>{stats.blueScore}</span></span>
              <span> vs </span>
              <span className="score-red"><span>{stats.redScore}</span> RED</span>
              <span className="score-target-tag">(TARGET: {targetScore})</span>
            </>
          ) : (
            <>
              <span className="score-blue">YOU <span>{stats.kills}</span></span>
              <span> | </span>
              <span className="score-target-tag">(TARGET: {targetScore})</span>
            </>
          )}
        </div>

        {/* Top Right Match Telemetry */}
        <div id="top-right" className="panel">
          <div className="row"><span className="label">KILLS</span><span id="telemetry-kills">{stats.kills}</span></div>
          <div className="row"><span className="label">TIME</span><span id="telemetry-time">{stats.time}</span></div>
          <div className="row"><span className="label">ZONE</span><span id="telemetry-zone">{stats.zoneStatus}</span></div>
          <div className="row"><span className="label">DIFF</span><span id="telemetry-diff">{difficultyKey.toUpperCase()}</span></div>
        </div>

        {/* Compass */}
        <div id="compass-wrap" className="panel">
          <div id="compass-strip" />
          <div id="compass-center-mark" />
        </div>

        {/* Killfeed */}
        <div id="killfeed" />
      </div>

      {/* Main Menu Lobby Overlay */}
      <div className={`overlay ${gameState === 'start' ? '' : 'hidden'}`}>
        <div className="overlay-box panel" style={{ width: '840px', maxWidth: '95vw' }}>
          <div className="overlay-title">GUN ARENA</div>
          <div className="overlay-sub">COMBAT SIMULATION & TACTICAL PROTOCOL</div>

          {/* Full Armory Expansion Highlight Banner */}
          <div className="mb-3 p-2.5 bg-[#57d1c9]/10 border border-[#57d1c9]/40 text-xs text-[#e8edf0] flex items-center justify-between rounded">
            <div>
              <span className="text-[#57d1c9] font-bold tracking-wider">FULL ARMORY EXPANSION:</span> <b>10 WEAPONS READY</b>
              <p className="text-[10px] text-[#8b98a1] mt-0.5">
                Assault Rifle, Shotgun, Sniper, Pistol, SMG, LMG, Battle Rifle, Plasma Laser, Heavy Minigun & Tactical Railgun.
              </p>
            </div>
            <button
              onClick={() => setShowAudioHelper(!showAudioHelper)}
              className="px-2.5 py-1 bg-[#57d1c9]/20 hover:bg-[#57d1c9]/40 border border-[#57d1c9] text-[10px] text-[#57d1c9] rounded cursor-pointer whitespace-nowrap ml-2 font-mono"
            >
              Audio Guide
            </button>
          </div>

          {/* Sound Attachment Helper Modal/Drawer */}
          {showAudioHelper && (
            <div className="mb-3 p-3 bg-black/80 border border-[#f5a623] text-xs text-[#e8edf0] rounded max-h-60 overflow-y-auto">
              <div className="font-bold text-[#f5a623] tracking-wide mb-1 flex items-center justify-between">
                <span>LOCAL AUDIO PRESERVATION MAPPING</span>
                <span className="text-[9px] text-[#8b98a1] font-normal">No synths • Zero overrides</span>
              </div>
              <p className="text-[11px] text-[#8b98a1] mb-2">
                All audio elements are mapped to clean relative local filenames. Drop matching audio files directly into your project root folder:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/40 p-2 border border-white/10 mb-2">
                <div>
                  <b className="text-[#57d1c9]">Weapon Firing:</b>
                  <ul className="list-disc pl-3 text-[#8b98a1] mt-1 space-y-0.5">
                    <li>Pistol: <code className="text-[#e8edf0]">pistol_fire.mp3</code></li>
                    <li>SMG: <code className="text-[#e8edf0]">smg_fire.mp3</code></li>
                    <li>LMG: <code className="text-[#e8edf0]">lmg_fire.mp3</code></li>
                    <li>Battle Rifle: <code className="text-[#e8edf0]">br_burst.mp3</code></li>
                    <li>Laser Beam: <code className="text-[#e8edf0]">laser_beam.mp3</code></li>
                  </ul>
                </div>
                <div>
                  <b className="text-[#57d1c9]">Weapon Reloading:</b>
                  <ul className="list-disc pl-3 text-[#8b98a1] mt-1 space-y-0.5">
                    <li>Sniper: <code className="text-[#e8edf0]">dragon-studio-gun-reload-2-511308.mp3</code></li>
                    <li>Pistol: <code className="text-[#e8edf0]">pistol_reload.mp3</code></li>
                    <li>SMG: <code className="text-[#e8edf0]">smg_reload.mp3</code></li>
                    <li>LMG: <code className="text-[#e8edf0]">lmg_reload.mp3</code></li>
                    <li>BR: <code className="text-[#e8edf0]">br_reload.mp3</code></li>
                    <li>Laser: <code className="text-[#e8edf0]">laser_vent.mp3</code></li>
                  </ul>
                </div>
              </div>
              <p className="text-[10px] text-[#8b98a1]">
                100% ready to sync up automatically the moment you download the game files to your desktop!
              </p>
            </div>
          )}

          {/* Battlefront-Style 5-Class Lineup & Armory Loadout Selection */}
          <div className="lobby-section">
            <div className="flex items-center justify-between mb-2">
              <div className="lobby-section-title mb-0">TACTICAL CLASS SELECTION & LOADOUT</div>
              <span className="text-[10px] text-[#8b98a1] uppercase font-mono">
                Active Perk: <span style={{ color: CLASSES[selectedClassId]?.color || '#57d1c9' }} className="font-bold">{CLASSES[selectedClassId]?.perkName}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {(Object.keys(CLASSES) as ClassId[]).map((clsKey) => {
                const cls = CLASSES[clsKey];
                const isSelected = selectedClassId === clsKey;
                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedPrimary(cls.defaultPrimary);
                      setSelectedSecondary(cls.defaultSecondary);
                    }}
                    style={{
                      borderColor: isSelected ? cls.color : 'rgba(232, 240, 244, 0.15)',
                      boxShadow: isSelected ? `0 0 10px ${cls.color}40` : 'none',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.45)'
                    }}
                    className="p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          style={{ color: cls.color }}
                          className="font-bold text-xs tracking-wider font-mono"
                        >
                          {cls.name}
                        </span>
                        {isSelected && (
                          <span
                            style={{ backgroundColor: cls.color }}
                            className="w-2 h-2 rounded-full shadow-sm"
                          />
                        )}
                      </div>
                      <div className="text-[9px] text-[#8b98a1] uppercase mt-0.5 font-mono">
                        {cls.tagline}
                      </div>

                      <div
                        style={{ borderColor: `${cls.color}40`, color: cls.color }}
                        className="mt-1.5 px-1.5 py-0.5 rounded bg-black/40 border text-[9px] font-mono leading-tight"
                      >
                        {cls.perkDesc}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-[#8b98a1] font-bold tracking-wider uppercase font-mono">
                          Primary
                        </label>
                        <select
                          className="bg-black/90 border border-white/20 text-[#e8edf0] text-[10px] py-1 px-1.5 rounded focus:border-[#57d1c9] outline-none font-mono cursor-pointer"
                          value={isSelected ? selectedPrimary : cls.defaultPrimary}
                          onChange={(e) => {
                            setSelectedClassId(cls.id);
                            setSelectedPrimary(e.target.value);
                          }}
                        >
                          {ARMORY_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              [{opt.slotNum}] {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-[#8b98a1] font-bold tracking-wider uppercase font-mono">
                          Secondary
                        </label>
                        <select
                          className="bg-black/90 border border-white/20 text-[#e8edf0] text-[10px] py-1 px-1.5 rounded focus:border-[#57d1c9] outline-none font-mono cursor-pointer"
                          value={isSelected ? selectedSecondary : cls.defaultSecondary}
                          onChange={(e) => {
                            setSelectedClassId(cls.id);
                            setSelectedSecondary(e.target.value);
                          }}
                        >
                          {ARMORY_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              [{opt.slotNum}] {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Loadout Summary Bar */}
            <div className="mt-2 p-2 bg-black/50 border border-white/10 rounded flex flex-wrap items-center justify-between text-[10px] font-mono text-[#8b98a1]">
              <div>
                <span className="text-white font-bold">DEPLOYING AS: </span>
                <span style={{ color: CLASSES[selectedClassId]?.color || '#57d1c9' }} className="font-bold">
                  {CLASSES[selectedClassId]?.name}
                </span>
                <span className="mx-1.5 text-white/30">|</span>
                <span>PRIMARY: </span>
                <b className="text-white">
                  {ARMORY_OPTIONS.find((o) => o.id === selectedPrimary)?.label || selectedPrimary}
                </b>
                <span className="mx-1.5 text-white/30">|</span>
                <span>SECONDARY: </span>
                <b className="text-white">
                  {ARMORY_OPTIONS.find((o) => o.id === selectedSecondary)?.label || selectedSecondary}
                </b>
              </div>
              <div className="text-[9px] text-[#57d1c9]">
                Hard-Locked 3-Slot Tactical Loadout (Keys 1-3 / Wheel)
              </div>
            </div>
          </div>

          <div className="lobby-section">
            <div className="lobby-section-title">MATCH MODE</div>
            <select
              className="mode-select"
              value={matchMode}
              onChange={(e) => setMatchMode(e.target.value as 'ffa' | 'team' | 'zombie')}
            >
              <option value="ffa">STANDARD FREE-FOR-ALL (DEATHMATCH)</option>
              <option value="team">RED VS. BLUE TEAM MATCH</option>
              <option value="zombie">ZOMBIE INFECTION SURVIVAL</option>
            </select>

            {matchMode !== 'ffa' && (
              <div className="cfg-row">
                <label>{matchMode === 'zombie' ? 'SURVIVOR ALLIES (0 = SOLO)' : 'FRIENDLY ALLIES (BLUE)'}</label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={friendlyCount}
                  onChange={(e) => setFriendlyCount(parseInt(e.target.value, 10))}
                />
                <span className="val-display">{friendlyCount}</span>
              </div>
            )}

            <div className="cfg-row">
              <label>{matchMode === 'zombie' ? 'ZOMBIES PER WAVE (BASE)' : 'ENEMY COMBATANTS'}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={enemyCount}
                onChange={(e) => setEnemyCount(parseInt(e.target.value, 10))}
              />
              <span className="val-display">{enemyCount}</span>
            </div>

            <div className="cfg-row">
              <label>{matchMode === 'zombie' ? 'STARTING WAVE' : 'TARGET KILLS TO WIN'}</label>
              <input
                type="range"
                min={matchMode === 'zombie' ? 1 : 5}
                max={matchMode === 'zombie' ? 15 : 50}
                step={matchMode === 'zombie' ? 1 : 5}
                value={targetScore}
                onChange={(e) => setTargetScore(parseInt(e.target.value, 10))}
              />
              <span className="val-display">{targetScore}</span>
            </div>
          </div>

          <div className="lobby-section">
            <div className="lobby-section-title">AI COMBAT DIFFICULTY</div>
            <div className="diff-row">
              {['easy', 'medium', 'hard'].map((d) => (
                <div
                  key={d}
                  className={`diff-btn ${difficultyKey === d ? 'selected' : ''}`}
                  onClick={() => setDifficultyKey(d)}
                >
                  {d.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          <div className="controls-guide">
            <b>WASD</b> Move &nbsp;|&nbsp; <b>Shift</b> Sprint &nbsp;|&nbsp; <b>Space</b> Jump &nbsp;|&nbsp; <b>Mouse</b> Aim/Look<br />
            <b>LMB</b> Fire &nbsp;|&nbsp; <b>RMB</b> Precision ADS &nbsp;|&nbsp; <b>R</b> Animated Reload &nbsp;|&nbsp; <b>F</b> Melee<br />
            <b>1</b> Primary &nbsp;|&nbsp; <b>2</b> Secondary &nbsp;|&nbsp; <b>3 / G</b> Grenades &nbsp;|&nbsp; <b>Scroll Wheel</b> Cycle Loadout
          </div>

          <div className="btn" id="btn-deploy">DEPLOY / START GAME</div>

          <div className="mt-3 text-center">
            <a
              href="https://ais-dev-mlmvjg57dudsycsch4poan-271150104517.asia-southeast1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#57d1c9] hover:underline flex items-center justify-center gap-1 opacity-90 hover:opacity-100"
            >
              <span>Launch Fullscreen In New Tab</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Pause Screen */}
      <div className={`overlay ${gameState === 'paused' ? '' : 'hidden'}`}>
        <div className="overlay-box panel" style={{ width: '420px' }}>
          <div className="overlay-title" style={{ fontSize: '22px' }}>PAUSED</div>
          <div className="overlay-sub">SYSTEM STANDBY</div>
          <div className="cfg-row mb-4">
            <label>SENSITIVITY</label>
            <input
              type="range"
              min="4"
              max="30"
              value={sensitivityVal}
              onChange={(e) => setSensitivityVal(parseInt(e.target.value, 10))}
            />
            <span className="val-display">{sensitivityVal}</span>
          </div>
          <div className="btn" id="btn-resume">RESUME MATCH</div>
          <div className="btn secondary" id="btn-to-lobby-pause">RETURN TO LOBBY</div>
          <div className="mt-3 text-center">
            <a
              href="https://ais-dev-mlmvjg57dudsycsch4poan-271150104517.asia-southeast1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#57d1c9] hover:underline inline-flex items-center gap-1"
            >
              <span>Play in Separate Full Tab</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Match Result Screen */}
      <div className={`overlay ${gameState === 'ended' ? '' : 'hidden'}`}>
        <div className="overlay-box panel" style={{ width: '440px' }}>
          <div className={`overlay-title text-center text-3xl font-bold ${endResult.victory ? 'text-[#57d1c9]' : 'text-[#e0473f]'}`}>
            {endResult.title}
          </div>
          <div className="overlay-sub text-center">{endResult.sub}</div>

          <div className="stat-row"><span className="label">Your Personal Kills</span><span>{stats.kills}</span></div>
          {matchMode === 'team' && (
            <>
              <div className="stat-row"><span className="label">Blue Team Score</span><span className="text-[#3f8fe0]">{stats.blueScore}</span></div>
              <div className="stat-row"><span className="label">Red Team Score</span><span className="text-[#e0473f]">{stats.redScore}</span></div>
            </>
          )}
          {matchMode === 'zombie' && (
            <div className="stat-row"><span className="label">Total Funds Earned</span><span className="text-[#f5a623]">${stats.funds}</span></div>
          )}
          <div className="stat-row"><span className="label">Match Duration</span><span>{stats.time}</span></div>

          <div className="btn mt-4" id="btn-restart-end">DEPLOY AGAIN</div>
          <div className="btn secondary" id="btn-to-lobby-end">RETURN TO LOBBY</div>
          <div className="mt-3 text-center">
            <a
              href="https://ais-dev-mlmvjg57dudsycsch4poan-271150104517.asia-southeast1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#57d1c9] hover:underline inline-flex items-center gap-1"
            >
              <span>Play in Separate Full Tab</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
