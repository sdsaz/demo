import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';
import { ProfileService } from './profile/profile.service';

const routes: Routes = [
    {
        path: 'users',
        loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
        data: { permission: enumPermissions.ListUsers }
    },
    {
        path: 'roles',
        loadChildren: () => import('./roles/role.module').then(m => m.RolesModule),
        data: { permission: enumPermissions.ListRoles }
    },
    {
        path: 'permissionsets',
        loadChildren: () => import('./permissionsets/permissionset.module').then(m => m.PermissionSetModule),
        data: { permission: enumPermissions.ListPermissionSets }
    },
    {
        path: 'permissions',
        loadChildren: () => import('./permissions/permissions.module').then(m => m.PermissionsModule),
        data: { permission: enumPermissions.ListPermissions }
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    providers:[
        ProfileService
    ],
    exports: [],
    declarations: []
})

export class UserManagementModule { }
