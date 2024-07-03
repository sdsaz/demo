/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CommonHelper } from './@core/common-helper';
import { AuthenticationService } from './pages/auth/auth.service';
import { ToastrModule } from 'ngx-toastr';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'; 

import {
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbWindowModule,
} from '@nebular/theme';
import { ConfirmationDialogService } from './@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from './@core/sharedServices/common.service';
import { ActivityService } from './@core/sharedComponents/common-activity-section/activity.service';
import { DatasourceService } from './@core/sharedServices/datasource.service';
import { AppConfigService } from './@core/sharedServices/app-config.service';
 
import { CustomTranslateHttpLoaderFactory } from './@theme/shared/shared.module'; 
import { NoRightClickModule } from './@core/sharedDirective/no-right-click/no-right-click.module';
import { PreventScreenshotModule } from './@core/sharedDirective/prevent-screenshot/prevent-screenshot.module';
import { PreventPrintWithInspectElementModule } from './@core/sharedDirective/prevent-print-with-inspect-element/prevent-print-with-inspect-element.module';
import { DocumentService } from './@core/sharedComponents/documents/document.service';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { GoogleAnalyticsService, NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

export function initializeAppFactory(appConfigService: AppConfigService) {
  return (): Promise<any> => {
    return appConfigService.load();
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: false,
      closeButton: true,
      enableHtml: true
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: CustomTranslateHttpLoaderFactory,
        deps: [HttpClient, Injector]
      },
      isolate : false
    }),
    CoreModule.forRoot(), 
    ThemeModule.forRoot(),
    NoRightClickModule,
    PreventPrintWithInspectElementModule,
    PreventScreenshotModule,
    NgxGoogleAnalyticsModule.forRoot('G-2RK6BRT89J'),
    NgxGoogleAnalyticsRouterModule
  ],
  providers:[
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [AppConfigService],
      multi: true
    },
    CommonHelper,
    AuthenticationService,
    ConfirmationDialogService,
    CommonService,
    ActivityService,
    DatasourceService,
    DocumentService,
    NgbPopover,
    GoogleAnalyticsService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
