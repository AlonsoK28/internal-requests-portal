import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';
import { Component, enableProdMode } from '@angular/core';
import { approvalsGuard, homeGuard, requestsGuard } from 'shared';

@Component({ template: '' })
class EmptyRoute {}

function loadFederatedComponent(remoteName: string) {
    // Development remote bundles reference ngDevMode directly; initialize it when the host does not.
    if (typeof ngDevMode === 'undefined') enableProdMode();
    return loadRemoteModule(remoteName, './Component').then(m => m.App);
}

export const routes: Routes = [
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
