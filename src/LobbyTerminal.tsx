import React, { useState } from 'react';
import { ClassId } from './types';
import { CLASSES } from './App';
import { VisorType, FactionType } from './lobbyAvatar';
import { VISOR_THEMES } from './HelmetHUD';

export type LobbyTab = 'play' | 'loadout' | 'gamemode' | 'intel';

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

          {/* 4 Clickable Styled Navigation Tab Buttons */}
          <div className="flex items-center gap-2">
            {(['play', 'loadout', 'gamemode', 'intel'] as LobbyTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabels: Record<LobbyTab, string> = {
                play: 'PLAY',
                loadout: 'LOADOUT',
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
                onClick={() => setFactionAlignment('usmc')}
                className={`p-2.5 text-left border rounded-xs transition-all cursor-pointer ${
                  factionAlignment === 'usmc' || matchMode === 'zombie'
                    ? 'border-[#628243] bg-[#2b3d1e]/40 shadow-[0_0_8px_rgba(98,130,67,0.4)]'
                    : 'border-white/10 bg-black/40 hover:border-white/30'
                }`}
              >
                <div className="text-xs font-bold text-[#a3d977] tracking-wider">
                  JOIN USMC COALITION
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-0.5">
                  Olive Drab Digital Camo • 3D Tactical Beard • PASGT Helmet
                </div>
              </button>

              <button
                disabled={matchMode === 'zombie'}
                onClick={() => setFactionAlignment('apex')}
                className={`p-2.5 text-left border rounded-xs transition-all cursor-pointer ${
                  matchMode === 'zombie'
                    ? 'opacity-30 cursor-not-allowed'
                    : factionAlignment === 'apex'
                    ? 'border-[#ff4444] bg-[#3a1818]/40 shadow-[0_0_8px_rgba(255,68,68,0.4)]'
                    : 'border-white/10 bg-black/40 hover:border-white/30'
                }`}
              >
                <div className="text-xs font-bold text-[#ff7777] tracking-wider">
                  CONTRACT WITH APEX MERCENARIES
                </div>
                <div className="text-[8px] text-[#8b98a1] mt-0.5">
                  Carbon Stealth Armor • 3D Skull Mask Plate • Tactical Hood
                </div>
              </button>
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
      {/* TAB 2: [ LOADOUT ] Armory Configuration Matrix & Helmet Locker            */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'loadout' && (
        <div className="flex-1 w-full p-6 flex items-center justify-center pointer-events-auto">
          <div className="w-[840px] max-w-[95vw] max-h-[82vh] overflow-y-auto bg-[#0c1015]/95 border border-white/15 backdrop-blur-md p-5 rounded-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <div className="text-sm font-extrabold tracking-widest text-[#2de2e6]">
                  ARMORY CONFIGURATION MATRIX
                </div>
                <div className="text-[10px] text-[#8b98a1]">
                  Customize your operative combat class, ballistic weapons, and diegetic helmet visor optics.
                </div>
              </div>
              <button
                onClick={onDeploy}
                className="px-4 py-1.5 bg-[#2de2e6] text-black font-bold text-xs tracking-wider rounded-xs hover:bg-[#00ff66] transition-colors cursor-pointer"
              >
                DEPLOY WITH LOADOUT
              </button>
            </div>

            {/* 1. Tactical Helmet Locker */}
            <div className="bg-black/40 border border-white/10 p-3 rounded-xs">
              <div className="text-xs font-bold text-[#2de2e6] tracking-wider mb-2 flex items-center justify-between">
                <span>TACTICAL HELMET LOCKER (DIEGETIC VISOR OPTICS)</span>
                <span className="text-[9px] text-[#8b98a1] font-normal">
                  UPDATES 3D AVATAR & IN-GAME HELMET VISOR HUD TINT
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {HELMET_LOCKER_OPTIONS.map((item) => {
                  const isSelected = visorType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setVisorType(item.id)}
                      className={`p-2.5 border rounded-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-white bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                          : 'border-white/10 bg-black/50 hover:border-white/30'
                      }`}
                      style={{
                        borderColor: isSelected ? item.tint : undefined
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-xs shadow-sm"
                          style={{ backgroundColor: item.tint }}
                        />
                        <span className="text-[11px] font-bold text-white tracking-wider">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#8b98a1] leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Battlefront-Style 5-Class Selector */}
            <div className="bg-black/40 border border-white/10 p-3 rounded-xs">
              <div className="text-xs font-bold text-[#2de2e6] tracking-wider mb-2 flex items-center justify-between">
                <span>TACTICAL CLASS SPECIALIZATION</span>
                <span className="text-[9px] text-[#8b98a1] font-normal">
                  PERK: {CLASSES[selectedClassId]?.perkName}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(CLASSES) as ClassId[]).map((cKey) => {
                  const cls = CLASSES[cKey];
                  const isSelected = selectedClassId === cKey;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedPrimary(cls.defaultPrimary);
                        setSelectedSecondary(cls.defaultSecondary);
                      }}
                      className={`p-2 text-left border rounded-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 shadow-md'
                          : 'bg-black/50 border-white/10 hover:border-white/30'
                      }`}
                      style={{
                        borderColor: isSelected ? cls.color : undefined
                      }}
                    >
                      <div className="text-xs font-bold tracking-wider" style={{ color: cls.color }}>
                        {cls.name}
                      </div>
                      <div className="text-[8px] text-[#8b98a1] mt-0.5">{cls.tagline}</div>
                      <div className="text-[8px] text-white/80 mt-1 line-clamp-2 leading-tight">
                        {cls.perkDesc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Primary & Secondary Weapon Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Primary Selector */}
              <div className="bg-black/40 border border-white/10 p-3 rounded-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-[#2de2e6] tracking-wider mb-1">
                    PRIMARY WEAPON SELECTION
                  </div>
                  <div className="text-[9px] text-[#8b98a1] mb-2">
                    Assault Rifles, Pump Shotguns, and Heavy Suppression Armaments.
                  </div>
                </div>
                <select
                  value={selectedPrimary}
                  onChange={(e) => setSelectedPrimary(e.target.value)}
                  className="w-full bg-black/90 border border-white/20 text-[#2de2e6] text-xs p-2 rounded-xs outline-none cursor-pointer focus:border-[#2de2e6]"
                >
                  {ARMORY_CATEGORIES.primary.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#0c1015] text-white">
                      [{opt.category}] {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Selector */}
              <div className="bg-black/40 border border-white/10 p-3 rounded-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-[#2de2e6] tracking-wider mb-1">
                    SECONDARY WEAPON SELECTION
                  </div>
                  <div className="text-[9px] text-[#8b98a1] mb-2">
                    Sidearms, Submachine Guns, and Close-Quarters Backup.
                  </div>
                </div>
                <select
                  value={selectedSecondary}
                  onChange={(e) => setSelectedSecondary(e.target.value)}
                  className="w-full bg-black/90 border border-white/20 text-[#2de2e6] text-xs p-2 rounded-xs outline-none cursor-pointer focus:border-[#2de2e6]"
                >
                  {ARMORY_CATEGORIES.secondary.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#0c1015] text-white">
                      [{opt.category}] {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
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
