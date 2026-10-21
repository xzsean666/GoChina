# TASK-017: Frontend Design System Elevation & Layout Shell (Aesthetics Overhaul)

## Objective
Elevate the GoChina frontend design system according to `docs/Frontend-Design-Skill.md` by ditching generic "AI slop" aesthetics. Establish a bold, memorable Edge-Computing/Web3 aesthetic: distinctive typography (Outfit + Plus Jakarta Sans + JetBrains Mono), an obsidian-slate/electric-emerald-cyan color palette, tactile fractal noise overlay, glassmorphic floating navigation with network pulse indicators, and refined toast notification system.

## Scope
- Ditch generic `Inter` typography:
  - Heading & Display: `Outfit` (sleek geometric character, tight letter-spacing)
  - Body Text: `Plus Jakarta Sans` (editorial clarity, high legibility)
  - Code & Cryptographic addresses/numbers: `JetBrains Mono`
- Deepen Theme & Color Palette in `tailwind.config.js` and CSS variables:
  - Obsidian slate dark canvas (`#080b11`, `#0d131f`, `#111927`) with glowing 1px border highlights
  - Alpine crisp light canvas (`#f8fafc`, `#ffffff`, `#f1f5f9`)
  - Distinctive brand accents: Electric Emerald (`#10b981`), Cyber Cyan (`#06b6d4`), Amber Gold (`#f59e0b`)
- Background depth & tactile micro-details:
  - SVG fractal noise layer in `style.css`
  - Subtle radial ambient glows and edge grid lines
- Modernize layout shell components:
  - `Navbar.vue`: Floating pill glassmorphic navigation header with live edge PoPs status indicator, network pill, wallet badge, and smooth transitions
  - `MobileDrawer.vue`: Glassmorphic slide-out drawer with responsive quick links
  - `Footer.vue`: Technical edge infrastructure badge, live latency indicator, and structured footer links
  - `ToastContainer.vue`: Glassmorphic floating toast notifications with custom SVG icons and status glow
  - `App.vue`: Ambient background container with noise overlay

## Allowed Files
- `frontend/index.html`
- `frontend/tailwind.config.js`
- `frontend/src/style.css`
- `frontend/src/App.vue`
- `frontend/src/components/layout/Navbar.vue`
- `frontend/src/components/layout/MobileDrawer.vue`
- `frontend/src/components/layout/Footer.vue`
- `frontend/src/components/layout/ToastContainer.vue`
- `frontend/test/layout.test.ts`

## Dependencies
- `TASK-011` (Frontend Base Scaffolding - DONE)
- `docs/Frontend-Design-Skill.md`

## Inputs and Outputs
- **Inputs**: Guidelines from `docs/Frontend-Design-Skill.md`.
- **Outputs**: Production-grade aesthetic design system, floating glass navigation header, tactile noise background, and elevated layout shell.

## Acceptance Criteria
- [x] Google Fonts updated to Outfit, Plus Jakarta Sans, and JetBrains Mono.
- [x] Tailwind theme configured with custom obsidian palette, display typography, and glow effects.
- [x] Navbar renders as a floating glass bar with live edge PoP pulse indicator, responsive on desktop and mobile.
- [x] Footer renders with network health indicator and refined typography.
- [x] ToastContainer displays notifications with glassmorphism and animated badges.
- [x] `pnpm --dir frontend test` passes with 100% test success.
- [x] `pnpm --dir frontend build` compiles without errors.

## Verification Commands
```bash
pnpm --dir frontend test
pnpm --dir frontend build
```

## Risks and Assumptions
- Font loading uses `font-display: swap` to prevent FOIT (Flash of Invisible Text).
- Retains existing button and route contracts so existing layout tests continue to pass.

## Status
DONE
