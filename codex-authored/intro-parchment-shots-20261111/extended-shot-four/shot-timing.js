'use strict';

const SHOT_FOUR_TIMING = (() => {
  const start = 220;
  const brace = 1000;
  const kneel = 545;
  const rise = 825;
  const vista = 630;
  return Object.freeze({
    braceAt: start / 100,
    braceDuration: brace / 100,
    braceDissolveDuration: 1.5,
    kneelAt: (start + brace) / 100,
    riseAt: (start + brace + kneel) / 100,
    riseDissolveDuration: 0.5,
    vistaAt: (start + brace + kneel + rise) / 100,
    duration: (start + brace + kneel + rise + vista) / 100,
  });
})();

if (typeof module !== 'undefined') module.exports = SHOT_FOUR_TIMING;
