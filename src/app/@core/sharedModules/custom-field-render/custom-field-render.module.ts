import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMPONENTS
import { CustomFieldComponent } from './custom-field/custom-field.component';

//PIPE MODULES
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { PhonePipeModule } from '../../pipes/phone-pipe/phone-pipe.module';
import { CommaSeperatorValueModule } from '../../pipes/comma-seperator-value/comma-seperator-value.module';
import { PhoneControlModule } from '../../sharedComponents/phone-control/phone-control.module';

//PRIMENG
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';

//MODULES
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';
import { CustomFieldReadOnlyComponent } from './custom-field-readonly/custom-field-readonly.component';
import { TranslateModule } from '@ngx-translate/core';
import { DisplayValueFinderModule } from '../../pipes/display-value-finder/display-value-finder.module';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

//SERVICES
import { DatasourceService } from '../../sharedServices/datasource.service';
import { CustomFieldLoadingBarComponent } from './custom-field-loading-bar/custom-field-loading-bar.component';
import { DateMaskModule } from '../../sharedDirective/date-mask/date-mask.module';
import { SafehtmlModule } from '../../pipes/safehtml/safehtml.module';
import { CommonJsonGridModule } from '../common-json-grid/common-json-grid.module';

@NgModule({
  declarations: [
    CustomFieldComponent,
    CustomFieldReadOnlyComponent,
    CustomFieldLoadingBarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DateFormatPipeModule,
    PhonePipeModule,
    CommaSeperatorValueModule,
    TrimValueModule,
    DisplayValueFinderModule,
    RadioButtonModule,
    
    CalendarModule,
    DropdownModule,
    MultiSelectModule,
    NgxMaskDirective, NgxMaskPipe,
    DateMaskModule,
    SafehtmlModule,
    CommonJsonGridModule,
    NgbTooltipModule,
    PhoneControlModule
  ],
  exports:[
    CustomFieldComponent
  ],
  providers:[
    DatasourceService,
    provideNgxMask({})
  ],
})
export class CustomFieldRenderModule { }
