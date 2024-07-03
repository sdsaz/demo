import { NgModule } from '@angular/core';
//import { ImageAreaSelectComponent } from './image-area-select.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ImageAreaSelectComponent } from './image-area-select.component';

@NgModule({
    declarations: [
        ImageAreaSelectComponent
    ],
    imports: [
        ImageCropperModule
    ],
    exports: [],
    providers: []
})
export class ImageAreaSelectModule
{
}
