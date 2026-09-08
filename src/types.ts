import * as THREE from 'three';

export interface WeaponDef {
  id: string;
  name: string;
  type: 'weapon' | 'grenade' | 'consumable' | 'empty';
  damage?: number;
  headshotMult?: number;
  pellets?: number;
  spread?: number;
  adsSpread?: number;
  fireRate?: number;
  mag?: number;
  reserve?: number;
  reloadTime?: number;
  range?: number;
  auto?: boolean;
  burst?: boolean;
  burstCount?: number;
  burstRate?: number;
  isLaser?: boolean;
  isMinigun?: boolean;
  isRailgun?: boolean;
  adsFov?: number;
  scoped?: boolean;
  kick?: number;
  count?: number;
  maxCount?: number;
  radius?: number;
  healAmount?: number;
  maxHealCap?: number;
  useTime?: number;
}

export interface WeaponSlotState {
  ammo?: number;
  reserve?: number;
  reloading?: boolean;
  reloadT?: number;
  totalReloadT?: number;
  isTacticalReload?: boolean;
  lastFired?: number;
  count?: number;
  using?: boolean;
  heat?: number;
  overheated?: boolean;
  burstRemaining?: number;
  burstTimer?: number;
  spinWarmup?: number;
  spinSpeed?: number;
  ventTimer?: number;
  chargeTimer?: number;
  charging?: boolean;
}

export interface Bot {
  id: number;
  team: string;
  isZombie: boolean;
  zType: 'walker' | 'runner' | 'tank';
  kills: number;
  meleeDmg: number;
  meleeCooldown: number;
  group: THREE.Group;
  torsoGroup: THREE.Group;
  armLPivot: THREE.Group;
  armRPivot: THREE.Group;
  legLPivot: THREE.Group;
  legRPivot: THREE.Group;
  gunMesh: THREE.Group | null;
  muzzleFlash: THREE.Sprite | null;
  muzzleFlashT: number;
  weaponTypeIndex: number;
  weaponType: string;
  flashMats: THREE.MeshStandardMaterial[];
  hitParts: THREE.Mesh[];
  healthEl: HTMLDivElement;
  fillEl: HTMLDivElement;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facing: number;
  health: number;
  maxHealth: number;
  speed: number;
  walkPhase: number;
  preferredRange: number;
  strafeDir: number;
  strafeTimer: number;
  target: Bot | 'player' | null;
  waypoint: THREE.Vector3 | null;
  waypointTimer: number;
  fireTimer: number;
  alive: boolean;
  deathT: number;
  fallAxis: 'x' | 'z';
  fallDir: number;
}

export interface WorldCollider {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  active: boolean;
  isDoor?: boolean;
}

export interface Door {
  hingeGroup: THREE.Group;
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  isOpen: boolean;
  currentAngle: number;
  targetAngle: number;
  collider: WorldCollider;
}

export interface GroundPickup {
  group: THREE.Group;
  typeIndex: number;
  ammo: number;
  label: string;
}

export interface ActiveGrenade {
  group: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
  timeAlive: number;
  maxFuse: number;
  hasHitGround: boolean;
  ownerTeam: string;
}

export interface ExplosionEffect {
  mesh: THREE.Mesh;
  light: THREE.PointLight | null;
  scale: number;
  life: number;
}

export interface MatchConfig {
  mode: 'ffa' | 'team' | 'zombie';
  friendlyCount: number;
  enemyCount: number;
  targetScore: number;
  startingWave: number;
}

export interface DifficultyConfig {
  label: string;
  botHealthMult: number;
  botDamageMult: number;
  botFireRateMult: number;
  botAccuracy: number;
}

export type ClassId = 'assault' | 'recon' | 'breacher' | 'juggernaut' | 'vanguard';

export interface ClassConfig {
  id: ClassId;
  name: string;
  tagline: string;
  perkName: string;
  perkDesc: string;
  color: string;
  defaultPrimary: string;
  defaultSecondary: string;
  reloadMultiplier: number;
  speedMultiplier: number;
  maxHealth: number;
  initialHealth: number;
  maxShield: number;
  initialShield: number;
}

export interface ArmoryOption {
  id: string;
  label: string;
  slotNum: string;
}
