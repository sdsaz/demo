import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { DocumentService } from '../document.service';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { Entity, PublicTenantSettings } from '../../../enum';
import { DataSources } from '../../../../@core/enum';
import { SettingsService } from '../../../../pages/settings/settings.service';

@Component({
  selector: 'document-dialog',
  templateUrl: './document-dialog.component.html',
  styleUrls: ['./document-dialog.component.scss']
})
export class DocumentDialogComponent implements OnInit {

  @ViewChild('documentName', { static: false }) documentNameRef: ElementRef;

  @Input() entityTypeId: number;
  @Input() entityRecordTypeID: number;
  @Input() entityId: number;
  @Input() uid: number;
  @Input() documentId: number;

  //dialog title
  title: string = 'DOCUMENTS.INFO_DIALOG.TITLE';

  //Save Flag
  submitted = false;
  isLoading: boolean = false;
  documentTypeList: any[] = [];
  fileName = [];
  //document detail
  @Input() documentModel: any = {
    id: 0,
    entityTypeId: 0,
    entityId: 0,
    entityRecordTypeID:null,
    uid: null,
    name: '',
    entityName: '',
    isPrivate: false,
    description: '',
  }

  // document required validation
  document_validation_messages = {
    'name': [
      { type: 'required', message: 'DOCUMENTS.INFO_DIALOG.MESSAGE_NAME' }
    ]
  }

  productImageTypes: string;

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _documentService: DocumentService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService) { }

  ngOnInit() {
    this.getProductImageTypes();
    this.getDocumentType();
    this.fileName = this.documentModel.name.split('.');
    let extension = this.fileName[this.fileName.length -1]
    this.fileName.pop()
    this.fileName = [this.fileName.join('.')]
    this.fileName.push(extension)
    setTimeout(() => { this.documentNameRef.nativeElement.focus(); });
  }
  // prepare params for datasource with required fields
  prepareParamsForDocumentType() {
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
      value: this.entityTypeId
    };
    params.push(paramItem1);

    return params;
  }

  getDocumentType(){
    return new Promise((resolve, reject) => {
     // prepare params
    var params = this.prepareParamsForDocumentType();
    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.DOCUMENTTYPE, params).then((response: any) => {
        if (response) {
          this.documentTypeList = response;
          this.documentTypeList.push({ label: this._commonHelper.getInstanceTranlationData('DOCUMENTS.INFO_DIALOG.TYPEDEFAULTVALUE'), value: null });
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

  onSubmit() {
    this.submitted = true;
    if (this.fileName[0].trim() === '') {
      this.fileName[0] = '';
      return false;
    }

    //If Type is selected then check for ProductType
    if (this.documentModel.entityRecordTypeID && this.documentModel.entityRecordTypeID > 0) {
      if (!this.checkFileExtensionIsValid()) {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('DOCUMENTS.INFO_DIALOG.MESSAGE_DOCUMENT_INVALID')
        );
        return false;
      }
    }
    
    this._commonHelper.showLoader();
    let data = { 
      id : this.documentModel.id,
      name : this.fileName.join('.'),
      entityRecordTypeID: this.documentModel.entityRecordTypeID,
      description : this.documentModel.description,
      isPrivate : this.documentModel.isPrivate,
     }

    this._documentService.updateDocument(data).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('DOCUMENTS.INFO_DIALOG.MESSAGE_DOCUMENT_UPDATE')
      );
      this._ngbActiveModal.close(response);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //for close form
  public onCloseForm() {
    this._ngbActiveModal.close();
  }

  getTranslateErrorMessage(messageCode: any): string {
    return this._commonHelper.getInstanceTranlationData('DOCUMENTS.' + messageCode.replaceAll('.', '_').toUpperCase());
  }

  private getProductImageTypes() {
    this.productImageTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.PRODUCT_IMAGE_TYPES));
    if (!this.productImageTypes) {
      this._commonHelper.showLoader();
      this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRODUCT_IMAGE_TYPES).then((response: any) => {
        this.productImageTypes = response;
        // store in local storage
        this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.PRODUCT_IMAGE_TYPES, JSON.stringify(this.productImageTypes));
        this._commonHelper.hideLoader();
      },
        () => {
          this._commonHelper.hideLoader();
        });
    }
  }

  checkFileExtensionIsValid(): boolean {
    if (this.documentModel && this.documentModel.name) {
       const isAllowed = (this.productImageTypes.split(',')).filter(x => x === this.fileName[1]);
       if (isAllowed.length == 0) {
        return false;
       }
       return true;
    }
    return true;
  }
}
