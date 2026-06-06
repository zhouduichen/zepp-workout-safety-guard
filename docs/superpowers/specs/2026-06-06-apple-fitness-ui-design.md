# 2026-06-06 Apple Fitness Style UI Redesign

## Design Direction

Pure Apple Fitness / watchOS aesthetic. The app's core function is **safety and emergency help** — beauty serves function, not the other way around.

### Color Palette

| Token | Hex | OKLCH | Role |
|-------|-----|-------|------|
| Background | `#000000` | `l:0 c:0` | True black screen base |
| Surface | `#1c1c1e` | `l:0.13 c:0.002` | Card backgrounds |
| Surface elevated | `#2c2c2e` | `l:0.18 c:0.002` | Pressed/highlighted surface |
| Stroke | `#38383a` | `l:0.24 c:0.002` | Thin dividers |
| Text primary | `#ffffff` | `l:1 c:0` | Titles, key numbers |
| Text muted | `#8e8e93` | `l:0.6 c:0.005` | Labels, secondary info |
| Green (Move/Active) | `#30d158` | `l:0.75 c:0.18` | Guard enabled, contacts OK |
| Orange (Alert) | `#ff9f0a` | `l:0.73 c:0.16` | Countdown, warnings |
| Red (Danger/SOS) | `#ff453a` | `l:0.65 c:0.22` | Help button, critical state |
| Blue (Info/Link) | `#0a84ff` | `l:0.6 c:0.2` | Phone, system status |
| Pink (Stand/Contact) | `#ff375f` | `l:0.62 c:0.23` | Contact indicator accent |

### Typography

Zepp OS uses system fonts with limited control. We approximate San Francisco feel through:
- Large numeric values: `text_size px(54)` Home, `px(86)` Countdown
- Clear weight contrast: title vs body vs label
- Consistent left-alignment (not center, except ring content)
- Muted labels in `#8e8e93`, 4-6px smaller than their values

### Layout Principles

- **Round screen (480×480)**: Content within 58px side margins, ring centered, everything pulled inward
- **Square screen (390×450)**: Slightly tighter margins (30px), but same hierarchy
- **No text overlapping graphics**: Rings have explicit bounding boxes; text is placed outside or centered within
- **Cards**: 2×2 grid for stats, rounded 18-20px, subtle surface color (not bordered)

### Motion (future pass)

- Countdown ring: smooth `end_angle` updates (already works)
- Number transitions: direct text replacement (no animation on Zepp)
- Button press: `press_color` darker than `normal_color`

## Page-by-Page Spec

### Home (`home.js` + layouts)

**Layout (top to bottom):**
1. Status bar row: title "Fitness Guard" left + status pill (ACTIVE/SETUP) right
2. Guard Score ring (centered, large): track `#1c1c1e`, progress green/orange/red based on score
3. Score number centered inside ring, "Guard Score" label below
4. 2×2 stat cards: Contacts | Queue | Phone | Service
5. "Readiness" section label + 6 trend bars
6. Primary CTA: "I Feel Unwell" red pill button (full width minus margins)
7. Secondary buttons: Practice | History (smaller, side by side)

**No text overlap rule**: Ring Y range is ~70-266. Score text inside ring at Y~124. Label at Y~180. Stat cards start at Y~266+. All clear.

### Assist Countdown (`assist.js` + layouts)

**Layout (top to bottom):**
1. Title "Workout Help" left + connection pill right
2. Countdown ring (centered): track, progress orange → red at ≤10s
3. Countdown number centered inside ring
4. Countdown label below ring ("Xs to auto contact")
5. Two action buttons side by side: "I'm Safe" (gray surface) | "Contact Now" (red)
6. "Open Phone" text button below (if phone capable)

**No text overlap rule**: Ring starts at Y~78. Countdown text inside at Y~154. Label at Y~250. Buttons start at Y~370. All separated.

### History (`history.js` + layouts)

**Layout (top to bottom):**
1. Title "History" left + event count right
2. 3 summary cards in a row: Total | Resolved | Open
3. "Recent Events" section label
4. Event rows: colored dot + trigger name + status label + time (max 3 visible)
5. "Mark Safe" button (green outline, only if unresolved > 0)
6. Clear | Back buttons

**Empty state**: Summary cards show 0, centered light checkmark, "No events yet" title, subtext "Practice and help events will appear here.", Back button only.

**No event strip**: Removed the colored left-stripe on event rows (side-stripe ban). Use colored dot instead.

### Onboarding (`onboarding.js` + layouts)

Keep existing step flow. Style pass only:
- Replace progress dots with pill-shaped step indicator
- Card: surface color, larger radius (28px round, 26px square)
- Title/body inside card
- Primary button: green pill below card
- Practice countdown: same ring style as assist page

### Secondary Widget (`secondary-widget/index.js`)

Compact 200×180 widget. Keep existing structure, refresh colors to match new palette.
- Background: true black
- Inner card: surface
- Ring: smaller (58×58)
- Help button: red pill

## Implementation Order

1. **Common layouts**: Update `COLORS` and `SCREEN_STYLE`
2. **Home**: Primary page, most visible
3. **Assist**: Core safety function
4. **History**: Event review
5. **Onboarding**: First-run flow
6. **Secondary widget**: Quick entry
