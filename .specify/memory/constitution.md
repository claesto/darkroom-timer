<!--
Sync Impact Report (temporary; remove before commit)
- Version change: (unfilled template) → 1.0.0
- Modified principles: none renamed; all placeholders replaced
- Added: Principles I–IX; Technical Constraints; Development Workflow & Definition of Done;
  Governance
- Removed: none
- Deferred TODOs: none
-->
# Darkroom Timer Constitution

## Core Principles

### I. Simplicity & Focus
The application serves one purpose: operating three configurable timers labelled DEVELOP, STOP,
and FIX.
- MUST NOT add accounts, analytics, dashboards, extra screens, navigation, or server-side
  functionality.
- MUST prefer the simplest implementation that fully satisfies the specification.
- MUST remain understandable and maintainable by a single developer.

Rationale: a darkroom tool is used in low light with wet hands; every extra feature is a risk.

### II. Client-Side Architecture
- MUST be a single-page web application deployable as static files (including GitHub Pages).
- MUST NOT require a backend, database, authentication service, external API, or server-side logic.
- MUST avoid runtime dependencies on third-party hosted services (CDNs, hosted fonts, etc.).
- User state MAY be stored locally in the browser only.

### III. Timer Correctness
Elapsed-time accuracy is the critical quality of the product.
- Calculations MUST use timestamps and elapsed-time reconciliation, never solely an in-memory
  per-second decrement.
- MUST remain accurate after browser throttling, tab inactivity, device sleep, or delayed
  JavaScript execution.
- State transitions MUST be deterministic and explicitly modelled.
- At most one timer MAY be running at any moment; starting one MUST safely pause any other.
- Time values MUST NEVER be negative.

### IV. Clear Interaction Semantics
- Start, pause, stop, reset, and clear MUST have distinct, documented behaviours.
- Destructive actions MUST NOT occur accidentally (confirmation or recoverable undo).
- Controls MUST give immediate visual feedback.
- Timer status MUST always be visible and MUST NOT rely on colour alone.
- Controls MUST work with mouse, touch, and keyboard.

### V. Premium Design
- The visual design MUST be precise, calm, minimal, and premium, inspired by the restraint of
  high-end aerospace and consumer hardware interfaces.
- MUST NOT copy proprietary layouts, branding, trademarks, fonts, icons, or assets; the visual
  identity MUST be original.
- MUST prioritise typography, spacing, contrast, alignment, subtle motion, and clear hierarchy
  over decoration.
- MUST NOT use visual clutter, excessive gradients, glassmorphism, novelty animations, or
  ornamentation.
- MUST work well in dark mode and across desktop, tablet, and mobile sizes.

### VI. Accessibility (WCAG 2.2 AA)
- MUST target WCAG 2.2 AA, using semantic HTML and native controls wherever practical.
- All functionality MUST be keyboard accessible with clearly visible focus states.
- Motion MUST respect `prefers-reduced-motion`.
- Timer state and important changes MUST reach assistive technologies without announcing every
  second.
- Touch targets MUST be appropriately sized.

### VII. Quality & Testing
- Timer calculations and state transitions MUST be implemented independently of presentation.
- Timer-domain logic MUST have automated unit tests covering start, pause, resume, stop, reset,
  clear, reaching zero, switching between timers, restoring saved state, and reconciling elapsed
  time.
- Important user interactions MUST have component or integration tests.
- Code MUST use strict typing; `any` MUST be avoided unless justified in a comment.
- Linting, formatting, type checking, tests, and production build MUST pass before work is
  complete.

### VIII. Performance & Resilience
- The initial application MUST be lightweight and responsive; large libraries MUST be avoided where
  browser APIs or small focused utilities suffice.
- Timer updates MUST NOT cause unnecessary full-page renders.
- Persisted data MUST be versioned and validated before use; corrupt or incompatible data MUST fail
  safely to sensible defaults.
- The application MUST remain usable if browser storage is unavailable.

### IX. Privacy & Security
- MUST NOT include telemetry, tracking, cookies, advertisements, or remote data collection.
- Timer data MUST NOT leave the user's browser.
- MUST NOT use unsafe HTML injection.
- Third-party packages MUST be minimised and their necessity reviewed.
- No secrets or environment-specific credentials may be required.

## Technical Constraints
Deliverable is a static bundle with no runtime server. Specific frameworks and tooling are chosen in
the plan, and MUST honour Principles I, II, VII, and VIII.

## Development Workflow & Definition of Done
A feature is complete only when:
1. its acceptance criteria are satisfied;
2. timer behaviour is covered by automated tests;
3. accessibility requirements are met;
4. responsive layouts have been verified;
5. linting, type checking, tests, and production build pass;
6. relevant documentation is updated;
7. no placeholder content, dead controls, debug output, or known broken states remain.

## Governance
This constitution supersedes other practices and applies to all specifications, plans, tasks, and
implementation decisions. Amendments MUST be documented with rationale and a version bump per
semantic versioning (MAJOR: removal or redefinition of principles; MINOR: new or materially
expanded principle; PATCH: clarifications). Every plan and review MUST verify compliance; any
deviation MUST be justified in writing.

**Version**: 1.0.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-06
