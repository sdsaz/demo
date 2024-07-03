import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogoutComponent } from './logout/logout.component';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ReturnLoginComponent } from './return-login/return-login.component';
import { UsersService } from '../usermanagement/users/users.service';

const routes: Routes = [
    {
        path: 'login',
        loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
    },
    {
        path: 'forgotpassword',
        loadChildren: () => import('./forgot-password/forgot-password.module').then(m => m.ForgotPasswordModule)

    },
    {
        path: 'resetpassword',
        loadChildren: () => import('./reset-password/reset-password.module').then(m => m.ResetPasswordModule)

    },
    {
        path: 'useractivation',
        loadChildren: () => import('./user-activation/user-activation.module').then(m => m.UserActivationModule)

    },
    {
        path: 'emailverification',
        loadChildren: () => import('./email-verification/email-verification.module').then(m => m.EmailVerificationModule)

    },
    {
        path: 'logout',
        component: LogoutComponent
    },
    {
        path: 'autologin',
        component: AutoLoginComponent
    },
    {
        path: 'returnlogin',
        component: ReturnLoginComponent
    },
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    declarations: [LogoutComponent, AutoLoginComponent, ReturnLoginComponent],
    providers: [UsersService]
})
export class AuthModule { }


