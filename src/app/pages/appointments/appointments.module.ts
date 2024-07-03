import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';

//COMPONENTS
import { AppointmentsListComponent } from './appointments-list/appointments-list.component';
import { enumPermissions } from '../../@core/common-helper';

//CUSTOM MODULES
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { CustomCalenderModule } from '../../@core/sharedComponents/custom-calender/custom-calender.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';

//THIRD PARTY MODULES
import { NgbActiveModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { AppointmentsDetailComponent } from './appointments-list/appointments-detail/appointments-detail.component';
import { AvatarModule } from 'ngx-avatar';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { DocumentModule } from '../../@core/sharedComponents/documents/document.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { DocumentViewerModule } from '../../@core/sharedModules/document-viewer/document-viewer.module';
import { CommonDetailsSectionModule } from '../../@core/sharedComponents/common-details-section/common-details-section.module';
import { EntityNotificationModule } from '../../@core/sharedComponents/entity-notification/entity-notification.module';
import { CharacterLimitModule } from '../../@core/pipes/character-limit/character-limit.module';
import { GetFileNameOrExtensionPipeModule } from '../../@core/pipes/get-file-extension/get-file-name-or-extension-pipe.module';
import { FileUploadDialogModule } from '../../@core/sharedComponents/file-upload-dialog/file-upload-dialog.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { SkeletonModule } from 'primeng/skeleton';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { EntityTagsViewModule } from "../../@core/sharedComponents/entity-tags-view/entity-tags-view.module";
import { DisplayValueFinderModule } from "../../@core/pipes/display-value-finder/display-value-finder.module";
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: AppointmentsListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListAppointment }
  },
  {
    path: 'details/:id',
    component: AppointmentsDetailComponent,
    data: { permission: enumPermissions.ViewAppointment }
  },
  {
    path: 'details/:id/:wf',
    component: AppointmentsDetailComponent,
    data: { permission: enumPermissions.ViewAppointment }
  },
];

@NgModule({
    declarations: [
        AppointmentsListComponent,
        AppointmentsDetailComponent
    ],
    providers: [NgbActiveModal],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),
        DateFormatPipeModule,
        ConfiguredEntityNamePipeModule,
        CustomCalenderModule,
        TranslateModule,
        ButtonModule,
        MultiSelectModule,
        PaginatorModule,
        TableModule,
        NgbTooltipModule,
        CommonUserProfieModule,
        EntityDocumentsModule,
        EntityReviewDisplayModule,
        CommonActivitySectionModule,
        AvatarModule,
        DropdownModule,
        CalendarModule,
        ReactiveFormsModule,
        TimeAgoPipeModule,
        DocumentModule,
        DateMaskModule,
        DocumentViewerModule,
        CommonDetailsSectionModule,
        EntityNotificationModule,
        CharacterLimitModule,
        GetFileNameOrExtensionPipeModule,
        FileUploadDialogModule,
        ControlLevelLoadingBarModule,
        ActivePipeModule,
        SkeletonModule,
        EntityBookmarkModule,
        StageCssPipeModule,
        GlobleNavTabModule,
        ShowHidePencilButtonModule,
        HistoryTabModule,
        RemoveWhiteSpaceModule,
        CustomFieldRenderModule,
        EntityTagsViewModule,
        DisplayValueFinderModule,
        TrimValueModule
    ]
})
export class AppointmentsModule { }
