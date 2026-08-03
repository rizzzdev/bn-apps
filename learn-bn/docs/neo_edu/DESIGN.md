---
name: Neo-Edu
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#414a35'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#717a62'
  outline-variant: '#c1caae'
  surface-tint: '#426900'
  primary: '#426900'
  on-primary: '#ffffff'
  primary-container: '#adff2f'
  on-primary-container: '#497300'
  inverse-primary: '#8fdb00'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#e8e8e8'
  on-tertiary-container: '#666868'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a8f928'
  primary-fixed-dim: '#8fdb00'
  on-primary-fixed: '#112000'
  on-primary-fixed-variant: '#314f00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system adopts a **Neobrutalist** aesthetic tailored for a modern Learning Management System. It targets a Gen-Z and Alpha demographic, prioritizing energy, clarity, and a "low-friction" but high-impact visual language. The UI is designed to feel tactile and immediate, moving away from the soft gradients of traditional SaaS into a world of raw, honest layout structures.

The emotional response should be one of **confidence and momentum**. By using high-contrast elements and heavy strokes, the interface reduces ambiguity—actions are clearly defined, and content hierarchy is absolute. The "unfinished" but polished look of neobrutalism suggests a dynamic learning environment that is constantly evolving.

## Colors

The palette is intentionally restricted to maximize impact. 
- **Primary (#ADFF2F):** A high-voltage Neon Green used for primary actions, progress indicators, and "active" states.
- **Secondary (#000000):** Pure black is used for all borders, hard shadows, and primary text to ensure maximum legibility and structural definition.
- **Background (#F5F5F5):** An off-white "Ghost White" serves as the canvas, preventing eye strain while allowing the neon green to vibrate against the surface.
- **Surface (#FFFFFF):** Pure white is reserved for the interior of cards and input fields to separate them from the global background.

## Typography

This design system uses **Space Grotesk** for headlines and labels to lean into the technical, geometric personality of the brand. Its quirky letterforms (like the lowercase 'a' and 'g') complement the neobrutalist style. **Inter** is used for body copy to ensure that long-form educational content (course descriptions, quiz questions) remains highly readable and professional.

**Bahasa Indonesia implementation:**
- Use "bold" weights for navigation links (e.g., *Beranda*, *Kursus Saya*).
- All labels and buttons use `label-bold` for a punchy, urgent feel.
- Maintain tight letter-spacing on display headings to emphasize the "blocky" aesthetic.

## Layout & Spacing

The layout follows a **Rigid Grid** philosophy. Elements do not float; they are anchored by heavy borders and consistent spacing increments of 8px.

- **Desktop:** A 12-column grid with a fixed 1280px max-width. Gutters are kept wide (24px) to allow the hard shadows of cards to breathe without overlapping.
- **Mobile:** A single-column flow with 16px side margins. Cards should span the full width minus margins.
- **Rhythm:** Use "Stack" spacing for vertical rhythm. `stack-md` (24px) is the default distance between distinct learning modules or card groups.

## Elevation & Depth

In this design system, depth is not simulated via light physics (soft shadows) but through **Hard Offsets**. This creates a "sticker" or "pop-up" effect.

1.  **Level 0 (Background):** The off-white base layer.
2.  **Level 1 (Default Card/Button):** A 2px black border with a 4px black shadow offset to the bottom-right (4px 4px 0px 0px #000000).
3.  **Level 2 (Hover/Active):** Elements "lift" by increasing the shadow offset to 8px. Alternatively, a "pressed" state removes the shadow entirely and moves the element 4px down and right to simulate physical compression.

No blurs are permitted. All transitions between elevation states should be instant (0ms) or very fast (100ms) to maintain a "snappy" feel.

## Shapes

The design system uses a **Sharp (0)** roundedness strategy. Every container, button, and input field must have 90-degree corners. This reinforces the "Brutalist" aspect of the design, making the UI feel structural and architectural.

Exception: Avatars (user photos) may be circular to provide a single point of organic contrast against the rigid rectangular grid.

## Components

### Buttons
- **Primary:** Neon Green (#ADFF2F) background, 2px black border, 4px black shadow. Text in `label-bold`.
- **States:** On hover, the shadow increases to 8px. On click/active, the shadow disappears and the button shifts 4px down-right.
- **Label Example:** "Mulai Belajar" (Start Learning).

### Cards (Course Modules)
- White background, 2px black border, 4px black shadow.
- Header area of the card can have a Neon Green fill to denote "In Progress" status.
- Content inside follows the `stack-sm` spacing rule.

### Input Fields
- White background, 2px black border. 
- No shadow in default state. 
- On focus, add a 4px Neon Green shadow (instead of black) to indicate the active typing area.
- Placeholder text: `body-md` in a mid-grey (#777777).

### Progress Bars
- Container: 3px black border, white background.
- Fill: Solid Neon Green.
- Height: Minimum 24px to ensure the "blocky" feel is maintained.

### Chips/Badges
- Small rectangular boxes with 2px black borders.
- Use Neon Green for "Lulus" (Passed) and White for "Belum Selesai" (Incomplete).