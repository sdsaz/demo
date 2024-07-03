//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMMON
import { AuthGuard } from '../auth/auth.guard';
import { AvatarModule } from 'ngx-avatar';

//PRIME NG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PaginatorModule } from 'primeng/paginator';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';

//OTHER
import { enumPermissions } from '../../@core/common-helper';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

//CUSTOM MODULES
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { CustomCalenderModule } from '../../@core/sharedComponents/custom-calender/custom-calender.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';

//COMPONENTS
import { PricebookAddComponent } from './pricebook-add/pricebook-add.component';
import { PricebookListComponent } from './pricebook-list/pricebook-list.component';
import { PricebookDetailComponent } from './pricebook-detail/pricebook-detail.component';
import { PricebookitemsAddComponent } from './pricebookitems-add/pricebookitems-add.component';

//SERVICE
import { PricebookService } from './pricebook.service';

//PIPE
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: PricebookListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListPriceBooks }
  },
  {
    path: 'details/:id',
    component: PricebookDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewPriceBook }
  }
];

@NgModule({
  declarations: [
    PricebookListComponent,
    PricebookAddComponent,
    PricebookDetailComponent,
    PricebookitemsAddComponent
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
    PaginatorModule,
    CalendarModule,
    TimeAgoPipeModule,
    NgxMaskDirective,
    NgxMaskPipe,

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
    TabLevelLoaderModule,
    HistoryTabModule,
    EntityReviewDisplayModule,
    EntityDocumentsModule,
    EntityBookmarkModule
  ],
  providers: 
  [
    PricebookService
  ]
})
export class PricebooksModule { }
