import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { DocumentService } from '../document.service';
import { Router } from '@angular/router';
import { LoggedUser } from '../../../sharedModels/user';
import { CommonHelper } from '../../../common-helper';
import { FileUploader } from 'ng2-file-upload';
import { FileUploadDialogComponent } from '../../file-upload-dialog/file-upload-dialog.component';
import { Actions, DataSources, Entity } from '../../../enum';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatasourceService } from '../../../sharedServices/datasource.service';

@Component({
    selector: 'document-form',
    templateUrl: './document-form.component.html',
    styleUrls: ['./document-form.component.scss']
})

export class DocumentFormComponent implements OnInit {
    @Input() entityId: number;
    @Input() entityTypeId: number;
    @Input() allowedFileType: string;
    @Input() isDocumentForCustomField: boolean = false;
    @Output() isDocumentUploadedEmit = new EventEmitter<boolean>();
    @Output() isImageUploadedEmit = new EventEmitter<string>();

    private fileuploadcontrolRef: ElementRef;
    @ViewChild('fileuploadcontrol', { static: false }) set content1(content: ElementRef) {
        if (content) { // initially setter gets called with undefined
            this.fileuploadcontrolRef = content;
        }
    }

    uploader: FileUploader | null = null;
    hasDropZoneOver: boolean = false;

    loggedUser: LoggedUser;
    allowedUploadFileTypes: string[];

    documentUploadMsg: string;
    allowMimeTypes: string[] = [];


    isMaxFilePopupShown: boolean = false;
    
    //all popup dialog open option settings
    optionsForPopupDialog: any = {
        size: "md",
        centered: false,
        backdrop: 'static',
        keyboard: false
    };

    //dialog ng model ref model
    modalRef: NgbModalRef | null;

    documentTypeList: any[] = [];
    
    constructor(public _route: Router,
        private _commonHelper: CommonHelper,
        private _documentService: DocumentService,
        private _modalService: NgbModal,
        private _dataSourceService: DatasourceService) { }

    ngOnInit() {
        if (this.allowedFileType && this.allowedFileType.trim() != '') {
            let fileTypes = this.allowedFileType.split(',');

            if (fileTypes && fileTypes.length > 0) {
                fileTypes.forEach(fileType => {
                    let mimeTypes = this._commonHelper.getMimeTypes(fileType);

                    if (mimeTypes != null && mimeTypes.length > 0)
                        this.allowMimeTypes.push(...mimeTypes);
                });
            }
        }

        // Get login user detail from local storage.
        this.loggedUser = this._commonHelper.getLoggedUserDetail();
        if (this.loggedUser == undefined) {
            this._route.navigate(['/auth/login']);
        }

        this.getDocumentType();
        let uploadFileUrl: string = this._documentService.getAddDocumentUrl();

        this.uploader = new FileUploader({
            url: uploadFileUrl,
            removeAfterUpload: true,
            maxFileSize: this._commonHelper.maxFileSizeInMb * 1024 * 1024,
            authTokenHeader: "Authorization",
            authToken: this.loggedUser.accessToken,
            itemAlias: "Files",
            allowedMimeType: this.allowMimeTypes,
            queueLimit: this._commonHelper.maxAllowedFiles
        });

        this.uploader.onAfterAddingFile = (file) => {
            file.withCredentials = false;
        };

        this.uploader.onAfterAddingAll = (files) => {
            if (this.isMaxFilePopupShown) {
                files.forEach((file: any) => {
                    this.uploader.removeFromQueue(file);
                });
                this.isMaxFilePopupShown = false;
                this.uploader.cancelAll();
                this.uploader.clearQueue();
                return;
            }

            if ((files.length) > this._commonHelper.maxAllowedFiles) {
                this.uploader.clearQueue();
                this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('DOCUMENTS.MAX_ALLOWED_FILES', { MaxFiles: this._commonHelper.maxAllowedFiles }));
                return;
            }

            files.forEach((file: any) => {
             if (this.allowMimeTypes.indexOf(file.file.type) == -1) {
                    this.uploader.clearQueue();
                    this._commonHelper.showToastrError(
                        this._commonHelper.getInstanceTranlationData('DOCUMENTS.UNSUPPORTEDFILE', { fileName: file.file.name, allowedFileType: this.allowedFileType.trim().replace(/,/g, ', ').replace(/,(?=[^,]+$)/g, ', or') })
                    );
                    return;
                }
            });

            this.openFileUploadDialog();
        };

        this.uploader.onWhenAddingFileFailed = (item, filter, options) => {

            if (this.isMaxFilePopupShown) return;

            if (filter.name == "queueLimit") {
                this._commonHelper.showToastrError(
                    this._commonHelper.getInstanceTranlationData('DOCUMENTS.MAX_ALLOWED_FILES', { MaxFiles: this._commonHelper.maxAllowedFiles }));
                this.isMaxFilePopupShown = true;
            }
            else if (item.size > options.maxFileSize) {
                if (this.fileuploadcontrolRef.nativeElement.files.length > this._commonHelper.maxAllowedFiles) {
                    this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('DOCUMENTS.MAX_ALLOWED_FILES', { MaxFiles: this._commonHelper.maxAllowedFiles }));
                    this.uploader.cancelAll();
                    this.uploader.clearQueue();
                    this.isMaxFilePopupShown = true;
                } else {
                    this._commonHelper.showToastrError(
                        this._commonHelper.getInstanceTranlationData('DOCUMENTS.MAX_FILE_SIZE', { fileName: item.name, maxFileSize: this._commonHelper.maxFileSizeInMb })
                    );
                }
            } else {
                if (this.fileuploadcontrolRef.nativeElement.files.length > this._commonHelper.maxAllowedFiles) {
                    this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('DOCUMENTS.MAX_ALLOWED_FILES', { MaxFiles: this._commonHelper.maxAllowedFiles }));
                    this.uploader.cancelAll();
                    this.uploader.clearQueue();
                    this.isMaxFilePopupShown = true;
                } else {
                    this._commonHelper.showToastrError(
                        this._commonHelper.getInstanceTranlationData('DOCUMENTS.UNSUPPORTEDFILE', { fileName: item.name, allowedFileType: this.allowedFileType.trim().replace(/,/g, ', ').replace(/,(?=[^,]+$)/g, ', or') })
                    );
                }
            }
        };

        this.uploader.onSuccessItem = (item: any, response: string, status: number, headers: any): any => {
            if (response && response != '') {
                const responseJson = JSON.parse(response);

                if (responseJson?.statusCode == 200) {
                    if (this.isDocumentForCustomField) {
                        this.isImageUploadedEmit.emit(response);
                        this._commonHelper.showToastrSuccess(
                            this._commonHelper.getInstanceTranlationData('DOCUMENTS.MESSAGE_IMAGE_ADD', { fileName: item.file.name })
                        );
                    } else if (responseJson?.data?.length < 1){
                        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('DOCUMENTS.FILES_VALIDATION_UNKNOWNERROR', { fileName: item.file.name }));
                    }
                    else {
                        //this.isDocumentUploadedEmit.emit(true);
                        this._commonHelper.showToastrSuccess(
                            this._commonHelper.getInstanceTranlationData('DOCUMENTS.MESSAGE_DOCUMENT_ADD', { fileName: item.file.name })
                        );
                    }
                } else {
                    const messageCode = responseJson?.messageCode || ''
                    if (messageCode && messageCode != '') {
                        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData(`DOCUMENTS.${messageCode.replaceAll('.', '_').toUpperCase()}`));
                    }
                }
            }
        }

        this.uploader.onCompleteAll = (): any => {
            this.isDocumentUploadedEmit.emit(true);
            this.modalRef.close();
            this._commonHelper.hideLoader();
        }

        //supported file document upload label.
        this.documentUploadMsg = this._commonHelper.getInstanceTranlationData('DOCUMENTS.ALLOWTYPES', { allowedFileType: this.allowedFileType.trim().replace(/,/g, ', ').replace(/,(?=[^,]+$)/g, ', or'), maxFileSize: this._commonHelper.maxFileSizeInMb });
    }

    public onSelectFileClick() {
        this.isMaxFilePopupShown = false;
    }

    public fileOverBase(e: any): void {
        this.isMaxFilePopupShown = false;
        this.hasDropZoneOver = e;
    }

    private openFileUploadDialog() {
        this.optionsForPopupDialog.size = 'lg';
        this.modalRef = this._modalService.open(FileUploadDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
        this.modalRef.componentInstance.parentEntityTypeId = null;
        this.modalRef.componentInstance.entityRecordTypeId = null;
        this.modalRef.componentInstance.entityId = this.entityId;
        this.modalRef.componentInstance.action = Actions.Add;
        this.modalRef.componentInstance.uploader = this.uploader;
        this.modalRef.componentInstance.documentTypeList = this.documentTypeList;
        
        this.modalRef.result.then((response: any[]) => {
            if (!response) {
                this.uploader.clearQueue();
            }
        });
    }

    getDocumentType() {
        return new Promise((resolve, reject) => {
            const params = this.prepareParamsForDocumentType();
            this._commonHelper.showLoader();
            this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.DOCUMENTTYPE, params).then((response: any[]) => {
                if (response) {
                    this.documentTypeList = response;
                }
                this._commonHelper.hideLoader();
                resolve(null);
            }, (error) => {
                this._commonHelper.hideLoader();
                reject(null);
            });
        });
    }

    prepareParamsForDocumentType(): any[] {
        return [
            { name: 'EntityTypeID', type: 'int', value: Entity.Files },
            { name: 'ParentEntityTypeID', type: 'int', value: this.entityTypeId }
        ];
    }
}
