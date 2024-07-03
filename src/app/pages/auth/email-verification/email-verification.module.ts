import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailVerificationComponent } from './email-verification.component';
import { RouterModule } from '@angular/router';


const routes = [
  {
    path: '',
    component: EmailVerificationComponent
  }
];

@NgModule({
  declarations: [
    EmailVerificationComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    RouterModule
  ]
})
export class EmailVerificationModule { }
