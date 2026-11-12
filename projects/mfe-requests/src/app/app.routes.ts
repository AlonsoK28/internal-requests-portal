import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { requestsGuard } from 'shared';
import { App } from './app';

@Component({ template: '<p>Inicia sesión en el portal para consultar tus solicitudes.</p>' })
class PublicLanding {}

export const routes: Routes = [
  { path: 'requests', component: App, canMatch: [requestsGuard] },
  { path: '', pathMatch: 'full', component: PublicLanding },
];
