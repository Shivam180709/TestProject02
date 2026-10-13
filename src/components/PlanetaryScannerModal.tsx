// Planetary Spectroscopic Analysis & Habitability Laboratory Modal
// High-tech Starfleet science station analyzing atmospheric gas distributions,
// Earth Similarity Index (ESI), magnetosphere strength, and biosignature indicators.

import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Globe,
  Radio,
  Sparkles,
  Shield,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Atom,
  Flame,
  Droplets,
} from 'lucide-react';
import { PlanetaryScienceData, getPlanetaryScienceData } from '../data/planetaryScienceData';

interface PlanetaryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlanetId?: string;
  targetPlanetName?: string;
  systemName?: string;
  objectType?: string;
  onPlotCourseToTarget?: () => void;
}

export const PlanetaryScannerModal: React.FC<PlanetaryScannerModalProps> = ({
  isOpen,
  onClose,
  targetPlanetId = 'sol_earth',
  targetPlanetName = 'Earth (Sector 001)',
  systemName = 'Sol System',
  objectType = 'terran',
  onPlotCourseToTarget,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'atmosphere' | 'geophysics' | 'habitability'>('atmosphere');

  const scienceData: PlanetaryScienceData = getPlanetaryScienceData(
    targetPlanetId,
    targetPlanetName,
    systemName,
    objectType
  );

  // Trigger scanning sequence when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScanProgress(0);
      const startTime = Date.now();
      const duration = 1200; // 1.2s rapid sensor sweep

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.round((elapsed / duration) * 100));
        setScanProgress(progress);

        if (progress >= 100) {
          setIsScanning(false);
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [isOpen, targetPlanetId]);

  if (!isOpen) return null;

  const handleRescan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const startTime = Date.now();
    const duration = 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setScanProgress(progress);

      if (progress >= 100) {
        setIsScanning(false);
        clearInterval(interval);
      }
    }, 30);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950/95 border border-sky-500/50 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-trek">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase font-bold">
                  Spectroscopic Sensor Array
                </span>
                <span className="text-xs text-slate-400 font-mono-nums">{scienceData.systemName}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">
                {scienceData.name} · Planetary Science Analysis
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRescan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-trek uppercase font-bold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
              title="Rescan Target Frequency"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Rescan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan Progress Bar (Active During Sweep) */}
        {isScanning && (
          <div className="w-full bg-slate-900 border-b border-sky-500/40 p-2.5">
            <div className="flex items-center justify-between text-xs font-mono-nums text-sky-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>MULTISPECTRAL TRIANGULATION IN PROGRESS...</span>
              </span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-sky-500/30">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-300 transition-all duration-75"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Overview Metric Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-900/50 border-b border-slate-800 text-xs font-mono-nums">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Classification</div>
            <div className="text-sm font-bold text-sky-300 truncate">{scienceData.classification}</div>
            <div className="text-[10px] text-slate-500">{scienceData.spectralClass}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Earth Similarity (ESI)</div>
            <div className="text-sm font-bold text-amber-300">
              {(scienceData.earthSimilarityIndex * 100).toFixed(0)}% (ESI: {scienceData.earthSimilarityIndex.toFixed(2)})
            </div>
            <div className="text-[10px] text-slate-500">Status: {scienceData.habitabilityStatus}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Surface Gravity</div>
            <div className="text-sm font-bold text-slate-100">
              {scienceData.surfaceGravityG.toFixed(2)} g ({scienceData.surfaceGravityMs2.toFixed(1)} m/s²)
            </div>
            <div className="text-[10px] text-slate-500">Pressure: {scienceData.surfacePressureAtm} atm</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Mean Temperature</div>
            <div className="text-sm font-bold text-cyan-300">
              {scienceData.meanSurfaceTempC}°C ({scienceData.meanSurfaceTempK} K)
            </div>
            <div className="text-[10px] text-slate-500">Magnetosphere: {scienceData.magneticFieldGauss} G</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 text-xs font-trek uppercase">
          {[
            { id: 'atmosphere', label: 'Atmospheric Spectroscopy', icon: Atom },
            { id: 'geophysics', label: 'Geophysical & Magnetic Field', icon: Shield },
            { id: 'habitability', label: 'Habitability & Biosignatures', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-sky-400 text-sky-300 bg-sky-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'atmosphere' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-sky-950/30 border border-sky-500/30 text-xs">
                <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  Spectroscopic Chemical Abundance Breakdown
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Real-time infrared and ultraviolet spectral absorption analysis detected the following molecular constituents within the planetary troposphere and mesosphere:
                </p>
              </div>

              {/* Molecular Percentage Bars */}
              <div className="space-y-3">
                {scienceData.atmosphereGases.map((gas: any) => (
                  <div key={gas.chemicalFormula} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: gas.color }}
                        />
                        <span className="font-bold text-white">{gas.name}</span>
                        <span className="font-mono-nums text-sky-400 font-bold">({gas.chemicalFormula})</span>
                      </div>
                      <span className="font-mono-nums text-sm font-extrabold text-white">
                        {gas.percentage.toFixed(2)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-1.5">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, gas.percentage)}%`,
                          backgroundColor: gas.color,
                        }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono-nums">
                      Role: {gas.scientificRole}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'geophysics' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Geophysical Structure & Magnetosphere Dynamics
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {scienceData.geophysicalSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs font-mono-nums">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Dipolar Magnetic Field:</span>
                    <span className="text-emerald-400 font-bold">{scienceData.magneticFieldGauss} Gauss</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Surface Radiation:</span>
                    <span className="text-amber-300 font-bold">{scienceData.radiationLevelRadHr} rad/hr</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Surface Gravity (Earth Baseline):</span>
                    <span className="text-sky-300 font-bold">{scienceData.surfaceGravityG.toFixed(2)} g</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Barometric Surface Pressure:</span>
                    <span className="text-cyan-300 font-bold">{scienceData.surfacePressureAtm} atm</span>
                  </div>
                </div>
              </div>

              {/* Science Highlights */}
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wide mb-2">
                  Key Scientific Findings & Observations
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {scienceData.scienceHighlights.map((highlight: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'habitability' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center shrink-0">
                  <div
                    className={`absolute inset-0 rounded-full border-4 ${
                      scienceData.earthSimilarityIndex > 0.8
                        ? 'border-emerald-400'
                        : scienceData.earthSimilarityIndex > 0.5
                        ? 'border-amber-400'
                        : 'border-red-400'
                    }`}
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                    }}
                  />
                  <div className="text-center font-mono-nums">
                    <div className="text-2xl font-black text-white">
                      {(scienceData.earthSimilarityIndex * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">ESI Index</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-trek uppercase">Habitability Rating:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        scienceData.habitabilityStatus === 'Optimal'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : scienceData.habitabilityStatus === 'Marginal'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-red-950 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {scienceData.habitabilityStatus}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Earth Similarity Index (ESI) assesses celestial bodies based on mean radius, bulk density, escape velocity, and equilibrium surface temperature.
                  </p>
                </div>
              </div>

              {/* Biosignature Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-nums">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Liquid Surface Water (H₂O):</span>
                  </div>
                  <span className={`font-bold ${scienceData.hasLiquidWater ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {scienceData.hasLiquidWater ? 'DETECTED' : 'NEGATIVE'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Active Biosignatures:</span>
                  </div>
                  <span className={`font-bold ${scienceData.biosignaturesDetected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {scienceData.biosignaturesDetected ? 'CONFIRMED' : 'NEGATIVE'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono-nums text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Spectral telemetry synchronized with ship astrogations</span>
          </div>

          <div className="flex items-center gap-2">
            {onPlotCourseToTarget && (
              <button
                onClick={() => {
                  onPlotCourseToTarget();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-sky-500/20"
              >
                Set Course & Warp to {scienceData.name.split(' (')[0]}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-trek font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
