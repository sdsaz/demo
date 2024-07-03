//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMPONENTS
import { KeyFieldComponent } from './key-field/key-field.component';

//MODULES
import { TranslateModule } from '@ngx-translate/core';
import { CommaSeperatorValueModule } from '../../pipes/comma-seperator-value/comma-seperator-value.module';
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';
import { DisplayValueFinderModule } from '../../pipes/display-value-finder/display-value-finder.module';
import { DateMaskModule } from '../../sharedDirective/date-mask/date-mask.module';
import { NgxMaskDirective, NgxMaskPipe} from 'ngx-mask';
import { ControlLevelLoadingBarModule } from '../../sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PhonePipeModule } from '../../pipes/phone-pipe/phone-pipe.module';
import { TimeFramePipeModule } from '../../pipes/time-frame-pipe/time-frame-pipe.module';
import { PhoneControlModule } from '../../sharedComponents/phone-control/phone-control.module';

//PRIMENG
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';


@NgModule({
  declarations: [
    KeyFieldComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,

    CalendarModule,
    DropdownModule,
    MultiSelectModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    DateFormatPipeModule,
    CommaSeperatorValueModule,
    TrimValueModule,
    DisplayValueFinderModule,
    
    NgxMaskDirective,
    NgxMaskPipe,
    DateMaskModule,
    ControlLevelLoadingBarModule,
    RadioButtonModule,
    PhonePipeModule,
    TimeFramePipeModule,
    PhoneControlModule
  ],
  exports:[
    KeyFieldComponent
  ]
})
export class KeyFieldRenderModule { }
