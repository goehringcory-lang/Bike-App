import type { Rule } from '../types'
import { cassetteDriverRule } from './cassette-driver'
import { shifterRdActuationRule } from './shifter-rd-actuation'
import { speedsRules } from './speeds-match'
import { rdMaxCogRule } from './rd-max-cog'
import { rdCapacityRule } from './rd-capacity'
import { chainSpeedRule } from './chain-speed'
import { chainStandardRule } from './chain-standard'

// Chainline (Boost vs non-Boost) is deliberately not a rule in v1: judging it
// requires frame data we don't model yet. Crank chainlineMm is already in the
// schema so the rule can be added without a data migration.
export const RULES: Rule[] = [
  cassetteDriverRule,
  shifterRdActuationRule,
  ...speedsRules,
  rdMaxCogRule,
  rdCapacityRule,
  chainSpeedRule,
  chainStandardRule,
]
