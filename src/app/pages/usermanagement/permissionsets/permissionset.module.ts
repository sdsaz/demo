import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { RouterModule, Routes } from '@angular/router';
import { TableModule } from 'primeng/table';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PaginatorModule } from 'primeng/paginator';

import { ActivePipeModule } from '../../../@core/pipes/active-pipe/active-pipe-module';
import { GroupByPipeModule } from '../../../@core/pipes/group-by-pipe/group-by-pipe-module';
import { ConfirmationDialogModule } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';

import { PermissionSetListComponent } from './permissionset-list/permissionset-list.component';
import { PermissionSetFormComponent } from './permissionset-form/permissionset-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionSetService } from './permissionset.service';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';

const routes: Routes = [
    {
        path: '',
        component: PermissionSetListComponent
    },
    {
        path: 'add',
        component: PermissionSetFormComponent
    },
    {
        path: 'details/:id',
        component: PermissionSetFormComponent
    }
];

@NgModule({
    declarations: [
        PermissionSetListComponent,
        PermissionSetFormComponent
    ],
    exports: [],
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
        GroupByPipeModule,
        ConfirmationDialogModule,
        ButtonModule,
        InputTextModule,
        CardModule,
        ToggleButtonModule,
        TrimValueModule
    ],
    providers: [
        PermissionSetService
    ]
})

export class PermissionSetModule {}
