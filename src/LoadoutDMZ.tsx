import React, { useState } from 'react';
import { ClassId } from './types';
import { CLASSES } from './App';
import { VisorType } from './lobbyAvatar';
import { HELMET_LOCKER_OPTIONS } from './LobbyTerminal';

export interface WeaponVaultItem {
  id: string;
  name: string;
  category: string;
  caliber: string;
  fireMode: string;
  description: string;
  damage: number;
  fireRate: number;
  range: number;
  accuracy: number;
  recoilControl: number;
  mobility: number;
  rounds: number;
  reserve: number;
  level: string;
  levelProgress: number; // 0 - 100
  affinity: string;
  isInsuredEligible?: boolean;
}

export const VAULT_WEAPONS: Record<string, WeaponVaultItem> = {
  ar: {
    id: 'ar',
    name: 'M4A1 TACTICAL',
    category: 'ASSAULT RIFLE',
    caliber: '5.56x45mm NATO',
    fireMode: 'FULL AUTO',
    description: 'Versatile military service rifle engineered for controlled mid-range engagements. High projectile velocity combined with predictable vertical recoil and fast magazine handling.',
    damage: 68,
    fireRate: 74,
    range: 70,
    accuracy: 76,
    recoilControl: 78,
    mobility: 72,
    rounds: 30,
    reserve: 150,
    level: 'LEVEL 28/30',
    levelProgress: 93,
    affinity: 'NATO SPEC-OPS'
  },
  shotgun: {
    id: 'shotgun',
    name: 'HAYMAKER 12G',
    category: 'SHOTGUN',
    caliber: '12-GAUGE 00 BUCK',
    fireMode: 'PUMP ACTION',
    description: 'Heavy-bore pump-action tactical shotgun delivering devastating kinetic pellet spread. Excels in breach corridors, doorway ambushes, and point-blank CQB encounters.',
    damage: 94,
    fireRate: 34,
    range: 30,
    accuracy: 44,
    recoilControl: 46,
    mobility: 66,
    rounds: 6,
    reserve: 36,
    level: 'LEVEL 19/25',
    levelProgress: 76,
    affinity: 'CQC BREACH'
  },
  sniper: {
    id: 'sniper',
    name: 'HEAVY AP SNIPER',
    category: 'PRECISION RIFLE',
    caliber: '.50 BMG ANTI-MATERIEL',
    fireMode: 'BOLT ACTION',
    description: 'Extreme-range anti-materiel sniper rifle with high-magnification ballistic optic. High-velocity projectile delivers guaranteed one-shot terminal trauma to target hostiles.',
    damage: 98,
    fireRate: 18,
    range: 98,
    accuracy: 96,
    recoilControl: 24,
    mobility: 40,
    rounds: 5,
    reserve: 20,
    level: 'MAX LEVEL (30/30)',
    levelProgress: 100,
    affinity: 'OVERWATCH'
  },
  pistol: {
    id: 'pistol',
    name: 'COMBAT 9MM',
    category: 'SIDEARM',
    caliber: '9x19mm PARABELLUM',
    fireMode: 'SEMI AUTO',
    description: 'Lightweight tactical sidearm featuring rapid trigger reset and crisp combat sights. Immediate draw-to-fire transition makes it an essential contingency backup.',
    damage: 48,
    fireRate: 62,
    range: 46,
    accuracy: 72,
    recoilControl: 84,
    mobility: 96,
    rounds: 15,
    reserve: 60,
    level: 'LEVEL 14/20',
    levelProgress: 70,
    affinity: 'BACKUP SERVICE'
  },
  smg: {
    id: 'smg',
    name: 'VEL-46 SUBMACHINE',
    category: 'SUBMACHINE GUN',
    caliber: '4.6x30mm AP',
    fireMode: 'FULL AUTO',
    description: 'High-cadence personal defense weapon engineered for aggressive flanking and CQB room clearance. Devastating close-range rate of fire compensates for reduced muzzle range.',
    damage: 54,
    fireRate: 94,
    range: 44,
    accuracy: 64,
    recoilControl: 58,
    mobility: 92,
    rounds: 32,
    reserve: 192,
    level: 'LEVEL 26/30',
    levelProgress: 86,
    affinity: 'INFILTRATION'
  },
  lmg: {
    id: 'lmg',
    name: 'SAKIN HEAVY LMG',
    category: 'LIGHT MACHINE GUN',
    caliber: '7.62x51mm NATO',
    fireMode: 'FULL AUTO',
    description: 'Sustained-fire squad automatic weapon equipped with a 100-round continuous drum. Unrivaled suppression capabilities to hold chokepoints against advancing hostile squads.',
    damage: 78,
    fireRate: 68,
    range: 80,
    accuracy: 66,
    recoilControl: 54,
    mobility: 44,
    rounds: 100,
    reserve: 300,
    level: 'LEVEL 21/28',
    levelProgress: 75,
    affinity: 'SQUAD SUPPRESSION'
  },
  br: {
    id: 'br',
    name: 'TAQ-V BATTLE RIFLE',
    category: 'BATTLE RIFLE',
    caliber: '7.62x51mm HV',
    fireMode: '3-ROUND BURST',
    description: 'Hard-hitting precision rifle operating on a synchronized 3-round burst grouping. Delivers high terminal kinetic shock at mid to long combat ranges.',
    damage: 82,
    fireRate: 58,
    range: 86,
    accuracy: 88,
    recoilControl: 68,
    mobility: 64,
    rounds: 36,
    reserve: 180,
    level: 'LEVEL 25/30',
    levelProgress: 83,
    affinity: 'MID-LONG RECON'
  },
  laser: {
    id: 'laser',
    name: 'PLASMA BEAM RIFLE',
    category: 'DIRECTED ENERGY',
    caliber: 'SUPERHEATED ION BEAM',
    fireMode: 'CONTINUOUS BEAM',
    description: 'High-energy directed plasma firearm utilizing micro-capacitor coils. Strips personal kinetic shielding and melts hostile plating through relentless concentrated energy transfer.',
    damage: 70,
    fireRate: 92,
    range: 66,
    accuracy: 92,
    recoilControl: 92,
    mobility: 74,
    rounds: 100,
    reserve: 100,
    level: 'LEVEL 18/25',
    levelProgress: 72,
    affinity: 'ENERGY TECH'
  },
  minigun: {
    id: 'minigun',
    name: 'VULCAN ROTARY CANNON',
    category: 'SPECIAL HEAVY',
    caliber: '7.62x51mm ROTARY',
    fireMode: 'MOTORIZED FULL AUTO',
    description: 'Motorized multi-barrel rotary cannon delivering overwhelming cyclic suppression. Continuous belt-fed ammunition feed destroys heavy defenses and hostile swarms.',
    damage: 74,
    fireRate: 98,
    range: 74,
    accuracy: 52,
    recoilControl: 42,
    mobility: 32,
    rounds: 999,
    reserve: 999,
    level: 'LEVEL 15/20',
    levelProgress: 75,
    affinity: 'HEAVY TITAN'
  },
  railgun: {
    id: 'railgun',
    name: 'KINETIC AP RAILGUN',
    category: 'ELECTROMAGNETIC',
    caliber: '15mm TUNGSTEN SLUG',
    fireMode: 'CHARGED SLUG',
    description: 'Electromagnetic accelerator launching solid hyper-velocity tungsten slugs. High linear kinetic transfer obliterates armor and pierces targets in direct ballistic trajectories.',
    damage: 100,
    fireRate: 16,
    range: 100,
    accuracy: 98,
    recoilControl: 20,
    mobility: 36,
    rounds: 1,
    reserve: 30,
    level: 'MAX LEVEL (20/20)',
    levelProgress: 100,
    affinity: 'ANTI-MATERIEL AP'
  }
};

// Tactical Ordnance for Insured Slot 3
export const ORDNANCE_ITEM: WeaponVaultItem = {
  id: 'grenade',
  name: 'M67 FRAG GRENADE',
  category: 'TACTICAL ORDNANCE',
  caliber: 'HIGH-EXPLOSIVE COMP-B',
  fireMode: 'TIMED FUSE (3.2S)',
  description: 'Military fragmentation grenade with internal delay fuse. Produces high-velocity steel shrapnel over a 7.5-meter lethal radius to flush out entrenched hostile combatants.',
  damage: 96,
  fireRate: 35,
  range: 55,
  accuracy: 82,
  recoilControl: 100,
  mobility: 90,
  rounds: 3,
  reserve: 6,
  level: 'MAX LEVEL',
  levelProgress: 100,
  affinity: 'TACTICAL ORDNANCE'
};

// Render crisp, military white line-art silhouettes for every weapon with uniform stroke and tactical realism
export const WeaponSilhouette: React.FC<{ id: string; className?: string }> = ({ id, className = 'w-full h-full' }) => {
  const stroke = '#FFFFFF';
  const strokeWidth = 1.5;

  switch (id) {
    case 'ar':
      // 1. M4A1 Tactical: Magpul collapsible stock, Picatinny top rail, quad-rail handguard, 30-rnd curved Stanag mag
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Magpul-Style Collapsible Stock with adjustment lock & buffer tube */}
          <path d="M 6 18 L 14 18 L 14 34 L 6 36 Z" />
          <line x1="14" y1="21" x2="36" y2="21" />
          <line x1="14" y1="26" x2="36" y2="26" />
          <path d="M 14 31 L 28 26 L 33 26" />
          <rect x="22" y="27" width="5" height="2.5" rx="0.5" />
          {/* Receiver & Picatinny Top Rail */}
          <path d="M 36 21 L 84 21 L 84 27 L 76 27 L 68 27 L 64 27 L 54 27 L 50 27 L 46 27 L 36 27 Z" />
          {/* Top Picatinny Rail Teeth */}
          <line x1="36" y1="19" x2="84" y2="19" />
          <line x1="40" y1="19" x2="40" y2="21" />
          <line x1="48" y1="19" x2="48" y2="21" />
          <line x1="56" y1="19" x2="56" y2="21" />
          <line x1="64" y1="19" x2="64" y2="21" />
          <line x1="72" y1="19" x2="72" y2="21" />
          <line x1="80" y1="19" x2="80" y2="21" />
          {/* Brass Deflector & Ejection Dust Cover */}
          <path d="M 52 22 L 56 24 L 52 24 Z" />
          <rect x="58" y="22" width="10" height="3" />
          {/* Ergonomic Pistol Grip & Trigger Assembly */}
          <path d="M 46 27 L 41 41 L 48 43 L 53 27" />
          <path d="M 53 30 C 53 34, 61 34, 61 30" />
          <path d="M 57 31 L 56 33" />
          {/* Standard 30-round Curved Magazine with Ribbing */}
          <path d="M 64 27 L 62 38 L 68 46 L 78 44 L 74 37 L 75 27" />
          <line x1="68" y1="46" x2="78" y2="44" />
          <line x1="65" y1="36" x2="74" y2="34" />
          <line x1="67" y1="41" x2="76" y2="39" />
          {/* Quad-Rail Handguard Texture & Delta Ring */}
          <rect x="84" y="20" width="3" height="7" />
          <line x1="87" y1="20" x2="126" y2="20" />
          <line x1="87" y1="27" x2="126" y2="27" />
          {/* Quad-Rail Texture Vent Slots */}
          <line x1="91" y1="22" x2="91" y2="25" />
          <line x1="97" y1="22" x2="97" y2="25" />
          <line x1="103" y1="22" x2="103" y2="25" />
          <line x1="109" y1="22" x2="109" y2="25" />
          <line x1="115" y1="22" x2="115" y2="25" />
          <line x1="121" y1="22" x2="121" y2="25" />
          {/* A2 Front Sight Base / Gas Block */}
          <path d="M 126 24 L 130 16 L 134 24" />
          <line x1="128" y1="24" x2="128" y2="27" />
          {/* Barrel & Flash Hider */}
          <line x1="134" y1="23.5" x2="148" y2="23.5" />
          <rect x="148" y="22" width="7" height="3" />
          <line x1="151" y1="22" x2="151" y2="25" />
        </svg>
      );
    case 'shotgun':
      // 2. Tactical Pump Shotgun (Realistic Rem 870 / Mossberg 590 style)
      // Needs to look realistic: thin-lined, accurate proportions
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Tactical Stock */}
          <path d="M 12 21 L 20 21 L 28 25 L 42 25 L 42 29 L 26 39 L 14 39 L 10 33 Z" />
          <line x1="15" y1="22" x2="15" y2="38" />
          {/* Receiver */}
          <path d="M 42 24 L 78 24 L 78 30 L 48 30 L 44 42 L 36 40 L 42 29 L 42 29 Z" />
          <rect x="54" y="25.5" width="12" height="2.5" />
          {/* Trigger Guard */}
          <path d="M 48 30 C 48 35, 58 35, 58 30" />
          <path d="M 53 31 L 52 34" />
          {/* Heat Shield over Barrel */}
          <path d="M 80 23 L 130 23" />
          {/* Magazine Tube */}
          <line x1="78" y1="30" x2="132" y2="30" />
          <rect x="132" y="28.5" width="4" height="3" rx="0.5" />
          {/* Pump Handguard */}
          <rect x="84" y="27" width="30" height="6.5" rx="1" />
          <line x1="88" y1="27" x2="88" y2="33.5" />
          <line x1="93" y1="27" x2="93" y2="33.5" />
          <line x1="98" y1="27" x2="98" y2="33.5" />
          <line x1="103" y1="27" x2="103" y2="33.5" />
          <line x1="108" y1="27" x2="108" y2="33.5" />
          {/* Barrel */}
          <line x1="78" y1="26" x2="148" y2="26" />
          {/* Front Sight */}
          <rect x="144" y="24" width="2" height="2" />
        </svg>
      );
    case 'sniper':
      // 3. Heavy AP Sniper: Clean, modern bolt-action tactical sniper
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Tactical Precision Stock */}
          <path d="M 6 22 L 14 22 L 20 25 L 44 25 L 42 36 L 36 36 L 38 28 L 18 28 L 14 34 L 6 34 Z" />
          {/* Cheek Riser */}
          <path d="M 16 19 L 32 19 L 32 22 L 16 22 Z" />
          {/* Receiver & Grip */}
          <path d="M 44 24 L 78 24 L 78 28 L 72 28 L 68 30 L 52 30 L 48 38 L 42 37 L 44 28 Z" />
          <path d="M 52 30 C 52 34, 60 34, 60 30" />
          <line x1="56" y1="31" x2="55" y2="33" />
          {/* Bolt Handle */}
          <circle cx="48" cy="22" r="1.5" />
          <line x1="48" y1="22" x2="52" y2="26" />
          {/* Modern High-Power Scope */}
          <path d="M 52 16 L 62 18 L 92 18 L 102 14 L 104 22 L 98 20 L 62 20 L 52 20 Z" />
          <line x1="68" y1="20" x2="68" y2="24" />
          <line x1="88" y1="20" x2="88" y2="24" />
          {/* Scope Turrets */}
          <rect x="74" y="14" width="6" height="4" rx="0.5" />
          <line x1="77" y1="14" x2="77" y2="18" />
          <rect x="80" y="16" width="3" height="3" />
          {/* Magazine */}
          <path d="M 62 30 L 60 38 L 70 38 L 72 30 Z" />
          <line x1="64" y1="32" x2="68" y2="32" />
          <line x1="64" y1="35" x2="68" y2="35" />
          {/* Fluted Free-Floating Barrel */}
          <line x1="78" y1="26" x2="148" y2="26" strokeWidth={1.8} />
          {/* Fluting */}
          <line x1="86" y1="25" x2="136" y2="25" strokeDasharray="6,4" strokeWidth={0.8} />
          {/* Massive Muzzle Brake */}
          <rect x="148" y="24" width="8" height="4" rx="0.5" />
          <line x1="150" y1="24" x2="150" y2="28" />
          <line x1="154" y1="24" x2="154" y2="28" />
          {/* Bipod (Folded) */}
          <line x1="116" y1="28" x2="100" y2="31" strokeWidth={1.5} />
          <line x1="100" y1="31" x2="96" y2="31" />
        </svg>
      );
    case 'pistol':
      // 4. Combat 9mm: Realistic proportions, slide aligns with frame and grip
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Slide Silhouette with Front & Rear Sights */}
          <path d="M 64 17 L 110 17 L 110 24 L 64 24 Z" />
          <rect x="65" y="14" width="3" height="3" />
          <rect x="106" y="14" width="2" height="3" />
          {/* Rear Cocking Serrations */}
          <line x1="68" y1="18" x2="68" y2="23" />
          <line x1="71" y1="18" x2="71" y2="23" />
          <line x1="74" y1="18" x2="74" y2="23" />
          {/* Front Cocking Serrations */}
          <line x1="100" y1="18" x2="100" y2="23" />
          <line x1="103" y1="18" x2="103" y2="23" />
          {/* Lower Frame / Dust Cover */}
          <path d="M 64 24 L 110 24 L 110 27 L 88 27 L 88 33 L 74 33 L 74 24 Z" />
          {/* Frame Accessory Rail */}
          <line x1="92" y1="26" x2="108" y2="26" />
          <line x1="96" y1="24" x2="96" y2="26" />
          <line x1="102" y1="24" x2="102" y2="26" />
          {/* Square Undercut Trigger Guard */}
          <path d="M 74 27 L 84 27 L 84 33 L 74 33" />
          <path d="M 77 28 C 77 31, 80 32, 82 31" />
          {/* Beavertail & Ergonomic Grip properly aligned */}
          <path d="M 64 24 L 56 26 L 64 43 L 76 43 L 74 33 L 74 24" />
          {/* Flush-Fitting Box Magazine Baseplate */}
          <rect x="63" y="43" width="14" height="3" rx="0.5" />
        </svg>
      );
    case 'smg':
      // 5. Compact SMG (MP7 / Vel-46 style): clean, proper proportions
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Wire Stock */}
          <path d="M 16 19 L 16 33" strokeWidth={1.8} />
          <line x1="16" y1="21" x2="36" y2="21" />
          <line x1="16" y1="27" x2="36" y2="27" />
          {/* Receiver / Body */}
          <path d="M 36 21 L 118 21 L 118 27 L 76 27 L 68 27 L 54 27 L 50 27 L 46 27 L 36 27 Z" />
          {/* Pistol Grip (houses the magazine) */}
          <path d="M 46 27 L 42 41 L 52 41 L 54 27" />
          {/* Trigger Guard */}
          <path d="M 54 27 L 54 32 L 64 32 C 62 29, 62 28, 62 27" />
          {/* Extended Magazine extending below grip */}
          <rect x="44" y="41" width="6" height="6" />
          {/* Top Optics Rail */}
          <line x1="42" y1="19" x2="114" y2="19" />
          <line x1="46" y1="19" x2="46" y2="21" />
          <line x1="60" y1="19" x2="60" y2="21" />
          <line x1="74" y1="19" x2="74" y2="21" />
          <line x1="88" y1="19" x2="88" y2="21" />
          <line x1="102" y1="19" x2="102" y2="21" />
          {/* Foldable Front Grip */}
          <path d="M 98 27 L 96 38 L 102 38 L 104 27" />
          {/* Barrel & Flash Hider */}
          <line x1="118" y1="24" x2="128" y2="24" strokeWidth={1.8} />
          <rect x="128" y="22" width="6" height="4" />
        </svg>
      );
    case 'lmg':
      // 6. Heavy LMG (M249 SAW / PKM style): Ammo box, carry handle, bipod
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Bulky Fixed Stock */}
          <path d="M 8 20 L 20 20 L 26 24 L 40 24 L 40 34 L 18 34 L 10 30 Z" />
          {/* Receiver */}
          <path d="M 40 24 L 98 24 L 98 28 L 50 28 L 46 39 L 38 38 L 42 28 L 40 28 Z" />
          <path d="M 46 28 C 46 32, 54 32, 54 28" />
          {/* Carry Handle */}
          <path d="M 68 24 L 72 16 L 86 16 L 90 24" />
          <rect x="74" y="14" width="10" height="3" />
          {/* Box Magazine (Ammo Box) */}
          <rect x="62" y="28" width="22" height="16" rx="1" />
          <line x1="66" y1="28" x2="66" y2="44" />
          <line x1="78" y1="28" x2="78" y2="44" />
          {/* Handguard / Heat Shield */}
          <path d="M 98 24 L 126 24 L 126 29 L 98 29 Z" />
          <line x1="102" y1="24" x2="102" y2="29" />
          <line x1="108" y1="24" x2="108" y2="29" />
          <line x1="114" y1="24" x2="114" y2="29" />
          <line x1="120" y1="24" x2="120" y2="29" />
          {/* Heavy Barrel */}
          <line x1="126" y1="26.5" x2="148" y2="26.5" strokeWidth={2} />
          {/* Front Sight */}
          <path d="M 136 25 L 140 18 L 144 25" />
          {/* Muzzle */}
          <rect x="148" y="25" width="4" height="3" />
          {/* Bipod (Folded Forward) */}
          <line x1="124" y1="29" x2="140" y2="33" strokeWidth={1.5} />
          <line x1="140" y1="33" x2="144" y2="31" />
        </svg>
      );
    case 'br':
      // 7. Battle Rifle (Halo 2 BR style): Bullpup design, integrated carry handle scope, thumbhole stock
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Bullpup Stock / Rear Receiver */}
          <path d="M 12 20 L 46 20 L 46 34 L 38 34 L 38 42 L 24 42 L 20 34 L 12 34 Z" />
          {/* Thumbhole Cutout */}
          <path d="M 22 24 L 36 24 L 36 30 L 22 30 Z" />
          {/* Angled Bullpup Magazine */}
          <path d="M 28 34 L 24 46 L 36 46 L 38 34" />
          {/* Main Forward Receiver & Grip */}
          <path d="M 46 22 L 96 22 L 96 28 L 76 28 L 68 38 L 56 38 L 58 28 L 46 28 Z" />
          {/* Trigger Guard */}
          <path d="M 58 28 L 58 33 L 64 33 C 64 30, 62 29, 62 28" />
          {/* Iconic Integrated Carry Handle / Scope */}
          <path d="M 40 20 L 46 12 L 80 12 L 86 20" />
          <line x1="50" y1="12" x2="50" y2="20" />
          <line x1="76" y1="12" x2="76" y2="20" />
          {/* Scope Optics (Top of Handle) */}
          <rect x="42" y="8" width="40" height="4" rx="1" />
          <line x1="48" y1="8" x2="48" y2="12" />
          <line x1="76" y1="8" x2="76" y2="12" />
          {/* Handguard */}
          <path d="M 96 22 L 122 22 L 122 26 L 96 26 Z" />
          <line x1="102" y1="22" x2="102" y2="26" />
          <line x1="108" y1="22" x2="108" y2="26" />
          <line x1="114" y1="22" x2="114" y2="26" />
          {/* Heavy Barrel */}
          <line x1="122" y1="24" x2="148" y2="24" strokeWidth={2} />
          {/* Distinct Muzzle Brake */}
          <rect x="148" y="22" width="6" height="4" rx="0.5" />
        </svg>
      );
    case 'laser':
      // 8. Plasma Rifle (Halo Reach style): Condensed, rounded alien curves, dual prongs
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Main Body Curve */}
          <path d="M 40 18 C 60 12, 90 12, 110 18 L 120 22 C 120 28, 100 36, 80 34 C 60 36, 40 28, 40 22 Z" />
          {/* Top Prong */}
          <path d="M 110 18 C 125 18, 135 20, 140 22 L 120 22" />
          {/* Bottom Prong */}
          <path d="M 120 22 L 140 22 C 135 24, 125 26, 110 26" />
          {/* Heat Vents / Scales on the body */}
          <path d="M 50 18 C 60 16, 70 16, 80 18" strokeWidth={1} />
          <path d="M 55 22 C 65 20, 75 20, 85 22" strokeWidth={1} />
          <path d="M 60 26 C 70 24, 80 24, 90 26" strokeWidth={1} />
          {/* Trigger Grip area (Integrated smoothly) */}
          <path d="M 60 33 C 58 40, 56 46, 52 46 C 48 46, 46 40, 48 33" />
          {/* Trigger Guard (Organic) */}
          <path d="M 60 33 C 66 33, 70 30, 72 26" />
          {/* Energy Core / Emitter */}
          <circle cx="130" cy="22" r="2" />
          <circle cx="90" cy="22" r="4" />
        </svg>
      );
    case 'minigun':
      // 9. Vulcan Rotary Cannon: Scaled six-barrel cluster array, top feeding housing, dual-handle spade grip assembly
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Dual-Handle Butterfly Spade Grip Assembly at Rear */}
          <path d="M 14 16 L 14 36" strokeWidth={2.4} />
          <path d="M 14 18 L 28 22" />
          <path d="M 14 34 L 28 30" />
          <rect x="16" y="24" width="3" height="4" rx="0.5" />
          {/* Main Electric Motor Drive Cylinder Housing */}
          <rect x="28" y="18" width="44" height="16" rx="2" />
          <ellipse cx="50" cy="26" rx="6" ry="4" />
          {/* Detailed Top-Mounted Delinking Feed Housing & Motor Assembly */}
          <rect x="36" y="11" width="34" height="8" rx="1" />
          <path d="M 44 11 L 48 7 L 60 7 L 64 11" />
          <circle cx="54" cy="15" r="2.5" />
          {/* Scaled Prominent 6-Barrel Cluster Array */}
          <line x1="72" y1="19" x2="152" y2="19" strokeWidth={1.6} />
          <line x1="72" y1="22" x2="152" y2="22" strokeWidth={1.6} />
          <line x1="72" y1="25" x2="152" y2="25" strokeWidth={1.6} />
          <line x1="72" y1="28" x2="152" y2="28" strokeWidth={1.6} />
          <line x1="72" y1="31" x2="152" y2="31" strokeWidth={1.6} />
          <line x1="72" y1="34" x2="152" y2="34" strokeWidth={1.6} />
          {/* Barrel Clamping Collars */}
          <rect x="108" y="17" width="5" height="19" rx="0.5" />
          <rect x="142" y="17" width="6" height="19" rx="0.5" />
        </svg>
      );
    case 'railgun':
      // 10. Kinetic AP Railgun: Top and bottom heavy parallel structural bars, internal coil segmentation lines
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <g transform="scale(0.9, 1) translate(8, 0)">
            {/* Heavy Capacitor Stock & Receiver */}
            <path d="M 12 18 L 56 18 L 56 32 L 46 41 L 34 40 L 38 32 L 12 32 Z" />
            {/* Capacitor Bank Cells */}
            <rect x="18" y="20" width="7" height="9" rx="0.5" />
            <rect x="28" y="20" width="7" height="9" rx="0.5" />
            <rect x="38" y="20" width="7" height="9" rx="0.5" />
            {/* Top and Bottom Heavy Parallel Electromagnetic Structural Rails */}
            <path d="M 56 16 L 152 16 L 152 21 L 56 21 Z" strokeWidth={1.8} />
            <path d="M 56 29 L 152 29 L 152 34 L 56 34 Z" strokeWidth={1.8} />
            {/* Internal Accelerator Coil Segmentation Lines */}
            <line x1="68" y1="21" x2="68" y2="29" />
            <line x1="76" y1="21" x2="76" y2="29" />
            <line x1="84" y1="21" x2="84" y2="29" />
            <line x1="92" y1="21" x2="92" y2="29" />
            <line x1="100" y1="21" x2="100" y2="29" />
            <line x1="108" y1="21" x2="108" y2="29" />
            <line x1="116" y1="21" x2="116" y2="29" />
            <line x1="124" y1="21" x2="124" y2="29" />
            <line x1="132" y1="21" x2="132" y2="29" />
            <line x1="140" y1="21" x2="140" y2="29" />
            {/* Central Magnetic Acceleration Bore Flight Path */}
            <line x1="56" y1="25" x2="154" y2="25" strokeDasharray="4,2" strokeWidth={1.2} />
            {/* Angled Heavy Muzzle Stabilizer Crown */}
            <path d="M 148 14 L 155 18 L 155 32 L 148 36 Z" />
          </g>
        </svg>
      );
    case 'grenade':
    default:
      return (
        <svg viewBox="0 0 160 50" className={className} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* M67 Fragmentation Grenade */}
          <circle cx="80" cy="28" r="12" />
          <line x1="68" y1="28" x2="92" y2="28" strokeWidth={1.2} />
          <line x1="80" y1="16" x2="80" y2="40" strokeWidth={1.2} />
          {/* Fuse Collar, Lever & Safety Ring */}
          <rect x="76" y="12" width="8" height="5" />
          <path d="M 84 14 C 92 14, 94 22, 93 30" strokeWidth={1.8} />
          <circle cx="73" cy="14" r="3" />
        </svg>
      );
  }
};

interface LoadoutDMZProps {
  selectedPrimary: string;
  setSelectedPrimary: (id: string) => void;
  selectedSecondary: string;
  setSelectedSecondary: (id: string) => void;
  selectedClassId: ClassId;
  setSelectedClassId: (id: ClassId) => void;
  visorType: VisorType;
  setVisorType: (type: VisorType) => void;
  onDeploy: () => void;
}

export const LoadoutDMZ: React.FC<LoadoutDMZProps> = ({
  selectedPrimary,
  setSelectedPrimary,
  selectedSecondary,
  setSelectedSecondary,
  selectedClassId,
  setSelectedClassId,
  visorType,
  setVisorType,
  onDeploy
}) => {
  // Currently inspected weapon in Left Preview Pane (defaults to active primary)
  const [previewId, setPreviewId] = useState<string>(selectedPrimary || 'ar');
  // Target slot to replace when assigning ('slot1' | 'slot2')
  const [targetAssignSlot, setTargetAssignSlot] = useState<'slot1' | 'slot2'>('slot1');
  // Optional category filter in contraband stash
  const [stashFilter, setStashFilter] = useState<'ALL' | 'RIFLE' | 'CQB' | 'HEAVY' | 'TECH'>('ALL');
  // Show quick operator drawer
  const [showOperatorPanel, setShowOperatorPanel] = useState<boolean>(false);

  const activeWeapon: WeaponVaultItem = VAULT_WEAPONS[previewId] || VAULT_WEAPONS.ar;
  const primaryItem: WeaponVaultItem = VAULT_WEAPONS[selectedPrimary] || VAULT_WEAPONS.ar;
  const secondaryItem: WeaponVaultItem = VAULT_WEAPONS[selectedSecondary] || VAULT_WEAPONS.pistol;

  // Filter contraband stash
  const stashList = Object.values(VAULT_WEAPONS).filter((item) => {
    if (stashFilter === 'ALL') return true;
    if (stashFilter === 'RIFLE') return ['ASSAULT RIFLE', 'BATTLE RIFLE', 'PRECISION RIFLE'].includes(item.category);
    if (stashFilter === 'CQB') return ['SHOTGUN', 'SIDEARM', 'SUBMACHINE GUN'].includes(item.category);
    if (stashFilter === 'HEAVY') return ['LIGHT MACHINE GUN', 'SPECIAL HEAVY'].includes(item.category);
    if (stashFilter === 'TECH') return ['DIRECTED ENERGY', 'ELECTROMAGNETIC'].includes(item.category);
    return true;
  });

  const isEquippedSlot1 = selectedPrimary === activeWeapon.id;
  const isEquippedSlot2 = selectedSecondary === activeWeapon.id;

  const handleEquipSlot1 = () => {
    // If equipping same as secondary, swap them
    if (selectedSecondary === activeWeapon.id) {
      setSelectedSecondary(selectedPrimary);
    }
    setSelectedPrimary(activeWeapon.id);
  };

  const handleEquipSlot2 = () => {
    // If equipping same as primary, swap them
    if (selectedPrimary === activeWeapon.id) {
      setSelectedPrimary(selectedSecondary);
    }
    setSelectedSecondary(activeWeapon.id);
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-80px)] p-4 sm:p-6 flex flex-col pointer-events-auto select-none font-mono overflow-hidden">
      {/* --------------------------------------------------------------------- */}
      {/* Top Header Strip: Clean DMZ Military Sub-bar                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-[#262626] gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-white" />
            <span className="text-white font-black text-sm tracking-widest uppercase">
              WEAPONS VAULT // ACTIVE ARMORY
            </span>
          </div>
          <span className="text-[10px] text-[#737373] tracking-widest uppercase hidden md:inline">
            SPEC-OPS WEAPONSMITH &bull; PROTOCOL DMZ-4.2
          </span>
        </div>

        {/* Quick Operator Specialization & Visor Pill Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOperatorPanel(!showOperatorPanel)}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showOperatorPanel
                ? 'bg-white text-black border-white'
                : 'bg-[#161616] text-[#a3a3a3] border-[#262626] hover:text-white hover:border-[#404040]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CLASSES[selectedClassId]?.color || '#ffffff' }} />
            <span>CLASS: {CLASSES[selectedClassId]?.name}</span>
            <span className="text-[#737373]">|</span>
            <span>VISOR: {visorType.toUpperCase()}</span>
            <span className="text-[8px]">{showOperatorPanel ? '▲' : '▼'}</span>
          </button>

          <button
            onClick={onDeploy}
            className="px-4 py-1.5 bg-white text-black font-black text-xs tracking-wider rounded hover:bg-[#e5e5e5] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>▶</span>
            <span>DEPLOY MATCH</span>
          </button>
        </div>
      </div>

      {/* Operator Specialization & Visor Pop-Down Drawer */}
      {showOperatorPanel && (
        <div className="w-full mb-3 p-3.5 bg-[#0D0D0D] border border-[#333333] rounded grid grid-cols-1 md:grid-cols-2 gap-4 text-xs z-30 shadow-2xl">
          <div>
            <div className="text-[10px] text-[#737373] font-bold uppercase tracking-wider mb-2">
              OPERATIVE SPECIALIZATION PERK
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(CLASSES) as ClassId[]).map((cKey) => {
                const cls = CLASSES[cKey];
                const isSelected = selectedClassId === cKey;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-2 text-left rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-white text-white'
                        : 'bg-[#161616] border-[#262626] text-[#737373] hover:text-white hover:border-[#404040]'
                    }`}
                  >
                    <div className="text-[10px] font-bold" style={{ color: isSelected ? '#ffffff' : cls.color }}>
                      {cls.name}
                    </div>
                    <div className="text-[8px] text-[#737373] truncate mt-0.5">{cls.perkName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#737373] font-bold uppercase tracking-wider mb-2">
              DIEGETIC HELMET VISOR HUD TINT
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {HELMET_LOCKER_OPTIONS.map((item) => {
                const isSelected = visorType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setVisorType(item.id)}
                    className={`p-2 text-left rounded border transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-white/10 border-white text-white'
                        : 'bg-[#161616] border-[#262626] text-[#737373] hover:text-white hover:border-[#404040]'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.tint }} />
                    <div className="text-[10px] font-bold truncate">
                      {item.id.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Main Split Body: Left 1/3 Feature Preview, Right 2/3 Vault Grid       */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto pr-1">
        {/* =================================================================== */}
        {/* 1. LEFT-SIDE FEATURE PREVIEW PANE (Roughly 1/3 Width: 4 cols)       */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 bg-[#0D0D0D] border border-[#262626] rounded p-5 flex flex-col justify-between shadow-2xl">
          <div className="space-y-4">
            {/* Header / Category Eyebrow & Status Flags */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#a3a3a3] font-bold tracking-widest uppercase">
                  {activeWeapon.category}
                </span>
                <span className="text-[9px] text-[#525252]">&bull;</span>
                <span className="text-[9px] text-[#d97706] font-bold tracking-wider">
                  {activeWeapon.affinity}
                </span>
              </div>

              {/* Status Ribbon: Slot 1 / Slot 2 / Unassigned */}
              {isEquippedSlot1 && (
                <span className="px-2 py-0.5 bg-[#4d7c0f]/20 border border-[#4d7c0f] text-[#84cc16] text-[9px] font-bold rounded">
                  EQUIPPED: SLOT 1
                </span>
              )}
              {isEquippedSlot2 && (
                <span className="px-2 py-0.5 bg-[#4d7c0f]/20 border border-[#4d7c0f] text-[#84cc16] text-[9px] font-bold rounded">
                  EQUIPPED: SLOT 2
                </span>
              )}
              {!isEquippedSlot1 && !isEquippedSlot2 && (
                <span className="px-2 py-0.5 bg-[#262626] text-[#737373] text-[9px] font-bold rounded">
                  IN STASH
                </span>
              )}
            </div>

            {/* Selected Weapon Name in Bold, Tight All-Caps Typography */}
            <div>
              <div className="text-[10px] text-[#737373] tracking-widest uppercase mb-0.5">
                PLATFORM SPECIFICATION
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FFFFFF] tracking-tight uppercase leading-none">
                {activeWeapon.name}
              </h1>
            </div>

            {/* Large White Line-Art Silhouette Hero Showcase */}
            <div className="w-full h-32 sm:h-36 bg-[#141414] border border-[#262626] rounded flex items-center justify-center p-3 relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[8px] text-[#525252] font-mono">
                CAD SCHEMATIC // {activeWeapon.id.toUpperCase()}
              </div>
              <div className="absolute bottom-2 right-2 text-[8px] text-[#525252] font-mono">
                {activeWeapon.caliber}
              </div>
              <WeaponSilhouette id={activeWeapon.id} className="w-4/5 h-4/5 text-white opacity-95" />
            </div>

            {/* Muted Descriptions Block Detailing Weapon Effectiveness */}
            <div className="bg-[#141414] border border-[#222222] p-3 rounded">
              <div className="text-[9px] text-[#737373] font-bold uppercase tracking-wider mb-1">
                COMBAT PERFORMANCE & BALLISTIC PROFILE
              </div>
              <p className="text-[11px] text-[#a3a3a3] leading-relaxed">
                {activeWeapon.description}
              </p>
            </div>

            {/* Crisp, White Horizontal Gauge Stat-Bar Visualizer */}
            <div className="space-y-2 pt-1 border-t border-[#222222]">
              <div className="text-[9px] text-[#737373] font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
                <span>TACTICAL ATTRIBUTES</span>
                <span>METRIC</span>
              </div>

              {/* Damage Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-[#d4d4d4]">
                  <span className="font-bold">DAMAGE</span>
                  <span className="font-mono text-white">{activeWeapon.damage}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${activeWeapon.damage}%` }} />
                </div>
              </div>

              {/* Fire Rate Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-[#d4d4d4]">
                  <span className="font-bold">FIRE RATE</span>
                  <span className="font-mono text-white">{activeWeapon.fireRate}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${activeWeapon.fireRate}%` }} />
                </div>
              </div>

              {/* Range Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-[#d4d4d4]">
                  <span className="font-bold">RANGE</span>
                  <span className="font-mono text-white">{activeWeapon.range}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${activeWeapon.range}%` }} />
                </div>
              </div>

              {/* Accuracy Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-[#d4d4d4]">
                  <span className="font-bold">ACCURACY</span>
                  <span className="font-mono text-white">{activeWeapon.accuracy}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${activeWeapon.accuracy}%` }} />
                </div>
              </div>

              {/* Recoil Control Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-[#d4d4d4]">
                  <span className="font-bold">RECOIL CONTROL</span>
                  <span className="font-mono text-white">{activeWeapon.recoilControl}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${activeWeapon.recoilControl}%` }} />
                </div>
              </div>

              {/* Mobility Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-[#d4d4d4]">
                  <span className="font-bold">MOBILITY</span>
                  <span className="font-mono text-white">{activeWeapon.mobility}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${activeWeapon.mobility}%` }} />
                </div>
              </div>
            </div>

            {/* Ammunition Overview in Clean Layout */}
            <div className="p-2.5 bg-[#141414] border border-[#222222] rounded grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <div className="text-[#737373] font-bold uppercase">ROUNDS</div>
                <div className="text-white text-sm font-black font-mono mt-0.5">
                  {activeWeapon.rounds} <span className="text-[9px] text-[#737373] font-normal">MAG</span>
                </div>
              </div>
              <div>
                <div className="text-[#737373] font-bold uppercase">RESERVE</div>
                <div className="text-white text-sm font-black font-mono mt-0.5">
                  {activeWeapon.reserve} <span className="text-[9px] text-[#737373] font-normal">ROUNDS</span>
                </div>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#222222] flex justify-between text-[9px] text-[#8a8a8a]">
                <span>FIRE MODE: <b className="text-white">{activeWeapon.fireMode}</b></span>
                <span>CALIBER: <b className="text-white">{activeWeapon.caliber}</b></span>
              </div>
            </div>
          </div>

          {/* Bottom Assignment Quick Actions */}
          <div className="pt-4 border-t border-[#222222] space-y-2 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleEquipSlot1}
                className={`py-2 px-2 text-[10px] font-bold rounded tracking-wider cursor-pointer transition-colors border ${
                  isEquippedSlot1
                    ? 'bg-[#4d7c0f]/20 border-[#4d7c0f] text-[#84cc16]'
                    : 'bg-[#161616] border-[#333333] text-white hover:bg-white hover:text-black hover:border-white'
                }`}
              >
                {isEquippedSlot1 ? '✓ ACTIVE IN SLOT 1' : 'ASSIGN TO SLOT 1'}
              </button>

              <button
                onClick={handleEquipSlot2}
                className={`py-2 px-2 text-[10px] font-bold rounded tracking-wider cursor-pointer transition-colors border ${
                  isEquippedSlot2
                    ? 'bg-[#4d7c0f]/20 border-[#4d7c0f] text-[#84cc16]'
                    : 'bg-[#161616] border-[#333333] text-white hover:bg-white hover:text-black hover:border-white'
                }`}
              >
                {isEquippedSlot2 ? '✓ ACTIVE IN SLOT 2' : 'ASSIGN TO SLOT 2'}
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. RIGHT-SIDE WEAPON VAULT GRID (Roughly 2/3 Width: 8 cols)         */}
        {/* =================================================================== */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* ----------------------------------------------------------------- */}
          {/* UPPER ROW: THREE DISTINCT "INSURED SLOTS"                         */}
          {/* ----------------------------------------------------------------- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-black tracking-widest uppercase">
                  INSURED WEAPON SLOTS
                </span>
                <span className="text-[9px] text-[#737373] uppercase">
                  [ 3 OF 3 ACTIVE SLOTS ]
                </span>
              </div>
              <span className="text-[9px] text-[#d97706] font-bold uppercase tracking-wider">
                &bull; RECOVERY PROTOCOL GUARANTEED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* INSURED SLOT 1: PRIMARY WEAPON */}
              <div
                onClick={() => {
                  setPreviewId(primaryItem.id);
                  setTargetAssignSlot('slot1');
                }}
                className={`p-3.5 bg-[#161616] rounded border transition-all cursor-pointer flex flex-col justify-between h-48 relative ${
                  previewId === primaryItem.id
                    ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.15)] ring-1 ring-white'
                    : 'border-[#262626] hover:border-[#404040]'
                }`}
              >
                {/* Accent Tag Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#a3a3a3] font-bold tracking-widest uppercase">
                    {primaryItem.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span className="px-1.5 py-0.5 bg-[#d97706]/15 border border-[#d97706]/60 text-[#f59e0b] text-[8px] font-bold tracking-wider rounded">
                      INSURED SLOT 1
                    </span>
                  </div>
                </div>

                {/* Gun Silhouette Line-Art */}
                <div className="w-full h-20 flex items-center justify-center my-1">
                  <WeaponSilhouette id={primaryItem.id} className="w-4/5 h-4/5 text-white opacity-90" />
                </div>

                {/* Weapon Title & Level Progress */}
                <div>
                  <div className="text-white text-xs font-black tracking-tight uppercase truncate">
                    {primaryItem.name}
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-[#737373] mt-1">
                    <span>{primaryItem.level}</span>
                    <span className="text-[#a3a3a3]">{primaryItem.levelProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-white" style={{ width: `${primaryItem.levelProgress}%` }} />
                  </div>
                </div>
              </div>

              {/* INSURED SLOT 2: SECONDARY WEAPON */}
              <div
                onClick={() => {
                  setPreviewId(secondaryItem.id);
                  setTargetAssignSlot('slot2');
                }}
                className={`p-3.5 bg-[#161616] rounded border transition-all cursor-pointer flex flex-col justify-between h-48 relative ${
                  previewId === secondaryItem.id
                    ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.15)] ring-1 ring-white'
                    : 'border-[#262626] hover:border-[#404040]'
                }`}
              >
                {/* Accent Tag Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#a3a3a3] font-bold tracking-widest uppercase">
                    {secondaryItem.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span className="px-1.5 py-0.5 bg-[#d97706]/15 border border-[#d97706]/60 text-[#f59e0b] text-[8px] font-bold tracking-wider rounded">
                      INSURED SLOT 2
                    </span>
                  </div>
                </div>

                {/* Gun Silhouette Line-Art */}
                <div className="w-full h-20 flex items-center justify-center my-1">
                  <WeaponSilhouette id={secondaryItem.id} className="w-4/5 h-4/5 text-white opacity-90" />
                </div>

                {/* Weapon Title & Level Progress */}
                <div>
                  <div className="text-white text-xs font-black tracking-tight uppercase truncate">
                    {secondaryItem.name}
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-[#737373] mt-1">
                    <span>{secondaryItem.level}</span>
                    <span className="text-[#a3a3a3]">{secondaryItem.levelProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-white" style={{ width: `${secondaryItem.levelProgress}%` }} />
                  </div>
                </div>
              </div>

              {/* INSURED SLOT 3: TACTICAL ORDNANCE */}
              <div
                onClick={() => {
                  setPreviewId('grenade');
                }}
                className={`p-3.5 bg-[#161616] rounded border transition-all cursor-pointer flex flex-col justify-between h-48 relative ${
                  previewId === 'grenade'
                    ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.15)] ring-1 ring-white'
                    : 'border-[#262626] hover:border-[#404040]'
                }`}
              >
                {/* Accent Tag Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#a3a3a3] font-bold tracking-widest uppercase">
                    {ORDNANCE_ITEM.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span className="px-1.5 py-0.5 bg-[#d97706]/15 border border-[#d97706]/60 text-[#f59e0b] text-[8px] font-bold tracking-wider rounded">
                      INSURED SLOT 3
                    </span>
                  </div>
                </div>

                {/* Ordnance Silhouette Line-Art */}
                <div className="w-full h-20 flex items-center justify-center my-1">
                  <WeaponSilhouette id="grenade" className="w-3/5 h-3/5 text-white opacity-90" />
                </div>

                {/* Weapon Title & Level Progress */}
                <div>
                  <div className="text-white text-xs font-black tracking-tight uppercase truncate">
                    {ORDNANCE_ITEM.name}
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-[#737373] mt-1">
                    <span>{ORDNANCE_ITEM.level}</span>
                    <span className="text-[#a3a3a3] font-mono">3 / 6 RECHARGE</span>
                  </div>
                  <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-white" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* LOWER SECTION: "CONTRABAND STASH"                                 */}
          {/* ----------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-[#262626] gap-2">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-black tracking-widest uppercase">
                  CONTRABAND STASH
                </span>
                <span className="text-[9px] text-[#737373] uppercase">
                  [ {Object.keys(VAULT_WEAPONS).length} REGISTERED ASSETS ]
                </span>
              </div>

              {/* Tactical Filter Chips */}
              <div className="flex items-center gap-1">
                {(['ALL', 'RIFLE', 'CQB', 'HEAVY', 'TECH'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStashFilter(filter)}
                    className={`px-2 py-0.5 text-[8px] font-bold tracking-wider rounded cursor-pointer transition-colors ${
                      stashFilter === filter
                        ? 'bg-white text-black'
                        : 'bg-[#161616] text-[#737373] border border-[#262626] hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Grid of Rectangular Weapon Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {stashList.map((weapon) => {
                const isSelected = previewId === weapon.id;
                const isSlot1 = selectedPrimary === weapon.id;
                const isSlot2 = selectedSecondary === weapon.id;

                return (
                  <div
                    key={weapon.id}
                    onClick={() => {
                      setPreviewId(weapon.id);
                    }}
                    className={`p-2.5 bg-[#161616] rounded border transition-all cursor-pointer flex flex-col justify-between h-36 relative ${
                      isSelected
                        ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.2)] ring-1 ring-white'
                        : 'border-[#262626] hover:border-[#404040]'
                    }`}
                  >
                    {/* Top Row: Category & Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] text-[#737373] font-bold tracking-wider uppercase truncate max-w-[70%]">
                        {weapon.category}
                      </span>

                      {isSlot1 && (
                        <span className="px-1 py-0.2 bg-[#4d7c0f]/20 border border-[#4d7c0f] text-[#84cc16] text-[7px] font-black rounded">
                          SLOT 1
                        </span>
                      )}
                      {isSlot2 && (
                        <span className="px-1 py-0.2 bg-[#4d7c0f]/20 border border-[#4d7c0f] text-[#84cc16] text-[7px] font-black rounded">
                          SLOT 2
                        </span>
                      )}
                    </div>

                    {/* Weapon Silhouette Centerpiece */}
                    <div className="w-full h-14 flex items-center justify-center my-1">
                      <WeaponSilhouette id={weapon.id} className="w-full h-full text-white opacity-85" />
                    </div>

                    {/* Bottom Metadata */}
                    <div>
                      <div className="text-white text-[10px] font-black tracking-tight uppercase truncate">
                        {weapon.name}
                      </div>
                      <div className="flex items-center justify-between text-[7.5px] text-[#737373] mt-0.5">
                        <span>{weapon.level}</span>
                        <span className="text-[#a3a3a3]">{weapon.rounds}R</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
