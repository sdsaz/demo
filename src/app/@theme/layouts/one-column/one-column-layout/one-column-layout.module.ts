import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OneColumnLayoutComponent } from '../one-column.layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { NbLayoutModule, NbSidebarModule } from '@nebular/theme';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';
import { ProfileService } from '../../../../pages/usermanagement/profile/profile.service';
import { InputSwitchModule } from 'primeng/inputswitch';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [OneColumnLayoutComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToggleButtonModule,
    NbLayoutModule,
    NbSidebarModule,
    NgbTooltipModule,
    TranslateModule,
    AvatarModule,
    InputSwitchModule,
    RouterModule
  ],
  exports: [
    OneColumnLayoutComponent
  ],
  providers: [ProfileService]
})
export class OneColumnLayoutModule { }
