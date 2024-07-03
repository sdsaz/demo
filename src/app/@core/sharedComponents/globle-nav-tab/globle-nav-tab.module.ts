import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideNgxMask } from 'ngx-mask';
import { GlobleNavTabComponent } from './globle-nav-tab.component';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';

@NgModule({
  declarations: [
    GlobleNavTabComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule
  ],
  providers:[provideNgxMask({})],
  exports: [
    GlobleNavTabComponent
  ]
})
export class GlobleNavTabModule { }
