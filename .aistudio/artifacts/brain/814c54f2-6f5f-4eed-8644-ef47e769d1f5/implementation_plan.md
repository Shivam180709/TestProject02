# Implementation Plan: 60-Second Flight Commander Demo & Interface Tutorial

Remove the Science Kiosk modal completely (keeping the Spectrometer) and replace it with an energetic, fully automated 60-second cinematic Flight Commander demonstration designed specifically for school exhibition visitors.

---

## 1. Scope & Key Enhancements

### A. Remove Science Kiosk & Preserve Spectrometer
* Delete `ScienceExhibitionModal.tsx` and all related references, props, and states in `App.tsx` and `LCARSHeader.tsx`.
* Retain `PlanetaryScannerModal.tsx` (`[SPECTROMETER]` button) with atmospheric gas spectroscopy and habitability metrics intact.

### B. Flight Commander LCARS Comms Banner (Matching Reference Image)
* Recreate the exact LCARS tactical communication banner from the provided reference screenshot:
  * Cyan pill border with pulsating indicator beacon.
  * Header: `ENTERPRISE NCC-1701 // FLIGHT COMMANDER:`
  * Dynamic script text in bold monospace terminal typography.
  * Animated cyan audio equalizer waveform equalizer visualizer on the right.
  * Authentic LCARS acknowledgment chimes on each script transition.

### C. 60-Second Cinematic Script & Automated Flight Sequence
Scripted as an enthusiastic, high-energy Starfleet Flight Commander:
1. **0:00 – 0:10 | Welcome & Helm Calibration (Orbiting Earth)**
   * Commander: *"Welcome aboard the USS Enterprise! Calibrating primary flight controls. Notice your helm telemetry on screen."*
   * Camera orbits around Earth; Keyboard Shortcut HUD highlights `[W / S]` for pitch and `[A / D]` for steering.
2. **0:10 – 0:22 | Astrogation & Deep Space Long-Range Targeting**
   * Commander: *"Plotting long-range course to Qo'noS in the Klingon Sector. Locking astrogational vector."*
   * Enterprise aligns heading with target coordinates; HUD highlights `[N]` Navigation and `[M]` Galaxy Map.
3. **0:22 – 0:38 | Engaging Faster-Than-Light Warp Drive**
   * Commander: *"Antimatter intermix set! Engaging Alcubierre warp propulsion at Factor 8.5—punch it!"*
   * Ship jumps to Warp 8.5; custom chromatic aberration shader and relativistic particle streaks surge past the hull; HUD highlights `[SHIFT]` Warp Drive.
4. **0:38 – 0:48 | Arrival & Sub-Light Orbital Insertion**
   * Commander: *"Dropping to sub-light impulse! Welcome to Qo'noS. Establishing standard planetary orbit."*
   * Enterprise drops cleanly from warp; HUD highlights `[R]` Drop Warp and camera glides into the classic dorsal saucer view.
5. **0:48 – 0:56 | Planetary Spectroscopic Sensor Sweep**
   * Commander: *"Initiating multi-spectral planetary sensor sweep. Nitrogen-oxygen atmosphere and volcanic mantle confirmed."*
   * Triggers automatic planetary spectroscopy sweep with gas distribution breakdown.
6. **0:56 – 1:00 | Handover of the Helm to Visitor**
   * Commander: *"Sensors nominal. Helm control transferred to Guest Pilot. The ship is yours—boldly go!"*
   * Switches controls to live manual flight with prominent visitor control badges.

### D. Keyboard Shortcut HUD Overlay
* Minimalist on-screen floating keyboard badge tray during the demo illustrating:
  * `[W / S]` Pitch Up / Down (Safe auto-clamped)
  * `[A / D]` Turn Yaw Left / Right
  * `[SHIFT / R]` Warp Cruise / Drop
  * `[SPACE / T]` Phasers / Photon Torpedoes
  * `[1 / 2 / 3 / 4]` Camera Views (Chase, Bridge, Saucer, Cinematic)
* Always displays an instant `"TAKE THE HELM NOW"` button so any booth guest can interrupt the demo and start flying immediately.

---

## 2. File Modifications

| File | Changes |
|------|---------|
| `src/components/FlightCommanderCommsBanner.tsx` | New component rendering the exact LCARS tactical audio comms banner with animated equalizer |
| `src/components/DemoKeyboardShortcutHUD.tsx` | New component displaying active key highlights and guest flight guide |
| `src/components/ScienceExhibitionModal.tsx` | Deleted |
| `src/three/simulationEngine.ts` | Upgraded 60-second automated flight sequence (Earth -> Qo'noS lock -> Warp 8.5 -> Orbit -> Sensor Sweep -> Handover) |
| `src/components/LCARSHeader.tsx` | Replaced Science Kiosk button with high-contrast `[60s FLIGHT DEMO]` button; kept `[SPECTROMETER]` |
| `src/App.tsx` | Integrated Flight Commander demo state machine, banner, shortcut HUD, and removed Science Kiosk imports |

---

## 3. Verification Plan

### Build Verification
* Run `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors.
* Run `compile_applet` to confirm Vite production bundle builds cleanly.

### Interactive Sequence Verification
1. **One-Click Demo Launch**: Click `[60s FLIGHT DEMO]`; verify LCARS comms banner appears with animated audio waveform and chimes.
2. **Telemetry & Shortcut Synchronization**: Verify shortcut keys highlight in sync with the Flight Commander's spoken orders.
3. **Warp & Arrival Transition**: Verify smooth warp engagement to Qo'noS at Factor 8.5 without camera jerking, followed by clean orbital drop.
4. **Planetary Sweep & Handover**: Verify the sensor sweep executes and controls transfer cleanly to the user.
5. **Early Takeover**: Test clicking "TAKE HELM NOW" during any phase to ensure immediate manual control handover.
