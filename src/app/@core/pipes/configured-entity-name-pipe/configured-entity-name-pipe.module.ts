import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguredEntityNamePipe } from './configured-entity-name.pipe';



@NgModule({
  declarations: [
    ConfiguredEntityNamePipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ConfiguredEntityNamePipe
  ],
  providers:[ConfiguredEntityNamePipe]
})
export class ConfiguredEntityNamePipeModule { }
