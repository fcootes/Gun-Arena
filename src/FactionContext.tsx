import React, { createContext, useContext, useState, useEffect } from 'react';
import { FactionType } from './lobbyAvatar';

export type GearTier = 'standard' | 'specialized';
export type HeadgearOption = 'base' | 'fast' | 'boonie' | 'skull';
export type TorsoOption = 'chest_rig' | 'molle_vest';
export type LowerOption = 'holster' | 'pouches';

export interface FactionGearState {
  faction: FactionType;
  gearTier: GearTier;
  setFaction: (f: FactionType) => void;
  setGearTier: (t: GearTier) => void;
  toggleGearTier: () => void;
  
  headgear: HeadgearOption;
  setHeadgear: (h: HeadgearOption) => void;
  torsoConfig: TorsoOption;
  setTorsoConfig: (t: TorsoOption) => void;
  lowerConfig: LowerOption;
  setLowerConfig: (l: LowerOption) => void;

  // Computed passive attributes
  maxArmor: number;
  armorBonusPct: number;
  sprintMultiplier: number;
  sprintBonusPct: number;
  explosionResistancePct: number;
  adsSpeedMultiplier: number;
  perkTitle: string;
  perkTag: string;
  perkDescription: string;
  kitName: string;
  kitDescriptor: string;
}

const FactionContext = createContext<FactionGearState | null>(null);

export const FactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [faction, setFactionState] = useState<FactionType>(() => {
    const saved = localStorage.getItem('gun_arena_faction');
    return (saved === 'apex' || saved === 'usmc') ? saved : 'usmc';
  });

  const [gearTier, setGearTierState] = useState<GearTier>(() => {
    const saved = localStorage.getItem('gun_arena_geartier');
    return (saved === 'specialized' || saved === 'standard') ? saved : 'standard';
  });

  const [headgear, setHeadgearState] = useState<HeadgearOption>(() => {
    const saved = localStorage.getItem('gun_arena_headgear') as HeadgearOption;
    return saved || 'fast';
  });

  const [torsoConfig, setTorsoConfigState] = useState<TorsoOption>(() => {
    const saved = localStorage.getItem('gun_arena_torso') as TorsoOption;
    return saved || 'chest_rig';
  });

  const [lowerConfig, setLowerConfigState] = useState<LowerOption>(() => {
    const saved = localStorage.getItem('gun_arena_lower') as LowerOption;
    return saved || 'pouches';
  });

  const setFaction = (f: FactionType) => {
    setFactionState(f);
    localStorage.setItem('gun_arena_faction', f);
  };

  const setGearTier = (t: GearTier) => {
    setGearTierState(t);
    localStorage.setItem('gun_arena_geartier', t);
  };

  const toggleGearTier = () => {
    setGearTier(gearTier === 'standard' ? 'specialized' : 'standard');
  };

  const setHeadgear = (h: HeadgearOption) => {
    setHeadgearState(h);
    localStorage.setItem('gun_arena_headgear', h);
  };

  const setTorsoConfig = (t: TorsoOption) => {
    setTorsoConfigState(t);
    localStorage.setItem('gun_arena_torso', t);
  };

  const setLowerConfig = (l: LowerOption) => {
    setLowerConfigState(l);
    localStorage.setItem('gun_arena_lower', l);
  };

  // Compute stat attributes based on faction and gear tier
  let maxArmor = 100;
  let armorBonusPct = 0;
  let sprintMultiplier = 1.0;
  let sprintBonusPct = 0;
  let explosionResistancePct = 0;
  let adsSpeedMultiplier = 1.0;
  let perkTitle = 'STANDARD ISSUE RECRUITS';
  let perkTag = 'BASELINE';
  let perkDescription = 'Balanced combat parameters with zero mobility or ballistic armor penalties.';
  let kitName = 'STANDARD ISSUE FIELD RIG';
  let kitDescriptor = faction === 'usmc' 
    ? 'Standard Combat Fatigues • Low-Profile Chest Rig • MICH/FAST Ballistic Helmet'
    : 'Charcoal Stealth Fatigues • Low-Profile Rig • Tactical Visor Helmet';

  if (gearTier === 'specialized') {
    if (faction === 'usmc') {
      // USMC Fortified Perk
      maxArmor = 115; // +15% Body Armor Capacity
      armorBonusPct = 15;
      sprintMultiplier = 0.95; // -5% sprint velocity due to heavy armor weight
      sprintBonusPct = -5;
      explosionResistancePct = 20; // 20% explosion resistance
      adsSpeedMultiplier = 1.0;
      perkTitle = 'FORTIFIED SPEC-OPS';
      perkTag = 'FORTIFIED';
      perkDescription = '+15% Maximum Body Armor, -20% Explosive Blast Damage taken. -5% Sprint Velocity.';
      kitName = 'BALLISTIC BREACHER KIT';
      kitDescriptor = 'Heavy Modular Plate Carrier (IOTV) • Neck & Groin Ballistic Guards • Throat Mic Headset';
    } else {
      // Apex Stalker Perk
      maxArmor = 90; // -10% Maximum Armor Capacity
      armorBonusPct = -10;
      sprintMultiplier = 1.10; // +10% Sprint Velocity
      sprintBonusPct = 10;
      explosionResistancePct = 0;
      adsSpeedMultiplier = 1.45; // Faster ADS transition & reduced ADS movement penalties
      perkTitle = 'STALKER RECON SPEC-OPS';
      perkTag = 'STALKER';
      perkDescription = '+10% Sprint Velocity, Accelerated Aim-Down-Sights (ADS) transition. -10% Body Armor.';
      kitName = 'LOW-VIS RECON RIG';
      kitDescriptor = 'Lightweight Multicam-Black Rig • Rolled Combat Sleeves • Low-Profile Headset with Mandible Guard';
    }
  }

  const value: FactionGearState = {
    faction,
    gearTier,
    setFaction,
    setGearTier,
    toggleGearTier,
    headgear,
    setHeadgear,
    torsoConfig,
    setTorsoConfig,
    lowerConfig,
    setLowerConfig,
    maxArmor,
    armorBonusPct,
    sprintMultiplier,
    sprintBonusPct,
    explosionResistancePct,
    adsSpeedMultiplier,
    perkTitle,
    perkTag,
    perkDescription,
    kitName,
    kitDescriptor
  };

  return (
    <FactionContext.Provider value={value}>
      {children}
    </FactionContext.Provider>
  );
};

export function useFaction(): FactionGearState {
  const ctx = useContext(FactionContext);
  if (!ctx) {
    throw new Error('useFaction must be used within a FactionProvider');
  }
  return ctx;
}
