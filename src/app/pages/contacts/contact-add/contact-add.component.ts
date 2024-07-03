//angular
import { Component, OnInit, Input } from '@angular/core';
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, ValidatorFn } from '@angular/forms';
//common
import { Contact } from '../contact.model';
import { CommonHelper } from '../../../@core/common-helper';
import { DataSources, ReferenceType, RefType, Entity, PublicTenantSettings, ContactType, Tenants, LocalStorageKey, ContactTypes } from '../../../@core/enum';
//service
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { ContactsService } from '../contacts.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { SettingsService } from '../../settings/settings.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
//other
import * as moment from 'moment';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-contact-add',
  templateUrl: './contact-add.component.html',
  styleUrls: ['./contact-add.component.scss']
})
export class ContactAddComponent implements OnInit {

  @Input() title: string;
  @Input() entityRecordTypeId: number;
  @Input() entityWorkflowId: number;
  @Input() isShowAssignTo: boolean = false;
  @Input() isShowWorkflow: boolean;
  @Input() workflows: any;
  @Input() entityWorkflowRecordTypeId: number;
  @Input() recordTypes: any;
  @Input() showEntityRecordTypeLoader: boolean;
  @Input() showWorkflowLoader: boolean;

  /**
   * If it is belongs to Entity or not, If it used from other Entity then values must be false
   */
  @Input() isFromSameEntity: boolean = true;

  //For contact Form
  contact: any;
  contactForm: UntypedFormGroup;

  entityTypeId: number = Entity.Contacts;

  //For Validation
  isPhoneInvalid: boolean = false;
  isSsnInvalid: boolean = false;

  contactTypeList: any[] = [];  //Entity record types
  assignedToUsers: any = null; //assigned to users

  copyOfAssignedTo: any; //copy of assingedUsers
  copyOfRecordTypes: any;
  copyOfWorkflows: any;
  isShowRecordTypes: boolean = true;
  isSpecificWorkflowPage: boolean = true;

  //save Flag
  submitted = false;
  isDisabled = true;
  hideTypeDropDown = false;

  formMode: string;

  //datasource
  genders: any = null;
  currencySymbol: any = null;

  //datepicker
  todaysDate = new Date();
  currentYearRange: string = "1901:" + this.todaysDate.getFullYear().toString();

  filteredWorkflows: any;

  selectedWorkflow: any;

  validation_messages = {
    'firstname': [
      { type: 'required', message: 'CRM.CONTACT.ADD_DIALOG.FIRSTNAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_FIRSTNAME_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_FIRSTNAME_MIN' }
    ],
    'lastname': [
      { type: 'required', message: 'CRM.CONTACT.ADD_DIALOG.LASTNAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_LASTNAME_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_LASTNAME_MIN' }
    ],
    'email': [
      { type: 'email', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_INVALID_EMAIL' },
      { type: 'maxlength', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_EMAIL_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_EMAIL_MIN' }
    ],
    'entityRecordTypeId': [
      { type: 'required', message: 'CRM.CONTACT.ADD_DIALOG.RECORDTYPE_REQUIRED' }
    ],
    'phone': [{ type: 'mask', message: 'CRM.CONTACT.ADD_DIALOG.PHONE_PATTERN' }],
    'birthdate': [{ type: 'mask', message: 'CRM.CONTACT.ADD_DIALOG.BIRTHDATE_PATTERN' }],
    'ssn': [{ type: 'mask', message: 'CRM.CONTACT.ADD_DIALOG.SSN_PATTERN' }],
    'typeId': [{ type: 'required', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_TYPE' }],
    'assignedTo': [
      { type: 'required', message: 'CRM.CONTACT.ADD_DIALOG.MESSAGE_ASSIGNEDTO_REQUIRED' }
    ],
    'entityWorkflowId': [
      { type: 'required', message: 'CRM.CONTACT.ADD_DIALOG.WORKFLOW_REQUIRED' },
    ]
  }

  contactCustomFields: any[] = [];
  customFieldControls: any[] = [];
  isShowContactCustomField: boolean = false;
  isShowCustomFieldsForTenants: boolean = false;

  tenantId: number;

  showGenderLoader: boolean = false;
  showAssignToLoader: boolean = false;
  showContactTypeLoader: boolean = false;

  // Reference Types
  contactTypes: any = null;

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _contactService: ContactsService,
    private _workflowmanagementService: WorkflowmanagementService) { }

  ngOnInit(): void {
    this.formMode = 'ADD';
    this.contact = new Contact({});
    this.tenantId = this._commonHelper.getTenantId();

    let loggedInUser = this._commonHelper.getLoggedUserDetail();
    (this._commonHelper.attachment_visibility_tenant ?? '').split(',').forEach(x => {
      if (Number(x) == loggedInUser.tenantId) {
        this.isShowCustomFieldsForTenants = true;
        return;
      }
    });

    Promise.all([
      this.getGenderFromReferenceType(),
      this.getContactTypesFromReferenceType(),
      this.getCurrencySymbol()
    ]).then(() => {
      this.contactForm = this.createcontactForm();
      
      //fill workflow field dropdown only general 
      this.filteredWorkflows = this.workflows?.filter((x: any) => x.entityRecordTypeID == null);
      this.showHideType();
      this.setInitialValues();
    });
  }
  
  assignedToOnFilter(e) {
    this.getAssignedToUsers(e.value, 0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(e.value, 1, null);
    }
  }
  //#region Private Methods

  private getGenderFromReferenceType() {
    return new Promise((resolve, reject) => {
      this.showGenderLoader = true;
      let params = { refType: RefType.Gender };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.Gender}`;
      // get data
      const refTypeGender = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeGender == null) {
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.showGenderLoader = false;
            this.genders = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.genders));
          }
          resolve(null);
        },
          (error) => {
            this.showGenderLoader = false;
            this.getTranslateErrorMessage(error);
          });
      }
      else {
        this.showGenderLoader = false;
        this.genders = refTypeGender;
        resolve(null);
      }
    });
  }

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response: any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.currencySymbol = currencySymbol;
    }
  }
  
  // prepare params for datasource with required fields
  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers = 1, searchString = null) {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'StageID',
      type: 'int',
      value: stageId
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SelectedUserID',
      type: 'int',
      value: assignedTo
    };
    params.push(paramItem2);

    const paramItem3 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers
    };
    params.push(paramItem3);

    const paramItem4 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem4);

    return params;
  }
  
  // get assigned to users
  private getAssignedToUsers(assignedTo, includeAllUsers = 1, searchString = null) {
    return new Promise((resolve, reject) => {      
      if (this.isShowAssignTo) {
        this.showAssignToLoader = true;
        let defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;
        
        // prepare params
        var params = this.prepareParamsForAssignedToUsers(defaultStageID, assignedTo, includeAllUsers, searchString);
        // call datasource service with params
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CONTACTASSIGNEDTO, params).then((response: any) => {
          if (response != undefined) {
            this.showAssignToLoader = false;
            this.assignedToUsers = response as any[];
            this.copyOfAssignedTo =  response as any[];
          }
          resolve(null);
        }, (error) => {
          this.showAssignToLoader = false;
          reject(null);
        });
      }
      else {
        this.showAssignToLoader = false;
        resolve(null);
      }
    });
  }

  private createcontactForm(): UntypedFormGroup {
    //empty custom fields
    var customFields: any = {};

    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: 0,
        tenantId: 0,
        firstname: [this.contact.firstname, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        lastname: [this.contact.lastname, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        email: [this.contact.email, Validators.compose([Validators.email, Validators.maxLength(200), Validators.minLength(2)])],
        phone: [],
        birthdate: [this.contact.birthdate != null ? moment(new Date(this.contact.birthdate)).toDate() : this.contact.birthdate],
        gender: [this.contact.gender],
        ssn: [this.contact.ssn],
        typeId: [this.contact.typeId, Validators.compose([Validators.required])],
        assignedTo: [this.contact.assignedTo],
        entityRecordTypeId: [this.contact.entityRecordTypeId],
        customFieldJSONData: customFields,
        entityWorkflowId: [this.contact.entityWorkflowId]
      });
    }
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

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'contacts.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  private getContactCustomFields(entityRecordTypeId: number): void {
    let param = { entityTypeId: this.entityTypeId, entityRecordTypeId: entityRecordTypeId };
    this.isShowContactCustomField = false;
    this._commonHelper.showLoader();
    this._commonService.getCustomFields(param)
      .then((response: any) => {
        if (response) {
          this.contactCustomFields = response?.customFields || [];
          this.contact.customFieldJSONData = this._commonHelper.tryParseJson(response?.customFieldJson);
          this.prepareCustomFieldControlsInJSON();
          this.prepareFormCustomFields();

          if (this.isShowCustomFieldsForTenants)
            this.isShowContactCustomField = true;
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this.isShowContactCustomField = false;
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private prepareCustomFieldControlsInJSON(): void {
    this.contactCustomFields.forEach((customField: any) => {
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
  }

  private prepareFormCustomFields(): void {
    this.customFieldControls.forEach(control => {
      this.contactForm.addControl(control.fieldName, new UntypedFormControl());
      if (control.settingsJSON) {
        let validatorFn: ValidatorFn[] = [];
        if (control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
          validatorFn.push(Validators.required);
        }
        if (control.settingsJSON.hasOwnProperty('min') && (String(control.settingsJSON['min']) || "").toString()) {
          validatorFn.push(Validators.min(+control.settingsJSON['min']));
        }
        if (control.settingsJSON.hasOwnProperty('max') && (String(control.settingsJSON['max']) || "").toString()) {
          validatorFn.push(Validators.max(+control.settingsJSON['max']));
        }
        if (validatorFn.length > 0) {
          this.contactForm.controls[control.fieldName].setValidators(validatorFn);
          this.contactForm.controls[control.fieldName].updateValueAndValidity();
        }
      }
    });
  }

  private clearContactCustomFields() {
    this.isShowContactCustomField = false;
    this.customFieldControls = [];
    this.contactCustomFields = [];
    this.contact.customFieldJSONData = null;
  }

  //#endregion Private Methods

  inputPhoneMaskValid() {
    this.isPhoneInvalid = this.contactForm['controls'].phone.invalid;
  }

  inputSsnMaskValid() {
    this.isSsnInvalid = this.contactForm['controls'].ssn.invalid;
  }

  //save contact
  saveContact(formData) {
    this.submitted = true;
    if (this.contactForm.invalid) {
      this.validateAllFormFields(this.contactForm);
      return;
    }
    //empty custom fields
    let customFields: any = {};

    //Prepare Custom Field Data.
    if (this.contact && this.contact.customFieldJSONData && this.customFieldControls && this.customFieldControls.length > 0) {
      this.customFieldControls.forEach((control) => {
        if (typeof (this.contact.customFieldJSONData[control.fieldName]) == 'number')
          customFields[control.fieldName] = this.contact.customFieldJSONData[control.fieldName];
        else
          customFields[control.fieldName] = this.contact.customFieldJSONData[control.fieldName] || "";
      })
    }

    if(this.isShowWorkflow) {
      this.entityWorkflowId = null;
    }

    let phoneControlValue; 
    if(formData?.phone?.countryCode && formData?.phone?.phoneNumber) {
      phoneControlValue = formData?.phone?.countryCode + '|' + String(formData?.phone?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
    }

    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      phone: phoneControlValue,
      birthdate: formData.birthdate != null ? moment(formData.birthdate).format('YYYY-MM-DD') : formData.birthdate,
      gender: formData.gender,
      ssn: formData.ssn,
      typeid: formData.typeId,
      assignedTo: formData.assignedTo,
      entityRecordTypeId: formData.entityRecordTypeId || this.entityRecordTypeId,
      entityWorkflowId: formData.entityWorkflowId || this.entityWorkflowId,
      customFieldJSONData: customFields
    }

    this._commonHelper.showLoader();
    // save contact
    this._contactService.updateContact(params).then((response) => {
      this._commonHelper.hideLoader();
      let contact: any = response;
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.SUCCESS_MESSAGE'));
      if (this.isFromSameEntity) {
        this._ngbActiveModal.close(contact.id);
      } else {
        this._ngbActiveModal.close(contact);
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //for close form
  onCloseForm(status: boolean) {
    if (this.isFromSameEntity) {
      this._ngbActiveModal.close(status);
    } else {
      this._ngbActiveModal.close();
    }
  }

  onContactTypeChange(event) {
    const id = +event.value || 0;
    if (id > 0 && this.isShowCustomFieldsForTenants) {
      const selectedContactType = this.contactTypeList.find(i => i.value === id);
      this.clearContactCustomFields();
      if (selectedContactType) {
        //Get Custom Fields
        this.getContactCustomFields(selectedContactType.value);
      }
    } else {
      this.clearContactCustomFields();
    }
  }

  workflowOnChange(e) {
    if (e.value) {
      this.entityWorkflowId = e.value;
      this.getAssignedToUsers(null, 1, null);
      // set record type from selected workflow
      if (this.workflows != null && this.workflows.length > 0) {
        this.selectedWorkflow = this.workflows?.filter(x => x.value == e.value)[0];
      }
      this.assignedToUsers = [];
    }
  }
  
  recordTypeOnChange(e) {
    if(e.value) {
      this.entityRecordTypeId = e.value;
      if(this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.filteredWorkflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
        if (this.workflows.length == 1) {
          let value = this.workflows.find(x => x.entityRecordTypeID == this.entityRecordTypeId)?.value;
          this.contactForm.controls['entityWorkflowId'].patchValue(value);
          this.contactForm.controls['entityWorkflowId'].updateValueAndValidity();
        }
      }
      this.assignedToUsers = [];
    }
  }

  private getContactTypesFromReferenceType() {
    return new Promise((resolve, reject) => {
      this.showContactTypeLoader = true;
      let params = { refType: RefType.ContactType };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.ContactType}`;
      // get data
      const refContactTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refContactTypes == null) {
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.showContactTypeLoader = false;
            this.contactTypes = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.contactTypes));
          }
          resolve(null);
        },
          (error) => {
            this.showContactTypeLoader = false;
            this.getTranslateErrorMessage(error);
          });
      }
      else {
        this.showContactTypeLoader = false;
        this.contactTypes  = refContactTypes;
        resolve(null);
      }
    });
  }

  private showHideRecordType() {
    // Record Types
    if (this.recordTypes && this.recordTypes.length == 1) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.recordTypes)
      this.isShowRecordTypes = false;
      this.entityRecordTypeId = this.recordTypes[0].value;

      this.contactForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypeId);
      this.contactForm.controls['entityRecordTypeId'].updateValueAndValidity();
    }
    else if (this.recordTypes && this.recordTypes.length > 0) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.recordTypes)
    }
    else {
      this.isShowRecordTypes = false;
    }
  }

  private setDataForSpecificWorkflow() {
    this.isSpecificWorkflowPage = true;

    // Get Assigned To users
    this.getAssignedToUsers(null, 1, null);

    this.isShowRecordTypes = false;
    this.isShowWorkflow = false;

    this.contactForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
    this.contactForm.controls['entityWorkflowId'].clearValidators();
    this.contactForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.isShowAssignTo = true;
  }

  private setInitialValues() {
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificWorkflowPage = false;
      this.showHideRecordType();
      this.showHideWorkflowAndAssignedTo();

      // get assigned to users
      if (this.isShowAssignTo && !this.isShowWorkflow) {
        this.getAssignedToUsers(null, 1, null);
      }
    }
    else {
      this.setDataForSpecificWorkflow();
    }
  }

  private showHideWorkflowAndAssignedTo() {
    // Workflows
    if (this.workflows && this.workflows?.length == 1) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      this.isShowWorkflow = false;
      this.entityWorkflowId = this.workflows[0].value;
      this.contactForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
      this.contactForm.controls['entityWorkflowId'].clearValidators();
      this.contactForm.controls['entityWorkflowId'].updateValueAndValidity();
    }
    else if (this.workflows && this.workflows?.length > 0) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      if (this.copyOfRecordTypes?.length == 1) {
        this.workflows = this.workflows?.filter(x => x.isDefault || x.entityRecordTypeID == this.entityRecordTypeId);
      }
      else {
        this.workflows = this.copyOfWorkflows?.filter(s => s.isDefault);
      }
    }
    else {
      this.isShowWorkflow = false;
      this.isShowAssignTo = false;
      if (this.workflows?.length <= 0) {
        this.contactForm.controls['entityWorkflowId'].clearValidators();
        this.contactForm.controls['entityWorkflowId'].updateValueAndValidity();
      }
    }
  }

  recordTypeOnClear(e) {
    this.entityWorkflowId = null;
    this.entityRecordTypeId = null;
    this.filteredWorkflows = [];
    var data = this.workflows?.filter(z => z.entityRecordTypeID == null);
    this.filteredWorkflows.push(data[0]);
    if (!this.selectedWorkflow?.isDefault) {
      this.assignedToUsers = [];
    }
    this.assignedToUsers.concat(this.copyOfAssignedTo);
  }

  workflowOnClear(e) {
    this.entityWorkflowId = null;
    this.assignedToUsers = [];
  }

  private showHideType() {
    if (this.entityWorkflowId != undefined && this.entityWorkflowId != 0) {
      // Contact type dropdwon
      if (this.contactTypes.length > 0) {
        this.hideTypeDropDown = true;
        let contactType = this.contactTypes?.filter(x => x.intValue1 == ContactTypes.Prospect);
        if (contactType && contactType.length > 0) {
          this.contactForm.patchValue({ typeId: contactType[0].intValue1 });
          this.contactForm.controls['typeId'].removeValidators([Validators.required]);
          this.contactForm.controls['typeId'].updateValueAndValidity();
        }
      }
      else {
        this.hideTypeDropDown = false;
      }
    }
  }
}

