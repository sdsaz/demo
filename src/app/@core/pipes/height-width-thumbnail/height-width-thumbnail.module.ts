import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeightWidthThumbnailPipe } from './height-width-thumbnail.pipe';



@NgModule({
  declarations: [
    HeightWidthThumbnailPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [HeightWidthThumbnailPipe]
})
export class HeightWidthThumbnailModule { }
