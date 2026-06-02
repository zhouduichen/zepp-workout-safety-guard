# Secondary Widget Spike

## Purpose

Verify secondary-widget (negative-one-screen shortcut) declaration and runtime behavior.

## Key Findings

### app.json Declaration

```json
{
  "module": {
    "secondary-widget": {
      "widgets": ["secondary-widget/index"]
    }
  }
}
```

### TypeScript Signature

```typescript
SecondaryWidget({
  state?: object,
  onInit?: (params?: string) => void,
  build?: (params?: string) => void,
  onResume?: () => void,
  onPause?: () => void,
  onDestroy?: () => void,
})
```

### Key Points

- Widget is a full-screen negative-one-screen app (single widget at a time)
- Has standard lifecycle: onInit → build → onResume/onPause → onDestroy
- Can use `createWidget` from `@zos/ui` for text and basic shapes
- Can use `push()` from `@zos/router` to navigate to app pages
- Widget cannot perform GPS, BLE dispatch, or risk evaluation itself

### Remaining Uncertainty

- Widget interaction reliability (tap detection) on real device
- Widget refresh behavior when app state changes
- Whether `build()` is called on every focus or only once

**Status: DOCUMENTED** — Type declarations confirmed, real device needed for UI interaction verification.
