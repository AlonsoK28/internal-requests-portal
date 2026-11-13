import { initFederation } from '@angular-architects/native-federation';

initFederation(
  {},
  {
    hostRemoteEntry: { url: './remoteEntry.json' },
    sse: true,
  },
)
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
