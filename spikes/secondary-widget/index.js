/**
 * secondary-widget.js — Platform spike: Secondary Widget
 *
 * Verifies: SecondaryWidget constructor, lifecycle, UI drawing,
 * and route navigation.
 *
 * Reference: Zepp OS Secondary Widget docs
 *
 * Status: DOCUMENTED — type declarations confirmed from @zeppos/device-types
 */

// In a real secondary-widget/index.js:
// import { createWidget, widget, text_style } from '@zos/ui'
// import { push } from '@zos/router'

/*
SecondaryWidget({
  state: {
    guardEnabled: false,
    phoneOnline: false,
  },

  onInit(params) {
    // Load state from storage
  },

  build() {
    // Create UI elements with createWidget
    // Show: guard status, connection status, "I feel unwell" button
  },

  onResume() {
    // Refresh state when widget gains focus
  },

  onPause() {
    // No-op
  },

  onDestroy() {
    // Cleanup
  },
})
*/

// SecondaryWidget lifecycle:
// onInit → build → (onResume ↔ onPause) → onDestroy
//
// Navigation:
// import { push } from '@zos/router'
// push({ url: 'page/assist/assist' })
