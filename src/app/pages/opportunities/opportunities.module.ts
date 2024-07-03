//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMMON
import { enumPermissions } from '../../@core/common-helper';

//SERVICES
import { OpportunitiesService } from './opportunities.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { WorkTasksService } from '../worktasks/worktasks.service';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { CommonService } from '../../@core/sharedServices/common.service';

//COMPONENT
import { OpportunityListComponent } from './opportunity-list/opportunity-list.component';
import { OpportunityAddComponent } from './opportunity-add/opportunity-add.component';
import { OpportunityDetailComponent } from './opportunity-detail/opportunity-detail.component';
import { OpportunityImportDialogComponent } from './opportunity-import-dialog/opportunity-import-dialog.component';
import { OpportunityitemsAddComponent } from './opportunityitems-add/opportunityitems-add.component';
import { OpportunityAllListingComponent } from './opportunity-all-listing/opportunity-all-listing.component';

//CUSTOM MODULES
import { KanbanBoardModule } from '../../@core/sharedComponents/kanban-board/kanban-board.module';
import { FiltersModule } from '../../@core/sharedModules/filters/filters.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { PriorityDialogModule } from '../../@core/sharedComponents/priority-dialog/priority-dialog.module';
import { SeverityDialogModule } from '../../@core/sharedComponents/severity-dialog/severity-dialog.module';
import { DueDateDialogModule } from '../../@core/sharedComponents/due-date-dialog/due-date-dialog.module';
import { WorkflowAssignDialogModule } from '../../@core/sharedComponents/workflow-assign-dialog/workflow-assign-dialog.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { ConfirmationDialogModule } from '../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { EntityStagesModule } from '../../@core/sharedComponents/entity-stages/entity-stages.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { WorkTaskExpandableTableModule } from '../../@core/sharedComponents/work-task-expandable-table/work-task-expandable-table.module';
import { EntityRelationModule } from '../../@core/sharedComponents/entity-relation/entity-relation.module';

//DIRECTIVIES
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';

//PIPES
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { TimeFramePipeModule } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { TimeFrameToMinutesModule } from '../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.module';
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { UserPermissionRelatedToModule } from '../../@core/pipes/user-permission-related-to/user-permission-related-to.module';

//THIRD PARTY MODULES
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AvatarModule } from 'ngx-avatar';
import { EditorModule } from '@tinymce/tinymce-angular';
import { SafehtmlModule } from '../../@core/pipes/safehtml/safehtml.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { DisplayValueFinderModule } from "../../@core/pipes/display-value-finder/display-value-finder.module";
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';

const opportunityRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: OpportunityAllListingComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListOpportunities }
  },
  {
    path: 'workflow/:wf',
    component: OpportunityListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListOpportunities },
  },
  {
    path: 'details/:wf/:id',
    component: OpportunityDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewOpportunity },
  },
  {
    path: 'details/:id',
    component: OpportunityDetailComponent,
    data: { permission: enumPermissions.ViewOpportunity }
  }
]


@NgModule({
    declarations: [
        OpportunityListComponent,
        OpportunityAddComponent,
        OpportunityImportDialogComponent,
        OpportunityDetailComponent,
        OpportunityitemsAddComponent,
        OpportunityAllListingComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(opportunityRoutes),
        FormsModule,
        KanbanBoardModule,
        ReactiveFormsModule,
        StageCssPipeModule,
        DateFormatPipeModule,
        MultiSelectModule,
        EntityTagsViewModule,
        FiltersModule,
        TableModule,
        DropdownModule,
        CalendarModule,
        ButtonModule,
        ToggleButtonModule,
        DateMaskModule,
        TrimValueModule,
        TimeAgoPipeModule,
        TimeFramePipeModule,
        TimeFrameToMinutesModule,
        ActivePipeModule,
        CommaSeperatorValueModule,
        CommonActivitySectionModule,
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
        TranslateModule,
        NgbTooltipModule,
        NgbModule,
        NgxMaskDirective,
        NgxMaskPipe,
        GlobleNavTabModule,
        ControlLevelLoadingBarModule,
        TabLevelLoaderModule,
        SkeletonModule,
        HistoryTabModule,
        UserPermissionRelatedToModule,
        DisplayValueFinderModule,
        CommonUserProfieModule,
        EntityReviewDisplayModule,
        EntityDocumentsModule,
        WorkTaskExpandableTableModule,
        EntityRelationModule,
        EntityBookmarkModule
    ],
    providers: [OpportunitiesService, WorkflowmanagementService, WorkTasksService, provideNgxMask({}), AccountsService, ContactsService, CommonService],
})
export class OpportunitiesModule { }
