---
name: frontend-ui-engineering
description: >-
  Build responsive, accessible, mobile-first frontend interfaces adhering to modern CSS
  standards, 360px+ viewport constraints, and WCAG 2.1 AA.
metadata:
  icon: devices
---

# Frontend UI Engineering

Enforces high-craft, accessible, responsive frontend components and styling architecture.

## Triggering Conditions
- Implementing user interface layouts, interactive components, forms, or views.
- Styling responsive layouts for mobile (360px+), tablet, and desktop viewports.
- Ensuring semantic markup, keyboard accessibility, and RTL support.

## Operational Checklist
- [ ] Adopt mobile-first styling: base styles target small screens (360px+), enhanced via `min-width` queries.
- [ ] Ensure all interactive controls are natively focusable or carry explicit ARIA attributes.
- [ ] Verify color contrast meets WCAG 2.1 AA standards (minimum 4.5:1 for normal text).
- [ ] Use CSS Logical Properties (`margin-inline`, `padding-inline`, `inset-inline`) for bidirectional (LTR/RTL) support.
- [ ] Maintain minimum touch target size of 44x44px for touch interactions.

## Execution Rules
1. **Semantic Elements:** Prefer native HTML tags (`<button>`, `<dialog>`, `<nav>`, `<main>`, `<header>`) over generic `<div>`.
2. **Zero Layout Blowout:** Prevent horizontal overflow on 360px viewports (`overflow-x: hidden`, flexible grids).
3. **State Completeness:** Explicitly handle Loading, Empty, Success, and Error states for every dynamic component.
4. **Resilient Typography:** Use relative units (`rem`, `ch`, `clamp()`) to respect user system font scaling.
5. **No Blind Framework Dependencies:** Match existing styling conventions (Tailwind, CSS Modules, or Vanilla CSS) without adding unnecessary libraries.
