//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

//COMPONENTS
import { NewsletterListComponent } from './newsletter-list/newsletter-list.component';
import { NewsletterAddComponent } from './newsletter-add/newsletter-add.component';
import { NewsletterDetailComponent } from './newsletter-list/newsletter-detail/newsletter-detail.component';

//SERVICES
import { CampaignsService } from '../campaigns/campaigns.service';
import { NewslettersService } from './newsletters.service';
import { SettingsService } from '../settings/settings.service';
import { CommonService } from '../../@core/sharedServices/common.service';
import { DatasourceService } from '../../@core/sharedServices/datasource.service';

//COMMON
import { enumPermissions } from '../../@core/common-helper';

//CUSTOM MODULES
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { CustomCalenderModule } from '../../@core/sharedComponents/custom-calender/custom-calender.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { SafehtmlModule } from '../../@core/pipes/safehtml/safehtml.module';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';

//THIRD PARTY MODULES
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';

//PRIMENG
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: NewsletterListComponent,
    data: { permission: enumPermissions.ListNewsletter }
  },
  {
    path: 'details/:id',
    component: NewsletterDetailComponent,
    data: { permission: enumPermissions.ViewNewsletter }
  }
];

@NgModule({
  declarations: [
    NewsletterListComponent,
    NewsletterAddComponent,
    NewsletterDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    DateFormatPipeModule,
    ConfiguredEntityNamePipeModule,
    DateMaskModule,
    CustomCalenderModule,
    ActivePipeModule,
    DynamicComponentModule,
    EntityTagsViewModule,
    RemoveWhiteSpaceModule,
    CustomFieldRenderModule,
    CommonActivitySectionModule,
    TrimValueModule,

    NgbModule,
    TranslateModule,
    AvatarModule,
    ButtonModule,
    CalendarModule,
    MultiSelectModule,
    ToggleButtonModule,
    PaginatorModule,
    TableModule,
    SafehtmlModule,
    EditorModule,
    ShowHidePencilButtonModule,
    GlobleNavTabModule,
    ControlLevelLoadingBarModule,
    HistoryTabModule,
    CommonUserProfieModule,
    EntityReviewDisplayModule,
    EntityDocumentsModule,
    EntityBookmarkModule
  ],
  providers: [NewslettersService, CampaignsService, SettingsService, CommonService, DatasourceService]
})
export class NewslettersModule { }
