import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';
import { Component, enableProdMode } from '@angular/core';
import { approvalsGuard, homeGuard, requestsGuard } from 'shared';

@Component({ template: '' })
class EmptyRoute {}

function loadFederatedComponent(remoteName: string, componentName = 'App') {
    // Development remote bundles reference ngDevMode directly; initialize it when the host does not.
    if (typeof ngDevMode === 'undefined') enableProdMode();
    return loadRemoteModule(remoteName, './Component').then(m => m[componentName]);
}

export const routes: Routes = [
    {
        path: 'requests/:id',
        canMatch: [requestsGuard],
        loadComponent: () => loadFederatedComponent('mfe-requests', 'RequestDetailComponent')
    },
    {
        path: 'requests',
        canMatch: [requestsGuard],
        loadComponent: () => loadFederatedComponent('mfe-requests')
    },
    {
        path: 'approvals',
        canMatch: [approvalsGuard],
        loadComponent: () => loadFederatedComponent('mfe-approvals')
    },
    { path: 'login', component: EmptyRoute },
    { path: '', pathMatch: 'full', component: EmptyRoute, canMatch: [homeGuard] }
];
