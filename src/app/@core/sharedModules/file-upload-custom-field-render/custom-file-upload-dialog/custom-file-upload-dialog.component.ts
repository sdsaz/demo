import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { Actions, DataSources, Entity } from '../../../enum';
import { CommonService } from '../../../sharedServices/common.service';
import { FileUploader } from 'ng2-file-upload';
import { DocumentService } from '../../../sharedComponents/documents/document.service';
import { LoggedUser } from '../../../sharedModels/user';
import { DatasourceService } from '../../../sharedServices/datasource.service';

@Component({
  selector: 'ngx-custom-file-upload-dialog',
  templateUrl: './custom-file-upload-dialog.component.html',
  styleUrls: ['./custom-file-upload-dialog.component.scss']
})
export class CustomFileUploadDialogComponent implements OnInit {

  private fileuploadcontrolRef: ElementRef;
  @ViewChild('fileuploadcontrol', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.fileuploadcontrolRef = content;
    }
  }

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
  @Input() parentEntityTypeId: number;
  /**
   * RecordTypeId of an Entity
   */
  @Input() entityRecordTypeId: number;
  /**
   * Action Type : Add, Edit
   */
  @Input() action: Actions;
  /**
   * File Id
   */
  @Input() recordId: number;

  customFormGroup: UntypedFormGroup;
  customFields: any[] = [];
  customFieldControls: any[] = [];
  customDto: any = {};

  uploader: FileUploader | null = null;
  loggedUser: LoggedUser;
  allowedUploadFileTypes: string[] = ["image", "pdf", "doc", "xls",];

  allowedUploadFileTypesMessage: string = this.allowedUploadFileTypes.toString().trim().replace(/,/g, ', ').replace(/,(?=[^,]+$)/g, ', or');
  allowTypesMessage = this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.ALLOWTYPES', { allowedFileTypes: this.allowedUploadFileTypesMessage,maxFileSize: this._commonHelper.maxFileSizeInMb });

  isShowMaxFileAllowedToster: boolean = true;

  submitted: boolean = false;
  description: string = '';
  recordSubTypeId: any;
  actionEnums = Actions;

  fileDto: any = {};

  fileRecordSubType: any[] = [];
  isFromDropArea: boolean = false;
  hasDropZoneOver: boolean = false;

  isMaxFilePopupShown: boolean = false;

  constructor(public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _formBuilder: UntypedFormBuilder,
    private _ngbActiveModal: NgbActiveModal,
    private _documentService: DocumentService,
    private _dataSourceService: DatasourceService) {
    this.customFormGroup = this._formBuilder.group({});
  }

  ngOnInit(): void {
    if (this.action == Actions.Add) {
      this.configureFileUploader();
    }
    this.getRecordSubType();
    this.getCustomFields();
  }

  onCloseForm() {
    this._ngbActiveModal.close(false);
  }

  saveData() {

    if (this.action == Actions.Add && this.uploader.queue.length == 0) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_SELECT_FILE')
      );
      return;
    }

    if (this.fileRecordSubType && this.fileRecordSubType.length > 0 && !this.recordSubTypeId) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_SELECT_RECORD_TYPE')
      );
      return;
    }

    this.submitted = true;
    if (this.customFormGroup.invalid) {
      this.validateAllFormFields(this.customFormGroup);
      return;
    }

    if (this.action == Actions.Add) {
      this.uploader.onBuildItemForm = (fileItem: any, form: any) => {
        form.append('EntityTypeID', this.parentEntityTypeId);
        form.append('EntityID', this.entityId);
        form.append('EntityRecordTypeID', this.entityRecordTypeId);
        form.append('Description', this.description);
        if (this.recordSubTypeId) {
          form.append('EntityRecordSubTypeID', this.recordSubTypeId);
        }
      };

      this._commonHelper.showLoader();
      this.uploader.uploadAll();
    } else {
      this.updateFile();
    }
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  onSelectFileClick(){
    this.isShowMaxFileAllowedToster = true;
    this.isMaxFilePopupShown = false;
  }

  /**
   * Configure event for upload
   */
  private configureFileUploader() {
    // Get login user detail from local storage.
    this.loggedUser = this._commonHelper.getLoggedUserDetail();

    let uploadFileUrl: string = this._documentService.getAddDocumentUrl();

    this.uploader = new FileUploader({
      url: uploadFileUrl,
      allowedFileType: this.allowedUploadFileTypes,
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
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles }));
        return;
      }
    };

    this.uploader.onWhenAddingFileFailed = (item, filter, options) => {
      if (this.isMaxFilePopupShown) return;

      if (filter.name == "queueLimit") {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles })
        );
        this.uploader.cancelAll();
        this.uploader.clearQueue();
        this.isMaxFilePopupShown = true;

      } else if (item.size > options.maxFileSize) {
        if (this.fileuploadcontrolRef.nativeElement.files.length > this._commonHelper.maxAllowedFiles) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles }));
          this.uploader.cancelAll();
          this.uploader.clearQueue();
          this.isMaxFilePopupShown = true;
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MAX_FILE_SIZE', { fileName: item.name, maxFileSize: this._commonHelper.maxFileSizeInMb })
          );
        }
      } else {
        if (this.fileuploadcontrolRef.nativeElement.files.length > this._commonHelper.maxAllowedFiles) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MAX_ALLOWED_FILES', { maxAllowedFiles: this._commonHelper.maxAllowedFiles }));
          this.isMaxFilePopupShown = true;
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.UNSUPPORTEDFILE', { fileName: item.name, allowedFileTypes: this.allowedUploadFileTypesMessage })
          );
        }
      }
    };

    this.uploader.onSuccessItem = (item: any, response: string, status: number, headers: any): any => {
      if (response) {
        if (this.customFieldControls.length > 0) {
          Promise.all([
            this.saveFileCustomField(JSON.parse(response).data[0].id)
          ]).then(() => {
            if (this.action == Actions.Add) {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_DOCUMENT_ADD', { fileName: item.file.name })
              );
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_RECORD_UPDATED')
              );
            }
          });
        } else {
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_DOCUMENT_ADD', { fileName: item.file.name })
          );
        }
      }
    }

    this.uploader.onErrorItem = (item: any, response: string, status: number, headers: any): any => {
      if (response) {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_DOCUMENT_ERROR')
        );
      }
    }

    this.uploader.onCompleteAll = (): any => {
      this._ngbActiveModal.close(true);
      this._commonHelper.hideLoader();
    }
  }

  private getCustomFields(): void {
    if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
      let param = { entityTypeId: Entity.Files, entityRecordTypeId: this.entityRecordTypeId };
      this._commonHelper.showLoader();
      this._commonService.getCustomFields(param).then((response: any) => {
        if (response) {

          this.customFields = response?.customFields || [];
          this.customDto.customFieldJSONData = this._commonHelper.tryParseJson(response?.customFieldJson);

          this.prepareCustomFieldControlsInJSON();
          this.prepareFormCustomFields();

          if (this.action == Actions.Edit) {
            this.getFileDetailById();
          }
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
  }

  private prepareCustomFieldControlsInJSON(): void {
    this.customFields.forEach((customField: any) => {
      if (customField.isVisible) {
        let control = {
          displayOrder: customField.displayOrder,
          fieldName: customField.fieldName,
          fieldType: customField.fieldType,
          fieldClass: customField.fieldClass,
          defaultValue: customField.defaultValue,
          label: customField.label,
          optionsJSON: customField.optionsJSON ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
          settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : ''
        };

        this.customFieldControls.push(control);
      }
    });
    this.customFieldControls.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
  }

  private getTranslateErrorMessage(error: any): string {
    return this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.' + (error.messageCode.replaceAll('.', '_')).toUpperCase());
  }

  private prepareFormCustomFields(): void {
    this.customFieldControls.forEach(control => {
      this.customFormGroup.addControl(control.fieldName, new UntypedFormControl());
      if (control.settingsJSON) {
        let validatorFn: ValidatorFn[] = [];
        if (control.settingsJSON['isRequired']) {
          validatorFn.push(Validators.required);
        }
        if (control.settingsJSON['minLength']) {
          validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
        }
        if (control.settingsJSON['maxLength']) {
          validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
        }
        if (validatorFn.length > 0) {
          this.customFormGroup.controls[control.fieldName].setValidators(validatorFn);
          this.customFormGroup.controls[control.fieldName].updateValueAndValidity();
        }
      }
    });
  }


  private updateFile() {
    const data = {
      id: this.fileDto.id,
      name: this.fileDto.name,
      entityRecordTypeID: this.fileDto.entityRecordTypeID,
      description: this.description,
      isPrivate: this.fileDto.isPrivate,
      entityRecordSubTypeID: this.recordSubTypeId
    }

    this._commonHelper.showLoader();
    this._documentService.updateDocument(data).then(() => {
      this._commonHelper.hideLoader();
      if (this.customFieldControls.length > 0) {
        Promise.all([
          this.saveFileCustomField(this.recordId)
        ]).then(() => {
          if (this.action == Actions.Add) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_DOCUMENT_ADD')
            );
          } else {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_RECORD_UPDATED')
            );
          }
        });
      } else {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('COMMON.CUSTOM_FILE_UPLOAD.MESSAGE_RECORD_UPDATED')
        );
      }
      this._ngbActiveModal.close(true);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private saveFileCustomField(fileId: any) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      const customFieldJson = this.customFormGroup.getRawValue();

      Object.keys(customFieldJson).forEach(x => {
        if (Array.isArray(customFieldJson[x])) {
          customFieldJson[x] = (customFieldJson[x] as []).join(',');
        }
      });

      const payload = {
        "fileId": fileId,
        "entityRecordTypeId": this.entityRecordTypeId,
        "parentEntityId": this.entityId,
        "customFieldJSONData": customFieldJson
      }

      this._documentService.saveFileCustomFieldData(payload).then(response => {
        this._commonHelper.hideLoader();
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  //For Form Validate
  private validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  private getFileDetailById() {
    this._commonHelper.showLoader();
    this._documentService.getDocumentDetailById({ id: this.recordId }).then(res => {
      if (res) {
        this.fileDto = res;
        this.description = res['description'];
        this.getCustomFieldValues();
        this.recordSubTypeId = res['entityRecordSubTypeID'];
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private getCustomFieldValues() {
    const params = {
      entityTypeId: Entity.Files,
      entityRecordTypeId: this.entityRecordTypeId,
      entityId: this.recordId
    };

    this._commonHelper.showLoader();
    this._commonService.getCustomFieldsForList(params).then((response: any) => {
      if (response.length > 0) {
        if (response[0].customFieldsJson) {
          const customFieldsJson = this._commonHelper.tryParseJson(response[0].customFieldsJson);
          if (customFieldsJson && customFieldsJson.length > 0) {
            this.fillCustomFieldFormGroup(customFieldsJson[0]);
          }
        }
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private fillCustomFieldFormGroup(customFieldsJson: any) {
    Object.keys(customFieldsJson).forEach(property => {
      if (customFieldsJson[property] && customFieldsJson[property] !== '') {
        const control = this.customFieldControls.find(x => x.fieldName == property);
        if (control) {
          if (control.fieldType == 'Picklist (MultiSelect)') {
            this.customFormGroup.get(property).patchValue((customFieldsJson[property]).split(','));
          }
          else {
            this.customFormGroup.get(property).patchValue(customFieldsJson[property]);
          }
        }
      }
    });
  }

  private getRecordSubType() {
    return new Promise((resolve, reject) => {
      // prepare params
      const params = this.prepareParamsForRecordSubType();
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.FILESUBTYPE, params).then((response: any) => {
        if (response) {
          this.fileRecordSubType = response as [];
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

  private prepareParamsForRecordSubType() {
    const params = [];
    const paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Files,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'ParentEntityTypeID',
      type: 'int',
      value: this.parentEntityTypeId
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'ParentID',
      type: 'int',
      value: this.entityRecordTypeId
    };
    params.push(paramItem2);

    return params;
  }
}
