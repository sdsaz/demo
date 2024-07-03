//ANGULAR MODULE
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//COMPONENTS
import { ControlLevelLoadingBarComponent } from './control-level-loading-bar.component';

@NgModule({
  declarations: [
    ControlLevelLoadingBarComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ControlLevelLoadingBarComponent
  ]
})
export class ControlLevelLoadingBarModule { }
