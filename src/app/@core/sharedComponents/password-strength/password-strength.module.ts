import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordStrengthComponent } from './password-strength/password-strength.component';
import { ProgressBarModule } from 'primeng/progressbar';



@NgModule({
  declarations: [
    PasswordStrengthComponent
  ],
  imports: [
    CommonModule,
    ProgressBarModule
  ],
  exports: [
    PasswordStrengthComponent
  ]
})
export class PasswordStrengthModule { }
