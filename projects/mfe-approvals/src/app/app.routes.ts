import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { approvalsGuard } from 'shared';
import { App } from './app';

@Component({ template: '<p>Inicia sesión en el portal para consultar las aprobaciones.</p>' })
class PublicLanding {}

export const routes: Routes = [
  { path: 'approvals', component: App, canMatch: [approvalsGuard] },
  { path: '', pathMatch: 'full', component: PublicLanding },
];
