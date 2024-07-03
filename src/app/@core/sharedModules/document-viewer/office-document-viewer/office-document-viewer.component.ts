//MODULES
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ngx-office-document-viewer',
  templateUrl: './office-document-viewer.component.html',
  styleUrls: ['./office-document-viewer.component.scss']
})
export class OfficeDocumentViewerComponent implements OnInit {

  /***
   * url: Office Document URL.
   */
  @Input() url;

  /***
   * documentType: The type of document such as excel, word or ppt.
   */
  @Input() documentType;

  /***
   * documentLoaded: Callback after document rendered.
   */
  @Output('documentLoaded') documentLoaded = new EventEmitter<boolean>();
 
  className: string;

  constructor() {
  }

  ngOnInit(): void {
    switch (this.documentType) {
      case "excel":
        this.className = "excel-document";
        break;
      case "ppt":
        this.className = "ppt-document";
        break;
      case "word":
        this.className = "word-document";
        break;
      default:
        this.className = "excel-document";
        break;
    }
  }

  contentLoaded() {
    this.documentLoaded.emit(true);
  }
}
