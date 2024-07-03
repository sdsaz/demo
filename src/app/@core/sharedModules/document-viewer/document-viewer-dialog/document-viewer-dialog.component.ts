//MODULES
import { Component, Input, OnInit } from '@angular/core';

//COMMON
import { CommonHelper } from '../../../common-helper';
import { DocumentViewerType } from '../../../enum';

//SERVICES
import { DocumentService } from '../../../sharedComponents/documents/document.service';

//THIRD PARTY PACKAGES
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-document-viewer-dialog',
  templateUrl: './document-viewer-dialog.component.html',
  styleUrls: ['./document-viewer-dialog.component.scss']
})
export class DocumentViewerDialogComponent implements OnInit {

  /***
   * documentId: The document id (File Id).
   */
  @Input() documentId: number;

  /***
   * isDocumentDownloadPermission: The download document permission
   */
  @Input() isDocumentDownloadPermission: boolean = false;

  /***
   * documentMimeType: This document mime type such as "image/jpeg"
   */
  @Input() documentMimeType: string;

  /***
   * documentName: The document name
   */
   @Input() documentName: string;

  /***
   * url: The url of the document
   */
   @Input() url: string;

   /***
   * url: The url of the thumbnail of the document
   */
   @Input() thumbnailUrl: string;


  /**
   * When Close Icon needs to show or hide
   */
  @Input() showCloseIcon: boolean = true;

  documentType: string;

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _documentService: DocumentService) {
  }

  ngOnInit(): void {
    this.setDocumentType();
  }

  downloadDocument(): void {
    if (this.isDocumentDownloadPermission) {
      this._commonHelper.showLoader();
      let params = { id: this.documentId };
      this._documentService.DownloadFileById(params).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response && response != '') {
          this._commonHelper.downloadFile(response.fileName, response.mimeType, response.contents);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
  }

  setDocumentType(): void {
    this.documentType = this._commonHelper.getDocumentViewerType(this.documentMimeType);

    if (![DocumentViewerType.Image.toString(), DocumentViewerType.Csv.toString(), DocumentViewerType.Video.toString(),DocumentViewerType.Audio.toString()].includes(this.documentType)) {
      this._commonHelper.showLoader();
    }
  }

  getTranslateErrorMessage(error) {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData(`COMMON.DOCUMENT_VIEWER.${error.messageCode.replaceAll('.', '_').toUpperCase()}`));
    }
  }

  documentLoaded(isDocumentLoaded: boolean): void {
    if (isDocumentLoaded) {
      this._commonHelper.hideLoader();
    }
  }

  onCloseForm(status: boolean): void {
    this._commonHelper.hideLoader();
    this._ngbActiveModal.close(status);
  }

}
