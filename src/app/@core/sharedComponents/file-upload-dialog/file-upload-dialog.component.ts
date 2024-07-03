import { Component, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileUploader } from 'ng2-file-upload';
import { CommonHelper } from '../../common-helper';
import { Actions, DataSources, Entity } from '../../enum';
import { DatasourceService } from '../../sharedServices/datasource.service';
import { DocumentService } from '../documents/document.service';

@Component({
  selector: 'ngx-file-upload-dialog',
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.scss']
})
export class FileUploadDialogComponent {

  @ViewChild('name') public name: FormControl;
  /**
   * EntityId of an Entity 
   */
  @Input() entityId: number;
  /**
   * EntityTypeId of an Entity
   */
  @Input() entityTypeId: number;
  /**
   * ParentEntityTypeId of an Entity
   */
  @Input() parentEntityTypeId?: number;
  /**
   * RecordTypeId of an Entity
   */
  @Input() entityRecordTypeId?: number;
  /**
   * bulkData
   */
  @Input() bulkData: any;
  /**
   * Action Type : Add, Edit
   */
  @Input() action: Actions;
  @Input() documentTypeList: any[] = [];
  @Input() documentSubTypeList: any[] = [];

  // uploader: FileUploader | null = null;
  @Input() uploader: FileUploader;

  isShowMaxFileAllowedToster: boolean = true;

  submitted: boolean = false;
  fileName: any[] = [];
  description?: string;
  documentSubTypeId?: number = null;
  actionEnums = Actions;

  fileDto: any = {};

  filesCount: number;

  isShowFileName: boolean;
  fileIds: string;
  isPrivate: boolean;
  oldEntityRecordType: any;
  updatedEntityRecordType: any;

  constructor(public _commonHelper: CommonHelper,
    private _ngbActiveModal: NgbActiveModal,
    private _documentService: DocumentService,
    private _dataSourceService: DatasourceService) {
  }

  ngOnInit(): void {
    if (this.documentTypeList?.length > 0) {
      this.documentTypeList = this.documentTypeList.filter(x => x.value);
    }
    if (this.action == Actions.Edit) {
      this.entityRecordTypeId = this.fileDto.entityRecordTypeID;
      this.entityTypeId = this.fileDto.entityTypeID;
      if (this.entityRecordTypeId) {
        this.documentSubTypeId = this.fileDto.entityRecordSubTypeID;
        this.getDocumentSubType();
      }

      this.description = this.fileDto.description;
      this.fileName = this.separateFileName(this.fileDto.name);
      this.oldEntityRecordType = this.entityRecordTypeId

    } else if(this.action == Actions.BulkEdit) {

      let fileId = this.bulkData.map(x => x.fileId);
      this.fileIds = fileId.toString();
      let recordTypeId = this.bulkData?.find(s => s.entityRecordTypeID)
      this.entityRecordTypeId = recordTypeId.entityRecordTypeID;
      let entityTypeId = this.bulkData?.find(s => s.entityTypeID)
      this.entityTypeId = entityTypeId.entityTypeID;
      if(this.entityRecordTypeId) {
        this.documentSubTypeId = null;
        this.getDocumentSubType();
      }
      this.description = null;
      let isPrivate = this.bulkData?.find(x => x.isPrivate);
      this.isPrivate = isPrivate?.isPrivate;
      this.oldEntityRecordType = this.entityRecordTypeId
    } else {

      this.filesCount = this.uploader.queue.length;
      if (this.uploader && this.uploader.queue.length == 1) {
        this.fileName = this.separateFileName(this.uploader.queue[0].file.name);
      }
      
    }
  }

  separateFileName(fullFilename): any[] {
    let fileName = fullFilename.split('.');
    let extension = fileName[fileName.length - 1];
    fileName.pop();
    fileName = [fileName.join('.')];
    fileName.push(extension);
    return fileName;
  }

  onCloseForm() {
    this._ngbActiveModal.close();
  }

  saveData() {

    if (this.action == Actions.Add && this.uploader.queue.length == 0) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('COMMON.FILE_UPLOAD_DIALOG.MESSAGE_SELECT_FILE')
      );
      return;
    }

    this.submitted = true;
    if(this.action == Actions.Add && (this.uploader.queue.length == 1) || this.action == Actions.Edit) {
      if(this.name.invalid) {
        return;
      }
    }
    

    if (this.uploader && this.uploader.queue.length == 1) {
      if (this.fileName[0].trim() === '') {
        this.fileName[0] = '';
        return false;
      }
    }
    if (this.action == Actions.Add) {

      if (this.uploader && this.uploader.queue.length == 1) {
        this.uploader.queue[0].file.name = this.fileName.join('.');
      }

      this.uploader.onBuildItemForm = (fileItem: any, form: any) => {
        form.append('EntityTypeID', this.entityTypeId);
        form.append('EntityID', this.entityId);
        if (this.description) {
          form.append('Description', this.description);
        }
        if (this.entityRecordTypeId) {
          form.append('EntityRecordTypeID', this.entityRecordTypeId);
          if (this.documentSubTypeId) {
            form.append('EntityRecordSubTypeID', this.documentSubTypeId);
          }
        }
      };

      this._commonHelper.showLoader();
      this.uploader.uploadAll();
    } else {
      this.action == Actions.BulkEdit ? this.updateBulkFiles() : this.updateFile();
    }
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  private getTranslateErrorMessage(error: any): string {
    return this._commonHelper.getInstanceTranlationData('COMMON.FILE_UPLOAD_DIALOG.' + (error.messageCode.replaceAll('.', '_')).toUpperCase());
  }

  private updateFile() {
    const data = {
      id: this.fileDto.id,
      name: this.fileName.join('.'),
      entityRecordTypeID: this.entityRecordTypeId,
      description: this.description,
      isPrivate: this.fileDto.isPrivate,
      entityRecordSubTypeID: this.documentSubTypeId
    }

    this._commonHelper.showLoader();
    this._documentService.updateDocument(data).then(() => {
      this._commonHelper.hideLoader();
      if (this.action == Actions.Add) {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('COMMON.FILE_UPLOAD_DIALOG.MESSAGE_DOCUMENT_ADD')
        );
      } else {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('COMMON.FILE_UPLOAD_DIALOG.MESSAGE_RECORD_UPDATED')
        );
      }
      if (this.documentTypeList.length > 0 ) {
        let obj = {};
        if (this.oldEntityRecordType != this.entityRecordTypeId) {
          obj = { 'sourceEntityRecordType' : this.oldEntityRecordType, 'destinationEntityRecordType' : this.entityRecordTypeId };
        } else {
          obj = { 'sourceEntityRecordType' : this.oldEntityRecordType };
        }
        this._ngbActiveModal.close(obj);
      } else {
        this._ngbActiveModal.close({ 'sourceEntityRecordType' : null, 'destinationEntityRecordType' : null });
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private updateBulkFiles() {
    const data = {
      ids: this.fileIds,
      entityRecordTypeID: this.entityRecordTypeId,
      description: this.description,
      entityRecordSubTypeID: this.documentSubTypeId,
      isPrivate: this.isPrivate,
    }

    this._commonHelper.showLoader();
    this._documentService.bulkEditFiles(data).then(() => {
      this._commonHelper.hideLoader();
      if (this.action == Actions.Add) {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('COMMON.FILE_UPLOAD_DIALOG.MESSAGE_DOCUMENT_ADD')
        );
      } else {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('COMMON.FILE_UPLOAD_DIALOG.MESSAGE_RECORD_UPDATED')
        );
      }
      let obj = {};
      if (this.oldEntityRecordType != this.entityRecordTypeId) {
        obj = { 'sourceEntityRecordType': this.oldEntityRecordType, 'destinationEntityRecordType': this.entityRecordTypeId };
      } else {
        obj = { 'sourceEntityRecordType': this.oldEntityRecordType };
      }
      this._ngbActiveModal.close(obj);
      //this._ngbActiveModal.close({ 'sourceEntityRecordType' : this.oldEntityRecordType, 'destinationEntityRecordType' : this.entityRecordTypeId });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private getDocumentSubType() {
    return new Promise((resolve, reject) => {
      // prepare params
      const params = this.prepareParamsForRecordSubType();
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.FILESUBTYPE, params).then((response: any) => {
        if (response) {
          this.documentSubTypeList = response as [];
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

  private prepareParamsForRecordSubType(): any[] {
    return [{ name: 'EntityTypeID', type: 'int', value: Entity.Files },
    { name: 'ParentEntityTypeID', type: 'int', value: this.entityTypeId },
    { name: 'ParentID', type: 'int', value: this.entityRecordTypeId }
    ];
  }

  onTypeChange(e) {
    if (e.value) {
      this.entityRecordTypeId = e.value;
      this.documentSubTypeId = null;
      this.getDocumentSubType();
      this.updatedEntityRecordType = e.value;
    }
  }

  onTypeClear() {
    this.entityRecordTypeId = null;
    this.documentSubTypeId = null;
    this.documentSubTypeList = [];
    this.updatedEntityRecordType = null;
  }

  uploaderRemoveFiles(file) {
    this.uploader.removeFromQueue(file);
    this.filesCount = this.uploader.queue.length;
    this.fileName = this.separateFileName(this.uploader.queue[0].file.name);
  }
}
