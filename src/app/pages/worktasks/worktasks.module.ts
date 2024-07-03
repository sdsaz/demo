//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//COMMON 
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';
//COMMON MODULE
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
import { TimelineModule } from '../../@core/sharedModules/timeline/timeline.module';
import { WorkTaskExpandableTableModule } from '../../@core/sharedComponents/work-task-expandable-table/work-task-expandable-table.module';

//COMPONENTS
import { WorkTaskListComponent } from './worktask-list/worktask-list.component';
import { WorkTaskDetailComponent } from './worktask-list/worktask-detail/worktask-detail.component';
import { WorkTaskImportDialogComponent } from './work-task-import-dialog/work-task-import-dialog.component';
import { WorktaskAddComponent } from './worktask-add/worktask-add.component';
import { WorktaskListingComponent } from './worktask-listing/worktask-listing.component';
import { LinkWorkTaskDialogComponent } from './link-work-task-dialog/link-work-task-dialog.component';
import { WorktaskAddSubTaskComponent } from './worktask-add-subtask/worktask-add-subtask.component';
//SERVICES
import { WorkTasksService } from './worktasks.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { CommonService } from '../../@core/sharedServices/common.service';
//PTIMNG
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';
//OTHER
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorModule } from '@tinymce/tinymce-angular';
import { AvatarModule } from 'ngx-avatar';
import { IsEntityFieldHiddenModule } from '../../@core/pipes/is-entity-field-hidden/is-entity-field-hidden.module';
import { HasPermissionPipeModule } from '../../@core/pipes/has-permission-pipe/has-permission-pipe.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { IsEntityFieldHiddenPipe } from '../../@core/pipes/is-entity-field-hidden/is-entity-field-hidden.pipe';
import { ContactsService } from '../contacts/contacts.service';
import { AccountsService } from '../accounts/accounts.service';
import { ProductsService } from '../products/products.service';
import { CasesService } from '../cases/cases.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { ActivityService } from '../../@core/sharedComponents/common-activity-section/activity.service';
import { RelatedToControlModule } from '../../@core/sharedComponents/related-to-control/related-to-control.module';
import { AddRelatedToControlModule } from '../../@core/sharedComponents/add-related-to-control/add-related-to-control.module';
import { ClickOutsideFilterModule } from '../../@core/sharedDirective/click-outside-filter/click-outside-filter.module';
const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: WorktaskListingComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListWorkTasks }
  },
  {
    path: 'details/:wf/:id',
    component: WorkTaskDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewWorkTask },
  },
  {
    path: 'details/:id',
    component: WorkTaskDetailComponent,
    data: { permission: enumPermissions.ViewWorkTask }
  },
  {
    path: 'workflow/:wf',
    component: WorkTaskListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListWorkTasks },
  },
];

@NgModule({
    declarations: [
        WorkTaskListComponent,
        WorkTaskDetailComponent,
        WorkTaskImportDialogComponent,
        WorktaskAddComponent,
        WorktaskListingComponent,
        LinkWorkTaskDialogComponent,
        WorktaskAddSubTaskComponent,
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
        CommonUserProfieModule,
        EntityReviewDisplayModule,
        TimelineModule,
        IsEntityFieldHiddenModule,
        HasPermissionPipeModule,
        EntityDocumentsModule,
        WorkTaskExpandableTableModule,
        EntityBookmarkModule,
        RelatedToControlModule,
        AddRelatedToControlModule,
        ClickOutsideFilterModule,
    ],
    providers: [
        WorkTasksService,
        WorkflowmanagementService,
        CommonService,
        IsEntityFieldHiddenPipe,
        AccountsService, 
        ContactsService,
        ProductsService,
        CasesService,
        OpportunitiesService,
        ActivityService
    ]
})
export class WorkTasksModule { }
