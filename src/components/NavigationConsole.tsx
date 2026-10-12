import React, { useState, useMemo } from 'react';
import { SolarSystem, PlanetData, CoursePlot, ShipState } from '../types/simulation';
import {
  STAR_TREK_SOLAR_SYSTEMS,
  calculateSafeCoordinates,
  getAllUniversalCelestialBodies,
  UniversalCelestialBody,
} from '../three/solarSystems';
import {
  X,
  Navigation,
  Compass,
  Globe,
  CheckCircle2,
  Rocket,
  Shield,
  Sparkles,
  MapPin,
  AlertTriangle,
  Crosshair,
  Sliders,
} from 'lucide-react';

interface NavigationConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  solarSystems: SolarSystem[];
  shipState?: ShipState | null;
  activeCoursePlot: CoursePlot | null;
  currentSystemId: string;
  currentWarpFactor?: number;
  onSetWarpFactor?: (factor: number) => void;
  onSetCourse: (systemId: string, planetId?: string, warpFactor?: number) => void;
  onSetCoordinatesCourse?: (
    coords: [number, number, number],
    systemId?: string,
    warpFactor?: number,
    label?: string
  ) => void;
  onCancelCourse: () => void;
}

export const NavigationConsole: React.FC<NavigationConsoleProps> = ({
  isOpen,
  onClose,
  solarSystems,
  shipState,
  activeCoursePlot,
  currentSystemId,
  currentWarpFactor = 6.0,
  onSetWarpFactor,
  onSetCourse,
  onSetCoordinatesCourse,
  onCancelCourse,
}) => {
  // Navigation Mode: 'systems' or 'coords' (Universal 3D Coordinates)
  const [navMode, setNavMode] = useState<'systems' | 'coords'>('systems');

  // Solar system selection state
  const [selectedSystemId, setSelectedSystemId] = useState<string>(currentSystemId || 'sol_system');
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('');
  const [selectedWarpFactor, setSelectedWarpFactor] = useState<number>(currentWarpFactor);
  const [navTerritory, setNavTerritory] = useState<'all' | 'federation' | 'klingon' | 'romulan' | 'cardassian' | 'frontier'>('all');

  // Custom 3D coordinates input state
  const [coordX, setCoordX] = useState<string>('0');
  const [coordY, setCoordY] = useState<string>('0');
  const [coordZ, setCoordZ] = useState<string>('-1300');
  const [coordLabel, setCoordLabel] = useState<string>('');

  const effectiveSolarSystems = useMemo(() => {
    return solarSystems && solarSystems.length > 0 ? solarSystems : STAR_TREK_SOLAR_SYSTEMS;
  }, [solarSystems]);

  const filteredSystems = useMemo(() => {
    return effectiveSolarSystems.filter((sys) => {
      if (navTerritory === 'federation') return sys.territory === 'federation';
      if (navTerritory === 'klingon') return sys.affiliation?.toLowerCase().includes('klingon') || sys.id === 'kronos_system';
      if (navTerritory === 'romulan') return sys.affiliation?.toLowerCase().includes('romulan') || sys.id === 'romulus_system';
      if (navTerritory === 'cardassian') return sys.affiliation?.toLowerCase().includes('cardassian') || sys.id === 'cardassia_system';
      if (navTerritory === 'frontier') return !sys.territory || (sys.territory !== 'federation' && !sys.affiliation?.toLowerCase().includes('klingon') && !sys.affiliation?.toLowerCase().includes('romulan') && !sys.affiliation?.toLowerCase().includes('cardassian'));
      return true;
    });
  }, [effectiveSolarSystems, navTerritory]);

  const currentSystem = useMemo(() => {
    return (
      effectiveSolarSystems.find((s) => s.id === selectedSystemId) ||
      effectiveSolarSystems[0] ||
      STAR_TREK_SOLAR_SYSTEMS[0]
    );
  }, [effectiveSolarSystems, selectedSystemId]);

  const activePlanet = useMemo(() => {
    return selectedPlanetId
      ? currentSystem?.planets?.find((p) => p.id === selectedPlanetId)
      : currentSystem?.planets?.[0];
  }, [currentSystem, selectedPlanetId]);

  // Standard planetary target transit stats
  const estimatedTransitStats = useMemo(() => {
    if (!activePlanet || !shipState) {
      return { seconds: 12, distanceKm: 8500 };
    }

    const currentPos = [shipState.position.x, shipState.position.y, shipState.position.z];
    let targetWorldPos: [number, number, number];

    if (currentSystem.id === shipState.currentSystemId) {
      targetWorldPos = activePlanet.position;
    } else {
      const shipSys =
        effectiveSolarSystems.find((s) => s.id === shipState.currentSystemId) ||
        effectiveSolarSystems[0];
      const dx = currentSystem.centerCoordinates[0] - shipSys.centerCoordinates[0];
      const dz = currentSystem.centerCoordinates[2] - shipSys.centerCoordinates[2];
      targetWorldPos = [
        activePlanet.position[0] + dx,
        activePlanet.position[1],
        activePlanet.position[2] + dz,
      ];
    }

    const dist = Math.hypot(
      targetWorldPos[0] - currentPos[0],
      targetWorldPos[1] - currentPos[1],
      targetWorldPos[2] - currentPos[2]
    );

    const speed = Math.pow(selectedWarpFactor, 2.6) * 115 * 0.85;
    const seconds = Math.max(2, Math.round(dist / Math.max(speed, 100)));

    return {
      seconds,
      distanceKm: Math.round(dist),
    };
  }, [activePlanet, shipState, currentSystem, effectiveSolarSystems, selectedWarpFactor]);

  // Parse entered custom coordinates
  const parsedCoords = useMemo((): [number, number, number] => {
    const x = parseFloat(coordX) || 0;
    const y = parseFloat(coordY) || 0;
    const z = parseFloat(coordZ) || 0;
    return [Math.round(x), Math.round(y), Math.round(z)];
  }, [coordX, coordY, coordZ]);

  // Real-time automatic collision safety evaluation for the custom coordinates
  const customCoordSafety = useMemo(() => {
    const shipPosTuple: [number, number, number] = shipState
      ? [shipState.position.x, shipState.position.y, shipState.position.z]
      : [0, 0, 0];

    const sysId = currentSystem ? currentSystem.id : 'sol_system';
    return calculateSafeCoordinates(parsedCoords, shipPosTuple, sysId, 140);
  }, [parsedCoords, shipState, currentSystem]);

  // Transit stats for custom coordinates (accounting for safe destination offset)
  const customCoordTransitStats = useMemo(() => {
    if (!shipState) return { distanceKm: 0, seconds: 0 };
    const curPos = [shipState.position.x, shipState.position.y, shipState.position.z];
    const dest = customCoordSafety.safePos;
    const dist = Math.hypot(dest[0] - curPos[0], dest[1] - curPos[1], dest[2] - curPos[2]);
    const speed = Math.pow(selectedWarpFactor, 2.6) * 115 * 0.85;
    const seconds = Math.max(1, Math.round(dist / Math.max(speed, 100)));
    return {
      distanceKm: Math.round(dist),
      seconds,
    };
  }, [customCoordSafety, shipState, selectedWarpFactor]);

  // Presets of all universal celestial bodies in the currently selected system for quick population
  const systemPresets = useMemo(() => {
    const presets: { label: string; coords: [number, number, number]; type: string }[] = [];
    if (!currentSystem) return presets;

    presets.push({
      label: `${currentSystem.primaryStar} (Primary Star)`,
      coords: currentSystem.centerCoordinates,
      type: 'star',
    });

    for (const p of currentSystem.planets) {
      presets.push({
        label: p.name,
        coords: p.position,
        type: p.type,
      });
    }
    return presets;
  }, [currentSystem]);

  if (!isOpen) return null;

  const handleSetCourse = () => {
    if (navMode === 'coords') {
      if (onSetCoordinatesCourse) {
        onSetCoordinatesCourse(parsedCoords, currentSystem.id, selectedWarpFactor, coordLabel || undefined);
      } else {
        onSetCourse(currentSystem.id, activePlanet?.id, selectedWarpFactor);
      }
    } else {
      onSetCourse(currentSystem.id, activePlanet?.id, selectedWarpFactor);
    }
    onClose();
  };

  const handleSelectPreset = (coords: [number, number, number], name: string) => {
    setCoordX(coords[0].toString());
    setCoordY(coords[1].toString());
    setCoordZ(coords[2].toString());
    setCoordLabel(name);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-full sm:w-[520px] bg-slate-950/95 backdrop-blur-xl border-r border-sky-500/40 text-slate-100 shadow-2xl flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-6 bg-sky-400 rounded-sm" />
          <div>
            <h2 className="text-sm font-trek uppercase tracking-wider font-bold text-sky-400">
              Stellar Cartography & Course Plotter
            </h2>
            <p className="text-xs text-slate-400 font-mono-nums">Universal 3D Astrogation System</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Mode Switcher: Celestial Objects vs Direct 3D Coordinates */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
        <button
          onClick={() => setNavMode('systems')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-trek uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
            navMode === 'systems'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Planetary Catalog</span>
        </button>
        <button
          onClick={() => setNavMode('coords')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-trek uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
            navMode === 'coords'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Universal 3D Coords</span>
        </button>
      </div>

      {/* Active Warp Flight Status Banner */}
      {activeCoursePlot && (
        <div className="px-4 py-3 bg-gradient-to-r from-sky-950/90 to-blue-950/80 border-b border-sky-500/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-trek text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              Automated Warp Course Engaged
            </span>
            <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-sky-500/30 text-sky-200 border border-sky-400/50 uppercase font-semibold">
              {activeCoursePlot.phase.replace('_', ' ')}
            </span>
          </div>

          <div className="text-xs text-slate-200 mb-1">
            Target: <span className="font-semibold text-white">{activeCoursePlot.targetSystem.name}</span> ·{' '}
            <span className="text-amber-300">{activeCoursePlot.targetPlanet.name}</span>
          </div>

          {/* Collision Safety Telemetry Indicator */}
          {activeCoursePlot.safetyTelemetry && (
            <div className="mb-2 p-1.5 rounded bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono-nums text-slate-300">
              <div className="flex items-center justify-between text-slate-400">
                <span>Requested Coords:</span>
                <span className="text-sky-300">
                  [{activeCoursePlot.safetyTelemetry.targetCoordinates.join(', ')}]
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Safe Standoff Point:</span>
                <span className="text-emerald-300 font-bold">
                  [{activeCoursePlot.safetyTelemetry.safeCoordinates.join(', ')}]
                </span>
              </div>
              {activeCoursePlot.safetyTelemetry.isOffsetApplied && (
                <div className="mt-1 flex items-center gap-1 text-cyan-300 font-trek uppercase text-[9.5px]">
                  <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Collision avoidance engaged ({activeCoursePlot.safetyTelemetry.clearanceDistance} km buffer)</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-mono-nums text-slate-300 mb-2">
            <span>Distance: {activeCoursePlot.distance.toLocaleString()} km</span>
            <span>ETA: ~{activeCoursePlot.etaSeconds}s</span>
          </div>
          <button
            onClick={onCancelCourse}
            className="w-full py-1 px-3 bg-red-600/80 hover:bg-red-500 text-white rounded text-xs font-trek uppercase font-bold tracking-wider transition-colors"
          >
            Disengage Course (All Stop)
          </button>
        </div>
      )}

      {/* Territory Filter Strip */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-[11px] font-trek">
        {[
          { id: 'all', label: 'All Sectors' },
          { id: 'federation', label: 'Federation' },
          { id: 'klingon', label: 'Klingon' },
          { id: 'romulan', label: 'Romulan' },
          { id: 'cardassian', label: 'Cardassian' },
          { id: 'frontier', label: 'Deep Space' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setNavTerritory(t.id as any)}
            className={`px-2.5 py-1 rounded transition-colors uppercase font-bold whitespace-nowrap ${
              navTerritory === t.id
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Solar System Selection Strip */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/40 overflow-x-auto flex items-center gap-1.5">
        {filteredSystems.map((sys) => {
          const isSelected = sys.id === currentSystem.id;
          const isHere = sys.id === currentSystemId;
          const isFed = sys.territory === 'federation';

          return (
            <button
              key={sys.id}
              onClick={() => {
                setSelectedSystemId(sys.id);
                setSelectedPlanetId('');
              }}
              className={`px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>{sys.name.split('/')[0].trim()}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                  isFed
                    ? isSelected ? 'bg-sky-900 text-sky-200' : 'bg-sky-950/80 text-sky-400 border border-sky-500/30'
                    : isSelected ? 'bg-amber-900 text-amber-200' : 'bg-red-950/80 text-red-400 border border-red-500/30'
                }`}
              >
                {isFed ? 'FED' : 'NON-FED'}
              </span>
              {isHere && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Current Location" />}
            </button>
          );
        })}
      </div>

      {/* Selected Solar System Overview */}
      <div className="p-4 bg-gradient-to-b from-slate-900/70 to-slate-950 border-b border-slate-800">
        {/* Jurisdiction / Territory Badge */}
        <div className="mb-2">
          {currentSystem.territory === 'federation' ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-400/50 text-[11px] font-trek font-bold uppercase tracking-wider text-sky-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>FEDERATION TERRITORY</span>
              <span className="text-slate-400">·</span>
              <span className="text-sky-200 font-normal">{currentSystem.affiliation || 'United Federation of Planets'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/60 text-[11px] font-trek font-bold uppercase tracking-wider text-red-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>NON-FEDERATION / ALIEN TERRITORY</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-200 font-normal">{currentSystem.affiliation || 'Hostile Sovereign Space'}</span>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[11px] font-mono-nums text-sky-400 uppercase tracking-wide">
              {currentSystem.quadrant} · {currentSystem.spectralType}
            </div>
            <h3 className="text-base font-trek font-bold text-white tracking-wide mt-0.5">
              {currentSystem.name}
            </h3>
          </div>
          <div className="text-right text-[11px] font-mono-nums text-slate-400">
            <div>Star: {currentSystem.primaryStar}</div>
            <div className="text-amber-400 font-semibold">{currentSystem.planets.length} Planetary Bodies</div>
          </div>
        </div>

        {/* Warp Cruise Speed Selector */}
        <div className="flex items-center justify-between p-2 mb-3 bg-slate-950/70 rounded-lg border border-sky-500/30">
          <div className="flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-trek text-sky-400 uppercase tracking-wide">Cruise Speed:</span>
            <span className="text-xs font-mono-nums font-bold text-white">Warp {selectedWarpFactor.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            {[4, 6, 8, 9, 9.9].map((wf) => (
              <button
                key={wf}
                onClick={() => {
                  setSelectedWarpFactor(wf);
                  onSetWarpFactor?.(wf);
                }}
                className={`px-2 py-0.5 text-[10px] font-mono-nums rounded border transition-colors ${
                  Math.abs(selectedWarpFactor - wf) < 0.15
                    ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm shadow-sky-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
                title={`Cruise at Warp Factor ${wf}`}
              >
                {wf === 9.9 ? 'MAX 9.9' : `W${wf}`}
              </button>
            ))}
          </div>
        </div>

        {/* DYNAMIC CONTENT: EITHER 3D COORDINATE INPUT OR CATALOG ESTIMATE */}
        {navMode === 'coords' ? (
          <div className="space-y-2.5 mb-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 font-trek uppercase font-bold text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Universal 3D Coordinates
                </span>
                <span className="text-[10px] font-mono-nums text-slate-400">
                  System: {currentSystem.name.split(' (')[0]}
                </span>
              </div>

              {/* 3D Coordinate X, Y, Z Inputs */}
              <div className="grid grid-cols-3 gap-2 mb-2 font-mono-nums">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase">X (km)</label>
                  <input
                    type="number"
                    value={coordX}
                    onChange={(e) => setCoordX(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase">Y (km)</label>
                  <input
                    type="number"
                    value={coordY}
                    onChange={(e) => setCoordY(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase">Z (km)</label>
                  <input
                    type="number"
                    value={coordZ}
                    onChange={(e) => setCoordZ(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="-1300"
                  />
                </div>
              </div>

              {/* Waypoint Label Input */}
              <div className="mb-2">
                <input
                  type="text"
                  value={coordLabel}
                  onChange={(e) => setCoordLabel(e.target.value)}
                  placeholder="Optional Waypoint Label (e.g. Earth High Orbit)"
                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* COLLISION SAFETY TELEMETRY STATUS */}
              {customCoordSafety.isOffsetApplied && customCoordSafety.standoffObject ? (
                <div className="p-2 rounded bg-amber-950/60 border border-amber-500/50 text-[10.5px] space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase font-trek">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Auto Collision Safety Active</span>
                  </div>
                  <p className="text-slate-300 leading-snug">
                    Entered coordinates fall within the collision boundary of{' '}
                    <strong className="text-white">{customCoordSafety.standoffObject.name}</strong> (Radius: {customCoordSafety.standoffObject.radius} km).
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-500/30 font-mono-nums">
                    <span className="text-slate-400">Safe Standoff Point:</span>
                    <span className="text-emerald-400 font-bold">
                      [{customCoordSafety.safePos.join(', ')}]
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300">
                    Maintains {customCoordSafety.clearanceDistance} km safe orbital clearance from center.
                  </div>
                </div>
              ) : (
                <div className="p-1.5 rounded bg-slate-900/80 border border-emerald-500/40 text-[10px] flex items-center gap-1.5 text-emerald-300 font-mono-nums">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Deep Space Vector Clear — No celestial obstacle detected.</span>
                </div>
              )}

              {/* Live Distance & ETA */}
              <div className="mt-2 flex items-center justify-between text-xs font-mono-nums text-slate-300 pt-1 border-t border-slate-800">
                <span className="text-slate-400">Est. Transit:</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-bold">~{customCoordTransitStats.seconds}s</span>
                  <span className="text-slate-400 text-[10px]">
                    ({customCoordTransitStats.distanceKm.toLocaleString()} km)
                  </span>
                </div>
              </div>
            </div>

            {/* Set Course & Engage Button for Coordinates */}
            <button
              onClick={handleSetCourse}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-trek font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>
                Lay in Course to Coordinates [{parsedCoords.join(', ')}] & Engage!
              </span>
            </button>
          </div>
        ) : (
          <>
            {/* Dynamic Estimated Flight Duration */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs font-mono-nums mb-2 shadow-inner">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-slate-400 font-trek uppercase text-[10px] font-bold">Est. Flight Duration:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold text-sm">
                  ~{estimatedTransitStats.seconds}s
                </span>
                <span className="text-[10px] text-slate-400">
                  ({estimatedTransitStats.distanceKm.toLocaleString()} km at W{selectedWarpFactor.toFixed(1)})
                </span>
              </div>
            </div>

            {/* Set Course & Engage Button */}
            <button
              onClick={handleSetCourse}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-trek font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Lay in Course to {activePlanet?.name || currentSystem.name} & Engage!</span>
            </button>
          </>
        )}
      </div>

      {/* Planetary Bodies List OR Quick Coordinates Presets */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {navMode === 'coords' ? (
          <div>
            <div className="flex items-center justify-between text-xs font-trek uppercase text-slate-400 pb-2">
              <span className="flex items-center gap-1 text-cyan-400">
                <Crosshair className="w-3.5 h-3.5" /> Quick System Presets ({currentSystem.name.split(' (')[0]})
              </span>
              <span className="text-[10px] text-slate-500">Click to fill 3D coords</span>
            </div>

            <div className="space-y-2">
              {systemPresets.map((preset) => (
                <div
                  key={preset.label}
                  onClick={() => handleSelectPreset(preset.coords, preset.label)}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{preset.label}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{preset.type}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono-nums text-[11px] text-cyan-300">
                    [{preset.coords.join(', ')}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs font-trek uppercase text-slate-400 pb-1">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" /> System Bodies & Orbital Targets
              </span>
              <span className="font-mono-nums text-slate-500">{currentSystem.planets.length} objects</span>
            </div>

            {currentSystem.planets.map((planet) => {
              const isTarget = (activePlanet?.id === planet.id);

              return (
                <div
                  key={planet.id}
                  onClick={() => setSelectedPlanetId(planet.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isTarget
                      ? 'bg-sky-500/20 border-sky-400/80 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: planet.textureColor }}
                      />
                      <h4 className="text-xs font-trek font-bold text-slate-100">
                        {planet.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-nums text-sky-300 uppercase">
                      <span>{planet.type.replace('_', ' ')}</span>
                      {planet.hasRings && <span className="text-amber-400">· Rings</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono-nums text-slate-400 mb-1">
                    <span>Coordinates: [{planet.position.join(', ')}]</span>
                    <span>Radius: {planet.radius} km</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {planet.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] font-mono-nums text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Collision Safety System Active
        </span>
        <span className="text-slate-500">Autonomous Standoff Enforced</span>
      </div>
    </div>
  );
};
