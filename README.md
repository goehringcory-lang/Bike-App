# Will It Fit? 🚲

A bike drivetrain compatibility checker — answer the shop-counter question *"will this part fit my bike?"*, including cross-brand combos the manufacturers don't document.

Set up your bike from a stock preset or from scratch, then drag parts from the catalog onto it. Each swap gets an instant verdict:

- ✅ **Manufacturer certified** — designed and tested together
- ✅ **Community verified** — cross-brand combo with strong mechanic consensus (e.g. the classic 11-speed "mullet": SRAM 11s shifter + derailleur on a Shimano HG cassette)
- ⚠️ **Works with caveats** — functions, with tradeoffs spelled out
- ❌ **Incompatible** — with an explanation of *why* and what you'd need to change ("this cassette needs an XD driver body — swap your freehub, or pick one of these HG cassettes instead")

Not sure what freehub you have? The **driver wizard** walks you through identifying HG splined vs Micro Spline vs XD in a few questions with pictures.

## How it works

- **`src/domain/`** — Zod schemas for every component category (cassette, rear derailleur, shifter, chain, crankset, rear hub/driver). Specs are the real compatibility surfaces: driver interface, actuation standard (cable pull family), speeds, max cog, total capacity, chain standard and width.
- **`src/data/`** — the curated parts database (~60 Shimano/SRAM/KMC MTB parts as JSON, validated at load), bike presets, and `overrides/known-combos.json`: hand-authored cross-brand knowledge with a compatibility tier and sources. Every override is scoped to a single rule so community knowledge can never blanket-approve an unrelated mismatch.
- **`src/engine/`** — a pure TypeScript rules engine. Declarative pairwise rules (driver interface, actuation match, speed counts, max cog, chain-wrap capacity, chain width/standard) produce a verdict, a mechanic-readable explanation, and actionable fix suggestions. `checkSwap` diffs the build before/after a candidate part — that's what powers the live drag-hover verdict.
- **UI** — React + Vite + Tailwind, dnd-kit drag-and-drop (touch-friendly), Zustand + localStorage for your garage and custom parts. No backend; deploys as a static site.

## Develop

```sh
pnpm install
pnpm dev        # dev server
pnpm test       # engine + data integrity unit tests (vitest)
pnpm e2e        # Playwright smoke tests
pnpm build      # typecheck + production build
```

Adding parts: drop them into a JSON file under `src/data/components/` (the integrity tests catch typos), or use **Catalog → Add custom part** in the app. Cross-brand knowledge goes in `src/data/overrides/known-combos.json`.

## Deploy

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml` (enable Pages → Source: GitHub Actions in the repo settings).
