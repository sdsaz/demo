import { NgModule } from '@angular/core';
import { CommonUserProfieModule } from './../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMMON
import { enumPermissions } from '../../@core/common-helper';

//COMPONENTS
import { AccountListComponent } from './account-list/account-list.component';
import { AccountImportDialogComponent } from './account-import-dialog/account-import-dialog.component';
import { AccountDetailComponent } from './account-list/account-detail/account-detail.component';
import { AccountWorkFlowListComponent } from './account-work-flow-list/account-work-flow-list.component';
import { AccountAddComponent } from './account-add/account-add.component';
import { AccountProductEditDialogComponent } from './account-product-edit-dialog/account-product-edit-dialog.component';

//DIRECTIVE
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';

//PRIMENG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SkeletonModule } from 'primeng/skeleton';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';

//THIRD PARTY MODULES
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask  } from 'ngx-mask';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';

//SERVICES
import { AccountsService } from './accounts.service';
import { SettingsService } from '../settings/settings.service';
import { ProductsService } from '../products/products.service';
import { ContactsService } from '../contacts/contacts.service';
import { DatasourceService } from '../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { WorkTasksService } from '../worktasks/worktasks.service';
import { CommonService } from '../../@core/sharedServices/common.service';

//CUSTOM PIPE MODULES
import { TimeFramePipeModule } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { PhonePipeModule } from '../../@core/pipes/phone-pipe/phone-pipe.module';
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';

//CUSTOM MODULES
import { CustomCalenderModule } from '../../@core/sharedComponents/custom-calender/custom-calender.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { FileUploadCustomFieldRenderModule } from '../../@core/sharedModules/file-upload-custom-field-render/file-upload-custom-field-render.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { FiltersModule } from '../../@core/sharedModules/filters/filters.module';
import { KanbanBoardModule } from '../../@core/sharedComponents/kanban-board/kanban-board.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityRelationModule } from '../../@core/sharedComponents/entity-relation/entity-relation.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CasesService } from '../cases/cases.service';
import { PhoneControlModule } from '../../@core/sharedComponents/phone-control/phone-control.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { WorkTaskExpandableTableModule } from '../../@core/sharedComponents/work-task-expandable-table/work-task-expandable-table.module';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: AccountListComponent,
    data: { permission: enumPermissions.ListAccounts }
  },
  {
    path: 'details/:id',
    component: AccountDetailComponent,
    data: { permission: enumPermissions.ViewAccount }
  },
  {
    path: 'details/:id/:wf',
    component: AccountDetailComponent,
    data: { permission: enumPermissions.ViewAccount }
  },
  {
    path: 'workflow/:id',
    component: AccountWorkFlowListComponent,
    data: { permission: enumPermissions.ViewAccount }
  }
];

@NgModule({
  declarations: [
    AccountListComponent,
    AccountDetailComponent,
    AccountImportDialogComponent,
    AccountAddComponent,
    AccountWorkFlowListComponent,
    AccountProductEditDialogComponent
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
    CalendarModule,
    DisplayValueFinderModule,
    ToggleButtonModule,
    EntityTagsViewModule,
    DynamicComponentModule,
    TrimValueModule,
    CommaSeperatorValueModule,
    MultiSelectModule,
    DateMaskModule,
    FiltersModule,
    KanbanBoardModule,
    AvatarModule,
    ConfiguredEntityNamePipeModule,
    StageCssPipeModule,
    ActivePipeModule,
    TimeFramePipeModule,
    CustomCalenderModule,
    CustomFieldRenderModule,
    FileUploadCustomFieldRenderModule,
    RemoveWhiteSpaceModule,
    ShowHidePencilButtonModule,
    GlobleNavTabModule,
    ControlLevelLoadingBarModule,
    TabLevelLoaderModule,
    SkeletonModule,
    HistoryTabModule,
    EntityRelationModule,
    CommonUserProfieModule,
    EntityReviewDisplayModule,
    PhoneControlModule,
    EntityDocumentsModule,
    WorkTaskExpandableTableModule,
    EntityBookmarkModule
  ],
  providers: [
    AccountsService,
    WorkTasksService,
    DatasourceService,
    WorkflowmanagementService,
    ContactsService,
    ProductsService,
    SettingsService,
    CommonService,
    CasesService,
    provideNgxMask({})
  ]
})
export class AccountsModule { }
