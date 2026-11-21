import * as migration_20261121_225135_initial from './20261121_225135_initial';

export const migrations = [
  {
    up: migration_20261121_225135_initial.up,
    down: migration_20261121_225135_initial.down,
    name: '20261121_225135_initial'
  },
];
