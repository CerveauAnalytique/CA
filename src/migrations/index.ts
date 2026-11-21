import * as migration_20261121_220618_initial from './20261121_220618_initial';

export const migrations = [
  {
    up: migration_20261121_220618_initial.up,
    down: migration_20261121_220618_initial.down,
    name: '20261121_220618_initial'
  },
];
