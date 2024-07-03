import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ResetPasswordComponent } from './reset-password.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { PasswordStrengthModule } from '../../../@core/sharedComponents/password-strength/password-strength.module';

const routes = [
    {
        path     : '',
        component: ResetPasswordComponent
    }
];

@NgModule({
    declarations: [
        ResetPasswordComponent
    ],
    imports     : [
        RouterModule.forChild(routes),
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        TranslateModule,
        TrimValueModule,
        PasswordStrengthModule
    ]
})
export class ResetPasswordModule
{
}
