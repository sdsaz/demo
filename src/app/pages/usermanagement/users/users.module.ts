import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PaginatorModule } from 'primeng/paginator';
// Import your AvatarModule
import { AvatarModule } from 'ngx-avatar';

import { ActivePipeModule } from '../../../@core/pipes/active-pipe/active-pipe-module';
import { ImageAreaSelectModule } from '../../../@core/sharedModules/image-area-select/image-area-select.module';
import { ConfirmationDialogModule } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';

import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { AvatarPersonNamePipeModule } from '../../../@core/pipes/avatar-person-name/avatar-person-name-pipe-module';
import { UserResetPasswordDialogComponent } from './user-reset-password-dialog/user-reset-password-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { UsersService } from './users.service';
import { RolesService } from '../roles/role.service';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { PasswordStrengthModule } from '../../../@core/sharedComponents/password-strength/password-strength.module';
import { PhonePipeModule } from '../../../@core/pipes/phone-pipe/phone-pipe.module';
import { EntityReferencesListModule } from '../../../@core/sharedComponents/entity-references-list/entity-references-list.module';
import { CommonUserProfieModule } from '../../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { PhoneControlModule } from '../../../@core/sharedComponents/phone-control/phone-control.module';

const avatarColors = ["#FFB6C1", "#2c3e50", "#95a5a6", "#f39c12", "#1abc9c"];

const routes: Routes = [
    {
        path: '',
        component: UserListComponent
    },
    {
        path: 'add',
        component: UserFormComponent
    },
    {
        path: 'details/:id',
        component: UserFormComponent
    }
];

@NgModule({
    declarations: [
        UserListComponent,
        UserFormComponent,
        UserResetPasswordDialogComponent
    ],
    imports: [
    CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BsDropdownModule,
        NgbModule,
        TranslateModule,
        //Primeng
        TableModule,
        ScrollPanelModule,
        PaginatorModule,
        AvatarModule.forRoot({
            colors: avatarColors
        }),
        AvatarPersonNamePipeModule,
        RouterModule.forChild(routes),
        NgxMaskDirective, NgxMaskPipe,
        ActivePipeModule,
        ImageAreaSelectModule,
        ConfirmationDialogModule,
        MultiSelectModule,
        InputTextModule,
        ButtonModule,
        CardModule,
        ToggleButtonModule,
        TrimValueModule,
        PasswordStrengthModule,
        PhonePipeModule,
        EntityReferencesListModule,
        CommonUserProfieModule,
        PhoneControlModule
    ],
    providers: [
        UsersService,
        RolesService,
        provideNgxMask({})
    ]
})

export class UsersModule { }