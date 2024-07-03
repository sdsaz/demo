//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

//COMPOENENT
import { OrderAddComponent } from './order-add/order-add.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { OrderItemAddComponent } from './order-item-add/order-item-add.component';
import { OrderWorkFlowListComponent } from './order-work-flow-list/order-work-flow-list.component';
import { OrderListComponent } from './order-list/order-list.component';

//COMMON
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';

//SERVICES
import { OrdersService } from './orders.service';
import { WorkflowmanagementService } from '../workflowmanagement/workflowmanagement.service';
import { DatasourceService } from '../../@core/sharedServices/datasource.service'; 
import { SettingsService } from '../settings/settings.service'; 
import { CommonService } from '../../@core/sharedServices/common.service';

//PRIME NG
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule } from 'primeng/paginator';

//OTHER
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';

//COMMON MODULE
import { CommaSeperatorValueModule } from '../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { DisplayValueFinderModule } from '../../@core/pipes/display-value-finder/display-value-finder.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { DueDateDialogModule } from '../../@core/sharedComponents/due-date-dialog/due-date-dialog.module';
import { EntityStagesModule } from '../../@core/sharedComponents/entity-stages/entity-stages.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { KanbanBoardModule } from '../../@core/sharedComponents/kanban-board/kanban-board.module';
import { PriorityDialogModule } from '../../@core/sharedComponents/priority-dialog/priority-dialog.module';
import { SeverityDialogModule } from '../../@core/sharedComponents/severity-dialog/severity-dialog.module';
import { UserAssignModule } from '../../@core/sharedComponents/user-assign/user-assign.module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { ConfirmationDialogModule } from '../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { FiltersModule } from '../../@core/sharedModules/filters/filters.module';
import { MaskSsnModule } from '../../@core/pipes/mask-ssn/mask-ssn.module';
import { PhonePipeModule } from '../../@core/pipes/phone-pipe/phone-pipe.module';
import { DynamicComponentModule } from '../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { CustomFieldRenderModule } from '../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { RemoveWhiteSpaceModule } from '../../@core/pipes/remove-white-space/remove-white-space.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { GlobleNavTabModule } from '../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { TabLevelLoaderModule } from '../../@core/sharedComponents/tab-level-loader/tab-level-loader.module';
import { HistoryTabModule } from '../../@core/sharedComponents/history-tab/history-tab.module';
import { ControlLevelLoadingBarModule } from '../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { EntityReviewDisplayModule } from '../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { EntityDocumentsModule } from '../../@core/sharedModules/entity-documents/entity-documents.module';
import { EntityRelationModule } from '../../@core/sharedComponents/entity-relation/entity-relation.module';

//PIPE
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { SafehtmlModule } from '../../@core/pipes/safehtml/safehtml.module';
import { StageCssPipeModule } from '../../@core/pipes/stage-css-pipe/stage-css-pipe.module';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { TimeFramePipeModule } from '../../@core/pipes/time-frame-pipe/time-frame-pipe.module';
import { UserPermissionRelatedToModule } from '../../@core/pipes/user-permission-related-to/user-permission-related-to.module';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { EntityBookmarkModule } from '../../@core/sharedComponents/entity-bookmark/entity-bookmark.module';



const routes: Routes = [
  {
    path: '',
    redirectTo: 'workflow',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: OrderListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListOrder }
  },
  {
    path: 'details/:id',
    component: OrderDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewOrder }
  },
  {
    path: 'details/:wf/:id',
    component: OrderDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ViewOrder }
  },
  {
    path: 'workflow/:wf',
    component: OrderWorkFlowListComponent,
    canActivate: [AuthGuard],
    data: { permission: enumPermissions.ListOrder }
  }
];

@NgModule({
  declarations: [
    OrderAddComponent,
    OrderDetailComponent,
    OrderWorkFlowListComponent,
    OrderItemAddComponent,
    OrderListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TableModule,
    TranslateModule,
    NgbModule,
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
    CommaSeperatorValueModule,
    ConfirmationDialogModule, // For confirmation Dialog
    EntityStagesModule,
    AvatarModule,
    ConfiguredEntityNamePipeModule,
    SafehtmlModule,
    PriorityDialogModule,
    SeverityDialogModule,
    DueDateDialogModule,
    MaskSsnModule,
    NgxMaskDirective, NgxMaskPipe,    
    PaginatorModule,     
    PhonePipeModule,       
    DynamicComponentModule,    
    ActivePipeModule,
    TimeFramePipeModule,
    CustomFieldRenderModule,
    RemoveWhiteSpaceModule,
    ShowHidePencilButtonModule,
    GlobleNavTabModule,
    SkeletonModule,
    TabLevelLoaderModule,
    HistoryTabModule,
    ControlLevelLoadingBarModule,
    UserPermissionRelatedToModule,
    CommonUserProfieModule,
    EntityReviewDisplayModule,
    EntityDocumentsModule,
    EntityRelationModule,
    EntityBookmarkModule
  ],
  providers: [OrdersService, DatasourceService, CommonService, WorkflowmanagementService, SettingsService, AccountsService, ContactsService ,DecimalPipe, provideNgxMask({})],
})
export class OrdersModule { }
