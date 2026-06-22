import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')

function read(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function readPxStyle(source, exportName) {
  const block = source.match(
    new RegExp(`export const ${exportName} = \\{([\\s\\S]*?)\\n\\};`)
  )
  assert.ok(block, `${exportName} should be exported`)

  const values = {}
  for (const key of ['x', 'y', 'w', 'h']) {
    const match = block[1].match(new RegExp(`${key}: px\\((\\d+)\\)`))
    assert.ok(match, `${exportName}.${key} should use a numeric px value`)
    values[key] = Number(match[1])
  }
  return values
}

function assertInsideRoundSafeArea(style, name) {
  const centerX = 240
  const centerY = 240
  const radius = 240
  const margin = 8

  for (const y of [style.y, style.y + style.h]) {
    const halfChord = Math.sqrt(radius ** 2 - Math.abs(y - centerY) ** 2)
    const safeLeft = centerX - halfChord + margin
    const safeRight = centerX + halfChord - margin

    assert.ok(style.x >= safeLeft, `${name} button is too far left at y=${y}`)
    assert.ok(
      style.x + style.w <= safeRight,
      `${name} button is too far right at y=${y}`
    )
  }
}

describe('watch UI regressions', () => {
  it('uses English as the default visible locale on every watch surface', () => {
    const files = [
      'page/home/home.js',
      'page/assist/assist.js',
      'page/onboarding/onboarding.js',
      'page/history/history.js',
      'secondary-widget/index.js',
    ]

    for (const file of files) {
      assert.match(read(file), /const i18n = EN;?/, `${file} should default to EN`)
    }
  })

  it('uses English for app metadata, notifications, and phone settings', () => {
    const appConfig = JSON.parse(read('app.json'))
    assert.equal(appConfig.defaultLanguage, 'en-US')
    assert.equal(appConfig.app.description, 'Workout Safety Guard')
    assert.equal(appConfig.i18n['en-US'].appName, 'Workout Safety Guard')

    const alerts = read('src/device/zepp-alerts.js')
    assert.match(alerts, /'Workout Safety Guard'/)
    assert.match(alerts, /'Are you okay\?'/)

    const settings = read('setting/index.js')
    assert.match(settings, /\['Personal information'\]/)
    assert.match(settings, /label: 'Emergency contact 1 name'/)
  })

  it('keeps every round-screen button inside the circular safe area', () => {
    const layouts = [
      ['page/home/home.r.layout.js', [
        'BTN_UNWELL_STYLE',
        'BTN_PRACTICE_STYLE',
        'BTN_HISTORY_STYLE',
      ]],
      ['page/assist/assist.r.layout.js', [
        'CANCEL_BTN_STYLE',
        'HELP_BTN_STYLE',
        'PHONE_BTN_STYLE',
      ]],
      ['page/onboarding/onboarding.r.layout.js', [
        'BTN_PRIMARY_STYLE',
        'BTN_CANCEL_STYLE',
      ]],
      ['page/history/history.r.layout.js', [
        'MARK_SAFE_BTN_STYLE',
        'CLEAR_BTN_STYLE',
        'BACK_BTN_STYLE',
        'EMPTY_BACK_BTN_STYLE',
      ]],
    ]

    for (const [file, exportNames] of layouts) {
      const source = read(file)
      for (const exportName of exportNames) {
        assertInsideRoundSafeArea(
          readPxStyle(source, exportName),
          `${file}:${exportName}`
        )
      }
    }

    const home = read('page/home/home.r.layout.js')
    const practice = readPxStyle(home, 'BTN_PRACTICE_STYLE')
    const history = readPxStyle(home, 'BTN_HISTORY_STYLE')

    assert.ok(
      practice.x + practice.w < history.x,
      'round home secondary buttons should not overlap'
    )
  })
})
