//MODULES
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent {

  /***
   * Image URL.
   */
  @Input() url;

  constructor() {
  }
}
