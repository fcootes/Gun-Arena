import React, { useEffect, useRef } from 'react';
import { WeaponDef, WeaponSlotState } from './types';
import { VisorType } from './lobbyAvatar';

export interface RadarPing {
  x: number;
  z: number;
  timestamp: number;
  duration: number;
  type: 'gunfire' | 'zombie';
}

export interface HelmetHUDProps {
  visorType: VisorType;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  currentWeapon: WeaponDef;
  weaponSlotState: WeaponSlotState;
  slotIndex: number;
  playerLoadout: WeaponDef[];
  playerLoadoutStates: WeaponSlotState[];
  matchMode: 'ffa' | 'team' | 'zombie' | 'escort';
  factionAlignment: 'usmc' | 'apex';
  blueScore: number;
  redScore: number;
  targetScore: number;
  currentWave: number;
  zombiesRemaining: number;
  kills: number;
  timeStr: string;
  zoneStatus: string;
  playerPos: { x: number; z: number };
  playerYaw: number;
  radarPingsRef: React.MutableRefObject<RadarPing[]>;
}

// Color schemes per visor model
export const VISOR_THEMES = {
  standard: {
    primary: '#2de2e6',
    secondary: '#3f8fe0',
    accent: '#00ffee',
    dim: 'rgba(45, 226, 230, 0.15)',
    border: 'rgba(45, 226, 230, 0.45)',
    glow: '0 0 12px rgba(45, 226, 230, 0.4)',
    scanlines: false,
    label: 'USMC BATTLE-VISOR'
  },
  recon: {
    primary: '#00ff66',
    secondary: '#39ff14',
    accent: '#70ff00',
    dim: 'rgba(0, 255, 102, 0.15)',
    border: 'rgba(0, 255, 102, 0.45)',
    glow: '0 0 12px rgba(0, 255, 102, 0.45)',
    scanlines: true,
    label: 'RECON NIGHT-VISION MATRIX'
  },
  apex: {
    primary: '#ff2a2a',
    secondary: '#e0473f',
    accent: '#ff5533',
    dim: 'rgba(255, 42, 42, 0.15)',
    border: 'rgba(255, 42, 42, 0.45)',
    glow: '0 0 12px rgba(255, 42, 42, 0.45)',
    scanlines: false,
    label: 'APEX MERCENARY TERMINAL'
  }
};

export const HelmetHUD: React.FC<HelmetHUDProps> = ({
  visorType,
  health,
  maxHealth,
  shield,
  maxShield,
  currentWeapon,
  weaponSlotState,
  slotIndex,
  playerLoadout,
  playerLoadoutStates,
  matchMode,
  factionAlignment,
  blueScore,
  redScore,
  targetScore,
  currentWave,
  zombiesRemaining,
  kills,
  timeStr,
  zoneStatus,
  playerPos,
  playerYaw,
  radarPingsRef
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const theme = VISOR_THEMES[visorType] || VISOR_THEMES.standard;

  // Health critical pulse check (<30% health)
  const hpRatio = Math.max(0, health) / (maxHealth || 100);
  const isCritical = hpRatio < 0.30;

  // Render Radar Canvas (Soundless Motion Tracker with 360 sweep and aggro blinks)
  useEffect(() => {
    let animationFrameId: number;

    const renderRadar = () => {
      const canvas = radarCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = w / 2 - 4;

      ctx.clearRect(0, 0, w, h);

      // Radar Dark Background with subtle tint
      ctx.fillStyle = visorType === 'apex' ? 'rgba(30, 8, 8, 0.75)' : (visorType === 'recon' ? 'rgba(4, 26, 12, 0.75)' : 'rgba(8, 20, 30, 0.75)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Distance Rings (15m, 30m, 50m max)
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      [0.3, 0.6, 0.95].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.strokeStyle = theme.dim;
      ctx.stroke();

      // Rotating 360-degree radar sweep beam
      const now = performance.now();
      const sweepAngle = (now * 0.0025) % (Math.PI * 2);
      const sweepGradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
      sweepGradient.addColorStop(0, theme.primary);
      sweepGradient.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweepAngle - 0.35, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = theme.dim;
      ctx.fill();
      ctx.restore();

      // Sweep leading line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Player Indicator (Arrowhead pointing forward/up)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx - 3, cy + 4);
      ctx.lineTo(cx, cy + 2);
      ctx.lineTo(cx + 3, cy + 4);
      ctx.closePath();
      ctx.fill();

      // Combat Aggro Radar Blinks (Active Gunfire / Zombie lunges within radius)
      const pings = radarPingsRef.current;
      const MAX_RADAR_DIST = 50.0;

      for (let i = pings.length - 1; i >= 0; i--) {
        const ping = pings[i];
        const age = (now - ping.timestamp) / 1000;
        if (age > ping.duration) {
          pings.splice(i, 1);
          continue;
        }

        // Relative coordinates from player
        const dx = ping.x - playerPos.x;
        const dz = ping.z - playerPos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > MAX_RADAR_DIST) continue;

        // Transform coordinates relative to player yaw so UP is forward
        // Angle in world coordinates
        const angle = Math.atan2(dz, dx);
        const relAngle = angle - playerYaw - Math.PI / 2;
        const rDist = (dist / MAX_RADAR_DIST) * (radius * 0.92);

        const blipX = cx + Math.cos(relAngle) * rDist;
        const blipY = cy + Math.sin(relAngle) * rDist;

        // Blinking alpha
        const blinkAlpha = Math.max(0, 1 - age / ping.duration);
        const isZombie = ping.type === 'zombie';

        // Glowing outer pulse ring
        ctx.strokeStyle = isZombie ? `rgba(255, 120, 0, ${blinkAlpha * 0.7})` : `rgba(255, 30, 30, ${blinkAlpha * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 4 + (age * 6), 0, Math.PI * 2);
        ctx.stroke();

        // Sharp solid coordinate center dot
        ctx.fillStyle = isZombie ? `rgba(255, 140, 20, ${blinkAlpha})` : `rgba(255, 40, 40, ${blinkAlpha})`;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(renderRadar);
    };

    renderRadar();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, visorType, playerPos, playerYaw, radarPingsRef]);

  // Weapon Silhouette SVG renderer matching active weapon
  const renderWeaponSilhouette = (weaponId: string) => {
    const strokeColor = theme.primary;
    if (weaponId === 'shotgun') {
      return (
        <svg viewBox="0 0 100 30" className="w-20 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M5 18 L25 18 L28 12 L85 12 L95 14 L95 18 L88 19 L40 19 L32 24 L20 24 L14 26 L5 24 Z" />
          <rect x="42" y="19" width="18" height="4" fill={strokeColor} fillOpacity="0.4" />
          <line x1="88" y1="12" x2="88" y2="19" />
        </svg>
      );
    }
    if (weaponId === 'sniper') {
      return (
        <svg viewBox="0 0 110 32" className="w-22 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M4 22 L20 22 L26 16 L98 16 L98 19 L42 19 L34 26 L16 26 L6 27 Z" />
          <rect x="35" y="9" width="30" height="5" />
          <line x1="42" y1="14" x2="42" y2="16" />
          <line x1="58" y1="14" x2="58" y2="16" />
          <line x1="92" y1="19" x2="96" y2="28" />
        </svg>
      );
    }
    if (weaponId === 'pistol') {
      return (
        <svg viewBox="0 0 60 36" className="w-14 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M6 10 L52 10 L54 13 L52 18 L28 18 L22 32 L12 32 L16 18 L6 18 Z" />
          <line x1="30" y1="18" x2="26" y2="24" />
        </svg>
      );
    }
    if (weaponId === 'smg') {
      return (
        <svg viewBox="0 0 80 34" className="w-18 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M6 16 L22 16 L26 12 L72 12 L74 18 L48 18 L42 32 L34 32 L38 18 L32 26 L22 26 L14 18 Z" />
          <line x1="60" y1="18" x2="60" y2="24" />
        </svg>
      );
    }
    if (weaponId === 'br') {
      return (
        <svg viewBox="0 0 95 32" className="w-20 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M8 20 L24 20 L30 14 L85 14 L88 18 L50 18 L46 26 L36 26 L40 18 L18 25 L8 24 Z" />
          <rect x="40" y="8" width="22" height="5" />
          <rect x="18" y="20" width="10" height="9" fill={strokeColor} fillOpacity="0.4" />
        </svg>
      );
    }
    if (weaponId === 'lmg' || weaponId === 'minigun') {
      return (
        <svg viewBox="0 0 100 36" className="w-22 h-8" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M6 16 L25 16 L32 10 L94 10 L94 18 L48 18 L42 28 L32 28 L36 18 L6 22 Z" />
          <circle cx="50" cy="24" r="7" fill={strokeColor} fillOpacity="0.35" />
          <line x1="75" y1="18" x2="80" y2="28" />
        </svg>
      );
    }
    if (weaponId === 'railgun' || weaponId === 'laser') {
      return (
        <svg viewBox="0 0 100 32" className="w-22 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <path d="M6 18 L24 18 L30 12 L92 12 L94 15 L78 15 L78 18 L94 18 L92 21 L35 21 L28 28 L18 28 L14 21 Z" />
          <line x1="45" y1="13" x2="65" y2="13" strokeDasharray="3,2" />
        </svg>
      );
    }
    if (currentWeapon.type === 'grenade') {
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke={strokeColor} strokeWidth="1.6">
          <circle cx="20" cy="24" r="12" />
          <rect x="17" y="6" width="6" height="6" />
          <path d="M14 6 C14 2, 26 2, 26 6" />
          <line x1="12" y1="24" x2="28" y2="24" />
          <line x1="20" y1="16" x2="20" y2="32" />
        </svg>
      );
    }
    // Default Assault Rifle (M4A1)
    return (
      <svg viewBox="0 0 95 32" className="w-20 h-7" fill="none" stroke={strokeColor} strokeWidth="1.6">
        <path d="M6 18 L24 18 L28 13 L86 13 L88 17 L52 17 L44 28 L36 28 L40 17 L24 24 L10 24 Z" />
        <rect x="42" y="17" width="8" height="11" fill={strokeColor} fillOpacity="0.4" />
        <line x1="72" y1="8" x2="72" y2="13" />
        <line x1="38" y1="9" x2="48" y2="9" />
      </svg>
    );
  };

  // Generate Segmented Health / Shield bars
  const totalHpSegments = 16;
  const filledHpSegments = Math.round((Math.max(0, health) / (maxHealth || 100)) * totalHpSegments);
  const totalShieldSegments = 16;
  const filledShieldSegments = Math.round((Math.max(0, shield) / (maxShield || 100)) * totalShieldSegments);

  // Ammunition formatting
  let ammoDisplay = `${weaponSlotState.ammo ?? 0}`;
  let reserveDisplay = `${weaponSlotState.reserve ?? 0}`;
  let fireModeLabel = 'AUTO';

  if (currentWeapon.id === 'laser') {
    const heat = Math.round(weaponSlotState.heat ?? 0);
    ammoDisplay = `${100 - heat}%`;
    reserveDisplay = `HEAT ${heat}%`;
    fireModeLabel = 'CONTINUOUS BEAM';
  } else if (currentWeapon.id === 'minigun') {
    const heat = Math.round(weaponSlotState.heat ?? 0);
    ammoDisplay = `${heat}%`;
    reserveDisplay = 'HEAT 100%';
    fireModeLabel = 'HYPER-AUTO';
  } else if (currentWeapon.id === 'railgun') {
    ammoDisplay = `${weaponSlotState.ammo ?? 1}`;
    reserveDisplay = `${weaponSlotState.reserve ?? 30} SLUGS`;
    fireModeLabel = 'KINETIC SLUG';
  } else if (currentWeapon.burst) {
    fireModeLabel = '3-ROUND BURST';
  } else if (!currentWeapon.auto && currentWeapon.type === 'weapon') {
    fireModeLabel = 'SEMI-AUTO';
  } else if (currentWeapon.type === 'grenade') {
    ammoDisplay = `${weaponSlotState.count ?? 0}`;
    reserveDisplay = 'GRENADES';
    fireModeLabel = 'EXPLOSIVE';
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 font-mono select-none">
      {/* 1. OUTER ARMOUR VISOR RIM: Diegetic Helmet Eye-Port Geometry */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-Left Helmet Corner Armature */}
        <div
          className="absolute top-0 left-0 w-48 h-24 border-t-4 border-l-4"
          style={{
            borderColor: theme.primary,
            clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)',
            opacity: 0.85
          }}
        >
          <div className="text-[9px] font-bold tracking-widest pl-2 pt-1 opacity-70" style={{ color: theme.primary }}>
            {theme.label} // SYS.OK
          </div>
        </div>

        {/* Top-Right Helmet Corner Armature */}
        <div
          className="absolute top-0 right-0 w-48 h-24 border-t-4 border-r-4"
          style={{
            borderColor: theme.primary,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 25% 100%)',
            opacity: 0.85
          }}
        >
          <div className="text-[9px] font-bold tracking-widest text-right pr-2 pt-1 opacity-70" style={{ color: theme.primary }}>
            TACTICAL HUD // VER 4.2
          </div>
        </div>

        {/* Bottom-Left Helmet Visor Arc Frame */}
        <div
          className="absolute bottom-0 left-0 w-64 h-32 border-b-4 border-l-4"
          style={{
            borderColor: theme.primary,
            clipPath: 'polygon(0 0, 30% 0, 100% 100%, 0 100%)',
            opacity: 0.65
          }}
        />

        {/* Bottom-Right Helmet Visor Arc Frame */}
        <div
          className="absolute bottom-0 right-0 w-64 h-32 border-b-4 border-r-4"
          style={{
            borderColor: theme.primary,
            clipPath: 'polygon(70% 0, 100% 0, 100% 100%, 0 100%)',
            opacity: 0.65
          }}
        />

        {/* Optical Visor Outer Vignette Edge */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 90px 20px ${theme.dim}`,
            border: `1px solid ${theme.dim}`
          }}
        />

        {/* Optional Recon Scanline Matrix Filter */}
        {theme.scanlines && (
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 102, 0.4) 3px, transparent 4px)',
              backgroundSize: '100% 4px'
            }}
          />
        )}
      </div>

      {/* 2. TOP-LEFT INTEGRATED DEFENCE CORE (Health & Shield Segments) */}
      <div
        className={`absolute top-6 left-8 p-3 rounded bg-black/70 border backdrop-blur-md transition-all ${
          isCritical ? 'border-red-500 animate-pulse !bg-red-950/60' : ''
        }`}
        style={{
          borderColor: isCritical ? '#ff2a2a' : theme.border,
          boxShadow: isCritical ? '0 0 20px rgba(255, 42, 42, 0.6)' : theme.glow,
          width: '280px'
        }}
      >
        <div className="flex items-center justify-between text-[10px] tracking-widest font-bold mb-1">
          <span style={{ color: isCritical ? '#ff5533' : theme.primary }}>
            {isCritical ? 'CRITICAL VITALS WARNING' : 'DEFENCE CORE MATRIX'}
          </span>
          <span style={{ color: isCritical ? '#ff5533' : theme.accent }}>
            HP: {Math.ceil(health)} | SH: {Math.ceil(shield)}
          </span>
        </div>

        {/* Energy Shield Segmented Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[8px] text-[#8b98a1] mb-0.5">
            <span>SHIELD MATRIX</span>
            <span className="text-[#3f8fe0] font-bold">{Math.round((shield / (maxShield || 100)) * 100)}%</span>
          </div>
          <div className="grid grid-cols-16 gap-0.5 h-3 bg-black/80 p-0.5 border border-white/10 rounded-sm">
            {Array.from({ length: totalShieldSegments }).map((_, idx) => (
              <div
                key={`sh-${idx}`}
                className={`h-full rounded-xs transition-all ${
                  idx < filledShieldSegments
                    ? 'bg-[#3f8fe0] shadow-[0_0_6px_#3f8fe0]'
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Vital Health Segmented Bar */}
        <div>
          <div className="flex items-center justify-between text-[8px] text-[#8b98a1] mb-0.5">
            <span>BIO-VITALS</span>
            <span className={isCritical ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {Math.round(hpRatio * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-16 gap-0.5 h-3 bg-black/80 p-0.5 border border-white/10 rounded-sm">
            {Array.from({ length: totalHpSegments }).map((_, idx) => (
              <div
                key={`hp-${idx}`}
                className={`h-full rounded-xs transition-all ${
                  idx < filledHpSegments
                    ? isCritical
                      ? 'bg-[#ff2a2a] shadow-[0_0_8px_#ff2a2a]'
                      : 'bg-[#e0473f] shadow-[0_0_6px_#e0473f]'
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Small Active Faction / Class Indicator Tag */}
        <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-[#8b98a1]">
          <span>OPERATIVE: <b className="text-white uppercase">{factionAlignment === 'usmc' ? 'USMC RECON' : 'APEX PMC'}</b></span>
          <span style={{ color: theme.primary }}>ARMOR LOCK // ENGAGED</span>
        </div>
      </div>

      {/* 3. TOP-CENTER MATCH SCOREBOARD & COMPASS */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        {/* Tactical Match Banner */}
        <div
          className="px-5 py-1.5 bg-black/75 border backdrop-blur-md rounded-t flex items-center gap-3 text-xs tracking-wider"
          style={{ borderColor: theme.border, boxShadow: theme.glow }}
        >
          {matchMode === 'zombie' ? (
            <>
              <span className="text-[#4caf50] font-bold">WAVE {currentWave}</span>
              <span className="text-white/30">|</span>
              <span className="text-[#ff4444] font-bold">ZOMBIES: {Math.max(0, zombiesRemaining)}</span>
            </>
          ) : matchMode === 'team' ? (
            <>
              <span className="text-[#3f8fe0] font-bold">
                {factionAlignment === 'usmc' ? 'USMC' : 'MERCENARIES'} {blueScore}
              </span>
              <span className="text-white/40 font-normal">VS</span>
              <span className="text-[#ff4444] font-bold">
                {redScore} {factionAlignment === 'usmc' ? 'MERCENARIES' : 'USMC'}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-[#f5a623] text-[10px]">GOAL: {targetScore}</span>
            </>
          ) : (
            <>
              <span className="text-[#3f8fe0] font-bold">ELIMINATIONS: {kills}</span>
              <span className="text-white/30">|</span>
              <span className="text-[#f5a623] text-[10px]">TARGET: {targetScore}</span>
            </>
          )}
          <span className="text-white/30">|</span>
          <span className="text-white text-[11px]">{timeStr}</span>
        </div>
      </div>

      {/* 4. TOP-RIGHT TACTICAL MUNITIONS MATRIX (Ammo Readout + Morphing Wireframe Silhouette) */}
      <div
        className="absolute top-6 right-8 p-3 rounded bg-black/70 border backdrop-blur-md flex flex-col items-end"
        style={{
          borderColor: theme.border,
          boxShadow: theme.glow,
          minWidth: '240px'
        }}
      >
        <div className="flex items-center justify-between w-full text-[9px] tracking-wider text-[#8b98a1] mb-1">
          <span style={{ color: theme.primary }}>TACTICAL MUNITIONS MATRIX</span>
          <span className="px-1 py-0.5 rounded bg-white/10 text-[8px] font-bold" style={{ color: theme.accent }}>
            {fireModeLabel}
          </span>
        </div>

        {/* Dynamic Wireframe Block Silhouette */}
        <div className="my-1 flex items-center justify-center p-1 bg-black/50 border border-white/10 rounded w-full">
          {renderWeaponSilhouette(currentWeapon.id)}
        </div>

        {/* Digital Numeric Ammo Readout */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-extrabold tracking-tight" style={{ color: theme.primary }}>
            {ammoDisplay}
          </span>
          <span className="text-xs font-bold text-[#8b98a1]">
            / {reserveDisplay}
          </span>
        </div>

        {/* Active Weapon Name Tag */}
        <div className="text-[10px] font-bold tracking-widest text-white mt-0.5 uppercase">
          {currentWeapon.name}
        </div>

        {/* Reloading / Overheating Status Tag */}
        {weaponSlotState.reloading && (
          <div className="mt-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-[9px] font-bold animate-pulse rounded">
            TACTICAL RELOAD IN PROGRESS...
          </div>
        )}
        {weaponSlotState.overheated && (
          <div className="mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500 text-red-400 text-[9px] font-bold animate-pulse rounded">
            CORE OVERHEATED! VENTING...
          </div>
        )}
      </div>

      {/* 5. BOTTOM-LEFT CIRCULAR PROXIMITY MOTION TRACKER (TACTICAL RADAR) */}
      <div
        className="absolute bottom-6 left-8 p-2 rounded-full bg-black/80 border backdrop-blur-md flex flex-col items-center justify-center"
        style={{
          borderColor: theme.border,
          boxShadow: theme.glow,
          width: '148px',
          height: '148px'
        }}
      >
        <canvas
          ref={radarCanvasRef}
          width={136}
          height={136}
          className="block rounded-full"
        />
        <div
          className="absolute -bottom-2 px-2 py-0.5 rounded bg-black/90 border text-[8px] font-bold tracking-wider"
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          MOTION TRACKER // 50M
        </div>
      </div>

      {/* 6. BOTTOM-CENTER 3-SLOT TACTICAL LOADOUT HOTBAR */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {playerLoadout.slice(0, 3).map((weapon, idx) => {
          const isSelected = slotIndex === idx;
          const slotState = playerLoadoutStates[idx];
          return (
            <div
              key={`hotbar-${weapon.id}-${idx}`}
              className={`px-3 py-1.5 rounded bg-black/80 border backdrop-blur-md flex items-center gap-2 transition-all ${
                isSelected ? 'scale-105' : 'opacity-70'
              }`}
              style={{
                borderColor: isSelected ? theme.primary : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isSelected ? theme.glow : 'none'
              }}
            >
              <div
                className="w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-bold font-mono"
                style={{
                  backgroundColor: isSelected ? theme.primary : 'rgba(255,255,255,0.1)',
                  color: isSelected ? '#000' : '#fff'
                }}
              >
                {idx === 2 ? '3/G' : idx + 1}
              </div>
              <div className="text-left">
                <div className="text-[9px] font-bold text-white tracking-wider">
                  {weapon.name}
                </div>
                <div className="text-[8px] text-[#8b98a1]">
                  {weapon.type === 'grenade'
                    ? `x${slotState?.count ?? 0} EXPLOSIVE`
                    : `${slotState?.ammo ?? 0} / ${slotState?.reserve ?? 0}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
