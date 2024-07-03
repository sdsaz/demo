import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhoneControlComponent } from './phone-control/phone-control.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CharacterLimitModule } from '../../pipes/character-limit/character-limit.module';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';



@NgModule({
  declarations: [
    PhoneControlComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    InputTextModule,
    CharacterLimitModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  exports:[ 
    PhoneControlComponent
  ],
  providers: [
    provideNgxMask({})
  ]
})
export class PhoneControlModule { }
