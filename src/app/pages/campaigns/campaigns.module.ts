import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

//COMPONENTS
import { CampaignListComponent } from './campaign-list/campaign-list.component';
import { CampaignAddComponent } from './campaign-add/campaign-add.component';
import { CampaignDetailComponent } from './campaign-list/campaign-detail/campaign-detail.component';
import { CampaignsService } from './campaigns.service';
import { DatasourceService } from '../../@core/sharedServices/datasource.service';
import { enumPermissions } from '../../@core/common-helper';
import { SettingsService } from '../settings/settings.service';

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
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';

//THIRD PARTY MODULES
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: CampaignListComponent,
    data: { permission: enumPermissions.ListCampaign }
  }
  ,
  {
    path: 'details/:id',
    component: CampaignDetailComponent,
    data: { permission: enumPermissions.ViewCampaign }
  }
];

@NgModule({
  declarations: [
    CampaignListComponent,
    CampaignAddComponent,
    CampaignDetailComponent
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
    EntityTagsViewModule,
    RemoveWhiteSpaceModule,
    CustomFieldRenderModule,
    CommonActivitySectionModule,
    TrimValueModule,
    DynamicComponentModule,
    CommaSeperatorValueModule,
    DisplayValueFinderModule,
    EntityBookmarkModule,
    NgbModule,
    TranslateModule,
    AvatarModule,
    ButtonModule,
    CalendarModule,
    MultiSelectModule,
    ToggleButtonModule,
    PaginatorModule,
    TableModule,
    NgbTooltipModule,
    RadioButtonModule,
    ShowHidePencilButtonModule,
    GlobleNavTabModule, 
    ControlLevelLoadingBarModule,
    TabLevelLoaderModule,
    HistoryTabModule,
    EntityReviewDisplayModule,
    CommonUserProfieModule,
    EntityDocumentsModule
  ],
  providers: [CampaignsService, DatasourceService, SettingsService]
})
export class CampaignsModule { }
