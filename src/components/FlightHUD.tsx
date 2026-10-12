import React, { useState } from 'react';
import { CameraViewMode, ShipState, CelestialTarget, TacticalLogEvent } from '../types/simulation';
import { TacticalHUDTicker } from './TacticalLogConsole';
import {
  Target,
  Zap,
  Shield,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Anchor,
  Rocket,
} from 'lucide-react';

interface FlightHUDProps {
  shipState: ShipState | null;
  currentView: CameraViewMode;
  targets: CelestialTarget[];
  onDisengageWarp?: () => void;
  onSetWarpFactor?: (factor: number) => void;
  onSummonNextWave?: () => void;
  onDock?: (stationId?: string) => void;
  onUndock?: () => void;
  onToggleNavigation?: () => void;
  onGoToNearestSpaceDock?: () => void;
  recentLogs?: TacticalLogEvent[];
  onOpenFullLog?: () => void;
  isScannerOpen?: boolean;
}

export const FlightHUD: React.FC<FlightHUDProps> = ({
  shipState,
  currentView,
  targets,
  onDisengageWarp,
  onSetWarpFactor,
  onSummonNextWave,
  onDock,
  onUndock,
  onToggleNavigation,
  onGoToNearestSpaceDock,
  recentLogs,
  onOpenFullLog,
  isScannerOpen = false,
}) => {
  const [isOrdnanceCollapsed, setIsOrdnanceCollapsed] = useState<boolean>(false);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(false);

  if (!shipState) return null;

  const isRedAlert = shipState.alertLevel === 'red';
  const selectedTarget = targets.find((t) => t.id === shipState.selectedTargetId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
      {/* Red Alert Screen Edge Warning Pulse */}
      {isRedAlert && (
        <div className="absolute inset-0 border-4 border-red-600/70 shadow-[inset_0_0_50px_rgba(220,38,38,0.35)] animate-pulse pointer-events-none" />
      )}

      {/* CRITICAL ALERT: INCOMING HOSTILE TORPEDO (Centered, High Visibility, Unobstructed) */}
      {shipState.hasIncomingTorpedo && (
        <div className="absolute top-48 sm:top-52 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-xl bg-red-600/95 border-2 border-amber-300 text-center shadow-[0_0_40px_rgba(239,68,68,0.9)] animate-bounce pointer-events-auto">
          <div className="flex items-center gap-2 text-white font-trek font-bold text-xs sm:text-sm uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            <span>⚠️ CRITICAL: INCOMING HEAVY TORPEDO!</span>
            <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] text-amber-200 font-mono-nums">
              EVASIVE BOOST [SHIFT]
            </span>
          </div>
        </div>
      )}

      {/* High-Impact Evasive Boost Visual Overdrive Vignette & Speed Flare */}
      {shipState.isBoostActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Cyan screen perimeter glow and high-energy impulse edge vignette */}
          <div className="absolute inset-0 border-4 border-cyan-400/60 shadow-[inset_0_0_100px_rgba(6,182,212,0.45)] animate-pulse" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cyan-500/25 via-cyan-900/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cyan-500/25 via-cyan-900/10 to-transparent" />
          {/* Subtle impulse thruster warp streaks along flanks */}
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-cyan-500/15 to-transparent" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-cyan-500/15 to-transparent" />
        </div>
      )}

      {/* Evasive Boost Active Banner */}
      {shipState.isBoostActive && (
        <div className="absolute top-48 sm:top-52 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-center shadow-[0_0_35px_rgba(6,182,212,0.85)] animate-pulse flex flex-col items-center gap-1 min-w-[320px]">
          <div className="text-xs font-trek text-cyan-200 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>⚡ EVASIVE OVERDRIVE [{Math.ceil(shipState.boostDuration ?? 13)}s]</span>
            <span className="text-cyan-400">·</span>
            <span>247,000 KM/S (BOOST SURGE)</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-cyan-300 font-mono-nums">
            <span>75% Disruptor Deflection</span>
            <span>·</span>
            <span>2.5x Agility & Thruster Burst</span>
          </div>
          {/* Dynamic Depletion Bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-100"
              style={{ width: `${Math.max(0, Math.min(100, ((shipState.boostDuration ?? 13) / 13) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* SPACE STATION DOCKING PROXIMITY BANNER (Repair & Refill Opportunity) */}
      {!shipState.isDocked && shipState.canDockAtStation && (
        <div className="absolute top-48 sm:top-52 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 text-center shadow-[0_0_35px_rgba(6,182,212,0.7)] flex flex-col sm:flex-row items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 text-cyan-300 font-trek font-bold text-xs uppercase tracking-wider">
            <Anchor className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>
              {shipState.canDockAtStation.name} IN RANGE ({shipState.canDockAtStation.distance} KM)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-nums text-slate-300 hidden md:inline">
              100% Hull Repair & Torpedo Refill
            </span>
            <button
              onClick={() => onDock?.(shipState.canDockAtStation?.id)}
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wide transition-all shadow-md flex items-center gap-1.5"
            >
              <span>⚓ DOCK NOW [X]</span>
            </button>
          </div>
        </div>
      )}

      {/* STARSHIP SECURELY DOCKED STATUS BANNER */}
      {shipState.isDocked && (
        <div className="absolute top-48 sm:top-52 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-2xl bg-slate-950/95 border-2 border-emerald-400 text-center shadow-[0_0_40px_rgba(16,185,129,0.7)] flex flex-col items-center gap-1.5 pointer-events-auto">
          <div className="text-xs font-trek text-emerald-300 font-bold uppercase tracking-widest flex items-center gap-2">
            <Anchor className="w-4 h-4 text-emerald-400" />
            <span>SECURELY MOORED: {shipState.dockedStationName || 'ORBITAL SPACEDOCK'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="text-[11px] font-mono-nums text-emerald-100/90 flex flex-wrap items-center justify-center gap-2">
            <span className="text-emerald-400 font-bold">✓ Hull Repaired: 100%</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">✓ Shields: 100%</span>
            <span>·</span>
            <span className="text-cyan-300 font-bold">✓ Photon Torpedoes: 30/30 (Rearmed)</span>
          </div>

          <button
            onClick={onUndock}
            className="mt-1 px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-trek font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>DISENGAGE MOORINGS / UNDOCK [X]</span>
          </button>
        </div>
      )}

      {/* Bridge / Helm Viewscreen Targeting Crosshair */}
      {(currentView === 'bridge' || currentView === 'chase' || currentView === 'interior_bridge') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center opacity-70">
            {/* Center reticle */}
            <div className="w-2.5 h-2.5 rounded-full border border-sky-400/80 bg-sky-400/20" />
            
            {/* Crosshair ticks */}
            <div className="absolute top-0 w-0.5 h-4 bg-sky-400/60" />
            <div className="absolute bottom-0 w-0.5 h-4 bg-sky-400/60" />
            <div className="absolute left-0 w-4 h-0.5 bg-sky-400/60" />
            <div className="absolute right-0 w-4 h-0.5 bg-sky-400/60" />

            {/* Tactical brackets */}
            <div className={`absolute inset-0 border rounded-full transition-colors ${
              shipState.lockedEnemy ? 'border-red-500/80 animate-pulse' : 'border-sky-500/30'
            }`} />
            
            {/* Target vector cue if locked on planet */}
            {selectedTarget && !shipState.lockedEnemy && (
              <div className="absolute -bottom-8 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-sky-500/40 text-[10px] font-mono-nums text-sky-300">
                <Target className="w-3 h-3 text-sky-400" />
                <span>{selectedTarget.name}</span>
                <span className="text-slate-400">· {selectedTarget.distance}M km</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ENEMY TARGET LOCK BOX */}
      {shipState.lockedEnemy && (
        <div className={`absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 p-3 backdrop-blur-md rounded-xl shadow-2xl text-xs font-mono-nums min-w-[340px] pointer-events-auto z-30 ${
          shipState.lockedEnemy.isMothership
            ? 'bg-amber-950/90 border-2 border-amber-500 shadow-amber-900/50'
            : 'bg-red-950/85 border border-red-500/70'
        }`}>
          <div className="flex items-center justify-between border-b border-red-800/80 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-trek font-bold text-red-200 uppercase tracking-wider">
                {shipState.lockedEnemy.isMothership ? '👑 FLAGSHIP:' : 'HOSTILE:'} {shipState.lockedEnemy.name}
              </span>
              {shipState.lockedEnemy.isElite && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded text-[9px] font-trek font-bold">
                  ELITE
                </span>
              )}
              {shipState.lockedEnemy.isCloaked && (
                <span className="px-1.5 py-0.2 bg-cyan-700 text-cyan-100 rounded text-[9px] font-mono animate-pulse">
                  CLOAKED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {shipState.lockedEnemy.rank && (
                <span className="text-[10px] text-amber-300 font-mono">
                  [{shipState.lockedEnemy.rank}]
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-red-900/60 text-[10px] uppercase font-semibold text-red-200">
                {shipState.lockedEnemy.faction}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 mb-2 flex items-center justify-between">
            <span className={shipState.lockedEnemy.isMothership ? 'text-amber-300 font-bold' : ''}>
              Class: {shipState.lockedEnemy.shipClass}
            </span>
            <span className="text-red-300 font-bold">{shipState.lockedEnemy.distanceToPlayer} km</span>
          </div>

          {/* Enemy Shields & Hull */}
          <div className="space-y-1 mb-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                <span>Shields</span>
                <span className="text-sky-300 font-bold">{shipState.lockedEnemy.shieldPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-100"
                  style={{ width: `${shipState.lockedEnemy.shieldPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                <span>Hull Integrity</span>
                <span className="text-red-400 font-bold">{shipState.lockedEnemy.hullPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${shipState.lockedEnemy.hullPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-amber-300 font-mono-nums bg-slate-950/80 px-2 py-1 rounded border border-amber-500/30 mb-2">
            <span>⚡ Torpedo: <strong className="text-red-400">Antimatter Blast</strong> (-50% to -70% Shields)</span>
            <span>🔥 Phasers: <strong className="text-orange-400">58 DMG/s</strong></span>
          </div>

          <div className="text-[10px] text-center text-red-300 font-trek uppercase tracking-wide bg-red-900/40 py-1 rounded">
            Press <kbd className="px-1 bg-red-950 rounded">T</kbd> Launch Homing Torpedo · <kbd className="px-1 bg-red-950 rounded">Space</kbd> Phasers · <kbd className="px-1 bg-red-950 rounded">Tab</kbd> Next Target
          </div>
        </div>
      )}

      {/* Bridge Interior Look Indicator */}
      {currentView === 'interior_bridge' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-950/80 border border-amber-500/40 rounded-full text-center">
          <span className="text-[11px] font-mono-nums text-amber-300">
            MAIN BRIDGE INTERIOR · Drag to Look Around 360°
          </span>
        </div>
      )}

      {/* Upper-Left Flight Telemetry & Tactical Ordnance HUD */}
      {/* Tactical Ordnance is placed FIRST at the top so the Nearest Space Dock button and weapons are immediately visible */}
      <div className={`absolute top-20 flex flex-col gap-2 max-w-[260px] max-h-[calc(100vh-175px)] overflow-y-auto pointer-events-auto z-20 transition-all duration-300 pr-1 ${isScannerOpen ? 'left-4 sm:left-[436px]' : 'left-4'}`}>
        {/* Tactical Ordnance Panel (Phasers & Torpedoes & Nearest Space Dock) - FIRST! */}
        <div className="p-3 bg-slate-950/85 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono-nums shadow-lg">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[11px] font-trek text-amber-400 uppercase tracking-wide">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-orange-400" />
              <span>Tactical Ordnance</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={shipState.isFiringPhasers ? 'text-red-400 animate-pulse font-bold' : 'text-slate-400 text-[10px]'}>
                {shipState.isFiringPhasers ? 'FIRING' : 'ARMED'}
              </span>
              <button
                onClick={() => setIsOrdnanceCollapsed((prev) => !prev)}
                className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isOrdnanceCollapsed ? 'Expand Tactical Ordnance' : 'Collapse Tactical Ordnance'}
              >
                {isOrdnanceCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {!isOrdnanceCollapsed && (
            <div className="space-y-1.5">
              {/* Phasers Energy */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-2.5 h-2.5 text-orange-400" /> Phaser Banks
                  </span>
                  <span className={shipState.phaserEnergy < 20 ? 'text-red-400 font-bold' : 'text-orange-300'}>
                    {shipState.phaserEnergy}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100"
                    style={{ width: `${shipState.phaserEnergy}%` }}
                  />
                </div>
              </div>

              {/* Photon Torpedo Count */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Photon Torpedoes:</span>
                <div className="flex items-center gap-1">
                  <span className="text-red-400 font-bold">{shipState.torpedoCount}</span>
                  <span className="text-slate-500 text-[10px]">/ 24</span>
                </div>
              </div>

              {/* Shields status */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" /> Shields:
                </span>
                <span className={shipState.shieldsRaised ? 'text-sky-300 font-semibold' : 'text-slate-500'}>
                  {shipState.shieldsRaised ? `${shipState.shieldIntegrity}%` : 'LOWERED'}
                </span>
              </div>

              {/* Quick Action: Nearest Space Dock Refill & Repair - Prominent Top Button */}
              {onGoToNearestSpaceDock && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={onGoToNearestSpaceDock}
                    className="w-full py-1.5 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95"
                    title="Warp or auto-dock at nearest space dock for 100% repairs and photon torpedo refills"
                  >
                    <Anchor className="w-3.5 h-3.5 text-slate-950" />
                    <span>
                      {shipState.isDocked
                        ? `Moored: ${shipState.dockedStationName || 'Space Dock'}`
                        : '⚓ Nearest Space Dock'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flight Telemetry Panel - SECOND (Below Ordnance) */}
        <div className="p-3 bg-slate-950/85 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono-nums shadow-lg">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[11px] font-trek text-amber-400 uppercase tracking-wide">
            <div className="flex items-center gap-1.5 truncate">
              <span>{shipState.currentSystemName || 'Sector 001'}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 text-[10px]">{currentView.replace('_', ' ').toUpperCase()}</span>
            </div>
            <button
              onClick={() => setIsTelemetryCollapsed((prev) => !prev)}
              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title={isTelemetryCollapsed ? 'Expand Telemetry' : 'Collapse Telemetry'}
            >
              {isTelemetryCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {!isTelemetryCollapsed && (
            <div className="space-y-1.5">
              {/* Speed / Propulsion Mode */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Drive:
                </span>
                <span className={`font-semibold ${shipState.isWarping ? 'text-sky-300 animate-pulse' : 'text-amber-300'}`}>
                  {shipState.isWarping ? `WARP FACTOR ${shipState.warpFactor.toFixed(1)}` : 'IMPULSE DRIVE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Velocity:</span>
                <span
                  className={`font-semibold ${
                    shipState.isBoostActive
                      ? 'text-cyan-300 font-bold animate-pulse'
                      : 'text-slate-100'
                  }`}
                >
                  {shipState.isWarping
                    ? `${(Math.pow(shipState.warpFactor, 2.5) * 8.5).toFixed(1)} c (Lightspeed)`
                    : `${shipState.speed.toLocaleString()} km/s${
                        shipState.isBoostActive ? ' [⚡ BOOST]' : ''
                      }`}
                </span>
              </div>

              {/* Throttle Gauge Bar */}
              <div className="pt-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Throttle</span>
                  <span>{shipState.throttlePercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      shipState.isWarping ? 'bg-sky-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${shipState.throttlePercent}%` }}
                  />
                </div>
              </div>

              {/* Evasive Thruster Boost */}
              <div className="pt-1 border-t border-slate-800/80">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">⚡ Evasive Boost:</span>
                  <span className={`font-semibold ${
                    shipState.isBoostActive
                      ? 'text-cyan-300 animate-pulse font-bold'
                      : (shipState.boostCharge ?? 100) >= 100
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}>
                    {shipState.isBoostActive
                      ? `OVERDRIVE (${shipState.boostDuration ?? 12}s)`
                      : (shipState.boostCharge ?? 100) >= 100
                      ? 'READY [SHIFT]'
                      : `${Math.round(shipState.boostCharge ?? 0)}%`}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      shipState.isBoostActive ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${shipState.isBoostActive ? 100 : (shipState.boostCharge ?? 100)}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Automated Course & Arrival ETA Card (Compact & High Precision) */}
              {shipState.activeCoursePlot && shipState.activeCoursePlot.isEngaged && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-trek uppercase tracking-wide text-sky-300 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <Rocket className="w-3 h-3 text-sky-400 animate-pulse" />
                        <span>TRANSIT ETA:</span>
                      </span>
                      <span className="text-amber-300 font-mono-nums font-black text-xs">
                        {shipState.activeCoursePlot.etaSeconds <= 0
                          ? '< 1s (ORBIT)'
                          : `~${shipState.activeCoursePlot.etaSeconds}s`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-300 mb-0.5">
                      <span className="truncate max-w-[130px] text-white font-semibold">
                        → {shipState.activeCoursePlot.targetPlanet.name}
                      </span>
                      <span className="text-sky-300 font-mono-nums font-bold">
                        {shipState.activeCoursePlot.distance.toLocaleString()} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono-nums text-slate-400 mb-1">
                      <span>Dest Coords:</span>
                      <span className="text-cyan-300">
                        [{shipState.activeCoursePlot.destinationPos.map(c => Math.round(c)).join(', ')}]
                      </span>
                    </div>

                    {shipState.activeCoursePlot.safetyTelemetry?.isOffsetApplied && (
                      <div className="text-[9px] text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 mb-1 flex items-center justify-between font-mono-nums">
                        <span>PERIMETER SAFEGUARD:</span>
                        <span>+{shipState.activeCoursePlot.safetyTelemetry.clearanceDistance}km</span>
                      </div>
                    )}

                    {/* Precision Arrival Progress Bar */}
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all duration-150"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              8,
                              100 -
                                (Math.min(25, shipState.activeCoursePlot.etaSeconds) / 25) * 88
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Free Warp Cruise Indicator (When warping without active course plot) */}
              {shipState.isWarping && !shipState.activeCoursePlot && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Rocket className="w-3 h-3 text-sky-400 animate-pulse" /> Subspace:
                  </span>
                  <span className="text-sky-300 font-mono-nums font-bold">WARP CRUISE ACTIVE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Tactical Alerts (Directly stacked under panels) */}
        {recentLogs && recentLogs.length > 0 && onOpenFullLog && (
          <TacticalHUDTicker
            recentLogs={recentLogs}
            onOpenFullLog={onOpenFullLog}
          />
        )}
      </div>

      {/* Real-time Warp Transit HUD - Streamlined & Compact ETA Strip (No redundant warp selector buttons) */}
      {(shipState.isWarping || (shipState.activeCoursePlot && (shipState.activeCoursePlot.phase === 'warping' || shipState.activeCoursePlot.phase === 'aligning'))) && (
        <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.35)] text-slate-100 font-trek">
            {/* Pulsing Status & Target Destination */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <Rocket className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                {shipState.activeCoursePlot
                  ? shipState.activeCoursePlot.targetPlanet.name
                  : 'WARP CRUISE'}
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-800" />

            {/* Read-Only Warp Factor Tag */}
            <div className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30 font-semibold shrink-0">
              WARP {shipState.warpFactor.toFixed(1)}
            </div>

            <div className="h-3.5 w-px bg-slate-800" />

            {/* High-Accuracy ETA Display */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">ETA:</span>
              <span className="text-xs sm:text-sm font-mono-nums font-black text-amber-300">
                {shipState.activeCoursePlot
                  ? shipState.activeCoursePlot.etaSeconds <= 0
                    ? '< 1s'
                    : `~${shipState.activeCoursePlot.etaSeconds}s`
                  : 'CRUISING'}
              </span>
            </div>

            {/* Remaining Distance */}
            {shipState.activeCoursePlot && (
              <>
                <div className="h-3.5 w-px bg-slate-800 hidden sm:block" />
                <div className="text-[10px] font-mono-nums text-slate-300 hidden sm:block shrink-0">
                  <span className="text-slate-400">DIST: </span>
                  <span className="font-semibold text-white">
                    {shipState.activeCoursePlot.distance.toLocaleString()} km
                  </span>
                </div>
              </>
            )}

            {/* Quick Drop Warp Button */}
            {onDisengageWarp && (
              <button
                onClick={onDisengageWarp}
                className="ml-1 px-2.5 py-0.5 rounded-full bg-red-600/80 hover:bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider transition-colors shadow-sm shrink-0 active:scale-95"
                title="Drop out of warp to impulse speed [R]"
              >
                Drop [R]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
