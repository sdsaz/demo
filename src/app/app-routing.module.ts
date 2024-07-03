import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

//SERVICES
import { CustomPreloadingStrategyService } from './@core/sharedServices/custom-preloading-strategy.service';
import { UserMenuItemsResolver } from './@core/sharedResolvers/user-menu-items.resolver';
import { UsersService } from './pages/usermanagement/users/users.service';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
    data: { preload: true }
  },
];

const config: ExtraOptions = {
  useHash: false,
  onSameUrlNavigation: 'reload',
  preloadingStrategy: CustomPreloadingStrategyService
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
  providers: [CustomPreloadingStrategyService, UsersService]
})
export class AppRoutingModule {
}
