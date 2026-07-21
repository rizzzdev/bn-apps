---
name: Academic Precision
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f2f2'
  surface-container: '#f1edec'
  surface-container-high: '#ece7e7'
  surface-container-highest: '#e6e1e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5b403c'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#8f706a'
  outline-variant: '#e4beb8'
  surface-tint: '#b82012'
  primary: '#830300'
  on-primary: '#ffffff'
  primary-container: '#ab1509'
  on-primary-container: '#ffbbaf'
  inverse-primary: '#ffb4a8'
  secondary: '#506600'
  on-secondary: '#ffffff'
  secondary-container: '#c1f100'
  on-secondary-container: '#546b00'
  tertiary: '#433f26'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b563b'
  on-tertiary-container: '#d3cbaa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410100'
  on-primary-fixed-variant: '#930300'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#ebe3c0'
  tertiary-fixed-dim: '#cec7a5'
  on-tertiary-fixed: '#1f1c06'
  on-tertiary-fixed-variant: '#4b472d'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e6e1e1'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-mono:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  unit: 8px
  gutter: 24px
  margin: 32px
  container-max: 1280px
  border-width: 4px
  shadow-offset: 8px
---

## Brand & Style

The design system operates on the principle of **Structured Neobrutalism**. It reconciles the raw, high-contrast energy of brutalist web design with the rigid order of academic publishing. The target audience is intellectual and detail-oriented, requiring a UI that feels both experimental and authoritative.

The aesthetic is built on "Perfect Blocks"—modular components that reject organic curves and soft gradients in favor of absolute geometry. Every element must feel heavy and physical, anchored to the page by thick strokes and hard shadows. The emotional response is one of clarity, impact, and structural integrity.

## Colors

The palette uses high-contrast juxtaposition to establish hierarchy.

- **Primary (Deep Red):** Reserved for core branding, critical calls to action, and academic emphasis.
- **Secondary (Lime Green):** Used as a "highlight" color for interactive feedback and success states. Its vibrance cuts through the traditional academic tones.
- **Tertiary (Cream):** The primary surface color. It softens the starkness of the black borders, providing a sophisticated, paper-like background.
- **Neutral (Stark Black):** Used exclusively for structural elements: 4px borders, hard shadows, and high-impact typography.

## Typography

The system utilizes a dual-font strategy. **Outfit** provides a bold, geometric sans-serif presence for all primary communication, ensuring high legibility and modern impact. **Space Mono** is used for secondary data points, metadata, and technical labels to reinforce the "Structured" and "Academic" narrative.

Headlines should always be set with tight leading to maximize visual weight. Body text maintains generous line height for readability against the cream background.

## Layout & Spacing

This design system employs a **Rigid 12-Column Grid**. Precision is non-negotiable; all modules must align to the 8px base grid.

- **Desktop:** 12 columns, 24px gutters.
- **Tablet:** 6 columns, 16px gutters.
- **Mobile:** 2 columns, 16px gutters.

Spacing between components should be consistent multiples of 8px. Elements should never "float" or overlap randomly; they must be locked into the grid as rectangular blocks. Negative space is used strategically to separate sections, rather than using dividers.

## Elevation & Depth

Depth is created through **Hard Shadows**, not gradients or blurs. Every elevated component must follow a strict "Bottom-Right" shadow rule.

- **Shadow Style:** 8px offset (X: 8px, Y: 8px), 0px blur, 100% opacity using the Neutral Black (#1C1B1B).
- **Interactive Depth:** When a component is "pressed" or active, the shadow offset reduces to 2px or 0px, simulating the physical compression of the block onto the page.
- **Layering:** All layers are flat. Depth is purely a result of the shadow and the 4px border.

## Shapes

The shape language is strictly **Sharp**. There are no rounded corners in this design system. Every button, input, card, and modal is a perfect rectangle or square. This reinforces the "Academic Precision" and "Structured" nature of the brand.

All shapes are defined by a 4px solid Black (#1C1B1B) stroke.

## Components

- **Buttons:** Sharp rectangles with 4px borders and 8px hard shadows. Primary buttons use Deep Red with White text. Secondary buttons use Lime Green with Black text. On hover, the button moves 4px down and right.
- **Cards:** Heavy blocks using the Tertiary Cream background. Must span a minimum of 3 columns in the desktop grid.
- **Inputs:** White or Cream background with 4px black borders. Placeholder text uses Space Mono. On focus, the border color remains black but the shadow increases in size.
- **Chips/Labels:** Small rectangular boxes using Space Mono. Use Lime Green backgrounds for status indicators.
- **Lists:** Items separated by 4px horizontal lines. No vertical lines between list items; the 12-column grid provides the structural verticality.
- **Checkboxes/Radios:** Pure squares. Checkboxes use a thick Black 'X' or 'Check' mark. Radio buttons use a smaller centered square instead of a circle.
- **Modular Blocks:** Components should be designed to "stack" perfectly. If two cards are adjacent, their borders should touch or maintain exactly one gutter's width of distance.
