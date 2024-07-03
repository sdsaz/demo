import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomCalenderComponent } from './custom-calender/custom-calender.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';

@NgModule({
  declarations: [
    CustomCalenderComponent,
  ],
  imports: [
    CommonModule, ButtonModule, RippleModule, TranslateModule, NgxMaskDirective, NgxMaskPipe
  ],
  providers:[provideNgxMask({})],
  exports: [CustomCalenderComponent],
})
export class CustomCalenderModule { }
