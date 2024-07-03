import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//CUSTOM COMPONENTS
import { EntityNotificationComponent } from './entity-notification/entity-notification.component';

//PRIMENG
import { DropdownModule } from 'primeng/dropdown';

//SERVICES
import { CommonService } from '../../sharedServices/common.service';
import { TimeFrameToMinutesPipe } from '../../pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { TimeFramePipe } from '../../pipes/time-frame-pipe/time-frame-pipe.pipe';

//THIRD PARTY MODULES
import { TranslateModule } from '@ngx-translate/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

//CUSTOM PIPE MODULES
import { TimeFrameToMinutesModule } from '../../pipes/time-frame-to-minutes/time-frame-to-minutes.module';
import { TimeFramePipeModule } from '../../pipes/time-frame-pipe/time-frame-pipe.module';


@NgModule({
  declarations: [
    EntityNotificationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    TranslateModule,
    NgbTooltipModule,
    TimeFrameToMinutesModule,
    TimeFramePipeModule
  ],
  exports: [
    EntityNotificationComponent
  ],
  providers: [
    CommonService,
    TimeFrameToMinutesPipe,
    TimeFramePipe
  ]
})
export class EntityNotificationModule { }
