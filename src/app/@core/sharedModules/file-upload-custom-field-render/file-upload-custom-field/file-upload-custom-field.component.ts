import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { Actions } from '../../../enum';
import { DocumentService } from '../../../sharedComponents/documents/document.service';
import { ConfirmationDialogService } from '../../confirmation-dialog/confirmation-dialog.service';
import { DocumentViewerDialogComponent } from '../../document-viewer/document-viewer-dialog/document-viewer-dialog.component';
import { CustomFileUploadDialogComponent } from '../custom-file-upload-dialog/custom-file-upload-dialog.component';

@Component({
  selector: 'ngx-file-upload-custom-field',
  templateUrl: './file-upload-custom-field.component.html',
  styleUrls: ['./file-upload-custom-field.component.scss']
})
export class FileUploadCustomFieldComponent {

  @Output('refreshDocuments') refreshDocuments = new EventEmitter<boolean>();

  @Input() documentType: string;
  @Input() entityId: number;
  @Input() entityTypeId: number;
  @Input() parentEntityTypeId: number;
  @Input() entityRecordTypeId: number;
  @Input() isShowAddFileButton: boolean;
  @Input() dynamicTableCode: string;
  @Input() dynamicTableParamList: any[] = [];
  @Input() isDocumentDownloadPermission: boolean = false;
  
  dynamicComponentData: any;

  refreshFileList: boolean = true;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //dialog ng model ref model
  modalRef: NgbModalRef | null;

  constructor(private _modalService: NgbModal, private _commonHelper: CommonHelper,
    private _confirmationDialogService: ConfirmationDialogService,
    private _documentService: DocumentService) { 
    }

  openFileUploadDialog() {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.optionsForPopupDialog.size = 'lg';
    this.modalRef = this._modalService.open(CustomFileUploadDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.parentEntityTypeId = this.parentEntityTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityId = this.entityId;
    this.modalRef.componentInstance.action = Actions.Add;

    this.modalRef.result.then(response => {
      if (response) {
        this.refreshDynamicTable();
      }
    });
  }

  deleteFile(id: any) {

    const optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('DOCUMENTS.MESSAGE_CONFIRM_DELETE_DOCUMENTS', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          let params = {
            id: id
          }
          this._commonHelper.showLoader();
          this._documentService.deleteDocument(params).then(() => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('DOCUMENTS.MESSAGE_DOCUMENT_DELETE'));
            this.refreshDynamicTable();
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error, 'DOCUMENTS');
            this.refreshDynamicTable();
          });
        }
      })
  }

  refreshDynamicTable() {
    this.refreshFileList = false;
    setTimeout(() => {
      this.refreshFileList = true;
    }, 50);
    this.refreshDocuments.emit(true);
  }

  getTranslateErrorMessage(error, node) {
    if (error && error.messageCode) {
      if (node.length > 0) { node = node + '.' }
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.' + node + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }

  //open document dialog box for document update
  downloadDocument(documentId) {
    if (this.isDocumentDownloadPermission) {
      this._commonHelper.showLoader();
      let params = { id: documentId };
      this._documentService.DownloadFileById(params).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response && response != '') {      
          this._commonHelper.downloadFile(response.fileName, response.mimeType, response.contents);
        }      
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, 'DOCUMENTS');
      });
    }
  }

  editDocument(documentId: number) {
    this._commonHelper.showLoader();
    this._documentService.getDocumentDetailById({ id: documentId }).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response && response != '') {
        this.openEditDocumentPopup(documentId);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error, 'DOCUMENTS');
      this.refreshDynamicTable();
    });
  }

  viewDocument(documentId: number) {
    this._commonHelper.showLoader();
    this._documentService.getDocumentDetailById({ id: documentId }).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response && response != '') {
        const documentMimeType = response?.mimeType || '';
        const url = response?.signedFileUrl || '';
        const documentName = response?.name || '';

        this.openDocumentViewer(documentId, documentMimeType, url, documentName);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error, 'DOCUMENTS');
      this.refreshDynamicTable();
    });
  }

  bindDynamicComponentData(data: any) {
    this.dynamicComponentData = data;
  }

  //#region Private Methods

  private openDocumentViewer(id: number, mimeType: string, url: string, documentName: string) {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    if (this._commonHelper.hasValidDocumentForPreview(mimeType)) {
      this.optionsForPopupDialog.size = 'xl';
      this.optionsForPopupDialog.windowClass = "document-viewer-dialog";
      this.modalRef = this._modalService.open(DocumentViewerDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.documentId = id;
      this.modalRef.componentInstance.url = url;
      this.modalRef.componentInstance.documentName = documentName;
      this.modalRef.componentInstance.documentMimeType = mimeType;
      this.modalRef.componentInstance.isDocumentDownloadPermission = this.isDocumentDownloadPermission;
    } else {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.DOCUMENTS.PREVIEW_RESTRICTED'));
    }
  }

  private openEditDocumentPopup(id: number) {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.optionsForPopupDialog.size = 'lg';
    this.modalRef = this._modalService.open(CustomFileUploadDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.parentEntityTypeId = this.parentEntityTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityId = this.entityId;
    this.modalRef.componentInstance.action = Actions.Edit;
    this.modalRef.componentInstance.recordId = id; 

    this.modalRef.result.then(response => {
      if (response) {
        this.refreshDynamicTable();
      }
    });
  }

  //#endregion Private Methods
}
