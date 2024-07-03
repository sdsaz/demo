import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';

const routes: Routes = [
  {
      path: 'teams',
      loadChildren: () => import('./teams/teams.module').then(m => m.TeamsModule),     
      data: { permission: enumPermissions.ListTeams }
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
],
exports: [],
declarations: []
})
export class TeamsmanagementModule { }
