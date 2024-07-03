import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TreeSelectModule } from 'primeng/treeselect';

import { DynamicCommonFilterComponent } from './dynamic-common-filter/dynamic-common-filter.component';
import { CalendarModule } from 'primeng/calendar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomCalenderModule } from '../../sharedComponents/custom-calender/custom-calender.module';
import { DateMaskModule } from '../../sharedDirective/date-mask/date-mask.module';
import { ClickOutsideFilterModule } from '../../sharedDirective/click-outside-filter/click-outside-filter.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    DynamicCommonFilterComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    ButtonModule,
    TooltipModule,
    DropdownModule,
    MultiSelectModule,
    InputTextModule,
    TreeSelectModule,
    CalendarModule,
    NgbModule, 
    CustomCalenderModule,
    DateMaskModule,
    ClickOutsideFilterModule,
    TranslateModule,
  ],
  exports: [
    DynamicCommonFilterComponent
  ],
  providers: []
})
export class FiltersModule { }
