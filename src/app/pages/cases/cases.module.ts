// ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// COMMON
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';

// COMPONENTS
import { CaseWorkflowListComponent } from './case-workflow-list/case-workflow-list.component';
import { CaseAddComponent } from './case-add/case-add.component';
import { CaseDetailComponent } from './case-detail/case-detail.component';
import { CaseImportDialogComponent } from './case-import-dialog/case-import-dialog.component';

// SERVICES
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { CasesService } from './cases.service';
import { CommonService } from '../../@core/sharedServices/common.service';

// PRIMENG
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';

// COMMON MODULE
import { TranslateModule } from '@ngx-translate/core';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { KanbanBoardModule } from '../../@core/sharedComponents/kanban-board/kanban-board.module';
import { UserAssignModule } from '../../@core/sharedComponents/user-assign/user-assign.module';
import { FiltersModule } from '../../@core/sharedModules/filters/filters.module';
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { ConfirmationDialogModule } from '../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { EntityStagesModule } from '../../@core/sharedComponents/entity-stages/entity-stages.module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { TimeFramePipeModule } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.module';
import { TimeFrameToMinutesModule } from '../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.module';
import { SafehtmlModule } from '../../@core/pipes/safehtml/safehtml.module';
import { PriorityDialogModule } from '../../@core/sharedComponents/priority-dialog/priority-dialog.module';
import { SeverityDialogModule } from '../../@core/sharedComponents/severity-dialog/severity-dialog.module';
import { DueDateDialogModule } from '../../@core/sharedComponents/due-date-dialog/due-date-dialog.module';
import { WorkflowAssignDialogModule } from '../../@core/sharedComponents/workflow-assign-dialog/workflow-assign-dialog.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { IsEntityFieldHiddenModule } from '../../@core/pipes/is-entity-field-hidden/is-entity-field-hidden.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { WorkTaskExpandableTableModule } from '../../@core/sharedComponents/work-task-expandable-table/work-task-expandable-table.module';

// OTHER
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorModule } from '@tinymce/tinymce-angular';
import { AvatarModule } from 'ngx-avatar';
import { CasesListComponent } from './cases-list/cases-list.component';

//PIPE
import { UserPermissionRelatedToModule } from '../../@core/pipes/user-permission-related-to/user-permission-related-to.module';
import { WorkTasksService } from '../worktasks/worktasks.service';
import { IsEntityFieldHiddenPipe } from '../../@core/pipes/is-entity-field-hidden/is-entity-field-hidden.pipe';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { ProductsService } from '../products/products.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';
import { RelatedToControlModule } from '../../@core/sharedComponents/related-to-control/related-to-control.module';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: CasesListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListCases }
  },
  {
    path: 'details/:wf/:id',
    component: CaseDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewCase },
  },
  {
    path: 'details/:id',
    component: CaseDetailComponent,
    data: { permission: enumPermissions.ViewCase }
  },
  {
    path: 'workflow/:wf',
    component: CaseWorkflowListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListCases },
  },
];

@NgModule({
  declarations: [
    CaseWorkflowListComponent,
    CaseAddComponent,
    CaseDetailComponent,
    CasesListComponent,
    CaseImportDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TableModule,
    TranslateModule,
    NgbModule,
    NgbTooltipModule,
    CommonActivitySectionModule,
    KanbanBoardModule,
    UserAssignModule,
    FiltersModule,
    CalendarModule,
    DisplayValueFinderModule,
    DropdownModule,
    DateMaskModule,
    RouterModule.forChild(routes),
    StageCssPipeModule,
    DateFormatPipeModule,
    MultiSelectModule,
    EntityTagsViewModule,
    ButtonModule,
    ToggleButtonModule,
    TrimValueModule,
    TimeAgoPipeModule,
    TimeFramePipeModule,
    TimeFrameToMinutesModule,
    CommaSeperatorValueModule,
    ConfirmationDialogModule,
    EntityStagesModule,
    AvatarModule,
    EditorModule,
    ConfiguredEntityNamePipeModule,
    SafehtmlModule,
    PriorityDialogModule,
    SeverityDialogModule,
    DueDateDialogModule,
    WorkflowAssignDialogModule,
    DynamicComponentModule,
    CustomFieldRenderModule,
    RemoveWhiteSpaceModule,
    ShowHidePencilButtonModule,
    GlobleNavTabModule,
    ControlLevelLoadingBarModule,
    SkeletonModule,
    TabLevelLoaderModule,
    HistoryTabModule,
    UserPermissionRelatedToModule,
    EntityReviewDisplayModule,
    CommonUserProfieModule,
    IsEntityFieldHiddenModule,
    EntityDocumentsModule,
    WorkTaskExpandableTableModule,
    EntityBookmarkModule,
    RelatedToControlModule
  ],
  providers: [
    CasesService,
    WorkflowmanagementService,
    CommonService,
    WorkTasksService,
    IsEntityFieldHiddenPipe,
    AccountsService, 
    ContactsService,
    ProductsService,
    OpportunitiesService
  ]
})
export class CasesModule { }
