import { NgModule } from '@angular/core';
import { NbMenuModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { AuthModule } from './auth/auth.module';
import { PagesRoutingModule } from './pages-routing.module';
import { DashboardService } from '../@core/sharedServices/dashboard.service';
import { UsersService } from './usermanagement/users/users.service';
import { ErrorComponent } from './error/error.component';
import { TranslateModule } from '@ngx-translate/core';
import { OneColumnLayoutModule } from '../@theme/layouts/one-column/one-column-layout/one-column-layout.module';
import { P404Component } from './error/404.component';

@NgModule({
    declarations: [
        PagesComponent,
        ErrorComponent,
        P404Component
    ],
    providers: [
        DashboardService,
        UsersService
    ],
    imports: [
        PagesRoutingModule,
        AuthModule,
        ThemeModule,
        NbMenuModule,
        TranslateModule,
        OneColumnLayoutModule
    ]
})
export class PagesModule {
}
