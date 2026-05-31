# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

Deploy is automatic: pushing to `main` triggers GitHub Actions → GitHub Pages at `/solar-system/`.

## Architecture

This is a React + Vite app with a single interactive 3D solar system scene. There are no routing or state management libraries — all state lives in `App.jsx`.

**Data layer** — `src/solarSystemData.js` exports two objects:
- `solarBodies`: array of 9 bodies (Mercury → Pluto), each with display/physics fields and an `en` sub-object for English overrides
- `sunInfo`: standalone Sun entry in the same shape

**3D scene** — `src/SolarSystemScene.jsx` is a raw Three.js component (no React Three Fiber). The entire scene (renderer, camera, OrbitControls, animation loop) is created once inside a `useEffect` and torn down on unmount. Mutable animation state (`isPlaying`, `speed`, `selectedId`, `language`) is kept in a `stateRef` so the animation loop reads the latest values without re-mounting the scene.

**UI shell** — `App.jsx` owns all React state and renders the header controls, the `<SolarSystemScene>`, and a side panel (`<aside>`) showing facts for the selected body. Bilingual copy (zh/en) is stored in a `copy` object at the top of the file.

**Localization pattern**: bodies default to Chinese. English text lives in each body's `en` sub-object. `localizeBody()` merges the `en` fields over the base object when `language === 'en'`. Labels inside the 3D scene are updated each animation frame via `getBodyName()`.

**Deployment**: `vite.config.js` sets `base: '/solar-system/'` for the GitHub Pages sub-path.
