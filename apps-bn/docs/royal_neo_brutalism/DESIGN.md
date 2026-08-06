---
name: Royal Neo-Brutalism
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#444650'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#757682'
  outline-variant: '#c5c6d2'
  surface-tint: '#435b9f'
  primary: '#00113a'
  on-primary: '#ffffff'
  primary-container: '#002366'
  on-primary-container: '#758dd5'
  inverse-primary: '#b3c5ff'
  secondary: '#6a5f00'
  on-secondary: '#ffffff'
  secondary-container: '#f8e206'
  on-secondary-container: '#6e6300'
  tertiary: '#310013'
  on-tertiary: '#ffffff'
  tertiary-container: '#570027'
  on-tertiary-container: '#ff478c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#00174a'
  on-primary-fixed-variant: '#2a4386'
  secondary-fixed: '#fbe40f'
  secondary-fixed-dim: '#ddc800'
  on-secondary-fixed: '#201c00'
  on-secondary-fixed-variant: '#4f4700'
  tertiary-fixed: '#ffd9e1'
  tertiary-fixed-dim: '#ffb1c4'
  on-tertiary-fixed: '#3f001a'
  on-tertiary-fixed-variant: '#8f0044'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Archivo Narrow
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.5'
  body-md:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
  label-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  border-width: 4px
  shadow-offset: 6px
  gutter: 24px
  margin: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system embraces a **Neobrutalist** aesthetic, prioritizing raw energy, structural honesty, and high-impact visual hierarchy. It is designed for products that want to stand out in a sea of soft, "safe" SaaS interfaces. The personality is unapologetically bold, disruptive, and professional yet playful.

The style is characterized by:

- **Architectural Rigidity:** Elements are defined by heavy strokes and clear boundaries.
- **High Contrast:** A stark juxtaposition between deep Royal Blue, vibrant accents, and pure black.
- **Intentional "Roughness":** Using hard shadows and thick borders to create a tactile, physical presence on the screen.
- **Modern Energy:** Moving away from traditional corporate minimalism toward a more expressive, graphic design-led interface.

## Colors

The palette is built on a foundation of high-contrast pairings to ensure maximum legibility and visual punch.

- **Primary (Royal Blue):** The anchor of the system. Used for headers, primary actions, and structural elements. It provides a sense of authority and depth.
- **Secondary (Vibrant Yellow):** The main "action" accent. Used for high-priority call-to-actions and highlighting key information against the Royal Blue.
- **Tertiary (Hot Pink):** Used sparingly for alerts, notifications, or "breaking" the grid to draw attention.
- **Black & White:** Pure `#000000` is used for all borders, shadows, and body text. Pure `#FFFFFF` is used for primary surface backgrounds to maintain the "stark" look.

## Typography

The typography strategy utilizes three distinct families to create a functional yet expressive hierarchy.

- **Headlines:** `Bricolage Grotesque` provides a quirky, variable-width character that feels contemporary and custom. It should be used for all major titles.
- **Body:** `Archivo Narrow` is used for its efficiency. In a design system with thick borders, space is at a premium; the condensed nature of Archivo allows for high information density without feeling cramped.
- **Labels & Data:** `Space Mono` is used for metadata, buttons, and small labels to lean into the "technical/brutalist" vibe of the system.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model on desktop and a **Fluid Grid** on mobile.

- **Grid:** A 12-column grid with a fixed max-width of 1280px. Columns are separated by heavy 4px vertical lines in specific layouts to emphasize the "blueprint" feel.
- **Spacing Rhythm:** Spacing is strictly mathematical, based on an 8px base unit. However, the presence of 4px borders must be accounted for in padding to maintain visual centering.
- **Breakpoints:**
  - **Desktop:** 1024px+ (12 columns, 32px margins)
  - **Tablet:** 768px - 1023px (8 columns, 24px margins)
  - **Mobile:** <767px (4 columns, 16px margins)

## Elevation & Depth

Depth in this design system is not achieved through light and shadow simulation, but through **Hard Offsets**.

- **Hard Shadows:** All "elevated" elements (cards, buttons, inputs) must feature a solid black `#000000` shadow with 0px blur. The shadow should be offset to the bottom-right (typically 6px).
- **Surface Layering:** When an item is hovered or active, the shadow offset may decrease (e.g., from 6px to 2px) to simulate the element being "pressed" into the page.
- **No Blurs:** The use of Gaussian blurs, backdrop filters, or soft glows is strictly prohibited to maintain the Neobrutalist aesthetic.

## Shapes

The shape language is primarily rectangular but uses a subtle `0.25rem` (4px) corner radius to prevent the UI from feeling dangerously sharp while maintaining its aggressive posture.

- **Standard Elements:** Buttons, cards, and input fields use a consistent 4px radius.
- **Large Containers:** Section containers or large modal overlays can scale up to `rounded-lg` (8px).
- **Icons:** Should be stroke-based, using a 2px or 3px weight to match the heaviness of the UI borders.

## Components

### Buttons

- **Primary:** Royal Blue background, white text, 4px black border, 6px black hard shadow.
- **Secondary:** Vibrant Yellow background, black text, 4px black border, 6px black hard shadow.
- **Hover State:** Shadow offset reduces to 2px; element moves 4px down and right.

### Input Fields

- **Default:** White background, 4px black border, 0px shadow.
- **Focus State:** 4px black border, 4px hard shadow in Hot Pink to denote active status. Text uses `Space Mono`.

### Cards

- White or very light gray background, 4px black border, 8px black hard shadow.
- Header area of the card should be separated by a 4px horizontal black line.

### Chips/Tags

- Small, `Space Mono` text, 2px black border, no shadow. Used for categorization.

### Checkboxes & Radios

- Square-edged (even for radios), 3px black border. When checked, the inner fill should be the Tertiary Hot Pink.

### Navigation Rails

- Sidebars should be separated from the main content by a vertical 4px black border. Active links should use the Secondary Yellow as a background "highlight" box behind the text.
