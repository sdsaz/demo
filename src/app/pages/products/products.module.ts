import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//prime ng
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CalendarModule } from 'primeng/calendar';
import { enumPermissions } from '../../@core/common-helper';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';

//other
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { AvatarModule } from 'ngx-avatar';
import { FileUploadModule } from 'ng2-file-upload';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { FiltersModule } from '../../@core/sharedModules/filters/filters.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthGuard } from '../auth/auth.guard';

//components
import { ProductListComponent } from './product-list/product-list.component';
import { ProductAddComponent } from './product-add/product-add.component';
import { ProductDetailComponent } from './product-list/product-detail/product-detail.component';
import { ProductImportDialogComponent } from './product-import-dialog/product-import-dialog.component';
import { ProductWorkflowListComponent } from './product-workflow-list/product-workflow-list.component';

//shared Components
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { KanbanBoardModule } from '../../@core/sharedComponents/kanban-board/kanban-board.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { EntityRelationModule } from '../../@core/sharedComponents/entity-relation/entity-relation.module';
import { WorkTaskExpandableTableModule } from '../../@core/sharedComponents/work-task-expandable-table/work-task-expandable-table.module';

//services
import { DatasourceService } from '../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { ProductsService } from './products.service';
import { WorkTasksService } from '../worktasks/worktasks.service';
import { AccountsService } from '../accounts/accounts.service';
import { TimeFramePipe } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';

//pipes
import { PhonePipeModule } from '../../@core/pipes/phone-pipe/phone-pipe.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { TimeFramePipeModule } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.module';
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
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
    component: ProductListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListProducts }
  },
  {
    path: 'details/:id',
    component: ProductDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewProduct }
  },
  {
    path: 'details/:wf/:id',
    component: ProductDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewProduct }
  },
  {
    path: 'workflow/:id',
    component: ProductWorkflowListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListProducts }
  }
];

@NgModule({
  declarations: [
    ProductListComponent,
    ProductDetailComponent,
    ProductAddComponent,
    ProductImportDialogComponent,
    ProductWorkflowListComponent
  ],
  imports: 
  [
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
    FileUploadModule,
    NgbTooltipModule,
    ActivePipeModule,
    CustomFieldRenderModule,
    RemoveWhiteSpaceModule,
    CalendarModule,
    TimeFramePipeModule,
    ShowHidePencilButtonModule,
    StageCssPipeModule,
    GlobleNavTabModule,
    ControlLevelLoadingBarModule,
    TabLevelLoaderModule,
    HistoryTabModule,
    SkeletonModule,
    EntityReviewDisplayModule,
    CommonUserProfieModule,
    EntityDocumentsModule,
    EntityRelationModule,
    WorkTaskExpandableTableModule,
    EntityBookmarkModule
  ],
  providers: [
    ProductsService,
    DatasourceService, 
    WorkflowmanagementService,
    WorkTasksService,
    AccountsService,
    TimeFramePipe,
    CasesService,
    provideNgxMask({})
  ],
})
export class ProductsModule { }
