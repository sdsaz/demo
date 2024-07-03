import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GeneralSettingComponent } from './general-setting/general-setting.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MultiSelectModule } from 'primeng/multiselect';
 
import { SettingsService } from './settings.service'; 
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';
import { ActivityService } from '../../@core/sharedComponents/common-activity-section/activity.service';
import { DocumentService } from '../../@core/sharedComponents/documents/document.service';
import { CommonService } from '../../@core/sharedServices/common.service';
import { CommunicationService } from '../../@core/sharedServices/communication.service';
import { DashboardService } from '../../@core/sharedServices/dashboard.service';
import { EntityrequestService } from '../../@core/sharedServices/entityrequest.service';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { ProductsService } from '../products/products.service';
import { ReportsService } from '../reports/reports.service';
import { UsersService } from '../usermanagement/users/users.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { WorkTasksService } from '../worktasks/worktasks.service';
import { DropdownModule } from 'primeng/dropdown';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { OrdersService } from '../orders/orders.service';
import { WorkflowautomationService } from '../workflowautomation/workflowautomation.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DatasourceService } from '../../@core/sharedServices/datasource.service';
import { AuthenticationService } from '../auth/auth.service';
import { CasesService } from '../cases/cases.service';
import { EntityNotificationService } from '../../@core/sharedComponents/entity-notification/services/entity-notification.service';

const routes: Routes = [
  {
      path: '',
      component: GeneralSettingComponent,
      data: { permission: enumPermissions.GeneralSettings }

  },
];


@NgModule({
    declarations: [
        GeneralSettingComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        TranslateModule,
        NgbTooltipModule,
        MultiSelectModule,
        DropdownModule,
        RadioButtonModule,
        ConfiguredEntityNamePipeModule
    ],
    providers: [
        SettingsService,
        AccountsService,
        ActivityService,
        CampaignsService,
        CommonService,
        CommunicationService,
        ContactsService,
        DashboardService,
        DatasourceService,
        DocumentService,
        EntityrequestService,
        WorkflowmanagementService,
        OrdersService,
        ProductsService,
        ReportsService,
        UsersService,
        WorkTasksService,
        WorkflowautomationService,
        AuthenticationService,
        CasesService,
        EntityNotificationService
    ]
})
export class SettingsModule { }
