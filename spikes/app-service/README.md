# App Service Spike

## Purpose

Verify the App Service lifecycle, sensor availability, and constraints documented for Zepp OS v3.

## Key Findings

### Constructor Pattern

```js
import { AppService } from '@zeppos/zml/app-service'

AppService({
  onInit(params) { /* called once on service start */ },
  onRun(params) { /* called on each alarm/notification wake */ },
  onDestroy() { /* called on service stop */ },
})
```

### App.json Declaration

```json
{
  "module": {
    "app-service": {
      "services": ["app-service/guard-service"]
    }
  }
}
```

### Continuous Mode

- Requires `device:os.bg_service` permission in manifest
- Requires explicit user permission (via `queryPermission` / `requestPermission`)
- Service continues after Device App pages are closed
- On alarm or notification action: single-execution (600 ms limit)
- On continuous mode: can keep sensors subscribed

### Sensor Access (available in App Service)

| Sensor | Method | Callback |
|---|---|---|
| HeartRate | `getCurrent()` → number | `onCurrentChange(cb)` |
| Step | `getCurrent()` → number | `onChange(cb)` |
| Distance | `getCurrent()` → number | `onChange(cb)` |
| Wear | `getStatus()` → 0-3 | `onChange(cb)` |
| Time | `getTime()` → ms | `onPerMinute(cb)` |

### Restrictions

- ❌ No `setTimeout` / `setInterval`
- ❌ No high-power sensors (Accelerometer, Gyroscope, GPS)
- ❌ No UI widgets or page APIs
- ⚠️ 600 ms execution limit per single-execution wake
- ⚠️ `reload` starts at API_LEVEL 4.0 — not available at 3.0

### Remaining Uncertainty

- Actual callback cadence on real hardware (HeartRate typically 1-5s intervals)
- Continuous mode battery impact over 60+ minutes
- Whether service truly survives all reboot scenarios

**Status: DOCUMENTED** — Unable to run Zeus simulator in this environment.
