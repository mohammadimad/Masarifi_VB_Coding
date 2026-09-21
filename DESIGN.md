---
name: Masarifi
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e4'
  on-secondary-container: '#626566'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered for a personal finance platform that prioritizes clarity, financial confidence, and effortless tracking. The brand personality is **trustworthy, transparent, and modern**, aiming to transform complex financial data into actionable insights.

The visual style follows a **Modern Corporate** aesthetic with a lean toward **Minimalism**. It utilizes high-quality typography, generous whitespace to reduce cognitive load, and a refined use of tonal layers. Since the application is designed for the Arabic language (RTL), the visual balance is mirrored to ensure a natural reading flow from right to left, emphasizing a premium and organized user experience.

## Colors
The palette is rooted in a deep Indigo primary color, chosen to evoke stability and professionalism. 

- **Primary (Indigo):** Used for main actions, active states, and brand identifiers.
- **Secondary (Light Gray):** The foundational background color to keep the interface feeling airy and clean.
- **Success (Green):** Specifically reserved for income, positive trends, and completion states.
- **Danger (Red):** Used for expenses, over-budget alerts, and destructive actions.
- **Neutrals:** A range of grays from Slate-900 (Text) to Gray-500 (Sub-labels) ensures high legibility and hierarchical depth.

## Typography
The system uses **Inter** for its exceptional legibility in data-heavy environments and its clean, neutral character. 

For the Arabic implementation, the system relies on system fonts or high-quality sans-serif equivalents that match Inter’s x-height and geometric balance. Headlines are bold and assertive to provide clear section signposting. Body text maintains a comfortable line-height (1.6) to ensure financial statements and transaction lists are easy to scan. All typography is right-aligned by default to support the RTL layout.

## Layout & Spacing
This design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Desktop:** 24px gutters with 48px page margins.
- **Mobile:** 16px gutters with 16px page margins.

The spacing scale is based on a 4px baseline, ensuring all elements align to a consistent rhythm. Layouts should favor "Surface-first" grouping, where related financial data is housed within cards rather than floating freely. In RTL mode, the sidebar or navigation drawer is anchored to the right, and the content flows toward the left.

## Elevation & Depth
Depth is created using a combination of **Tonal Layers** and **Ambient Shadows**.

1.  **Level 0 (Background):** Secondary Light Gray (#F9FAFB).
2.  **Level 1 (Cards/Content):** Pure White (#FFFFFF) with a `shadow-sm` (0 1px 2px 0 rgba(0, 0, 0, 0.05)).
3.  **Level 2 (Modals/Dropdowns):** Pure White with a `shadow-lg` to create a distinct separation from the base content.

Borders are used sparingly, primarily as subtle 1px dividers in `#E5E7EB` to separate list items or table rows without adding visual noise.

## Shapes
The shape language is friendly yet structured. The primary container unit is the **2xl Card**, which provides a soft, approachable feel to the financial data. 

- **Large Containers (Cards, Modals):** 1.5rem (24px) - `rounded-2xl`.
- **Standard Components (Buttons, Inputs):** 0.5rem (8px) - `rounded-md`.
- **Small Elements (Chips, Tags):** Full pill-shape for easy identification.

## Components
### Buttons
- **Primary:** Solid Indigo background, White text. High contrast, bold weight.
- **Secondary:** Light Gray background with Dark Gray text for less prominent actions.
- **State:** On hover, primary buttons darken by 10%. Active states should show a subtle inner shadow.

### Cards
- White background, `rounded-2xl` corners, and `shadow-sm`. 
- Used for transaction summaries, budget progress, and account balances.

### Input Fields
- White background with a 1px border (#D1D5DB).
- **Focus State:** 2px solid Indigo (#4F46E5) border with a soft Indigo outer glow.
- Labels are positioned above the input, right-aligned.

### Chips & Badges
- Used for transaction categories. 
- Income uses Success Green with 10% opacity background and solid green text. 
- Expenses use Danger Red with 10% opacity background and solid red text.

### Progress Bars
- Used for budgets. The track is Light Gray, and the fill is Primary Indigo. 
- If a budget is exceeded, the fill color dynamically switches to Danger Red.