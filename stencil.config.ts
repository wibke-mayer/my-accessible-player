import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'accessible-player',
  outputTargets: [
    { type: 'dist' },
    { type: 'www' }
  ]
};
