import type { DriverInterface } from '../../domain/constants'

export interface WizardOption {
  label: string
  detail?: string
  /** id of the next step, or… */
  next?: string
  /** …a final answer. */
  result?: DriverInterface
}

export interface WizardStep {
  id: string
  question: string
  help?: string
  /** show the three driver-body illustrations on this step */
  showDriverPictures?: boolean
  options: WizardOption[]
}

export const WIZARD_START = 'cog-count'

/**
 * Guided identification of the freehub driver body. The branch logic encodes
 * the market reality: which cassettes shipped on which drivers.
 */
export const DRIVER_WIZARD: Record<string, WizardStep> = {
  'cog-count': {
    id: 'cog-count',
    question: 'How many cogs (sprockets) does your rear cassette have?',
    help: 'Count them from the side — or count the clicks on your shifter and add one.',
    options: [
      { label: '12', next: 'smallest-12' },
      { label: '11', next: 'smallest-11' },
      { label: '10 or fewer', result: 'hg-splined', detail: 'Everything 10-speed and below uses the standard HG splined driver.' },
      { label: 'Not sure — let me look at the driver itself', next: 'visual' },
    ],
  },
  'smallest-12': {
    id: 'smallest-12',
    question: 'How many teeth are on the smallest cog?',
    help: 'A 10-tooth cog is tiny — visibly smaller than the lockring area of an 11t cassette. Count if unsure.',
    options: [
      { label: '10 teeth', next: 'brand-12' },
      {
        label: '11 teeth',
        result: 'hg-splined',
        detail: 'A 12-speed cassette starting at 11t (like SRAM NX Eagle 11-50 or Deore CS-M5100 style) fits the standard HG splined driver.',
      },
      { label: 'Not sure', next: 'visual' },
    ],
  },
  'brand-12': {
    id: 'brand-12',
    question: 'What brand is the cassette?',
    options: [
      { label: 'SRAM (Eagle 10-50 or 10-52)', result: 'xd', detail: 'SRAM 10t-smallest Eagle cassettes thread onto an XD driver.' },
      { label: 'Shimano (10-51 or 10-45)', result: 'micro-spline', detail: 'Shimano 12-speed MTB cassettes need a Micro Spline driver.' },
      { label: 'Something else / not sure', next: 'visual' },
    ],
  },
  'smallest-11': {
    id: 'smallest-11',
    question: 'How many teeth are on the smallest cog?',
    options: [
      { label: '10 teeth', result: 'xd', detail: 'An 11-speed cassette starting at 10t (SRAM XG-1150/1180 10-42) means an XD driver.' },
      { label: '11 teeth', result: 'hg-splined', detail: '11-speed MTB cassettes starting at 11t fit the standard HG splined driver.' },
      { label: 'Not sure', next: 'visual' },
    ],
  },
  visual: {
    id: 'visual',
    question: 'Pull the wheel (and cassette if you can) and look at the driver body. Which does it look like?',
    help: 'No tools for the visual check on most bikes — the shape differences are obvious once you see them side by side.',
    showDriverPictures: true,
    options: [
      {
        label: 'Wide straight splines, one narrower than the rest',
        result: 'hg-splined',
        detail: 'That is the classic Shimano HG splined driver — around since the 90s.',
      },
      {
        label: 'Many small shallow splines (23 of them)',
        result: 'micro-spline',
        detail: 'That is Shimano Micro Spline.',
      },
      {
        label: 'Mostly smooth stepped cylinder with threads — the cassette screws on as one piece',
        result: 'xd',
        detail: 'That is a SRAM XD (or road XDR) driver.',
      },
    ],
  },
}

/** The generic hub part representing each identified driver. */
export const DRIVER_TO_HUB_PART: Record<DriverInterface, string> = {
  'hg-splined': 'generic-hub-hg',
  'micro-spline': 'generic-hub-ms',
  xd: 'generic-hub-xd',
  xdr: 'generic-hub-xd',
}
