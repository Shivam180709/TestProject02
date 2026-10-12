import React, { useState, useMemo, useEffect } from 'react';
import { SolarSystem, PlanetData, ShipState, CoursePlot } from '../types/simulation';
import { STAR_TREK_SOLAR_SYSTEMS } from '../three/solarSystems';
import {
  X,
  Compass,
  Navigation,
  Globe,
  Rocket,
  Shield,
  Search,
  Crosshair,
  Layers,
  Anchor,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StarSystemMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  solarSystems: SolarSystem[];
  shipState: ShipState | null;
  activeCoursePlot: CoursePlot | null;
  onSetCourse: (systemId: string, planetId?: string, warpFactor?: number) => void;
  onSetCoordinatesCourse?: (
    coords: [number, number, number],
    systemId?: string,
    warpFactor?: number,
    label?: string
  ) => void;
  onCancelCourse: () => void;
  onDock?: (stationId?: string) => void;
  onUndock?: () => void;
}

type MapTab = 'galaxy' | 'orbits' | 'manifest';
type FilterType =
  | 'all'
  | 'stations'
  | 'planets'
  | 'federation'
  | 'klingon'
  | 'romulan'
  | 'cardassian'
  | 'dominion'
  | 'delta_borg';

type QuadrantFocus = 'all' | 'core' | 'frontiers';

// Primary strategic Starfleet warp corridors (established interstellar lanes)
// Avoids indiscriminate dense spiderweb lines across all close stars
const STRATEGIC_WARP_LANES: [string, string][] = [
  ['sol_system', 'vulcan_system'],
  ['sol_system', 'andoria_system'],
  ['sol_system', 'wolf_359_system'],
  ['sol_system', 'alpha_centauri_system'],
  ['vulcan_system', 'andoria_system'],
  ['vulcan_system', 'kronos_system'],
  ['vulcan_system', 'romulus_system'],
  ['kronos_system', 'mempa_system'],
  ['kronos_system', 'rura_penthe_system'],
  ['romulus_system', 'krios_system'],
  ['romulus_system', 'remus_system'],
  ['sol_system', 'bajor_system'],
  ['bajor_system', 'cardassia_system'],
  ['bajor_system', 'idran_system'], // Bajoran wormhole to Gamma
  ['idran_system', 'omarion_system'], // Dominion Founders
  ['cardassia_system', 'chintoka_system'],
  ['sol_system', 'starbase_12_sector'],
  ['sol_system', 'rigel_system'],
  ['delta_caretaker_system', 'borg_unicomplex_system'],
  ['galactic_barrier_sector', 'sol_system'],
];

export const StarSystemMapModal: React.FC<StarSystemMapModalProps> = ({
  isOpen,
  onClose,
  solarSystems,
  shipState,
  activeCoursePlot,
  onSetCourse,
  onSetCoordinatesCourse,
  onCancelCourse,
  onDock,
  onUndock,
}) => {
  const [activeTab, setActiveTab] = useState<MapTab>('galaxy');
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    shipState?.currentSystemId || 'sol_system'
  );
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('');
  const [selectedWarp, setSelectedWarp] = useState<number>(shipState?.warpFactor || 6.0);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Decluttering & Astrometric Display State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [quadrantFocus, setQuadrantFocus] = useState<QuadrantFocus>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showTerritories, setShowTerritories] = useState<boolean>(true);
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);
  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null);
  const [isBodiesDrawerOpen, setIsBodiesDrawerOpen] = useState<boolean>(false);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    try {
      if (nextState) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Graceful fallback for environments restricting full screen API
    }
  };

  // Bulletproof fallback to predefined systems if solarSystems is empty or loading
  const effectiveSolarSystems = useMemo(() => {
    return solarSystems && solarSystems.length > 0 ? solarSystems : STAR_TREK_SOLAR_SYSTEMS;
  }, [solarSystems]);

  const currentSystem: SolarSystem = useMemo(() => {
    const found = effectiveSolarSystems.find((s) => s.id === selectedSystemId);
    if (found) return found;
    const currentShipSys = effectiveSolarSystems.find((s) => s.id === shipState?.currentSystemId);
    if (currentShipSys) return currentShipSys;
    return effectiveSolarSystems[0] || STAR_TREK_SOLAR_SYSTEMS[0];
  }, [effectiveSolarSystems, selectedSystemId, shipState?.currentSystemId]);

  const selectedPlanet: PlanetData | undefined = useMemo(() => {
    if (!currentSystem || !currentSystem.planets || currentSystem.planets.length === 0) {
      return undefined;
    }
    if (selectedPlanetId) {
      const found = currentSystem.planets.find((p) => p.id === selectedPlanetId);
      if (found) return found;
    }
    return currentSystem.planets[0];
  }, [currentSystem, selectedPlanetId]);

  // Galactic map coordinate bounds mapping for 2D schematic rendering
  // Base canvas coordinate space: 720 x 480
  const mapSvgWidth = 720;
  const mapSvgHeight = 480;

  const mapCoordsToSvg = (x: number, z: number) => {
    const minX = -195000;
    const maxX = 195000;
    const minZ = -235000;
    const maxZ = 15000;

    const normX = Math.max(0, Math.min(1, (x - minX) / (maxX - minX)));
    const normZ = Math.max(0, Math.min(1, (z - minZ) / (maxZ - minZ)));

    return {
      sx: 45 + normX * (mapSvgWidth - 90),
      sy: 40 + normZ * (mapSvgHeight - 75),
    };
  };

  // Dynamic ViewBox for SVG based on quadrant focus and zoom level
  const activeViewBox = useMemo(() => {
    let baseMinX = 0;
    let baseMinY = 0;
    let baseW = mapSvgWidth;
    let baseH = mapSvgHeight;

    if (quadrantFocus === 'core') {
      // Focus on Alpha & Beta Quadrants (Federation, Klingon, Romulan, Cardassian)
      baseMinX = 140;
      baseMinY = 160;
      baseW = 430;
      baseH = 300;
    } else if (quadrantFocus === 'frontiers') {
      // Focus on Gamma (Dominion), Delta (Borg) & Galactic Barrier
      baseMinX = 20;
      baseMinY = 20;
      baseW = 540;
      baseH = 300;
    }

    // Apply zoom multiplier
    const w = baseW / zoomLevel;
    const h = baseH / zoomLevel;
    const cx = baseMinX + baseW / 2;
    const cy = baseMinY + baseH / 2;
    const x = cx - w / 2;
    const y = cy - h / 2;

    return `${x} ${y} ${w} ${h}`;
  }, [quadrantFocus, zoomLevel, mapSvgWidth, mapSvgHeight]);

  const handleSelectSystem = (sysId: string) => {
    setSelectedSystemId(sysId);
    const sys = effectiveSolarSystems.find((s) => s.id === sysId);
    if (sys && sys.planets && sys.planets.length > 0) {
      const station = sys.planets.find((p) => p.type === 'starbase');
      setSelectedPlanetId(station ? station.id : sys.planets[0].id);
    } else {
      setSelectedPlanetId('');
    }
  };

  const handleSetCourseToSelected = () => {
    if (!currentSystem) return;
    if (selectedPlanet) {
      if (onSetCoordinatesCourse) {
        onSetCoordinatesCourse(selectedPlanet.position, currentSystem.id, selectedWarp, selectedPlanet.name);
      } else {
        onSetCourse(currentSystem.id, selectedPlanet.id, selectedWarp);
      }
    } else {
      if (onSetCoordinatesCourse) {
        onSetCoordinatesCourse(currentSystem.centerCoordinates, currentSystem.id, selectedWarp, currentSystem.primaryStar);
      } else {
        onSetCourse(currentSystem.id, undefined, selectedWarp);
      }
    }
    onClose();
  };

  const handleQuickEngage = (systemId: string, planetId?: string) => {
    onSetCourse(systemId, planetId, selectedWarp);
    onClose();
  };

  // Filtered planet list for whole manifest
  const allCelestialBodies = useMemo(() => {
    const list: { system: SolarSystem; planet: PlanetData }[] = [];
    effectiveSolarSystems.forEach((sys) => {
      if (sys.planets) {
        sys.planets.forEach((p) => {
          list.push({ system: sys, planet: p });
        });
      }
    });
    return list;
  }, [effectiveSolarSystems]);

  const filteredManifest = useMemo(() => {
    return allCelestialBodies.filter(({ system, planet }) => {
      if (filterType === 'stations' && planet.type !== 'starbase') return false;
      if (filterType === 'planets' && planet.type === 'starbase') return false;
      if (filterType === 'federation' && system.territory !== 'federation') return false;
      if (
        filterType === 'klingon' &&
        system.id !== 'kronos_system' &&
        !system.affiliation?.toLowerCase().includes('klingon')
      )
        return false;
      if (
        filterType === 'romulan' &&
        system.id !== 'romulus_system' &&
        !system.affiliation?.toLowerCase().includes('romulan')
      )
        return false;
      if (
        filterType === 'cardassian' &&
        system.id !== 'cardassia_system' &&
        !system.affiliation?.toLowerCase().includes('cardassian')
      )
        return false;
      if (
        filterType === 'dominion' &&
        !system.quadrant.toLowerCase().includes('gamma') &&
        !system.affiliation?.toLowerCase().includes('dominion')
      )
        return false;
      if (
        filterType === 'delta_borg' &&
        !system.quadrant.toLowerCase().includes('delta') &&
        !system.affiliation?.toLowerCase().includes('borg')
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          planet.name.toLowerCase().includes(q) ||
          system.name.toLowerCase().includes(q) ||
          (planet.description && planet.description.toLowerCase().includes(q)) ||
          planet.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allCelestialBodies, filterType, searchQuery]);

  // Real-time estimated transit duration and distance (updates instantly as warp factor or target changes)
  const estimatedTransitStats = useMemo(() => {
    if (!selectedPlanet || !shipState) {
      return { seconds: 12, distanceKm: 8500 };
    }
    const currentPos = [shipState.position.x, shipState.position.y, shipState.position.z];
    let targetWorldPos: [number, number, number];
    if (currentSystem.id === shipState.currentSystemId) {
      targetWorldPos = selectedPlanet.position;
    } else {
      const shipSys =
        effectiveSolarSystems.find((s) => s.id === shipState.currentSystemId) ||
        effectiveSolarSystems[0];
      const dx = currentSystem.centerCoordinates[0] - shipSys.centerCoordinates[0];
      const dz = currentSystem.centerCoordinates[2] - shipSys.centerCoordinates[2];
      targetWorldPos = [
        selectedPlanet.position[0] + dx,
        selectedPlanet.position[1],
        selectedPlanet.position[2] + dz,
      ];
    }
    const dist = Math.hypot(
      targetWorldPos[0] - currentPos[0],
      targetWorldPos[1] - currentPos[1],
      targetWorldPos[2] - currentPos[2]
    );
    const speed = Math.pow(selectedWarp, 2.6) * 115 * 0.85;
    const seconds = Math.max(2, Math.round(dist / Math.max(speed, 100)));
    return {
      seconds,
      distanceKm: Math.round(dist),
    };
  }, [selectedPlanet, shipState, currentSystem, effectiveSolarSystems, selectedWarp]);

  if (!isOpen) return null;

  const isSelectedStation = selectedPlanet?.type === 'starbase';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center select-none animate-in fade-in duration-150 ${
        isFullscreen ? 'p-0 bg-slate-950' : 'p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md'
      }`}
    >
      <div
        className={`relative w-full bg-slate-950 border-sky-500/60 shadow-2xl shadow-sky-950/80 flex flex-col overflow-hidden text-slate-100 font-trek transition-all duration-200 ${
          isFullscreen
            ? 'h-screen max-h-screen rounded-none border-0'
            : 'max-w-7xl h-[94vh] max-h-[920px] rounded-2xl border-2'
        }`}
      >
        {/* LCARS Top Header Strip with Elbow Accent */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 border-b border-sky-500/50 shrink-0">
          <div className="flex items-center gap-3">
            {/* LCARS Orange Elbow Accent */}
            <div className="flex items-center">
              <div className="w-10 h-8 rounded-tl-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs tracking-wider">
                MAP
              </div>
              <div className="w-3.5 h-8 bg-amber-400 border-l border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wider text-sky-400 uppercase">
                  ASTROMETRICS CARTOGRAPHY // SECTOR & PLANETARY MAP
                </h2>
                <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase font-semibold">
                  LCARS 47
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono-nums flex items-center gap-2">
                <span>SECTOR: {shipState?.currentSystemName || 'Sector 001'}</span>
                <span>·</span>
                <span className="text-emerald-400">
                  {shipState?.isDocked
                    ? `⚓ MOORED AT ${shipState.dockedStationName}`
                    : 'FREE FLIGHT TRAJECTORY'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick In-Flight Undock / Dock status (if physically in range of starbase) */}
            {shipState?.isDocked ? (
              <button
                onClick={onUndock}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-700/40"
                title="Release docking clamps and resume impulse cruise [X key]"
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>Undock [X]</span>
              </button>
            ) : shipState?.canDockAtStation ? (
              <button
                onClick={() => onDock?.(shipState.canDockAtStation?.id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase transition-colors flex items-center gap-1.5 animate-pulse shadow-md shadow-cyan-500/50"
                title="Dock starship for 100% hull repair and full photon torpedo reload [X key]"
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>Dock & Repair [X]</span>
              </button>
            ) : null}

            {/* FULL SCREEN TOGGLE BUTTON */}
            <button
              onClick={toggleFullscreen}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
                isFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                  : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800 hover:border-amber-400'
              }`}
              title={isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen Map View'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Windowed</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>

            {/* CLOSE MODAL BUTTON */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
              title="Close Astrometrics Map"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Mode Tabs & Global Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 font-trek shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('galaxy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'galaxy'
                  ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Galactic Sector Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('orbits')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'orbits'
                  ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Planetary Orbits ({currentSystem.name.split('/')[0].trim()})</span>
            </button>

            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'manifest'
                  ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Celestial Manifest ({allCelestialBodies.length})</span>
            </button>
          </div>

          {/* Quick Active Course Notice */}
          {activeCoursePlot && (
            <div className="flex items-center gap-2 text-xs font-mono-nums px-3 py-1 bg-sky-950/80 rounded-md border border-sky-400/40 text-sky-200">
              <Rocket className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>
                En route to <strong className="text-white">{activeCoursePlot.targetPlanet.name}</strong>
              </span>
              <span className="text-slate-400">·</span>
              <span>ETA ~{activeCoursePlot.etaSeconds}s</span>
              <button
                onClick={onCancelCourse}
                className="ml-1 text-[10px] px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-500 text-white uppercase font-bold"
              >
                Disengage
              </button>
            </div>
          )}
        </div>

        {/* Main Content Split Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* LEFT: Interactive Map Canvas View / Manifest */}
          <div className="flex-1 flex flex-col bg-slate-950/60 p-3 sm:p-4 overflow-hidden border-r border-slate-800 min-h-0">
            {activeTab === 'galaxy' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Astrometric Toolbar: Decluttering, Focus & Zoom Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-xs font-mono-nums shrink-0">
                  {/* Quadrant Quick-Focus Presets */}
                  <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 px-1 font-trek">Sector Focus:</span>
                    <button
                      onClick={() => {
                        setQuadrantFocus('all');
                        setZoomLevel(1.0);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        quadrantFocus === 'all'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Milky Way
                    </button>
                    <button
                      onClick={() => {
                        setQuadrantFocus('core');
                        setZoomLevel(1.0);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        quadrantFocus === 'core'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Alpha & Beta (Core)
                    </button>
                    <button
                      onClick={() => {
                        setQuadrantFocus('frontiers');
                        setZoomLevel(1.0);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        quadrantFocus === 'frontiers'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Gamma & Delta
                    </button>
                  </div>

                  {/* Layer Toggles & Zoom Controls */}
                  <div className="flex items-center gap-2">
                    {/* Layer Toggles */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setShowCorridors(!showCorridors)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-nums uppercase transition-colors ${
                          showCorridors
                            ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Toggle Warp Lanes and Trade Corridors"
                      >
                        Lanes: {showCorridors ? 'ON' : 'OFF'}
                      </button>

                      <button
                        onClick={() => setShowTerritories(!showTerritories)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-nums uppercase transition-colors ${
                          showTerritories
                            ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Toggle Empire Boundaries"
                      >
                        Borders: {showTerritories ? 'ON' : 'OFF'}
                      </button>

                      <button
                        onClick={() => setShowAllLabels(!showAllLabels)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-nums uppercase transition-colors ${
                          showAllLabels
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Toggle Full Labels vs Clean Astrometric View"
                      >
                        Labels: {showAllLabels ? 'ALL' : 'CLEAN'}
                      </button>
                    </div>

                    {/* Zoom In / Out / Reset */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] px-1 font-mono-nums text-sky-400 font-bold min-w-[34px] text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(2.4, Number((z + 0.2).toFixed(1))))}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1.0)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SVG Galactic Coordinate Sector Map Canvas */}
                <div className="flex-1 relative rounded-xl border border-sky-500/50 bg-slate-950 overflow-hidden flex items-center justify-center shadow-inner min-h-0">
                  <svg
                    viewBox={activeViewBox}
                    className="w-full h-full select-none bg-slate-950 transition-all duration-300"
                  >
                    {/* Definitions */}
                    <defs>
                      <pattern id="astrometricGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.7" opacity="0.45" />
                      </pattern>
                      <radialGradient id="solGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Dark Space & Coordinates Grid */}
                    <rect x="-100" y="-100" width="1000" height="700" fill="#020617" />
                    <rect x="-100" y="-100" width="1000" height="700" fill="url(#astrometricGrid)" />

                    {/* Background Distant Stars */}
                    <circle cx="80" cy="60" r="1" fill="#94a3b8" opacity="0.4" />
                    <circle cx="150" cy="120" r="0.8" fill="#e2e8f0" opacity="0.5" />
                    <circle cx="280" cy="50" r="1.2" fill="#38bdf8" opacity="0.6" />
                    <circle cx="510" cy="110" r="1" fill="#fde047" opacity="0.4" />
                    <circle cx="430" cy="380" r="0.8" fill="#94a3b8" opacity="0.5" />
                    <circle cx="210" cy="390" r="1.1" fill="#cbd5e1" opacity="0.6" />
                    <circle cx="340" cy="310" r="0.7" fill="#64748b" opacity="0.4" />
                    <circle cx="95" cy="290" r="1.3" fill="#38bdf8" opacity="0.5" />
                    <circle cx="620" cy="360" r="1" fill="#a855f7" opacity="0.4" />

                    {/* Sector Neutral Zone & Territory Boundaries */}
                    {showTerritories && (
                      <g>
                        {/* The Great Galactic Barrier (Milky Way Rim) */}
                        <path
                          d="M 40 45 Q 360 18, 680 45"
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="2.5"
                          strokeDasharray="6 4"
                          opacity="0.85"
                        />
                        <text
                          x="360"
                          y="36"
                          textAnchor="middle"
                          fill="#f472b6"
                          fontSize="10"
                          fontWeight="bold"
                          letterSpacing="1"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          ⚡ THE GREAT GALACTIC BARRIER // MILKY WAY RIM
                        </text>

                        {/* United Federation of Planets boundary */}
                        <path
                          d="M 180 375 C 190 295, 385 290, 405 345 C 420 395, 380 440, 290 445 C 210 445, 175 420, 180 375 Z"
                          fill="rgba(2, 132, 199, 0.07)"
                          stroke="#0284c7"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="220"
                          y="435"
                          fill="#38bdf8"
                          fontSize="9.5"
                          fontWeight="bold"
                          opacity="0.8"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          UNITED FEDERATION OF PLANETS
                        </text>

                        {/* Klingon Empire Zone */}
                        <path
                          d="M 370 285 C 385 225, 465 230, 485 268 C 490 315, 450 340, 395 330 C 365 325, 360 305, 370 285 Z"
                          fill="rgba(220, 38, 38, 0.08)"
                          stroke="#dc2626"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="400"
                          y="245"
                          fill="#f87171"
                          fontSize="9.5"
                          fontWeight="bold"
                          opacity="0.85"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          KLINGON EMPIRE (Qo'noS)
                        </text>

                        {/* Romulan Star Empire Zone */}
                        <path
                          d="M 385 340 C 410 298, 490 302, 505 345 C 510 385, 465 410, 410 400 C 380 395, 375 365, 385 340 Z"
                          fill="rgba(5, 150, 105, 0.07)"
                          stroke="#059669"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="435"
                          y="375"
                          fill="#34d399"
                          fontSize="9.5"
                          fontWeight="bold"
                          opacity="0.8"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          ROMULAN STAR EMPIRE
                        </text>

                        {/* Cardassian Union Zone */}
                        <path
                          d="M 95 350 C 110 300, 205 310, 225 355 C 225 405, 175 425, 120 415 C 85 405, 85 380, 95 350 Z"
                          fill="rgba(245, 158, 11, 0.07)"
                          stroke="#f59e0b"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="115"
                          y="335"
                          fill="#fbbf24"
                          fontSize="9.5"
                          fontWeight="bold"
                          opacity="0.8"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          CARDASSIAN UNION
                        </text>

                        {/* Dominion / Gamma Quadrant (Via Wormhole) */}
                        <path
                          d="M 35 220 C 45 160, 120 170, 135 225 C 135 275, 85 285, 45 270 C 25 255, 25 235, 35 220 Z"
                          fill="rgba(168, 85, 247, 0.07)"
                          stroke="#a855f7"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="45"
                          y="195"
                          fill="#c084fc"
                          fontSize="9"
                          fontWeight="bold"
                          opacity="0.85"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          DOMINION (GAMMA)
                        </text>

                        {/* Borg Collective & Delta Quadrant Frontier */}
                        <path
                          d="M 485 160 C 505 95, 610 85, 625 150 C 630 205, 575 230, 500 220 C 475 205, 475 180, 485 160 Z"
                          fill="rgba(34, 197, 94, 0.07)"
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="495"
                          y="112"
                          fill="#4ade80"
                          fontSize="9"
                          fontWeight="bold"
                          opacity="0.85"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          BORG SPACE & DELTA FRONTIER
                        </text>

                        {/* Quadrant Legend Markers */}
                        <text
                          x="110"
                          y="460"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ◄ ALPHA QUADRANT
                        </text>
                        <text
                          x="510"
                          y="460"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          BETA QUADRANT ►
                        </text>
                        <text
                          x="45"
                          y="170"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ▲ GAMMA QUADRANT
                        </text>
                        <text
                          x="540"
                          y="78"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ▲ DELTA QUADRANT
                        </text>
                      </g>
                    )}

                    {/* Clean Strategic Warp Lanes (No messy spiderweb!) */}
                    {showCorridors && (
                      <g>
                        {STRATEGIC_WARP_LANES.map(([sysAId, sysBId]) => {
                          const sysA = effectiveSolarSystems.find((s) => s.id === sysAId);
                          const sysB = effectiveSolarSystems.find((s) => s.id === sysBId);
                          if (!sysA || !sysB) return null;

                          const posA = mapCoordsToSvg(sysA.centerCoordinates[0], sysA.centerCoordinates[2]);
                          const posB = mapCoordsToSvg(sysB.centerCoordinates[0], sysB.centerCoordinates[2]);

                          const isHighPriority =
                            sysA.id === selectedSystemId ||
                            sysB.id === selectedSystemId ||
                            sysA.id === shipState?.currentSystemId ||
                            sysB.id === shipState?.currentSystemId;

                          return (
                            <line
                              key={`${sysAId}-${sysBId}`}
                              x1={posA.sx}
                              y1={posA.sy}
                              x2={posB.sx}
                              y2={posB.sy}
                              stroke={isHighPriority ? '#38bdf8' : '#334155'}
                              strokeWidth={isHighPriority ? 1.5 : 0.8}
                              strokeDasharray={isHighPriority ? '4 2' : '3 3'}
                              opacity={isHighPriority ? 0.75 : 0.35}
                            />
                          );
                        })}
                      </g>
                    )}

                    {/* Interactive Star Systems Nodes */}
                    {effectiveSolarSystems.map((sys) => {
                      const { sx, sy } = mapCoordsToSvg(sys.centerCoordinates[0], sys.centerCoordinates[2]);
                      const isSelected = sys.id === selectedSystemId;
                      const isHere = sys.id === shipState?.currentSystemId;
                      const isHovered = sys.id === hoveredSystemId;
                      const hasDock = sys.planets?.some((p) => p.type === 'starbase');
                      const isFed = sys.territory === 'federation';

                      const starColor =
                        sys.id === 'sol_system'
                          ? '#fde047'
                          : sys.id === 'vulcan_system'
                          ? '#f97316'
                          : sys.id === 'andoria_system'
                          ? '#38bdf8'
                          : sys.id === 'kronos_system' || sys.id === 'mempa_system'
                          ? '#ef4444'
                          : sys.id === 'romulus_system' || sys.id === 'krios_system'
                          ? '#10b981'
                          : sys.id === 'cardassia_system' || sys.id === 'chintoka_system'
                          ? '#f59e0b'
                          : sys.id === 'gorn_sector' || sys.id === 'bolian_system'
                          ? '#60a5fa'
                          : sys.id === 'idran_system'
                          ? '#818cf8'
                          : sys.id === 'omarion_system'
                          ? '#f472b6'
                          : sys.id === 'delta_caretaker_system'
                          ? '#06b6d4'
                          : sys.id === 'borg_unicomplex_system'
                          ? '#22c55e'
                          : sys.id === 'galactic_barrier_sector'
                          ? '#ec4899'
                          : '#38bdf8';

                      // Determine whether to display the sub-label (FEDERATION · N BODIES)
                      // Prevents text collision and clutter unless hovered, selected, or zoomed in
                      const displaySubLabel =
                        showAllLabels || isSelected || isHovered || isHere || zoomLevel >= 1.4;

                      return (
                        <g
                          key={sys.id}
                          className="cursor-pointer transition-transform"
                          onClick={() => handleSelectSystem(sys.id)}
                          onMouseEnter={() => setHoveredSystemId(sys.id)}
                          onMouseLeave={() => setHoveredSystemId(null)}
                        >
                          {/* Selection aura */}
                          {isSelected && (
                            <circle
                              cx={sx}
                              cy={sy}
                              r="24"
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="1.8"
                              strokeDasharray="4 2"
                            >
                              <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`0 ${sx} ${sy}`}
                                to={`360 ${sx} ${sy}`}
                                dur="8s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}

                          {/* Enterprise Player Location Marker */}
                          {isHere && (
                            <g>
                              <circle
                                cx={sx}
                                cy={sy}
                                r="32"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                opacity="0.8"
                              >
                                <animate
                                  attributeName="r"
                                  values="20;36;20"
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="opacity"
                                  values="0.9;0.2;0.9"
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                              <text
                                x={sx}
                                y={sy - 22}
                                textAnchor="middle"
                                fill="#38bdf8"
                                fontSize="8.5"
                                fontWeight="bold"
                                fontFamily="monospace"
                                stroke="#020617"
                                strokeWidth="3"
                                paintOrder="stroke fill"
                              >
                                📍 YOU ARE HERE
                              </text>
                            </g>
                          )}

                          {/* Star Glow */}
                          <circle
                            cx={sx}
                            cy={sy}
                            r={isHovered || isSelected ? '18' : '13'}
                            fill={starColor}
                            opacity={isHovered || isSelected ? 0.45 : 0.25}
                          />

                          {/* Central Star Core */}
                          <circle
                            cx={sx}
                            cy={sy}
                            r={isSelected ? '7.5' : isHovered ? '7' : '5.5'}
                            fill={starColor}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? '1.8' : '1.2'}
                          />

                          {/* Space Station / Starbase indicator icon */}
                          {hasDock && (
                            <g transform={`translate(${sx + 8}, ${sy - 13})`}>
                              <circle cx="5" cy="5" r="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                              <text x="5" y="7.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                                ⚓
                              </text>
                            </g>
                          )}

                          {/* Primary System Label (With Halo for crisp legibility) */}
                          <text
                            x={sx}
                            y={sy + 16}
                            textAnchor="middle"
                            fill={
                              isSelected
                                ? '#38bdf8'
                                : isHovered
                                ? '#ffffff'
                                : sys.id === 'kronos_system'
                                ? '#fca5a5'
                                : '#e2e8f0'
                            }
                            fontSize={isSelected ? '11' : '10'}
                            fontWeight="bold"
                            letterSpacing="0.4"
                            stroke="#020617"
                            strokeWidth="3.5"
                            strokeLinejoin="round"
                            paintOrder="stroke fill"
                          >
                            {sys.id === 'kronos_system'
                              ? "Qo'noS"
                              : sys.name.split('/')[0].replace('System', '').trim()}
                          </text>

                          {/* Sub-label (Only shown when zoomed or selected/hovered to declutter) */}
                          {displaySubLabel && (
                            <text
                              x={sx}
                              y={sy + 26}
                              textAnchor="middle"
                              fill={isFed ? '#7dd3fc' : '#fca5a5'}
                              fontSize="7.5"
                              fontFamily="monospace"
                              stroke="#020617"
                              strokeWidth="3"
                              paintOrder="stroke fill"
                            >
                              {isFed ? 'FED' : 'FRONTIER'} · {sys.planets?.length || 0} BODIES
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Collapsible Sleek Planetary Bodies Tray in Selected Sector */}
                {currentSystem && currentSystem.planets && currentSystem.planets.length > 0 && (
                  <div className="mt-2 rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shrink-0">
                    <div
                      onClick={() => setIsBodiesDrawerOpen(!isBodiesDrawerOpen)}
                      className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-slate-850 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs font-trek uppercase font-bold text-sky-400">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Planetary Bodies in {currentSystem.name}:</span>
                        <span className="text-[10px] text-slate-400 font-mono-nums">
                          ({currentSystem.planets.length} worlds & stations)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono-nums text-slate-400">
                        <span>{isBodiesDrawerOpen ? 'Collapse Tray' : 'Expand All Bodies'}</span>
                        {isBodiesDrawerOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Horizontal scroll strip when collapsed; full grid when expanded */}
                    <div
                      className={`p-2 transition-all duration-200 ${
                        isBodiesDrawerOpen
                          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto'
                          : 'flex items-center gap-2 overflow-x-auto pb-1.5'
                      }`}
                    >
                      {currentSystem.planets.map((planet) => {
                        const isTarget = selectedPlanet?.id === planet.id;
                        const isStation = planet.type === 'starbase';
                        return (
                          <div
                            key={planet.id}
                            onClick={() => setSelectedPlanetId(planet.id)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2 shrink-0 ${
                              isBodiesDrawerOpen ? 'w-auto' : 'min-w-[150px]'
                            } ${
                              isTarget
                                ? 'bg-sky-950/80 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                                style={{ backgroundColor: planet.textureColor || '#38bdf8' }}
                              />
                              <div className="truncate">
                                <span className="text-xs font-bold text-white truncate font-trek block">
                                  {planet.name.split('(')[0].trim()}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono-nums block truncate">
                                  {isStation ? '⚓ Starbase' : planet.type}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickEngage(currentSystem.id, planet.id);
                              }}
                              className="py-1 px-2 rounded bg-sky-600/80 hover:bg-sky-500 text-white font-trek font-bold text-[9px] uppercase tracking-wide flex items-center gap-1 shrink-0 transition-colors"
                              title={`Engage course to ${planet.name}`}
                            >
                              <Rocket className="w-2.5 h-2.5" />
                              <span>Warp</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orbits' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400 font-mono-nums shrink-0">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      ORBITAL SYSTEM VIEW: <strong className="text-white">{currentSystem.name}</strong>
                    </span>
                  </span>
                  <span className="text-sky-300">CLICK ANY PLANET OR STARBASE TO SELECT</span>
                </div>

                {/* Concentric Orbital Plane Visualization (Scaled 800 x 460) */}
                <div className="flex-1 relative rounded-xl border border-sky-500/40 bg-slate-950 overflow-hidden flex items-center justify-center p-2 min-h-0">
                  <svg viewBox="0 0 800 460" className="w-full h-full select-none">
                    <defs>
                      <radialGradient id="starCore" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                        <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Central Star */}
                    <circle cx="400" cy="230" r="50" fill="url(#starCore)" />
                    <circle cx="400" cy="230" r="19" fill="#fef08a" stroke="#ffffff" strokeWidth="2" />
                    <text
                      x="400"
                      y="262"
                      textAnchor="middle"
                      fill="#fde68a"
                      fontSize="10"
                      fontWeight="bold"
                      stroke="#020617"
                      strokeWidth="3"
                      paintOrder="stroke fill"
                    >
                      {currentSystem.primaryStar.split('(')[0].trim()}
                    </text>

                    {/* Concentric Planet Orbits & Satellites */}
                    {(() => {
                      const primaryWorlds = currentSystem.planets.filter(
                        (p) => p.type !== 'moon' && p.type !== 'starbase'
                      );

                      const worldPositions = new Map<string, { px: number; py: number }>();

                      return (
                        <>
                          {/* 1. Concentric Orbit Tracks for Primary Worlds */}
                          {primaryWorlds.map((world, wIdx) => {
                            const orbitRadius = 80 + (wIdx + 1) * Math.max(34, Math.min(52, 280 / primaryWorlds.length));
                            const isSelected = world.id === selectedPlanet?.id;
                            const angle = (wIdx * 1.45 + 0.5) * Math.PI;
                            const px = 400 + Math.cos(angle) * orbitRadius;
                            const py = 230 + Math.sin(angle) * (orbitRadius * 0.70);
                            worldPositions.set(world.id, { px, py });

                            return (
                              <ellipse
                                key={`orbit-${world.id}`}
                                cx="400"
                                cy="230"
                                rx={orbitRadius}
                                ry={orbitRadius * 0.70}
                                fill="none"
                                stroke={isSelected ? '#38bdf8' : '#334155'}
                                strokeWidth={isSelected ? '1.8' : '0.9'}
                                strokeDasharray="3 3"
                                opacity={0.65}
                              />
                            );
                          })}

                          {/* 2. Interactive Bodies (Planets, Moons, Starbases) */}
                          {currentSystem.planets.map((planet) => {
                            const isSelected = planet.id === selectedPlanet?.id;
                            const isStation = planet.type === 'starbase';
                            const isMoon = planet.type === 'moon';
                            const isGasGiant = planet.type === 'gas_giant';

                            let px = 400;
                            let py = 230;

                            if (isMoon) {
                              const parentId = (planet as any).parentPlanetId || primaryWorlds[0]?.id;
                              const parentPos = worldPositions.get(parentId) || { px: 490, py: 230 };
                              px = parentPos.px + 26;
                              py = parentPos.py - 18;
                            } else if (isStation) {
                              const parentId = (planet as any).parentPlanetId || primaryWorlds[0]?.id;
                              const parentPos = worldPositions.get(parentId) || { px: 490, py: 230 };
                              px = parentPos.px - 26;
                              py = parentPos.py + 20;
                            } else {
                              const pos = worldPositions.get(planet.id);
                              if (pos) {
                                px = pos.px;
                                py = pos.py;
                              }
                            }

                            return (
                              <g
                                key={planet.id}
                                className="cursor-pointer"
                                onClick={() => setSelectedPlanetId(planet.id)}
                              >
                                {/* Guide line connecting moons / starbases to host planet */}
                                {(isMoon || isStation) && (
                                  <line
                                    x1={worldPositions.get((planet as any).parentPlanetId || primaryWorlds[0]?.id)?.px || px}
                                    y1={worldPositions.get((planet as any).parentPlanetId || primaryWorlds[0]?.id)?.py || py}
                                    x2={px}
                                    y2={py}
                                    stroke="#38bdf8"
                                    strokeWidth="0.8"
                                    strokeDasharray="2 2"
                                    opacity="0.5"
                                  />
                                )}

                                {/* Selected Ring Aura */}
                                {isSelected && (
                                  <circle
                                    cx={px}
                                    cy={py}
                                    r={isStation ? '18' : isMoon ? '12' : '16'}
                                    fill="none"
                                    stroke="#38bdf8"
                                    strokeWidth="2"
                                    strokeDasharray="3 2"
                                  >
                                    <animateTransform
                                      attributeName="transform"
                                      type="rotate"
                                      from={`0 ${px} ${py}`}
                                      to={`360 ${px} ${py}`}
                                      dur="6s"
                                      repeatCount="indefinite"
                                    />
                                  </circle>
                                )}

                                {/* Planet, Moon, or Station Marker */}
                                {isStation ? (
                                  <g>
                                    <rect
                                      x={px - 8}
                                      y={py - 8}
                                      width="16"
                                      height="16"
                                      rx="3"
                                      fill="#0284c7"
                                      stroke="#38bdf8"
                                      strokeWidth="1.5"
                                    />
                                    <text
                                      x={px}
                                      y={py + 4}
                                      textAnchor="middle"
                                      fill="#ffffff"
                                      fontSize="10"
                                      fontWeight="bold"
                                    >
                                      ⚓
                                    </text>
                                  </g>
                                ) : isMoon ? (
                                  <circle
                                    cx={px}
                                    cy={py}
                                    r="5.5"
                                    fill={planet.textureColor || '#94a3b8'}
                                    stroke="#cbd5e1"
                                    strokeWidth="1"
                                  />
                                ) : (
                                  <circle
                                    cx={px}
                                    cy={py}
                                    r={isGasGiant ? '13' : '9'}
                                    fill={planet.textureColor || '#38bdf8'}
                                    stroke="#f8fafc"
                                    strokeWidth="1.2"
                                  />
                                )}

                                {/* Label with crisp text halo */}
                                <text
                                  x={px}
                                  y={isStation ? py + 16 : isMoon ? py + 13 : py - 13}
                                  textAnchor="middle"
                                  fill={isSelected ? '#38bdf8' : isMoon ? '#94a3b8' : '#e2e8f0'}
                                  fontSize={isMoon ? '8' : '9.5'}
                                  fontWeight={isSelected ? 'bold' : 'normal'}
                                  stroke="#020617"
                                  strokeWidth="3"
                                  paintOrder="stroke fill"
                                >
                                  {planet.name.split('(')[0].trim()}
                                </text>

                                {isStation && (
                                  <text
                                    x={px}
                                    y={py + 25}
                                    textAnchor="middle"
                                    fill="#38bdf8"
                                    fontSize="7.5"
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                    stroke="#020617"
                                    strokeWidth="3"
                                    paintOrder="stroke fill"
                                  >
                                    [STARBASE]
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'manifest' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search planets, starbases, drydocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-trek text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { id: 'all', label: 'All Bodies' },
                      { id: 'stations', label: '⚓ Starbases & Docks' },
                      { id: 'planets', label: '🪐 Worlds' },
                      { id: 'federation', label: 'Federation' },
                      { id: 'klingon', label: '⚔️ Klingon Empire' },
                      { id: 'romulan', label: '🦅 Romulan' },
                      { id: 'cardassian', label: '🏛️ Cardassian' },
                      { id: 'dominion', label: '🌌 Dominion (Gamma)' },
                      { id: 'delta_borg', label: '🟩 Delta / Borg' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilterType(f.id as FilterType)}
                        className={`px-2.5 py-1 text-[11px] rounded transition-colors uppercase font-bold ${
                          filterType === f.id
                            ? 'bg-sky-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manifest Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 min-h-0">
                  {filteredManifest.map(({ system, planet }) => {
                    const isSelected = planet.id === selectedPlanet?.id;
                    const isStation = planet.type === 'starbase';
                    return (
                      <div
                        key={planet.id}
                        onClick={() => {
                          setSelectedSystemId(system.id);
                          setSelectedPlanetId(planet.id);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-sky-950/80 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: planet.textureColor || '#334155',
                            borderColor: isStation ? '#38bdf8' : '#64748b',
                          }}
                        >
                          {isStation ? (
                            <span className="text-base text-sky-200">⚓</span>
                          ) : (
                            <span className="text-xs">🪐</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate font-trek">
                              {planet.name}
                            </h4>
                            {isStation && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono font-bold uppercase shrink-0">
                                Refit Dock
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono-nums truncate">
                            {system.name.split('/')[0].trim()} · Type: {planet.type}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {planet.description}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickEngage(system.id, planet.id);
                              }}
                              className="py-1 px-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-trek font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 transition-colors"
                              title={`Lay in course and engage to ${planet.name}`}
                            >
                              <Rocket className="w-3 h-3" />
                              <span>Plot & Engage Warp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Detailed Inspector & Warp Actions Panel */}
          <div className="w-full md:w-[380px] bg-slate-900/80 p-4 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-slate-800 font-trek shrink-0">
            <div>
              {/* Selected Target Header */}
              <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-800">
                <div>
                  <div className="text-[10px] font-mono-nums text-sky-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <Crosshair className="w-3 h-3 text-sky-400" />
                    <span>TARGET TELEMETRY</span>
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide mt-0.5">
                    {selectedPlanet ? selectedPlanet.name : currentSystem?.name || 'Sector View'}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono-nums">
                    System: <span className="text-amber-300">{currentSystem?.name || 'Local System'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      currentSystem?.territory === 'federation'
                        ? 'bg-sky-950 border-sky-500/50 text-sky-300'
                        : 'bg-red-950 border-red-500/50 text-red-300'
                    }`}
                  >
                    {currentSystem?.territory === 'federation' ? 'FEDERATION' : 'WAR ZONE'}
                  </span>
                </div>
              </div>

              {/* CRITICAL STARBASE REPAIR & REARM BADGE (Telemetry data only, no dock button) */}
              {isSelectedStation && (
                <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-cyan-950/80 to-blue-950/90 border-2 border-cyan-400 text-xs shadow-lg shadow-cyan-950/50 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-cyan-300 uppercase tracking-wide">
                    <Anchor className="w-4 h-4 text-cyan-400" />
                    <span>STARSHIP REPAIR & REARM FACILITY</span>
                  </div>
                  <p className="text-[11px] text-cyan-100/90 leading-relaxed font-mono-nums mb-2">
                    Docking slips certified for Constitution-class starships. Guarantees complete structural hull restoration and full replenishment of tactical photon torpedo ordnance upon arrival.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-nums text-slate-300">
                    <div className="p-1 rounded bg-slate-900/80 border border-cyan-500/30 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Hull Refit: <strong>100%</strong></span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/80 border border-cyan-500/30 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Shields: <strong>100%</strong></span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/80 border border-cyan-500/30 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Torpedoes: <strong>30/30</strong></span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/80 border border-cyan-500/30 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Thruster Overdrive</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Planet / System Specs Grid */}
              <div className="space-y-2 mb-4 text-xs font-mono-nums">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Classification:</span>
                  <span className="text-white font-semibold">
                    {selectedPlanet ? selectedPlanet.type.toUpperCase() : currentSystem?.spectralType || 'STAR'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Primary Star:</span>
                  <span className="text-amber-300">{currentSystem?.primaryStar || 'Central Star'}</span>
                </div>
                {selectedPlanet && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Target Radius:</span>
                    <span className="text-white">{selectedPlanet.radius * 100} km</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="text-slate-300">
                    {selectedPlanet
                      ? `[${selectedPlanet.position.join(', ')}]`
                      : `[${currentSystem?.centerCoordinates ? currentSystem.centerCoordinates.join(', ') : '0, 0, 0'}]`}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                {selectedPlanet ? selectedPlanet.description : currentSystem?.description || ''}
              </div>
            </div>

            {/* Bottom Actions Area: Warp Cruise Selector & Engagement (WARP ONLY AS GIVEN FOR OTHER THINGS) */}
            <div className="space-y-2 pt-2 border-t border-slate-800 font-trek">
              {/* Warp Factor Speed Chooser */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-sky-400 uppercase font-bold">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Warp Factor:</span>
                  <span className="text-white font-mono-nums">W{selectedWarp.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[4, 6, 8, 9, 9.9].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWarp(w)}
                      className={`px-2 py-0.5 text-[10px] font-mono-nums rounded border transition-colors ${
                        Math.abs(selectedWarp - w) < 0.15
                          ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {w === 9.9 ? '9.9' : `W${w}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Estimated Transit Duration (Updates instantly as Warp Factor changes) */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs font-mono-nums shadow-inner">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-slate-400 font-trek uppercase text-[10px] font-bold">Est. Flight Duration:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-black text-sm">
                    ~{estimatedTransitStats.seconds}s
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({estimatedTransitStats.distanceKm.toLocaleString()} km at W{selectedWarp.toFixed(1)})
                  </span>
                </div>
              </div>

              {/* Live In-Flight Course Status (if currently warping to a destination) */}
              {activeCoursePlot && (
                <div className="p-2 rounded-lg bg-sky-900/40 border border-sky-400/50 text-[11px] font-mono-nums flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-300 font-trek uppercase font-bold text-[10px]">
                    <Rocket className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span>In-Flight Transit:</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-300 font-bold text-xs">
                      Live ETA: ~{activeCoursePlot.etaSeconds}s
                    </span>
                    <span className="text-slate-400 text-[10px] ml-1.5">
                      ({activeCoursePlot.distance.toLocaleString()} km rem.)
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION: SET COURSE / WARP TO TARGET (WARP ONLY) */}
              <button
                onClick={handleSetCourseToSelected}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold uppercase tracking-wider text-xs transition-colors shadow-lg shadow-sky-900/40 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>
                  Engage Course to{' '}
                  {selectedPlanet
                    ? selectedPlanet.name.split('(')[0].trim()
                    : currentSystem?.name
                    ? currentSystem.name.split('/')[0].trim()
                    : 'Destination'}
                </span>
              </button>

              {/* CANCEL COURSE IF ENGAGED */}
              {activeCoursePlot && (
                <button
                  onClick={onCancelCourse}
                  className="w-full py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs transition-colors"
                >
                  Disengage Active Course (All Stop)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
