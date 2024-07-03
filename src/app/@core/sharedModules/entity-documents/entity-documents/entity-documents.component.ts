import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { DocumentService } from '../../../sharedComponents/documents/document.service';
import { Actions, DataSources, Entity } from '../../../enum';
import { FileUploader } from 'ng2-file-upload';
import { LoggedUser } from '../../../sharedModels/user';
import { DatasourceService as DataSourceService } from '../../../sharedServices/datasource.service';
import { FileUploadDialogComponent } from '../../../sharedComponents/file-upload-dialog/file-upload-dialog.component';

@Component({
  selector: 'ngx-entity-documents',
  templateUrl: './entity-documents.component.html',
  styleUrls: ['./entity-documents.component.scss']
})
export class EntityDocumentsComponent implements OnChanges, OnInit {

  private fileUploadControlRef: ElementRef;

  @ViewChild('fileUploadControl', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.fileUploadControlRef = content;
    }
  }

  @Input() entityID: number;
  @Input() entityTypeID: number;
  @Input() isDocumentDownloadPermission: boolean = false;
  @Input() entityRecordTypeID: number;
  @Input() entityRecordSubTypeID: number;
  @Input() isEditPermission: boolean = false;
  @Input() refreshFromParent: boolean = false;
  @Input() privacyLevel?: number;

  
  @Output() refreshDocuments = new EventEmitter<boolean>();

  loggedUser: LoggedUser;

  documentTypeList: any[] = [];
  documentSubTypeList: any[] = [];
  
  refreshDocument: boolean = true;
  
  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  uploader: FileUploader | null = null;
  hasDropZoneOver: boolean = false;
  isShowMaxFileAllowedToster: boolean = true;
  isMaxFilePopupShown: boolean = false;

  allowedUploadFileTypes: string[] = ["image", "video","audio", "pdf", "doc", "excel", "compress", "csv"];
  allowMimeTypes: string[] = [];
  allowedUploadFileTypesMessage: string = this.allowedUploadFileTypes.toString().trim().replace(/,/g, ', ').replace(/,(?=[^,]+$)/g, ', or');
  allowTypesMessage = this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.ALLOWTYPES', { allowedFileTypes: this.allowedUploadFileTypesMessage, maxFileSize: this._commonHelper.maxFileSizeInMb });

  //dialog ng model ref model
  modalRef: NgbModalRef | null;

  isRecordTypeExist: boolean;

  constructor(private _modalService: NgbModal, private _commonHelper: CommonHelper,
    private _documentService: DocumentService,
    private _dataSourceService: DataSourceService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    //refresh Activity Data
    if (changes?.refreshFromParent?.previousValue != undefined && changes.refreshFromParent.currentValue != changes.refreshFromParent.previousValue && changes.refreshFromParent.currentValue) {
      if (this.documentTypeList.length > 0) {
        this.documentTypeList.forEach(x => this.setRefreshDocuments(x.value));
      } else {
        this.setRefreshDocuments();
      }
    }
  }

  ngOnInit(): void {
    this.allowMimeTypes = this.getMimeTypesFromFileTypes(this.allowedUploadFileTypes);
    this.configureFileUploader();
    this.getDocumentType();
  }

  setRefreshDocuments(entityRecordTypeID?: number) {
    
    if (this.documentTypeList.length > 0) {
      const obj = this.documentTypeList.find(x => x.value == entityRecordTypeID);
      if (obj) {
        obj.refreshDocument = !obj.refreshDocument;
      }
    } else {
      this.refreshDocument = !this.refreshDocument;
    }
  }

  onAddDeleteUpdateDocument(obj?: any) {

    this.refreshDocument = !this.refreshDocument;

    if (this.documentTypeList.length == 0) {
      this.setRefreshDocuments();
    }  

    if (obj?.hasOwnProperty('sourceEntityRecordType')) {
      this.setRefreshDocuments(obj.sourceEntityRecordType);
    }  
    if (obj?.hasOwnProperty('destinationEntityRecordType')) {
      this.setRefreshDocuments(obj.destinationEntityRecordType);
    }

    this.refreshDocuments.emit(true);
  }

  onSelectFileClick() {
    this.isShowMaxFileAllowedToster = true;
    this.isMaxFilePopupShown = false;
  }

  getMimeTypesFromFileTypes(allowedUploadFileTypes: string[]): any[] {
    let mimeTypes: any[] = [];
    if (allowedUploadFileTypes && allowedUploadFileTypes.length > 0) {
      allowedUploadFileTypes.forEach(fileType => {
        let mimeType = this._commonHelper.getMimeTypes(fileType)
        if (mimeType != null && mimeType.length > 0)
          mimeTypes.push(...mimeType);
      });
    }
    return mimeTypes;
  }

  private configureFileUploader() {
    this.loggedUser = this._commonHelper.getLoggedUserDetail();

    let uploadFileUrl: string = this._documentService.getAddDocumentUrl();

    this.uploader = new FileUploader({
      url: uploadFileUrl,
      allowedMimeType: this.allowMimeTypes,
      removeAfterUpload: true,
      maxFileSize: this._commonHelper.maxFileSizeInMb * 1024 * 1024,
      authTokenHeader: "Authorization",
      authToken: this.loggedUser.accessToken,
      itemAlias: "Files",
      queueLimit: this._commonHelper.maxAllowedFiles
    });

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onAfterAddingAll = (files) => {

      if (this.isMaxFilePopupShown) {
        this.isMaxFilePopupShown = false;
        this.uploader.cancelAll();
        this.uploader.clearQueue();
        return;
      }
      if ((files.length) > this._commonHelper.maxAllowedFiles) {
        this.uploader.clearQueue();
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles }));
        return;
      }

      this.openFileUploadDialog();
    };

    this.uploader.onWhenAddingFileFailed = (item, filter, options) => {
      if (this.isMaxFilePopupShown) return;

      if (filter.name == "queueLimit") {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles })
        );
        this.uploader.cancelAll();
        this.uploader.clearQueue();
        this.isMaxFilePopupShown = true;

      } else if (item.size > options.maxFileSize) {
        if (this.fileUploadControlRef.nativeElement.files.length > this._commonHelper.maxAllowedFiles) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles }));
          this.uploader.cancelAll();
          this.uploader.clearQueue();
          this.isMaxFilePopupShown = true;
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MAX_FILE_SIZE', { fileName: item.name, maxFileSize: this._commonHelper.maxFileSizeInMb })
          );
        }
      } else {
        if (this.fileUploadControlRef.nativeElement.files.length > this._commonHelper.maxAllowedFiles) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles }));
          this.isMaxFilePopupShown = true;
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.UNSUPPORTEDFILE', { fileName: item.name, allowedFileTypes: this.allowedUploadFileTypesMessage })
          );
        }
      }
    };

    this.uploader.onErrorItem = (item: any, response: string, status: number, headers: any): any => {
      if (response) {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MESSAGE_DOCUMENT_ERROR')
        );
      }
    }

    this.uploader.onSuccessItem = (item: any, response: string, status: number, headers: any): any => {
      if (response && response != '') {
        const responseJson = JSON.parse(response);
        if (responseJson?.statusCode == 200) {
          if (responseJson?.data?.length < 1) {
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('DOCUMENTS.FILES_VALIDATION_UNKNOWNERROR', { fileName: item.file.name }));
          }
          else {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.ENTITY_DOCUMENT_DIALOG.MESSAGE_DOCUMENT_ADD', { fileName: item.file.name })
            );
          }
        }
      }
    }

    this.uploader.onCompleteAll = (): any => {
      this.modalRef.close();
      this.setRefreshDocuments(this.modalRef.componentInstance.entityRecordTypeId);
      this.refreshDocuments.emit(true);
      this._commonHelper.hideLoader();
    }
  }

  private openFileUploadDialog() {
    this.optionsForPopupDialog.size = 'lg';
    this.modalRef = this._modalService.open(FileUploadDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = this.entityTypeID;
    this.modalRef.componentInstance.parentEntityTypeId = null;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.entityId = this.entityID;
    this.modalRef.componentInstance.action = Actions.Add;
    this.modalRef.componentInstance.uploader = this.uploader;
    this.modalRef.componentInstance.documentTypeList = this.documentTypeList;
    this.modalRef.componentInstance.documentSubTypeList = this.documentSubTypeList;

    this.modalRef.result.then((response: any[]) => {
      if (!response) {
        this.uploader.clearQueue();
      }
    });
  }

  prepareParamsForDocumentType() : any[] {
     return [
          { name: 'EntityTypeID', type: 'int', value: Entity.Files },
          { name: 'ParentEntityTypeID', type: 'int',value: this.entityTypeID}
        ];
  }

  getDocumentType() {
    return new Promise((resolve, reject) => {
      // prepare params
      const params = this.prepareParamsForDocumentType();
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.DOCUMENTTYPE, params).then((response: any[]) => {
        if (response) {
          this.documentTypeList = response;
          if(this.documentTypeList.length > 0) {
            this.documentTypeList.push({ value: undefined, label: 'Other' });
            this.documentTypeList.forEach(x => {
              x['refreshDocument'] = true;
            });
          }
        }
        this._commonHelper.hideLoader();
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  getTranslateErrorMessage(error) {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }

  recordTypeByValue(index, entityRecordTypeWiseSection) {
    return entityRecordTypeWiseSection.value;
  }

}
