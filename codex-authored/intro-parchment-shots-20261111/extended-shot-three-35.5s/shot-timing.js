'use strict';

const FEATHER_LAND_AT = 29.50;
const FEATHER_LIGHT_SPREAD = 3;
const THIRD_FADE_AT = FEATHER_LAND_AT + FEATHER_LIGHT_SPREAD;

const ORIGINAL_OPENING_SHOT_TIMING = Object.freeze({
  offset: 34,
  thirdDuration: THIRD_FADE_AT + 1,
  revealAt: 0.20,
  revealEnd: 2.42,
  starsAt: 2.75,
  thirdFogAt: 0.24,
  thirdBeamAt: 12.0,
  thirdHopeAt: 12.55,
  thirdDiveAt: 16.0,
  thirdGroundAt: 17.28,
  groundLightOut: 18.08,
  pushInStart: 18.10,
  pushInEnd: 22.55,
  groundDriftEnd: 31.24,
  revealBodyAt: 19.12,
  revealBodyEnd: 22.27,
  wideAt: 23.05,
  wideFeatherAt: 23.25,
  chestAt: 27.35,
  featherLandAt: FEATHER_LAND_AT,
  thirdFadeAt: THIRD_FADE_AT
});

const FEATHER_DESCENT_EXTENSION = 2;
const OPENING_SHOT_TIMING = Object.freeze({
  ...ORIGINAL_OPENING_SHOT_TIMING,
  featherLandAt: FEATHER_LAND_AT + FEATHER_DESCENT_EXTENSION,
  thirdFadeAt: THIRD_FADE_AT + FEATHER_DESCENT_EXTENSION,
  thirdDuration: ORIGINAL_OPENING_SHOT_TIMING.thirdDuration + FEATHER_DESCENT_EXTENSION
});

function thirdPictureTime(seconds) {
  const { chestAt, featherLandAt } = ORIGINAL_OPENING_SHOT_TIMING;
  if (seconds <= chestAt) return seconds;
  if (seconds >= OPENING_SHOT_TIMING.featherLandAt) return seconds - FEATHER_DESCENT_EXTENSION;
  const approach = featherLandAt - chestAt;
  return chestAt + (seconds - chestAt) * approach / (approach + FEATHER_DESCENT_EXTENSION);
}

if (typeof module !== 'undefined') module.exports = OPENING_SHOT_TIMING;
