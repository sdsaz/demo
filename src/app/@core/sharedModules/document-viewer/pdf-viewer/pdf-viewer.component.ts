//MODULES
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

//THIRD PARTY MODULES
import { PDFProgressData } from 'ng2-pdf-viewer';

@Component({
  selector: 'ngx-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit {

  /***
   * Reference Links:
   * https://github.com/VadimDez/ng2-pdf-viewer
   * https://www.npmjs.com/package/ng2-pdf-viewer
   * Demo: https://vadimdez.github.io/ng2-pdf-viewer 
   */

  /**
   * url: The url of pdf document.
   */
  @Input() url: string;


  /**
   * src: The src of Pdf document src. It's might be url or object.
   */
  @Input() src: any;

  /**
   * isPasswordProtected: Used for password protected document.
   */
  @Input() isPasswordProtected: boolean = false;

  /**
   * renderText: Enable text rendering, allows to select text
   */
  @Input() renderText: boolean = true;

  /**
   * renderTextMode: Used to enable or disable text selection
   * Used in combination with [render-text]="true"
   * Controls if the text layer is enabled, and the selection mode that is used.
   * 0 = RenderTextMode.DISABLED - disable the text selection layer
   * 1 = RenderTextMode.ENABLED - enables the text selection layer
   * 2 = RenderTextMode.ENHANCED - enables enhanced text selection
   */
  @Input() renderTextMode: number;

  /**
   * if set to true - size will be as same as original document
   * if set to false - size will be as same as container block
   */
  @Input() originalSize: boolean = false;

  /**
   * zoom: Used to zoom pdf
   */
  @Input() zoom: number;

  /**
   * width: Width of the pdf viewer
   */
  @Input() width: string = "100%";

  /**
   * height: Height of the pdf viewer
   */
  @Input() height: string = "95vh";


  /**
   * Callback after pdf rendering.
   */
  @Output('afterLoadComplete') afterLoadComplete = new EventEmitter<boolean>();

  /**
   * Error callback
   */
  @Output() error: EventEmitter<any>;

  /**
   * 
   */
  @Output() onProgress: EventEmitter<PDFProgressData>;

  ngOnInit() {
    if (this.isPasswordProtected) {
      this.src = {
        url: this.url,
        withCredentials: true
      }
    } else {
      this.src = this.url;
    }
  }

  pdfLoaded(event: any) {
    this.afterLoadComplete.emit(true);
  }
}