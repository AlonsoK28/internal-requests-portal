import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'request',
        loadComponent: () => loadRemoteModule('mfe-requests', './Component').then( m => m.App)
    },
    {
        path: 'approvals',
        loadComponent: () => loadRemoteModule('mfe-approvals', './Component').then( m => m.App)
    },
];
