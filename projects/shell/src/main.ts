import { initFederation } from '@angular-architects/native-federation';

// Federated development chunks can access this global before Angular initializes it.
const angularGlobal = globalThis as typeof globalThis & { ngDevMode?: boolean };
angularGlobal.ngDevMode ??= true;

initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
  sse: true,
})
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
