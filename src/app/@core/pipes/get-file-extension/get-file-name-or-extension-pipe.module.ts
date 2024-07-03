import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetFileNameOrExtensionPipe } from './get-file-name-or-extension-pipe.pipe';


@NgModule({
  declarations: [
    GetFileNameOrExtensionPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GetFileNameOrExtensionPipe
  ]
})
export class GetFileNameOrExtensionPipeModule { }
