import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PrivacyPolicyModule } from '../../../@core/sharedModules/privacy-policy/privacy-policy.module'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '../../usermanagement/profile/profile.service';
import { RemoveWhiteSpaceModule } from '../../../@core/pipes/remove-white-space/remove-white-space.module';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { NbMenuModule } from '@nebular/theme';

const routes = [
  {
      path     : '',
      component: LoginComponent
  }
];

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NbMenuModule,
    RouterModule, 
    RemoveWhiteSpaceModule,    
       
    RouterModule.forChild(routes),
    TranslateModule,
    PrivacyPolicyModule,
    TrimValueModule // for privacy-policy dialog
  ],
  providers:[
    ProfileService
  ]
})


export class LoginModule { }
