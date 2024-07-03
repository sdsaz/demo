import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//Components
import { MiscTaskListComponent } from './misc-task-list/misc-task-list.component';
import { MiscTaskDetailComponent } from './misc-task-detail/misc-task-detail.component';

//Services
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MiscTaskListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListWorkTasks }
  },
  {
    path: 'details/:id',
    component: MiscTaskDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewWorkTask }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MiscTasksRoutingModule { }
