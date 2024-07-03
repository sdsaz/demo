import { Component, Input, OnInit, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DataSources, Entity, LocalStorageKey } from '../../enum';
import { AccountAddComponent } from '../../../pages/accounts/account-add/account-add.component';
import { ContactAddComponent } from '../../../pages/contacts/contact-add/contact-add.component';
import { ProductAddComponent } from '../../../pages/products/product-add/product-add.component';
import { OpportunityAddComponent } from '../../../pages/opportunities/opportunity-add/opportunity-add.component';
import { CaseAddComponent } from '../../../pages/cases/case-add/case-add.component';
import { CommonHelper } from '../../common-helper';
import { CommonService } from '../../sharedServices/common.service';
import { DatasourceService } from '../../sharedServices/datasource.service';
import { Dropdown } from 'primeng/dropdown';

@Component({
  selector: 'ngx-add-related-to-control',
  templateUrl: './add-related-to-control.component.html',
  styleUrls: ['./add-related-to-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR, 
      useExisting: forwardRef(() => AddRelatedToControlComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AddRelatedToControlComponent),
      multi: true,
    }
  ] 
})
export class AddRelatedToControlComponent  implements OnInit, ControlValueAccessor{
  
  @Input() relatedToList:any[]
  @Input() isAddRelatedTo :boolean;
  @Input() isShowAddButton:boolean=true
  @Input() relatedEntityTypeId:number
  @Input() entityRecordTypeId:number
  @Input() entityTypeId: number
  @Input() entityWorkflowId:number
  @Input() parentEntityList:any[]
  @Input() isReadOnly:boolean=false
 
  showRelatedToLoader: boolean = false;
  @ViewChild("drpRelatedTo", { static: false }) drpRelatedTo: Dropdown;

  modalRef: NgbModalRef | null;
  workflowsListAccount: any;
  workflowListContact: any;
  workflowsListProduct: any;
  WorkflowListopportunity:any;
  workflowListCase:any;

  recordTypesForAccount: any;
  recordTypesForContact: any;
  recordTypesForProduct: any;
  recordTypesForOpportunity:any;
  recordTypesForCase:any;

  isRelatedToGroupDropDown: boolean;

  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

   /*
  event variables
  */
  value: any = {};
  disabled: boolean = false;

  
  /*
  onChange event
  */
  onChange = (value: any) => {};
  /*
  onTouched event
  */
  onTouched = () => {};
  /*
  focusout event
  */
  focusout = (value: any) => {};
  /*
  keypress event
  */
  keypress = (value: any) => {};
  /*
  click event
  */
  click = (value: any) => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
}

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.value = value;
  }
}

  constructor(public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _dataSourceService:DatasourceService,
    private _modalService: NgbModal) { 
     
     }

     ngOnInit(): void {
      this.getWorkflowListForAccount();
      this.getWorkflowListForContact();
      this.getWorkflowListForProduct();
      this.getWorkflowListForOpportunity();
      this.getWorkflowListForCase();
      this.getEntityRecordTypes();
    }

    private getWorkflowListForAccount() {
      return new Promise((resolve, reject) => {
        //storage key
        let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Accounts}`;
        var workflowListAccount = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
  
        if (workflowListAccount == null) {
          const params = this.prepareParamsForWorkflows(Entity.Accounts);
          this._commonHelper.showLoader();
          this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
            if (response) {
              this.workflowsListAccount = response;
              this.workflowsListAccount.sort((a, b) => a.value - b.value);
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowsListAccount));
            }
            this._commonHelper.hideLoader();
            resolve(null);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              reject(null);
            });
        }
        else {
          this.workflowsListAccount = workflowListAccount;
          resolve(null);
        }
      });
    }
  
    private getWorkflowListForContact() {
      return new Promise((resolve, reject) => {
        //storage key
        let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Contacts}`;
        var workflowListForContactData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
  
        if (workflowListForContactData == null) {
          const params = this.prepareParamsForWorkflows(Entity.Contacts);
          this._commonHelper.showLoader();
          this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
            if (response) {
              this.workflowListContact = response;
              this.workflowListContact.sort((a, b) => a.value - b.value);
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowListContact));
            }
            this._commonHelper.hideLoader();
            resolve(null);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              reject(null);
            });
        }
        else {
          this.workflowListContact = workflowListForContactData;
          resolve(null);
        }
      });
    }
  
    private getWorkflowListForProduct() {
      return new Promise((resolve, reject) => {
        //storage key
        let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Products}`;
        var workflowListForProductData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
  
        if (workflowListForProductData == null) {
          const params = this.prepareParamsForWorkflows(Entity.Products);
          this._commonHelper.showLoader();
          this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
            if (response) {
              this.workflowsListProduct = response;
              this.workflowsListProduct.sort((a, b) => a.value - b.value);
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowsListProduct));
            }
            this._commonHelper.hideLoader();
            resolve(null);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              reject(null);
            });
        }
        else {
          this.workflowsListProduct = workflowListForProductData;
          resolve(null);
        }
      });
    }
  
    private getWorkflowListForOpportunity() {
      return new Promise((resolve, reject) => {
        //storage key
        let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Opportunities}`;
  
        this.WorkflowListopportunity = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
        if (this.WorkflowListopportunity == null) {
          const params = this.prepareParamsForWorkflows(Entity.Opportunities);
          this._commonHelper.showLoader();
          this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
            if (response) {
              this.WorkflowListopportunity = response;
              this.WorkflowListopportunity.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
              this.WorkflowListopportunity.sort((a, b) => a.value - b.value);
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.WorkflowListopportunity));
            }
            this._commonHelper.hideLoader();
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
        }
        else {
          this.WorkflowListopportunity.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
          this.WorkflowListopportunity.sort((a, b) => a.value - b.value);
          resolve(null);
        }
      });
    }
  
    private getWorkflowListForCase() {
      return new Promise((resolve, reject) => {
        //storage key
        let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Cases}`;
        var workflowListForCaseData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
  
        if (workflowListForCaseData == null) {
          const params = this.prepareParamsForWorkflows(Entity.Cases);
          this._commonHelper.showLoader();
          this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
            if (response) {
              this.workflowListCase = response;
              this.workflowListCase.sort((a, b) => a.value - b.value);
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowListCase));
            }
            this._commonHelper.hideLoader();
            resolve(null);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              reject(null);
            });
        }
        else {
          this.workflowListCase = workflowListForCaseData;
          resolve(null);
        }
      });
    }
  
    private prepareParamsForWorkflows(entityTypeId: number) { return [{ name: 'EntityTypeID', type: 'int', value: entityTypeId }]; }
  
    //get all entity record types 
    private getEntityRecordTypes() {
      let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        return new Promise((resolve, reject) => {
          this._commonHelper.showLoader();
          this._commonService.getEntityRecordTypes().then((response: any) => {
            if (response) {
              this.recordTypesForAccount = response?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
              this.recordTypesForContact = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
              this.recordTypesForOpportunity = response?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id }));
              this.recordTypesForCase = response?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id }));
              this.recordTypesForProduct = response?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
              this.recordTypesForProduct.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.FILTER_OPTION_TEXT_RECORDTYPE') });
              this.recordTypesForProduct.sort((a, b) => a.value - b.value);
              // store in local storage
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            }
            this._commonHelper.hideLoader();
            resolve(null);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              reject(null);
            });
        });
      }
      else {
        this.recordTypesForAccount = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
        this.recordTypesForContact = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
        this.recordTypesForOpportunity = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id }));
        this.recordTypesForCase = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id }));
        this.recordTypesForProduct = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
        this.recordTypesForProduct.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.FILTER_OPTION_TEXT_RECORDTYPE') });
        this.recordTypesForProduct.sort((a, b) => a.value - b.value);
      }
    }
  


addRelatedTo() {
  if (!this.relatedEntityTypeId) return;
  this.optionsForPopupDialog.size = "md";
  if (this.relatedEntityTypeId == Entity.Accounts) {

    this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
    this.modalRef.componentInstance.recordTypes = this.recordTypesForAccount?.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflowsListAccount?.filter((x: any) => x.value != 0);
    this.modalRef.componentInstance.isShowAssignedTo = true;
    this.modalRef.componentInstance.isShowWorkflow =  this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;

  } else if (this.relatedEntityTypeId == Entity.Contacts) {

    this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflowListContact?.filter((x: any) => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypesForContact?.filter(x => x.value != 0);
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
  
  }
  else if (this.relatedEntityTypeId == Entity.Products) {

    this.modalRef = this._modalService.open(ProductAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.entityTypeId = Entity.Products;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflowsListProduct?.filter((x: any) => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypesForProduct?.filter(x => x.value != 0);
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
    this.modalRef.componentInstance.isShowProductCategory = true; 
  }
  else if(this.relatedEntityTypeId == Entity.Opportunities)
  {
    this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = Entity.Opportunities;
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.OPPORTUNITIES.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = null;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.WorkflowListopportunity?.filter((x: any) => x.value != 0);
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesForOpportunity?.filter(x => x.value != 0);
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
    this.modalRef.componentInstance.isShowRecordTypes = (this.recordTypesForOpportunity && this.recordTypesForOpportunity.length > 0);
   
  }
    else if(this.relatedEntityTypeId == Entity.Cases)
  {
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = Entity.Cases;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CASES.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = null;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowListCase?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypes = this.recordTypesForCase?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
      this.modalRef.componentInstance.isShowRecordTypes = (this.recordTypesForCase && this.recordTypesForCase.length > 0);
      this.modalRef.componentInstance.isShowAddButton = false;
     
  }

  this.modalRef.componentInstance.isFromSameEntity = false;

  this.modalRef.result.then((response: any) => {
    if (response) {
      if (this.drpRelatedTo.filterValue) {
        this.drpRelatedTo.resetFilter();
        if(this.isRelatedToGroupDropDown)
        {
          this.getRelatedTo([Entity.Accounts, Entity.Contacts, Entity.Products, Entity.Cases, Entity.Opportunities], 1, '', response['id']);
        }
        else {
          this.getRelatedTo([this.relatedEntityTypeId], 1, '', response['id']);
        }
      }

      if (this.relatedToList && this.relatedToList.length > 0) {
        if (this.isRelatedToGroupDropDown) {
          let items = this.relatedToList.find((obj: any) => obj.relatedToEntityTypeId === this.relatedEntityTypeId);
          const relatedTo = { value: response['id'], label: response['name'], relatedToEntityTypeId: this.relatedEntityTypeId, relatedToEntityTypeName: items.relatedToEntityTypeName };
          items.items.unshift(relatedTo);
       
        }
        else {
          const relatedTo = { value: response['id'], label: response['name'] };
          this.relatedToList.unshift(relatedTo);
      
        }
      } else {
        this.relatedToList = [];
        const relatedTo = { value: response['id'], label: response['name'] };
        this.relatedToList.push(relatedTo);

        if (this.isRelatedToGroupDropDown) {
          let items = this.relatedToList.find((obj: any) => obj.relatedToEntityTypeId === this.relatedEntityTypeId);
          const relatedTo = { value: response['id'], label: response['name'], relatedToEntityTypeId: this.relatedEntityTypeId, relatedToEntityTypeName: items.relatedToEntityTypeName };
          items.items.unshift(relatedTo);
       
        }
        else {
          const relatedTo = { value: response['id'], label: response['name'] };
          this.relatedToList.unshift(relatedTo);
       
        }
      }
    }
  });
}

private getRelatedTo(selectedEntities: any, includeAllEntities, searchString: any = '', selectedEntityID = null) {
  return new Promise((resolve, reject) => {
    this.showRelatedToLoader = true;
    this.relatedToList = [];
    let params = [{
      name: 'EntityTypeIDs',
      type: 'string',
      value: selectedEntities > 0 ? selectedEntities.toString() : null
    },
    {
      name: 'SelectedEntityID',
      type: 'int',
      value: selectedEntityID
    },
    {
      name: 'IncludeAllEntities',
      type: 'bit',
      value: includeAllEntities
    },
    {
      name: 'SearchString',
      type: 'string',
      value: searchString
    }];
    
    this.isRelatedToGroupDropDown = (this.entityRecordTypeId && this.entityRecordTypeId > 0) ? false : true;

    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES, params)
    .then((response: any) => {
      if (response && response.length > 0) {
        let responseList: any = response as [];
        this.relatedToList = responseList.map(x => ({ 'label': x.label, 'value': x.value }));
      }
      this.showRelatedToLoader = false;
      resolve(true);
    }, (error) => {
      this.showRelatedToLoader = false;
      this._commonHelper.showToastrError(error.message);
      reject(false);
    });
  }).catch();
}

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'cases.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CASES.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }
}
