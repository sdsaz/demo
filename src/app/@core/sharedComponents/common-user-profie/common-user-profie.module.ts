
//ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//COMPONENTS
import { CommonUserProfileComponent } from './common-user-profile.component';
import { CommonSkeletonLoaderComponent } from '../common-skeleton-loader/common-skeleton-loader.component';

//MODULES
import { StickyPopoverModule } from '../../../@core/sharedComponents/common-user-profie/user-popover.module';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { HrefLinkPipeModule } from '../../pipes/href-link-pipe/href-link-pipe.module';
import { PhonePipeModule } from '../../pipes/phone-pipe/phone-pipe.module';

//PRIMENG
import { SkeletonModule } from 'primeng/skeleton';

//OTHER
import { AvatarModule } from 'ngx-avatar';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    CommonUserProfileComponent,
    CommonSkeletonLoaderComponent
  ],
  imports: [
    CommonModule,
    AvatarModule,
    StickyPopoverModule,
    NgbTooltipModule ,
    SkeletonModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    HrefLinkPipeModule,
    PhonePipeModule
  ],
  exports: [CommonUserProfileComponent]
})
export class CommonUserProfieModule { }
