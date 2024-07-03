import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PagesComponent } from './pages.component';
import { AuthGuard } from './auth/auth.guard'
import { ErrorComponent } from './error/error.component';
import { P404Component } from './error/404.component';
import { UserMenuItemsResolver } from '../@core/sharedResolvers/user-menu-items.resolver';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  resolve: { menuItemResolver: UserMenuItemsResolver },
  children: [
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    },
    {
      path: 'dashboard',
      loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
      canActivate: [AuthGuard],
      data: { preload: true }
    },
    {
      path: 'accounts',
      loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'campaigns',
      loadChildren: () => import('./campaigns/campaigns.module').then(m => m.CampaignsModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'newsletters',
      loadChildren: () => import('./newsletters/newsletters.module').then(m => m.NewslettersModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'contacts',
      loadChildren: () => import('./contacts/contacts.module').then(m => m.ContactsModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'worktasks',
      loadChildren: () => import('./worktasks/worktasks.module').then(m => m.WorkTasksModule), 
      canActivate: [AuthGuard],
      data: { preload: true }  
    },
    {
      path: 'misctasks',
      loadChildren: () => import('./misc-tasks/misc-tasks.module').then(m => m.MiscTasksModule), 
      canActivate: [AuthGuard],  
    },
    {
      path: 'profile',
      loadChildren: () => import('./usermanagement/profile/profile.module').then(m => m.ProfileModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'reports',
      loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'settings',
      loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),  
      canActivate: [AuthGuard],
    },
    {
      path: 'uram',
      loadChildren: () => import('./usermanagement/usermanagement.module').then(m => m.UserManagementModule),   
      canActivate: [AuthGuard]
    },
    {
      path: 'teammanagement',
      loadChildren: () => import('./teamsmanagement/teamsmanagement.module').then(m => m.TeamsmanagementModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'workflowmanagement',
      loadChildren: () => import('./workflowmanagement/workflowmanagement.module').then(m => m.WorkflowmanagementModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'tagmanagement',
      loadChildren: () => import('./entitytags/entitytags.module').then(m => m.EntitytagsModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'entityrecordtypes',
      loadChildren: () => import('./entityrecordtypes/entityrecordtypes.module').then(m => m.EntityRecordTypesModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'products',
      loadChildren: () => import('./products/products.module').then(m => m.ProductsModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'productcategories',
      loadChildren: () => import('./products/productcategories/productcategories.module').then(m => m.ProductcategoriesModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'productskus',
      loadChildren: () => import('./products/productsku/productsku.module').then(m => m.ProductskuModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'dynamicform',
      loadChildren: () => import('./dynamicform/dynamicform.module').then(m => m.DynamicformModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'orders',
      loadChildren: () => import('./orders/orders.module').then(m => m.OrdersModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'opportunities',
      loadChildren: () => import('./opportunities/opportunities.module').then(m => m.OpportunitiesModule),
      canActivate: [AuthGuard]
    },
    {
      path: 'pricebooks',
      loadChildren: () => import('./pricebooks/pricebooks.module').then(m => m.PricebooksModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'cases',
      loadChildren: () => import('./cases/cases.module').then(m => m.CasesModule),
      canActivate: [AuthGuard],
    },
    {
      path: 'appointments',
      loadChildren: () => import('./appointments/appointments.module').then(m => m.AppointmentsModule),
      canActivate: [AuthGuard],
    },
    { path: 'error', component: ErrorComponent },
    { path: '**', component: P404Component, canActivate: [AuthGuard]},
    
  ],
},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
