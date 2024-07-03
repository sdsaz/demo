import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//Routing
import { MiscTasksRoutingModule } from './misc-tasks-routing.module';

//Components
import { MiscTaskListComponent } from './misc-task-list/misc-task-list.component';
import { MiscTaskDetailComponent } from './misc-task-detail/misc-task-detail.component';
import { AddMiscTaskComponent } from './add-misc-task/add-misc-task.component';

//ThirdParty Packages
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AvatarModule } from 'ngx-avatar';

//Custom Pipes
import { ConfiguredEntityNamePipeModule } from '../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { ShowHidePencilButtonModule } from '../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { CommonActivitySectionModule } from '../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { EntityTagsViewModule } from '../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';

//Directives
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';

//Services
import { WorkTasksService } from '../worktasks/worktasks.service';

//CommonModules
import { CommonUserProfieModule } from '../../@core/sharedComponents/common-user-profie/common-user-profie.module';

//PrimeNG
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { DateFormatPipeModule } from '../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { DateFormatPipe } from '../../@core/pipes/date-format-pipe/date-format-pipe';

@NgModule({
  declarations: [
    MiscTaskListComponent,
    MiscTaskDetailComponent,
    AddMiscTaskComponent
  ],
  imports: [
    CommonModule,
    MiscTasksRoutingModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    DropdownModule,
    CalendarModule,
    TrimValueModule,
    TableModule,
    TimeAgoPipeModule,
    MultiSelectModule,
    DateMaskModule,
    DateFormatPipeModule,
    ShowHidePencilButtonModule,
    CommonActivitySectionModule,
    EntityTagsViewModule,
    CommonUserProfieModule,
    AvatarModule
  ],
  providers: [
    WorkTasksService,
    DateFormatPipe
  ]
})
export class MiscTasksModule { }
