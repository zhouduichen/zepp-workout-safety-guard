import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { developmentConfig } from '../src/domain/default-config.js'
import { GuardStatus, InputType, EffectType } from '../src/domain/constants.js'

describe('default-config', () => {
  it('has autoContactDispatch: false', () => {
    assert.equal(developmentConfig.autoContactDispatch, false)
  })

  it('has dispatcherMode: demo', () => {
    assert.equal(developmentConfig.dispatcherMode, 'demo')
  })

  it('has expected configuration properties', () => {
    assert.equal(typeof developmentConfig.activityEvidenceWindowSec, 'number')
    assert.equal(typeof developmentConfig.highRiskConfirmSec, 'number')
    assert.equal(typeof developmentConfig.mediumRiskConfirmSec, 'number')
    assert.equal(typeof developmentConfig.ordinaryStopPromptSec, 'number')
    assert.equal(typeof developmentConfig.ordinaryStopHelpSec, 'number')
  })
})
