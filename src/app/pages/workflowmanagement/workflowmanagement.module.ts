//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//COMMON
import { enumPermissions } from '../../@core/common-helper';
import { TranslateModule } from '@ngx-translate/core';
//SERVICES
import { WorkflowmanagementService } from './workflowmanagement.service';
import { SettingsService } from '../settings/settings.service';
//COMPONENTS
import { EntityworkflowListComponent } from './entityworkflow-list/entityworkflow-list.component';
import { EntityworkflowDetailComponent } from './entityworkflow-list/entityworkflow-detail/entityworkflow-detail.component';
//COMMON MODULES
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { PhonePipeModule } from '../../@core/pipes/phone-pipe/phone-pipe.module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
//PRIMENG
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MultiSelectModule } from 'primeng/multiselect';
//OTHER
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
    data: { permission: enumPermissions.ListEntityWorkflows }
  },
  {
    path: 'list',
    component: EntityworkflowListComponent,
    data: { permission: enumPermissions.ListEntityWorkflows }
  },
  {
    path: 'details/:id',
    component: EntityworkflowDetailComponent,
    data: { permission: enumPermissions.ViewEntityWorkflows }
  }
];


@NgModule({
  declarations: [
    EntityworkflowListComponent,
    EntityworkflowDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    PaginatorModule,
    TranslateModule,
    NgbModule,
    DateFormatPipeModule,
    PhonePipeModule,
    NgxMaskDirective, NgxMaskPipe,
    CommonActivitySectionModule,
    RouterModule.forChild(routes),
    ButtonModule,
    ToggleButtonModule,
    EntityTagsViewModule,
    TrimValueModule,
    MultiSelectModule,
    ShowHidePencilButtonModule,
    HistoryTabModule
  ],
  providers: [WorkflowmanagementService, SettingsService, provideNgxMask({})],
})
export class WorkflowmanagementModule { }
