//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

//COMMON
import { enumPermissions } from '../../../@core/common-helper';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { CommonUserProfieModule } from '../../../@core/sharedComponents/common-user-profie/common-user-profie.module';
import { ConfiguredEntityNamePipeModule } from '../../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';

//OTHER
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';
import { EditorModule } from '@tinymce/tinymce-angular'

//COMPONENETS
import { ProfileComponent } from './profile-form/profile.component';
import { ImageAreaSelectModule } from '../../../@core/sharedModules/image-area-select/image-area-select.module';
import { ConfirmationDialogModule } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { PasswordStrengthModule } from '../../../@core/sharedComponents/password-strength/password-strength.module';

//SERVICES
import { ProfileService } from './profile.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';

//PRIMENG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { PhoneControlModule } from '../../../@core/sharedComponents/phone-control/phone-control.module';

const routes: Routes = [
    {
        path: '**',
        component: ProfileComponent,
        data: { permission: enumPermissions.EditProfile }
    }
];

@NgModule({
    declarations: [
        ProfileComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BsDropdownModule,
        NgbModule,
        RouterModule.forChild(routes),
        NgxMaskDirective, NgxMaskPipe,
        ImageAreaSelectModule,
        ConfirmationDialogModule,
        TranslateModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        DropdownModule,
        TableModule,
        PasswordStrengthModule,
        TrimValueModule,
        AvatarModule,
        CommonUserProfieModule,
        EditorModule,
        PhoneControlModule,
        NgbTooltipModule,
        MultiSelectModule,
        RadioButtonModule,
        ConfiguredEntityNamePipeModule
    ],
    providers: [
        ProfileService,
        CommonService,
        DatasourceService,
        provideNgxMask({}),
    ]
})
export class ProfileModule { }
