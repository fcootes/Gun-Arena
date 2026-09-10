import React, { useState } from 'react';
import { ClassId } from './types';
import { CLASSES } from './App';
import { VisorType, FactionType } from './lobbyAvatar';
import { LoadoutDMZ } from './LoadoutDMZ';
import { useFaction, GearTier, HeadgearOption, TorsoOption, LowerOption } from './FactionContext';

export type LobbyTab = 'play' | 'locker' | 'loadout' | 'gamemode' | 'intel';

export interface PersistentStats {
  totalKills: number;
  totalHeadshots: number;
  totalShots: number;
  totalHits: number;
  totalFunds: number;
  highestWave: number;
  matchesPlayed: number;
  matchesWon: number;
}

export interface LobbyTerminalProps {
  activeTab: LobbyTab;
  setActiveTab: (tab: LobbyTab) => void;
  factionAlignment: FactionType;
  setFactionAlignment: (f: FactionType) => void;
  gearTier?: GearTier;
  setGearTier?: (tier: GearTier) => void;
  visorType: VisorType;
  setVisorType: (v: VisorType) => void;
  selectedClassId: ClassId;
  setSelectedClassId: (c: ClassId) => void;
  selectedPrimary: string;
  setSelectedPrimary: (p: string) => void;
  selectedSecondary: string;
  setSelectedSecondary: (s: string) => void;
  matchMode: 'ffa' | 'team' | 'zombie' | 'escort';
  setMatchMode: (m: 'ffa' | 'team' | 'zombie' | 'escort') => void;
  friendlyCount: number;
  setFriendlyCount: (n: number) => void;
  enemyCount: number;
  setEnemyCount: (n: number) => void;
  targetScore: number;
  setTargetScore: (n: number) => void;
  difficultyKey: string;
  setDifficultyKey: (d: string) => void;
  onDeploy: () => void;
  showAudioHelper: boolean;
  setShowAudioHelper: (show: boolean) => void;
}

export const ARMORY_CATEGORIES = {
  primary: [
    { id: 'ar', label: 'M4A1 Tactical Suppressed', category: 'ASSAULT RIFLES' },
    { id: 'br', label: 'FAMAS Bullpup Burst', category: 'ASSAULT RIFLES' },
    { id: 'shotgun', label: 'Pump-Action 12-Gauge', category: 'SHOTGUNS' },
    { id: 'lmg', label: 'LMG Support Box', category: 'SPECIAL HEAVIES' },
    { id: 'minigun', label: 'Heavy Minigun', category: 'SPECIAL HEAVIES' },
    { id: 'railgun', label: 'Kinetic AP Railgun', category: 'SPECIAL HEAVIES' },
    { id: 'sniper', label: 'Bolt-Action Heavy Sniper', category: 'PRECISION' },
    { id: 'laser', label: 'Covenant Plasma Rifle', category: 'ENERGY' }
  ],
  secondary: [
    { id: 'pistol', label: 'Combat 9mm Pistol', category: 'SIDEARMS' },
    { id: 'smg', label: 'Submachine Gun (SMG)', category: 'COMPACT FIREARMS' },
    { id: 'shotgun', label: 'Pump-Action 12-Gauge', category: 'SHOTGUNS' },
    { id: 'laser', label: 'Covenant Plasma Rifle', category: 'ENERGY' }
  ]
};

export const HELMET_LOCKER_OPTIONS: { id: VisorType; name: string; tint: string; desc: string }[] = [
  {
    id: 'standard',
    name: 'STANDARD USMC BATTLE-VISOR',
    tint: '#2de2e6',
    desc: 'High-contrast optical eye-port with crisp neon-blue defense matrix and target telemetry.'
  },
  {
    id: 'recon',
    name: 'RECON NIGHT-VISION MATRIX',
    tint: '#00ff66',
    desc: 'Intense glowing green-phosphor electronic scanline overlay for dark operational stealth.'
  },
  {
    id: 'apex',
    name: 'APEX MERCENARY TERMINAL',
    tint: '#ff2a2a',
    desc: 'Aggressive crimson-red combat tracking HUD scheme with high-priority threat highlighting.'
  }
];

export const getPersistentStats = (): PersistentStats => {
  try {
    const raw = localStorage.getItem('gun_arena_persistent_intel');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    totalKills: 38,
    totalHeadshots: 14,
    totalShots: 420,
    totalHits: 215,
    totalFunds: 3450,
    highestWave: 7,
    matchesPlayed: 12,
    matchesWon: 9
  };
};

export const LobbyTerminal: React.FC<LobbyTerminalProps> = ({
  activeTab,
  setActiveTab,
  factionAlignment,
  setFactionAlignment,
  gearTier,
  setGearTier,
  visorType,
  setVisorType,
  selectedClassId,
  setSelectedClassId,
  selectedPrimary,
  setSelectedPrimary,
  selectedSecondary,
  setSelectedSecondary,
  matchMode,
  setMatchMode,
  friendlyCount,
  setFriendlyCount,
  enemyCount,
  setEnemyCount,
  targetScore,
  setTargetScore,
  difficultyKey,
  setDifficultyKey,
  onDeploy,
  showAudioHelper,
  setShowAudioHelper
}) => {
  const factionCtx = useFaction();
  const currentFaction = factionAlignment || factionCtx.faction;
  const currentGearTier = gearTier || factionCtx.gearTier;

  const handleFactionSelect = (f: FactionType) => {
    setFactionAlignment(f);
    factionCtx.setFaction(f);
  };

  const handleGearTierSelect = (tier: GearTier) => {
    if (setGearTier) setGearTier(tier);
    factionCtx.setGearTier(tier);
  };

  const [intelStats] = useState<PersistentStats>(getPersistentStats);
  const currentVisorConfig = HELMET_LOCKER_OPTIONS.find((v) => v.id === visorType) || HELMET_LOCKER_OPTIONS[0];

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between select-none font-mono">
      {/* ========================================================================= */}
      {/* 1. TOP HUD HEADER BAR: Pinned sleek dark horizontal tab bar (1v1.lol)     */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#0b0e12]/95 border-b border-white/15 backdrop-blur-md px-6 py-2.5 flex items-center justify-between pointer-events-auto z-40 shadow-2xl">
        <div className="flex items-center gap-6">
          {/* Game Brand Tag */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-[#2de2e6] rounded-xs shadow-[0_0_8px_#2de2e6]" />
            <div>
              <div className="text-sm font-extrabold tracking-widest text-white leading-none">
                GUN ARENA // OPS
              </div>
              <div className="text-[9px] text-[#2de2e6] tracking-wider leading-none mt-0.5">
                TACTICAL BATTLE SUITE
              </div>
            </div>
          </div>

          {/* Clickable Styled Navigation Tab Buttons */}
          <div className="flex items-center gap-2">
            {(['play', 'locker', 'loadout', 'gamemode', 'intel'] as LobbyTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabels: Record<LobbyTab, string> = {
                play: 'PLAY',
                locker: 'LOCKER',
                loadout: 'WEAPONS',
                gamemode: 'GAME MODE',
                intel: 'INTEL'
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-widest transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#2de2e6]/20 border-[#2de2e6] text-[#2de2e6] shadow-[0_0_12px_rgba(45,226,230,0.5)]'
                      : 'bg-black/40 border-white/10 text-[#8b98a1] hover:text-white hover:border-white/30'
                  }`}
                >
                  [ {tabLabels[tab]} ]
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Corner Utilities: Audio Guide & Launch Fullscreen */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAudioHelper(!showAudioHelper)}
            className="px-2.5 py-1 rounded bg-[#f5a623]/20 border border-[#f5a623]/60 text-[#f5a623] text-[10px] font-bold cursor-pointer hover:bg-[#f5a623]/30 transition-colors"
          >
            Audio Guide
          </button>
          <a
            href="https://ais-dev-mlmvjg57dudsycsch4poan-271150104517.asia-southeast1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#2de2e6] hover:underline flex items-center gap-1 font-bold opacity-90 hover:opacity-100"
          >
            <span>Fullscreen Tab</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* Audio Helper Modal */}
      {showAudioHelper && (
        <div className="absolute top-14 right-6 w-96 p-3 bg-black/95 border border-[#f5a623] text-xs text-[#e8edf0] rounded shadow-2xl z-50 pointer-events-auto max-h-72 overflow-y-auto">
          <div className="font-bold text-[#f5a623] tracking-wide mb-1 flex items-center justify-between">
            <span>LOCAL AUDIO PRESERVATION MAPPING</span>
            <button onClick={() => setShowAudioHelper(false)} className="text-white hover:text-red-400">✕</button>
          </div>
          <p className="text-[10px] text-[#8b98a1] mb-2">
            Mapped to clean relative filenames for instant desktop offline play:
          </p>
          <div className="text-[9px] bg-black/50 p-2 border border-white/10 space-y-1">
            <div>• Rifle / Pistol / SMG fire: <code className="text-[#2de2e6]">pistol_fire.mp3</code> / <code className="text-[#2de2e6]">smg_fire.mp3</code></div>
            <div>• Reloading: <code className="text-[#2de2e6]">dragon-studio-gun-reload-2-511308.mp3</code></div>
            <div>• Footsteps & Jump: <code className="text-[#2de2e6]">footstep_1.mp3</code> / <code className="text-[#2de2e6]">jump_grunt.mp3</code></div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB VIEWPORTS                                                          */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 1: [ PLAY ] Home Hub (Avatar Canvas Showcase)                         */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'play' && (
        <div className="flex-1 w-full p-6 flex justify-between items-end pointer-events-none">
          {/* LEFT TERMINAL COLUMN */}
          <div className="w-88 max-w-[32vw] bg-[#0c1015]/90 border border-white/15 backdrop-blur-md p-4 rounded-sm pointer-events-auto shadow-2xl flex flex-col gap-3">
            <div className="text-xs font-extrabold tracking-widest text-[#2de2e6] border-b border-white/10 pb-1.5 flex items-center justify-between">
              <span>OPERATOR FACTION ALLIANCE</span>
              <span className="text-[9px] text-[#8b98a1] font-normal">
                {matchMode === 'zombie' ? '(USMC LOCKED)' : 'SELECT FACTION'}
              </span>
            </div>

            {/* Faction Choice Selectors */}
            <div className="flex flex-col gap-2">
              <button
                disabled={matchMode === 'zombie'}
                onClick={() => handleFactionSelect('usmc')}
                className={`p-2.5 text-left border rounded-xs transition-all cursor-pointer ${
                  currentFaction === 'usmc' || matchMode === 'zombie'
                    ? 'border-[#738a54] bg-[#222b1c]/80 shadow-sm'
                    : 'border-white/10 bg-black/40 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#b4dc8b] tracking-wider">
                    USMC 1st RECON
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-xs bg-[#738a54]/25 text-[#a3d977] border border-[#738a54]/40">
                    COALITION
                  </span>
                </div>
                <div className="text-[9px] text-[#cbd5e1]/90 mt-1 leading-tight">
                  Standard Issue Fatigues • Modular Plate Carrier • Ballistic Helmet
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-1 flex items-center gap-1.5">
                  <span className="text-[#a3d977] font-semibold">PERK: FORTIFIED</span>
                  <span>•</span>
                  <span>+15% Armor, -20% Explosive Dmg</span>
                </div>
              </button>

              <button
                disabled={matchMode === 'zombie'}
                onClick={() => handleFactionSelect('apex')}
                className={`p-2.5 text-left border rounded-xs transition-all cursor-pointer ${
                  matchMode === 'zombie'
                    ? 'opacity-30 cursor-not-allowed'
                    : currentFaction === 'apex'
                    ? 'border-[#4a5568] bg-[#1a1d24]/80 shadow-sm'
                    : 'border-white/10 bg-black/40 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e2e8f0] tracking-wider">
                    APEX PMC SHADOW
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-xs bg-white/10 text-white border border-white/20">
                    CONTRACTOR
                  </span>
                </div>
                <div className="text-[9px] text-[#cbd5e1]/90 mt-1 leading-tight">
                  Matte-Black Carbon Weave • Stealth Armor • Tactical Visor Helmet
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-1 flex items-center gap-1.5">
                  <span className="text-[#93c5fd] font-semibold">PERK: STALKER</span>
                  <span>•</span>
                  <span>+10% Sprint Speed, Faster ADS</span>
                </div>
              </button>
            </div>

            {/* Grounded Gear Tiers Toggle Array */}
            <div className="border-t border-white/10 pt-2">
              <div className="text-xs font-bold tracking-widest text-white/90 mb-1.5 flex items-center justify-between">
                <span>GROUNDED GEAR TIERS</span>
                <span className="text-[8px] text-[#8b98a1] uppercase">
                  {currentGearTier === 'specialized' ? 'TIER 2 ACTIVE' : 'TIER 1 ACTIVE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {/* Tier 1: Standard Issue Baseline */}
                <button
                  onClick={() => handleGearTierSelect('standard')}
                  className={`p-2 text-left border rounded-xs transition-all cursor-pointer flex flex-col justify-between ${
                    currentGearTier === 'standard'
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/10 bg-black/40 text-[#8b98a1] hover:border-white/20'
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-wider">
                    TIER 1 // BASELINE
                  </div>
                  <div className="text-[8px] mt-1 opacity-80 leading-tight">
                    Standard Issue Fatigues & Light Rig. Balanced mobility.
                  </div>
                </button>

                {/* Tier 2: Specialized Modern Gear Upgrade */}
                <button
                  onClick={() => handleGearTierSelect('specialized')}
                  className={`p-2 text-left border rounded-xs transition-all cursor-pointer flex flex-col justify-between ${
                    currentGearTier === 'specialized'
                      ? currentFaction === 'usmc'
                        ? 'border-[#738a54] bg-[#222b1c]/80 text-[#b4dc8b]'
                        : 'border-[#60a5fa] bg-[#1e293b]/80 text-[#93c5fd]'
                      : 'border-white/10 bg-black/40 text-[#8b98a1] hover:border-white/20'
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-wider">
                    {currentFaction === 'usmc' ? 'TIER 2 // BREACHER' : 'TIER 2 // RECON'}
                  </div>
                  <div className="text-[8px] mt-1 opacity-80 leading-tight">
                    {currentFaction === 'usmc'
                      ? 'Ballistic Breacher Kit with IOTV Carrier.'
                      : 'Low-Vis Recon Rig & Mandible Guard.'}
                  </div>
                </button>
              </div>

              {/* Active Gear Details Readout */}
              <div className="bg-black/50 border border-white/10 p-2 rounded-xs text-[9px] text-[#cbd5e1] space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-[#8b98a1]">KIT CONFIG:</span>
                  <span className="text-white">
                    {currentGearTier === 'specialized'
                      ? (currentFaction === 'usmc' ? 'BALLISTIC BREACHER KIT' : 'LOW-VIS RECON RIG')
                      : 'STANDARD ISSUE BASELINE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b98a1]">PERK STATUS:</span>
                  <span className={currentFaction === 'usmc' ? 'text-[#a3d977] font-semibold' : 'text-[#60a5fa] font-semibold'}>
                    {currentGearTier === 'specialized'
                      ? (currentFaction === 'usmc' ? 'FORTIFIED (+15% ARMOR)' : 'STALKER (+10% SPRINT)')
                      : 'STANDARD ATTRIBUTES'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b98a1]">TACTICAL HUD:</span>
                  <span className="text-white/80">
                    {currentGearTier === 'specialized'
                      ? (currentFaction === 'usmc' ? 'MATTE HELMET PERIMETER' : 'DIGITAL HEADING COMPASS')
                      : 'CLEAN MINIMALIST'}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Quick Sliders */}
            <div className="border-t border-white/10 pt-2 space-y-2 text-[10px]">
              {matchMode !== 'ffa' && (
                <div className="flex items-center justify-between">
                  <span className="text-[#8b98a1]">
                    {matchMode === 'zombie' ? 'SURVIVOR ALLIES:' : 'USMC ALLIES:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={friendlyCount}
                      onChange={(e) => setFriendlyCount(parseInt(e.target.value, 10))}
                      className="w-24 accent-[#2de2e6] cursor-pointer"
                    />
                    <span className="text-[#f5a623] font-bold w-4">{friendlyCount}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#8b98a1]">
                  {matchMode === 'zombie' ? 'ZOMBIES PER WAVE:' : 'ENEMY MERCENARIES:'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={enemyCount}
                    onChange={(e) => setEnemyCount(parseInt(e.target.value, 10))}
                    className="w-24 accent-[#2de2e6] cursor-pointer"
                  />
                  <span className="text-[#f5a623] font-bold w-4">{enemyCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8b98a1]">
                  {matchMode === 'zombie' ? 'STARTING WAVE:' : 'TARGET KILLS TO WIN:'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={matchMode === 'zombie' ? 1 : 5}
                    max={matchMode === 'zombie' ? 15 : 50}
                    step={matchMode === 'zombie' ? 1 : 5}
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseInt(e.target.value, 10))}
                    className="w-24 accent-[#2de2e6] cursor-pointer"
                  />
                  <span className="text-[#f5a623] font-bold w-4">{targetScore}</span>
                </div>
              </div>

              {/* Combat Difficulty Buttons */}
              <div className="pt-1">
                <div className="text-[9px] text-[#8b98a1] mb-1 font-bold">AI COMBAT DIFFICULTY</div>
                <div className="grid grid-cols-3 gap-1">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficultyKey(d)}
                      className={`py-1 text-[9px] font-bold tracking-wider rounded-xs border cursor-pointer ${
                        difficultyKey === d
                          ? 'border-[#2de2e6] bg-[#2de2e6]/20 text-[#2de2e6]'
                          : 'border-white/10 bg-black/40 text-[#8b98a1] hover:text-white'
                      }`}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER GAP IS OPEN FOR 3D AVATAR VIEWPORT */}

          {/* RIGHT COMMAND TERMINAL */}
          <div className="w-88 max-w-[32vw] bg-[#0c1015]/90 border border-white/15 backdrop-blur-md p-4 rounded-sm pointer-events-auto shadow-2xl flex flex-col gap-3">
            <div className="text-xs font-extrabold tracking-widest text-[#2de2e6] border-b border-white/10 pb-1.5 flex items-center justify-between">
              <span>DEPLOYMENT PROTOCOL</span>
              <span className="text-[9px] text-[#f5a623] font-bold">STATUS: READY</span>
            </div>

            {/* Loadout Quick Matrix */}
            <div className="bg-black/50 border border-white/10 p-2.5 rounded-xs text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">OPERATOR:</span>
                <span className={`font-bold uppercase ${currentFaction === 'usmc' ? 'text-[#b4dc8b]' : 'text-[#93c5fd]'}`}>
                  {currentFaction === 'usmc' ? 'USMC 1st RECON' : 'APEX PMC SHADOW'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">GEAR KIT:</span>
                <span className="font-bold text-white uppercase">
                  {currentGearTier === 'specialized'
                    ? (currentFaction === 'usmc' ? 'T2 BREACHER' : 'T2 RECON')
                    : 'T1 BASELINE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">ACTIVE PERK:</span>
                <span className={`font-bold uppercase ${currentFaction === 'usmc' ? 'text-[#a3d977]' : 'text-[#60a5fa]'}`}>
                  {currentGearTier === 'specialized'
                    ? (currentFaction === 'usmc' ? 'FORTIFIED (+15% ARMOR)' : 'STALKER (+10% SPRINT)')
                    : 'STANDARD ISSUE'}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1">
                <span className="text-[#8b98a1]">ACTIVE CLASS:</span>
                <span className="font-bold text-white uppercase">{CLASSES[selectedClassId]?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">PRIMARY:</span>
                <span className="font-bold text-[#2de2e6] uppercase">
                  {ARMORY_CATEGORIES.primary.find((p) => p.id === selectedPrimary)?.label || selectedPrimary}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">SECONDARY:</span>
                <span className="font-bold text-white uppercase">
                  {ARMORY_CATEGORIES.secondary.find((s) => s.id === selectedSecondary)?.label || selectedSecondary}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">HELMET VISOR:</span>
                <span className="font-bold uppercase" style={{ color: currentVisorConfig.tint }}>
                  {currentVisorConfig.name.replace('STANDARD ', '')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b98a1]">MODE:</span>
                <span className="font-bold text-[#f5a623] uppercase">{matchMode}</span>
              </div>
            </div>

            {/* Quick Controls Card */}
            <div className="bg-black/30 border border-white/5 p-2 rounded-xs text-[9px] text-[#8b98a1] leading-relaxed">
              <span className="text-white font-bold">CONTROLS: </span>
              WASD Move • Shift Sprint • Space Jump • LMB Fire • RMB ADS • 1-3 Loadout • R Reload • F Melee
            </div>

            {/* LARGE PULSING NEON TEAL/GREEN DEPLOYMENT BUTTON */}
            <button
              id="btn-deploy"
              onClick={onDeploy}
              className="w-full py-3.5 bg-gradient-to-r from-[#2de2e6] to-[#00ff66] text-black font-extrabold text-sm tracking-widest rounded-sm cursor-pointer shadow-[0_0_24px_rgba(45,226,230,0.6)] hover:shadow-[0_0_36px_rgba(0,255,102,0.8)] hover:scale-[1.02] transition-all duration-200 border-none animate-pulse flex items-center justify-center gap-2"
            >
              <span>▶</span>
              <span>DEPLOY OPERATION</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 1.5: [ LOCKER ] Tactical Gear & Armor Customization                   */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'locker' && (
        <div className="flex-1 w-full p-6 flex flex-col items-center justify-center pointer-events-auto">
          <div className="w-[1000px] max-w-full bg-[#0c1015]/90 border border-[#2de2e6]/20 backdrop-blur-md p-6 flex flex-col gap-6 rounded-sm shadow-2xl relative overflow-hidden">
            {/* Top Header */}
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-xl font-bold tracking-widest text-[#e8edf0] flex items-center gap-3">
                <span className="text-[#2de2e6] opacity-70">///</span>
                TACTICAL LOCKER
              </h2>
              <p className="text-xs text-[#8b98a1] mt-1 font-medium tracking-wide">
                CONFIGURE OPERATOR HARDWARE • COSMETIC OVERRIDES
              </p>
            </div>
            
            <div className="flex gap-6 h-[50vh] min-h-[400px]">
              {/* Left Column: Config List */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scroll">
                
                {/* Headgear */}
                <div className="bg-black/40 border border-white/5 p-4 flex flex-col gap-2">
                  <div className="text-xs font-bold text-[#8b98a1] tracking-widest mb-1">HEADGEAR CONFIGURATION</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'base', label: 'BARE HEAD', desc: 'No ballistic protection' },
                      { id: 'fast', label: 'FAST HELMET', desc: 'High-cut ballistic helmet' },
                      { id: 'boonie', label: 'BOONIE HAT', desc: 'Canvas field hat' },
                      { id: 'skull', label: 'SKULL MASK', desc: 'Ballistic face shield' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => factionCtx?.setHeadgear(opt.id as HeadgearOption)}
                        className={`text-left p-2 border ${factionCtx?.headgear === opt.id ? 'bg-[#2de2e6]/10 border-[#2de2e6]/50 text-[#2de2e6]' : 'bg-white/5 border-transparent text-[#8b98a1] hover:bg-white/10'}`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[9px] opacity-70 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Torso */}
                <div className="bg-black/40 border border-white/5 p-4 flex flex-col gap-2">
                  <div className="text-xs font-bold text-[#8b98a1] tracking-widest mb-1">TORSO CONFIGURATION</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'chest_rig', label: 'LOW-PROFILE RIG', desc: 'Minimalist canvas rig' },
                      { id: 'molle_vest', label: 'HEAVY MOLLE VEST', desc: 'Full plate carrier' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => factionCtx?.setTorsoConfig(opt.id as TorsoOption)}
                        className={`text-left p-2 border ${factionCtx?.torsoConfig === opt.id ? 'bg-[#2de2e6]/10 border-[#2de2e6]/50 text-[#2de2e6]' : 'bg-white/5 border-transparent text-[#8b98a1] hover:bg-white/10'}`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[9px] opacity-70 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lower */}
                <div className="bg-black/40 border border-white/5 p-4 flex flex-col gap-2">
                  <div className="text-xs font-bold text-[#8b98a1] tracking-widest mb-1">LOWER CONFIGURATION</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'holster', label: 'THIGH HOLSTER', desc: 'Sidearm quick-draw' },
                      { id: 'pouches', label: 'UTILITY POUCHES', desc: 'Extra magazines' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => factionCtx?.setLowerConfig(opt.id as LowerOption)}
                        className={`text-left p-2 border ${factionCtx?.lowerConfig === opt.id ? 'bg-[#2de2e6]/10 border-[#2de2e6]/50 text-[#2de2e6]' : 'bg-white/5 border-transparent text-[#8b98a1] hover:bg-white/10'}`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[9px] opacity-70 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Display Placeholder for balance */}
              <div className="w-[300px] border border-white/10 bg-black/50 p-4 flex flex-col justify-end">
                <div className="text-[10px] text-[#2de2e6] tracking-widest text-center border-t border-[#2de2e6]/20 pt-2">
                  REAL-TIME PREVIEW ACTIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 2: [ LOADOUT ] Modern Tactical DMZ / MWIII Weapon Vault Grid          */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'loadout' && (
        <LoadoutDMZ
          selectedPrimary={selectedPrimary}
          setSelectedPrimary={setSelectedPrimary}
          selectedSecondary={selectedSecondary}
          setSelectedSecondary={setSelectedSecondary}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          visorType={visorType}
          setVisorType={setVisorType}
          onDeploy={onDeploy}
        />
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 3: [ GAME MODE ] Visual Scenario Deck                                */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'gamemode' && (
        <div className="flex-1 w-full p-6 flex items-center justify-center pointer-events-auto">
          <div className="w-[900px] max-w-[95vw] bg-[#0c1015]/95 border border-white/15 backdrop-blur-md p-5 rounded-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <div className="text-sm font-extrabold tracking-widest text-[#2de2e6]">
                  VISUAL SCENARIO DECK // SIMULATION MODES
                </div>
                <div className="text-[10px] text-[#8b98a1]">
                  Select an operational combat theater to engage enemy forces.
                </div>
              </div>
              <button
                onClick={onDeploy}
                className="px-4 py-1.5 bg-[#2de2e6] text-black font-bold text-xs tracking-wider rounded-xs hover:bg-[#00ff66] transition-colors cursor-pointer"
              >
                DEPLOY SELECTED SCENARIO
              </button>
            </div>

            {/* 3 Distinct Styled Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* CARD 1: FACTION CONFLICT (TEAM & FFA) */}
              <div
                onClick={() => setMatchMode(matchMode === 'team' ? 'ffa' : 'team')}
                className={`p-4 rounded-xs border transition-all cursor-pointer flex flex-col justify-between h-72 ${
                  matchMode === 'team' || matchMode === 'ffa'
                    ? 'border-[#2de2e6] bg-[#2de2e6]/10 shadow-[0_0_16px_rgba(45,226,230,0.35)]'
                    : 'border-white/10 bg-black/50 hover:border-white/30'
                }`}
              >
                <div>
                  {/* Abstract crosshair scanning helmet graphic */}
                  <div className="w-full h-28 bg-[#15191e] rounded-xs border border-white/10 flex items-center justify-center relative overflow-hidden mb-3">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#2de2e6]/80 stroke-current fill-none">
                      <circle cx="50" cy="50" r="38" strokeWidth="1.5" strokeDasharray="4 2" />
                      <line x1="50" y1="5" x2="50" y2="95" strokeWidth="1.2" />
                      <line x1="5" y1="50" x2="95" y2="50" strokeWidth="1.2" />
                      {/* Stylized Helmet Silhouette */}
                      <path
                        d="M32 60 C32 35, 68 35, 68 60 L74 65 L66 65 L64 74 L36 74 L34 65 L26 65 Z"
                        fill="currentColor"
                        fillOpacity="0.3"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <div className="absolute top-2 left-2 text-[8px] text-[#2de2e6] font-bold">
                      THEATER 01
                    </div>
                  </div>

                  <div className="text-xs font-extrabold text-white tracking-wider">
                    FACTION CONFLICT
                  </div>
                  <div className="text-[9px] text-[#2de2e6] font-bold mt-0.5">
                    {matchMode === 'team' ? 'TEAM DEATHMATCH (USMC VS MERCENARIES)' : 'FREE-FOR-ALL (SOLO ARENA)'}
                  </div>
                  <div className="text-[9px] text-[#8b98a1] mt-1.5 leading-relaxed">
                    Tactical skirmish between USMC 1st Recon and Apex Mercenaries. Coordinate squad fire or dominate solo arena.
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px]">
                  <span className="text-[#8b98a1]">CLICK TO TOGGLE:</span>
                  <span className="font-bold text-[#f5a623]">{matchMode === 'team' ? 'TEAM' : 'FFA'}</span>
                </div>
              </div>

              {/* CARD 2: HORDE SURVIVAL (ZOMBIE INFECTION) */}
              <div
                onClick={() => setMatchMode('zombie')}
                className={`p-4 rounded-xs border transition-all cursor-pointer flex flex-col justify-between h-72 ${
                  matchMode === 'zombie'
                    ? 'border-[#ff2a2a] bg-[#ff2a2a]/10 shadow-[0_0_16px_rgba(255,42,42,0.35)]'
                    : 'border-white/10 bg-black/50 hover:border-white/30'
                }`}
              >
                <div>
                  {/* Crimson screaming skull profile mimic graphic */}
                  <div className="w-full h-28 bg-[#1f1012] rounded-xs border border-red-900/40 flex items-center justify-center relative overflow-hidden mb-3">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#ff2a2a]/80 stroke-current fill-none">
                      {/* Screaming Skull Jaw Profile */}
                      <path
                        d="M30 45 C30 20, 70 20, 70 45 C70 55, 62 60, 60 70 L60 82 L40 82 L40 70 C38 60, 30 55, 30 45 Z"
                        fill="#ff2a2a"
                        fillOpacity="0.25"
                        strokeWidth="1.8"
                      />
                      <circle cx="42" cy="42" r="6" fill="#ff2a2a" />
                      <circle cx="58" cy="42" r="6" fill="#ff2a2a" />
                      <path d="M44 65 L56 65 L50 74 Z" fill="#ff2a2a" />
                    </svg>
                    <div className="absolute top-2 left-2 text-[8px] text-[#ff4444] font-bold">
                      THEATER 02 // BIO-HAZARD
                    </div>
                  </div>

                  <div className="text-xs font-extrabold text-white tracking-wider">
                    HORDE SURVIVAL
                  </div>
                  <div className="text-[9px] text-[#ff4444] font-bold mt-0.5">
                    ZOMBIE INFECTION WAVES
                  </div>
                  <div className="text-[9px] text-[#8b98a1] mt-1.5 leading-relaxed">
                    High-intensity wave defense against Walkers, Sprinting Runners, and Titan Tanks. Selective limb dismemberment physics active.
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px]">
                  <span className="text-[#8b98a1]">SURVIVOR DIFFICULTY:</span>
                  <span className="font-bold text-[#ff4444]">PROGRESSIVE WAVES</span>
                </div>
              </div>

              {/* CARD 3: ESCORT VIP EXTRACTION */}
              <div
                onClick={() => setMatchMode('escort')}
                className={`p-4 rounded-xs border transition-all cursor-pointer flex flex-col justify-between h-72 ${
                  matchMode === 'escort'
                    ? 'border-[#00ff66] bg-[#00ff66]/10 shadow-[0_0_16px_rgba(0,255,102,0.35)]'
                    : 'border-white/10 bg-black/50 hover:border-white/30'
                }`}
              >
                <div>
                  {/* Sharp neon geometric security shield crest outline */}
                  <div className="w-full h-28 bg-[#0c1813] rounded-xs border border-emerald-900/40 flex items-center justify-center relative overflow-hidden mb-3">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#00ff66]/80 stroke-current fill-none">
                      <path
                        d="M50 15 L80 25 L80 55 C80 75, 50 88, 50 88 C50 88, 20 75, 20 55 L20 25 Z"
                        fill="#00ff66"
                        fillOpacity="0.25"
                        strokeWidth="1.8"
                      />
                      <circle cx="50" cy="50" r="8" fill="#00ff66" />
                      <line x1="50" y1="35" x2="50" y2="65" strokeWidth="1.5" />
                      <line x1="35" y1="50" x2="65" y2="50" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute top-2 left-2 text-[8px] text-[#00ff66] font-bold">
                      THEATER 03 // EXTRACTION
                    </div>
                  </div>

                  <div className="text-xs font-extrabold text-white tracking-wider">
                    ESCORT VIP EXTRACTION
                  </div>
                  <div className="text-[9px] text-[#00ff66] font-bold mt-0.5">
                    HIGH VALUE TARGET DEFENSE
                  </div>
                  <div className="text-[9px] text-[#8b98a1] mt-1.5 leading-relaxed">
                    Protect the unarmed USMC VIP operative from incoming hostile mercenaries until extraction countdown completes.
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px]">
                  <span className="text-[#8b98a1]">TIMER:</span>
                  <span className="font-bold text-[#00ff66]">180 SEC DEFENSE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 4: [ INTEL ] Statistical Performance Ledger                           */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'intel' && (
        <div className="flex-1 w-full p-6 flex items-center justify-center pointer-events-auto">
          <div className="w-[840px] max-w-[95vw] bg-[#0c1015]/95 border border-white/15 backdrop-blur-md p-5 rounded-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <div className="text-sm font-extrabold tracking-widest text-[#2de2e6]">
                  INTEL // STATISTICAL PERFORMANCE LEDGER
                </div>
                <div className="text-[10px] text-[#8b98a1]">
                  Persistent combat metrics, accuracy telemetry, and operational achievements.
                </div>
              </div>
              <div className="px-2.5 py-1 bg-white/10 rounded text-[10px] text-[#f5a623] font-bold">
                OPERATIVE CLEARANCE: LEVEL 4
              </div>
            </div>

            {/* Matrix Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-black/50 border border-white/10 rounded-xs">
                <div className="text-[9px] text-[#8b98a1] font-bold tracking-wider">
                  TOTAL TARGETS ELIMINATED
                </div>
                <div className="text-2xl font-extrabold text-[#2de2e6] mt-1">
                  {intelStats.totalKills}
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-0.5">Across all combat theaters</div>
              </div>

              <div className="p-3 bg-black/50 border border-white/10 rounded-xs">
                <div className="text-[9px] text-[#8b98a1] font-bold tracking-wider">
                  HEADSHOT ACCURACY RATE
                </div>
                <div className="text-2xl font-extrabold text-[#00ff66] mt-1">
                  {intelStats.totalKills > 0
                    ? Math.round((intelStats.totalHeadshots / intelStats.totalKills) * 100)
                    : 0}
                  %
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-0.5">
                  {intelStats.totalHeadshots} lethal precision shots
                </div>
              </div>

              <div className="p-3 bg-black/50 border border-white/10 rounded-xs">
                <div className="text-[9px] text-[#8b98a1] font-bold tracking-wider">
                  ACCUMULATED CURRENCY
                </div>
                <div className="text-2xl font-extrabold text-[#f5a623] mt-1">
                  ${intelStats.totalFunds}
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-0.5">Tactical supply points</div>
              </div>

              <div className="p-3 bg-black/50 border border-white/10 rounded-xs">
                <div className="text-[9px] text-[#8b98a1] font-bold tracking-wider">
                  HIGHEST WAVE SURVIVED
                </div>
                <div className="text-2xl font-extrabold text-[#ff4444] mt-1">
                  WAVE {intelStats.highestWave}
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-0.5">Zombie infection threshold</div>
              </div>
            </div>

            {/* Match History & Deployment Telemetry */}
            <div className="bg-black/40 border border-white/10 p-3 rounded-xs space-y-2">
              <div className="text-xs font-bold text-white tracking-wider flex items-center justify-between">
                <span>SERVICE RECORD & OPERATIONAL RATINGS</span>
                <span className="text-[9px] text-[#2de2e6]">
                  WIN RATIO: {intelStats.matchesPlayed > 0 ? Math.round((intelStats.matchesWon / intelStats.matchesPlayed) * 100) : 0}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 bg-black/50 border border-white/5 rounded">
                  <span className="text-[#8b98a1]">DEPLOYMENTS: </span>
                  <b className="text-white">{intelStats.matchesPlayed} Matches</b>
                </div>
                <div className="p-2 bg-black/50 border border-white/5 rounded">
                  <span className="text-[#8b98a1]">VICTORIES: </span>
                  <b className="text-[#00ff66]">{intelStats.matchesWon} Operations</b>
                </div>
                <div className="p-2 bg-black/50 border border-white/5 rounded">
                  <span className="text-[#8b98a1]">COMBAT RATING: </span>
                  <b className="text-[#2de2e6]">TIER 1 OPERATOR</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FOOTER BAR */}
      <div className="w-full bg-[#0b0e12]/90 border-t border-white/10 px-6 py-2 flex items-center justify-between pointer-events-auto text-[9px] text-[#8b98a1]">
        <div>
          DIEGETIC HELMET VISOR ACTIVE: <b style={{ color: currentVisorConfig.tint }}>{currentVisorConfig.name}</b>
        </div>
        <div>
          GUN ARENA ENGINE V4.2 • THREE.JS 3D RIGGING • 60 FPS REACT
        </div>
      </div>
    </div>
  );
};
