//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//COMPONENTS
import { HistoryTabComponent } from './history-tab/history-tab.component';

//SERVICES
import { WorkflowmanagementService } from '../../../pages/workflowmanagement/workflowmanagement.service';
import { ActivityService } from '../common-activity-section/activity.service';

//COMMON MODULE
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { TimeFramePipeModule } from '../../pipes/time-frame-pipe/time-frame-pipe.module';
import { TabLevelLoaderModule } from '../tab-level-loader/tab-level-loader.module';
import { ControlLevelLoadingBarModule } from '../control-level-loading-bar/control-level-loading-bar.module';
import { CommonUserProfieModule } from '../common-user-profie/common-user-profie.module';

//PRIMNG
import { PaginatorModule } from 'primeng/paginator';
import { TreeTableModule } from 'primeng/treetable';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    HistoryTabComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    DateFormatPipeModule,
    TableModule,
    TreeTableModule,
    PaginatorModule,
    NgbTooltipModule,
    AvatarModule,
    TabLevelLoaderModule,
    ControlLevelLoadingBarModule,
    TimeFramePipeModule,
    CommonUserProfieModule
  ],
  providers: [
    WorkflowmanagementService,
    ActivityService
  ],
  exports: [
    HistoryTabComponent
  ]
})
export class HistoryTabModule { }
