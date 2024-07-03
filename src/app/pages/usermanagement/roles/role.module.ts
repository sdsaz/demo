import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PaginatorModule } from 'primeng/paginator';

import { ActivePipeModule } from '../../../@core/pipes/active-pipe/active-pipe-module';
import { ConfirmationDialogModule } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { RoleFormComponent } from './role-form/role-form.component';
import { RoleListComponent } from './role-list/role-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { RolesService } from './role.service';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { CardModule } from 'primeng/card';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TrimValueDirective } from '../../../@core/sharedDirective/trim-value/trim-value.directive';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { DropdownModule } from 'primeng/dropdown';
import { SafehtmlModule } from '../../../@core/pipes/safehtml/safehtml.module';



const routes: Routes = [
    {
        path: '',
        component: RoleListComponent
    },
    {
        path: 'add',
        component: RoleFormComponent
    },
    {
        path: 'details/:id',
        component: RoleFormComponent
    }
];

@NgModule({
    declarations: [
        RoleListComponent,
        RoleFormComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BsDropdownModule,
        NgbModule,
        TranslateModule,
        //primeng
        TableModule,
        ScrollPanelModule,
        PaginatorModule,
        RouterModule.forChild(routes),
        ActivePipeModule,
        ConfirmationDialogModule,
        InputTextModule,
        ButtonModule,
        CardModule,
        ToggleButtonModule,
        TrimValueModule,
        DropdownModule,
        SafehtmlModule
    ],
    providers: [
        RolesService,
        CommonService
    ]
})
export class RolesModule {}
