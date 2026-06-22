import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const releaseNotes = readFileSync(
  resolve(projectRoot, 'RELEASE-v1.0.0.md'),
  'utf8'
)

describe('release metadata', () => {
  it('points testers to the verified English-only package', () => {
    assert.match(releaseNotes, /\| appId \| 1116573 \|/)
    assert.match(releaseNotes, /`2c2a3ee` \(`codex\/demo-alpha-review`\)/)
    assert.match(
      releaseNotes,
      /1116573-WorkoutSafetyGuard-1\.0\.0-20260622222102\.zab/
    )
    assert.match(
      releaseNotes,
      /BED6659322E8F1FC2F28A55CE78843AAB9472D63265D688C17CC2BA140FCD128/
    )
    assert.doesNotMatch(releaseNotes, /9999998|5ca01a4|169\/169/)
  })
})
