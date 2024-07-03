import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserActivationComponent } from './user-activation.component';

const routes = [
    {
        path: '',
        component: UserActivationComponent
    }
];

@NgModule({
    declarations: [
        UserActivationComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        RouterModule.forChild(routes)
    ]
})
export class UserActivationModule {
}
