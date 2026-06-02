# Foreground GPS Spike

## Purpose

Verify Geolocation API lifecycle for the foreground assistance page.

## Key Findings

### API (from @zos/sensor)

```js
import { Geolocation } from '@zos/sensor'

const geo = new Geolocation()

// One-shot position
geo.getCurrentPosition()

// Continuous updates
geo.startListening()
geo.stopListening()
```

### Lifecycle Rules

| Context | GPS Allowed? | Reason |
|---|---|---|
| Device App page (foreground) | ✅ Yes | User-initiated, visible UI |
| App Service (background) | ❌ No | High-power sensor restriction |
| Secondary Widget | ❌ No | Not a full page context |

### Usage Pattern in Assist Page

```
page/assist opens → start GPS (non-blocking) → send help.requested immediately
                                              → if GPS succeeds: queue help.location_updated
                                              → onDestroy: stop GPS (always)
```

### Timeout Handling

- GPS may never return a fix indoors
- Help delivery must NOT wait for GPS
- GPS failure is a normal degraded state — show "location unavailable"

### Remaining Uncertainty

- `getCurrentPosition()` vs `startListening()` timeout behavior on real watch
- Typical fix acquisition time outdoors
- Whether GPS continues after page is backgrounded

**Status: DOCUMENTED** — Geolocation API is available at API_LEVEL 3.0. GPS timeout/accuracy behavior requires real device.
