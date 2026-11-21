import * as migration_20261121_191011_initial from './20261121_191011_initial';

export const migrations = [
  {
    up: migration_20261121_191011_initial.up,
    down: migration_20261121_191011_initial.down,
    name: '20261121_191011_initial'
  },
];
