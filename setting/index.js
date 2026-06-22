/**
 * setting/index.js — Zepp App Settings page for Workout Safety Guard.
 *
 * Phone-side settings. Contact data stays on phone; only a sanitized
 * contact count (0-3) is synchronised to watch storage.
 *
 * Reference: AppSettingsPage({ build(props) }) from @zeppos/zml
 */

AppSettingsPage({
  build(props) {
    const ss = props.settingsStorage

    // -----------------------------------------------------------------------
    // Helper: read a string value with a default
    // -----------------------------------------------------------------------
    function getVal(key, fallback) {
      const raw = ss.getItem(key)
      return raw != null ? raw : fallback
    }

    // -----------------------------------------------------------------------
    // Helper: read a number value with a default
    // -----------------------------------------------------------------------
    function getNum(key, fallback) {
      const raw = ss.getItem(key)
      if (raw == null) return fallback
      const n = Number(raw)
      return Number.isFinite(n) ? n : fallback
    }

    // -----------------------------------------------------------------------
    // Helper: read a boolean value with a default
    // -----------------------------------------------------------------------
    function getBool(key, fallback) {
      const raw = ss.getItem(key)
      return raw != null ? raw === true || raw === 'true' : fallback
    }

    // -----------------------------------------------------------------------
    // Build sections
    // -----------------------------------------------------------------------
    return Section({}, [
      // =============================================================
      // Personalisation
      // =============================================================
      Text({}, ['Personal information']),

      Input({
        label: 'Nickname',
        placeholder: 'Enter nickname',
        value: getVal('nickname', ''),
        onChange: (v) => ss.setItem('nickname', v),
      }),

      // Age bracket: select from predefined ranges
      Text({ style: { marginTop: '16px' } }, ['Age range']),
      Select({
        label: 'Select age range',
        value: getVal('age_bracket', '25-34'),
        options: [
          { label: '18-24', value: '18-24' },
          { label: '25-34', value: '25-34' },
          { label: '35-44', value: '35-44' },
          { label: '45-54', value: '45-54' },
          { label: '55-64', value: '55-64' },
          { label: '65+', value: '65+' },
        ],
        onChange: (v) => ss.setItem('age_bracket', v),
      }),

      // =============================================================
      // Threshold Configuration
      // =============================================================
      Text({ style: { marginTop: '24px' } }, ['Thresholds']),

      Input({
        label: 'Intensity reminder (bpm)',
        placeholder: 'Default 170',
        value: String(getNum('intensity_reminder_bpm', 170)),
        onChange: (v) => ss.setItem('intensity_reminder_bpm', Number(v) || 170),
      }),

      Text(
        { style: { marginTop: '8px', color: '#ff9800', fontSize: '12px' } },
        ['Test configuration - high-risk candidate threshold (bpm)'],
      ),
      Input({
        label: 'High-risk candidate threshold',
        placeholder: 'Default 190',
        value: String(getNum('high_risk_candidate_bpm', 190)),
        onChange: (v) => ss.setItem('high_risk_candidate_bpm', Number(v) || 190),
      }),

      // =============================================================
      // Emergency Contacts (max 3, phone-side only)
      // =============================================================
      Text({ style: { marginTop: '24px' } }, ['Emergency contacts (up to 3)']),

      // Contact 1
      Input({
        label: 'Emergency contact 1 name',
        placeholder: 'Name',
        value: getVal('contact_1_name', ''),
        onChange: (v) => {
          ss.setItem('contact_1_name', v)
          _updateContactCount(ss)
        },
      }),
      Input({
        label: 'Emergency contact 1 phone',
        placeholder: 'Phone number',
        value: getVal('contact_1_phone', ''),
        onChange: (v) => {
          ss.setItem('contact_1_phone', v)
          _updateContactCount(ss)
        },
      }),

      // Contact 2
      Input({
        label: 'Emergency contact 2 name',
        placeholder: 'Name',
        value: getVal('contact_2_name', ''),
        onChange: (v) => {
          ss.setItem('contact_2_name', v)
          _updateContactCount(ss)
        },
      }),
      Input({
        label: 'Emergency contact 2 phone',
        placeholder: 'Phone number',
        value: getVal('contact_2_phone', ''),
        onChange: (v) => {
          ss.setItem('contact_2_phone', v)
          _updateContactCount(ss)
        },
      }),

      // Contact 3
      Input({
        label: 'Emergency contact 3 name',
        placeholder: 'Name',
        value: getVal('contact_3_name', ''),
        onChange: (v) => {
          ss.setItem('contact_3_name', v)
          _updateContactCount(ss)
        },
      }),
      Input({
        label: 'Emergency contact 3 phone',
        placeholder: 'Phone number',
        value: getVal('contact_3_phone', ''),
        onChange: (v) => {
          ss.setItem('contact_3_phone', v)
          _updateContactCount(ss)
        },
      }),

      // =============================================================
      // Feature Toggles
      // =============================================================
      Text({ style: { marginTop: '24px' } }, ['Features']),

      Switch({
        label: 'Offline local alert',
        checked: getBool('offline_local_alert_enabled', true),
        onChange: (v) => ss.setItem('offline_local_alert_enabled', v),
      }),

      Text(
        { style: { marginTop: '8px', color: '#ff9800', fontSize: '12px' } },
        ['Locked on in this version - demo dispatcher'],
      ),
      Switch({
        label: 'Demo dispatcher',
        checked: true,
        disabled: true,
        onChange: () => {},
      }),
      // Persist demo dispatcher as always enabled
      ss.setItem('demo_dispatcher_enabled', true),

      Switch({
        label: 'Training complete',
        checked: getBool('training_complete', false),
        onChange: (v) => ss.setItem('training_complete', v),
      }),
    ])
  },
})

// ---------------------------------------------------------------------------
// Helper: sanitised contact count synchronised to watch storage
// ---------------------------------------------------------------------------

/**
 * Count how many contacts have both a name and phone, derivate a 0-3 count,
 * and write it to settingsStorage so the side service can sync it to the watch.
 *
 * Contact details NEVER leave the phone. Only the count crosses BLE.
 */
function _updateContactCount(ss) {
  let count = 0
  for (let i = 1; i <= 3; i++) {
    const name = ss.getItem('contact_' + i + '_name')
    const phone = ss.getItem('contact_' + i + '_phone')
    if (name && name.length > 0 && phone && phone.length > 0) {
      count++
    }
  }
  ss.setItem('contact_count', String(Math.min(count, 3)))
}
