import * as migration_20261122_014346_initial from './20261122_014346_initial';
import * as migration_20261123_164018_api_hub from './20261123_164018_api_hub';
import * as migration_20261123_224635_phylena_chat from './20261123_224635_phylena_chat';

export const migrations = [
  {
    up: migration_20261122_014346_initial.up,
    down: migration_20261122_014346_initial.down,
    name: '20261122_014346_initial',
  },
  {
    up: migration_20261123_164018_api_hub.up,
    down: migration_20261123_164018_api_hub.down,
    name: '20261123_164018_api_hub',
  },
  {
    up: migration_20261123_224635_phylena_chat.up,
    down: migration_20261123_224635_phylena_chat.down,
    name: '20261123_224635_phylena_chat',
  },
];
