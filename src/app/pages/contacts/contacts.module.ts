//angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//common
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { ConfirmationDialogModule } from '../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { FiltersModule } from '../../@core/sharedModules/filters/filters.module';
import { KanbanBoardModule } from '../../@core/sharedComponents/kanban-board/kanban-board.module';
import { enumPermissions } from '../../@core/common-helper';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityRelationModule } from '../../@core/sharedComponents/entity-relation/entity-relation.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { PhoneControlModule } from '../../@core/sharedComponents/phone-control/phone-control.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { WorkTaskExpandableTableModule } from '../../@core/sharedComponents/work-task-expandable-table/work-task-expandable-table.module';

//components
import { ContactListComponent } from './contact-list/contact-list.component';
import { ContactDetailComponent } from './contact-list/contact-detail/contact-detail.component';
import { ContactAddComponent } from './contact-add/contact-add.component';
import { ContactWorkflowListComponent } from './contact-workflow-list/contact-workflow-list.component';
import { ContactImportDialogComponent } from './contact-import-dialog/contact-import-dialog.component';

//primeng
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SkeletonModule } from 'primeng/skeleton';

//services
import { ContactsService } from './contacts.service';
import { WorkTasksService } from '../worktasks/worktasks.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { DatasourceService } from '../../@core/sharedServices/datasource.service';
import { CommonService } from '../../@core/sharedServices/common.service';

//pipes
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { PhonePipeModule } from '../../@core/pipes/phone-pipe/phone-pipe.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { MaskSsnModule } from '../../@core/pipes/mask-ssn/mask-ssn.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { TimeFramePipeModule } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.module';
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
import { TimeFramePipe } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';

//other
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { AvatarModule } from 'ngx-avatar';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule } from 'ng2-file-upload';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { CasesService } from '../cases/cases.service';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';



const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: ContactListComponent,
    data: { permission: enumPermissions.ListContacts }
  },
  {
    path: 'details/:id',
    component: ContactDetailComponent,
    data: { permission: enumPermissions.ViewContact }
  },
  {
    path: 'details/:wf/:id',
    component: ContactDetailComponent,
    data: { permission: enumPermissions.ViewContact }
  },
  {
    path: 'workflow/:id',
    component: ContactWorkflowListComponent,
    data: { permission: enumPermissions.ListContacts }
  }
];

@NgModule({
    declarations: [
        ContactListComponent,
        ContactDetailComponent,
        ContactAddComponent,
        ContactWorkflowListComponent,
        ContactImportDialogComponent
    ],
    imports: [
        CommonModule,
        CommonUserProfieModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        PaginatorModule,
        TranslateModule,
        CalendarModule,
        MultiSelectModule,
        ButtonModule,
        ToggleButtonModule,
        NgbModule,
        NgxMaskDirective, NgxMaskPipe,
        CommonActivitySectionModule,
        RouterModule.forChild(routes),
        TranslateModule,
        EntityTagsViewModule,
        DynamicComponentModule,
        FiltersModule,
        KanbanBoardModule,
        AvatarModule,
        FileUploadModule,
        NgbTooltipModule,
        ConfirmationDialogModule,
        TimeFramePipeModule,
        PhonePipeModule,
        DateFormatPipeModule,
        CommaSeperatorValueModule,
        DisplayValueFinderModule,
        TrimValueModule,
        DateMaskModule,
        ConfiguredEntityNamePipeModule,
        MaskSsnModule,
        ActivePipeModule,
        CustomFieldRenderModule,
        RemoveWhiteSpaceModule,
        ShowHidePencilButtonModule,
        StageCssPipeModule,
        GlobleNavTabModule,
        ControlLevelLoadingBarModule,
        TabLevelLoaderModule,
        HistoryTabModule,
        SkeletonModule,
        EntityRelationModule,
        EntityReviewDisplayModule,
        PhoneControlModule,
        EntityDocumentsModule,
        WorkTaskExpandableTableModule,
        EntityBookmarkModule
    ],
    providers: [
      ContactsService, 
      DatasourceService, 
      WorkTasksService, 
      CommonService, 
      WorkflowmanagementService, 
      TimeFramePipe,
      CasesService, 
      provideNgxMask({})
    ]
})
export class ContactsModule { }
