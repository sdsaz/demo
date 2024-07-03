import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DataSources, Entity, FieldNames, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, ReferenceType, RefType, SectionCodes, TabLayoutType } from '../../../../@core/enum';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { SettingsService } from '../../../settings/settings.service';
import { ContactsService } from '../../contacts.service';
import { WorkflowmanagementService } from '../../../workflowmanagement/workflowmanagement.service';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ReasonDialogComponent } from '../../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { EntityRelationComponentsModel } from '../../../../@core/sharedModels/entity-relation.model';
import { EntityRelationService } from '../../../../@core/sharedServices/entity-relation.service';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { WorkTasksService } from '../../../worktasks/worktasks.service';
import { WorktaskAddComponent } from '../../../worktasks/worktask-add/worktask-add.component';
import { OpportunityAddComponent } from '../../../opportunities/opportunity-add/opportunity-add.component';
import { OpportunitiesService } from '../../../opportunities/opportunities.service';
import { CaseAddComponent } from '../../../cases/case-add/case-add.component';
import { CasesService } from '../../../cases/cases.service';
import { NoteService } from '../../../../@core/sharedComponents/notes/notes.service';

@Component({
  selector: 'ngx-contact-detail',
  templateUrl: './contact-detail.component.html',
  styleUrls: ['./contact-detail.component.scss']
})
export class ContactDetailComponent implements OnInit {
  private contactTxtNameRef: ElementRef;
  @ViewChild('contactTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.contactTxtNameRef = content;
    }
  }

  //option for confirm dialog settings
  optionsForConfirmDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  // contact model
  entityTypeId: number = Entity.Contacts;
  contactId: number;
  entityRecordTypeId: number;

  contact: any;
  copyOfContact: any;
  copyOfContactFormValues: any;
  contactCustomFields: any[] = [];

  tbWorktaskParameters: Array<DynamicTableParameter> = [];
  tbRelatedOpportunitiesParameters: Array<DynamicTableParameter> = [];
  tbRelatedCasesParameters: Array<DynamicTableParameter> = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';
  contactForm: UntypedFormGroup;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;

  isListWorkTask: boolean = false;
  isListOpportunities: boolean = false;
  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  refreshDocument: boolean = false;
  
  isRelatedAccount: boolean = false;
  activeTab = '';

  isListViewLayout: boolean = true;

   //user detail
   _loggedInUser: any;

  // permissions
  hasPermission: boolean = false;
  isViewContact: boolean = false;
  isAddContact: boolean = false;
  isEditContact: boolean = false;
  isViewAccount: boolean = false;
  isResumeRecord: boolean = false;
  changeContactStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isAddOpportunity: boolean = false;
  isAddCase: boolean = false;
  isListCases: boolean = false;
  isDeleteContact: boolean = false;

  isInitialLoading: boolean = true;

  //Assign To loader
  isForceReloadAssignedTo: boolean = true;
  showAssignedToLoader: boolean = false;

  // Contact type Loader
  showContactTypeLoader: boolean = false;

  isShowLoaderForOpportunity: boolean = false;

  //all popup dialog open option settings
  private modalRef: NgbModalRef | null;
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //datepicker
  todaysDate = new Date();
  currentYearRange: string = "1901:" + this.todaysDate.getFullYear().toString();

  //datasource
  genders: any = null
  currencySymbol:any = null;
  hoursInDay:number = null;

  //ssn
  encryptSSN: boolean = true;
  decryptSSN: boolean = false;

  onceWorkTaskClicked: boolean = false;
  onceRelatedOpportunitiesClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;
  refreshWorkTaskTab: boolean = false;
  refreshOpporunityTab: boolean = false;
  
  //Ref types
  contactTypes: any = [];

  // worktask tab
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeDetails: any;
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  opportunityRecordTypes: any;
  opportunityWorkflowList: any = null;

  contactValidationMessages = {
    title: [{ type: 'maxlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_TITLE_MAX' }],
    firstname: [
      { type: 'required', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.FIRSTNAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_FIRSTNAME_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_FIRSTNAME_MIN' }
    ],
    lastname: [
      { type: 'required', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.LASTNAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_LASTNAME_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_LASTNAME_MIN' }
    ],
    name: [
      { type: 'maxlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' }
    ],
    email: [
      { type: 'email', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.EMAIL_PATTERN' },
      { type: 'maxlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_EMAIL_MAX' },
      { type: 'minlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_EMAIL_MIN' }
    ],
    phone: [
      { type: 'mask', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.PHONE_PATTERN' },
      { type: 'maxlength', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_PHONE_MAX' }
    ],
    birthDate: [{ type: 'mask', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_BIRTHDATE_PATTERN' }],
    ssn: [{ type: 'mask', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.MESSAGE_SSN_PATTERN' }],
    typeId: [{ type: 'required', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.TYPE_REQUIRED' }],
    entityStageId: [{ type: 'required', message: 'CRM.CONTACT.DETAIL.TAB_DETAILS.STATUS_REQUIRED' }],
  }

  navTabs: any[] = [];
  navTabsAll: any[] = [];
  navTabsMore: any[] = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  forceRedirectionTabName: string = '';
  //#region Workflow related declaration
  entityWorkflowId: number;
  isEntityWorkflow: boolean;
  contactStages: any[] = [];
  entityStagesWithTasksStorageKey: string = LocalStorageKey.ContactEntityStageWithTasksKey;
  
  //#endregion
  
  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any;

  currentStageTask: any;
  currentStage: any;
  selectedStage: any;
  oldStageTask: any;
  contactCurrentStageTaskIds: string;
  contactCurrentStage: number;
  //#endregion

  // assigned users
  assignedToUsers: any[] = [];

  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;

  entityRelationComponents: EntityRelationComponentsModel[] = [];
  entityRelationTabs: any[] = [];
  
  tabsNameHideAction: string[] = [];
  refreshCustomFieldJSONGrid: boolean = false;

  fromEntityStageId: any;

  isShowLoaderForCase: boolean = false;
  onceRelatedCasesClicked: boolean = false;
  refreshCaseTab: boolean = false;
  casesRecordTypes: any;
  casesWorkflowList: any;

  entityHiddenFieldSettings: any;
  fieldName = FieldNames;
  sectionCodeName = SectionCodes;
  countries: any;
  
  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _contactService: ContactsService,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _formBuilder: UntypedFormBuilder,
    private _location: Location,
    private _confirmationDialogService: ConfirmationDialogService, 
    private _workflowManagementService: WorkflowmanagementService,
    private _timeFramePipe: TimeFramePipe,
    private _modalService: NgbModal,
    private _dataSourceService: DatasourceService,
    private _entityRelationService: EntityRelationService,
    private _workTaskService: WorkTasksService,
    private _opportunitiesService: OpportunitiesService,
    private _casesService: CasesService,
    private _noteService: NoteService) {
    this.isEditContact = this._commonHelper.havePermission(enumPermissions.EditContact);
    this.isViewContact = this._commonHelper.havePermission(enumPermissions.ViewContact);
    this.isListWorkTask = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isListOpportunities = this._commonHelper.havePermission(enumPermissions.ListOpportunities);
    this.isViewAccount = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.changeContactStage = this._commonHelper.havePermission(enumPermissions.ChangeContactStage);
    this.isDocumentDownloadPermission =  this._commonHelper.havePermission(enumPermissions.DownloadContactDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isListCases = this._commonHelper.havePermission(enumPermissions.ListCases);
    this.isDeleteContact = this._commonHelper.havePermission(enumPermissions.DeleteContact);
    this.isResumeRecord = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    
    this.hasPermission = this.isViewContact || this.isEditContact;

    this.readRouteParameter();

    Promise.all([
      this.getTabLayoutTenantSetting(),
      this.getEntityRecordTypes(),
      this.getWorktaskWorkflowList(),
      this.getWorkflowListForOpportunity(),
      this.getWorkflowListForCase(),
      this.getEntitySubTypes(),
      this.getCountries()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    this.fillNavTabsNameHideAction();
    this.setWorkTaskTabParameters();
    this.setRelatedOpportunitiesTabParameters();
    this.setRelatedCasesTabParameters();
    // get details
    if (this.isViewContact) {
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getEntityRelationComponents(),
        this.getGenderFromReferenceType(),
        this.getContactTypesFromReferenceType(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getEntityHiddenField()
      ]).then(() => this.getContactCustomFields());
    }
   
  }

  //#region Events
  get contactfrm() { return this.contactForm.controls; }

  backToList(): void {
    this._location.back();
  }
  assignedToOnFilter(e) {
    this.getAssignedToUsers(0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(1, null);
    }
  }

  bindDropdownData() {
    if(this.isForceReloadAssignedTo) this.getAssignedToUsers(1, null);
  }

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.contactForm.invalid) {
        this.validateAllFormFields(this.contactForm);
        this.navigateToTabByValidation();
        return;
      }

      this.refreshActivity = true;

      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = true;
        this.submitted = false;

         //find countryCode
         if(this.contact.phone) {
          const phoneDetail = String(this.contact.phone).split('|');
          if (phoneDetail.length == 2) {
            this.contactForm.patchValue({'phone' : { countryCode : phoneDetail[0], phoneNumber : phoneDetail[1]}});
            this.contact['countryCode'] = phoneDetail[0];
            this.contact['phoneNumber'] = phoneDetail[1];
            this.contact['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
          }
        } else {
          this.contactForm.patchValue({ 'phone': { countryCode: null, phoneNumber: null } });
        }
        
      })
      
    }
    else if (frmMode === 'CANCEL') {
      this.contact = this._commonHelper.deepClone(this.copyOfContact);
      
      if(this.contact.customFieldJSONData && this.contact.customFieldJSONData !== null && this.contact.customFieldJSONData !== '' && this.contact.customFieldJSONData !== undefined) {
        this.contactCustomFields.forEach((field: any) => {
          if(field.fieldType == 'Date') {
            if (this.contact.customFieldJSONData[field.fieldName] && this.contact.customFieldJSONData[field.fieldName] != null && this.contact.customFieldJSONData[field.fieldName] != '' && this.contact.customFieldJSONData[field.fieldName] != undefined) {
              this.contact.customFieldJSONData[field.fieldName] = moment(new Date(this.contact.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.contact.customFieldJSONData[field.fieldName] && this.contact.customFieldJSONData[field.fieldName] != null && this.contact.customFieldJSONData[field.fieldName] != '' && this.contact.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.contact.customFieldJSONData[field.fieldName] === 'string') {
                this.contact.customFieldJSONData[field.fieldName] = JSON.parse(this.contact.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.contactForm.removeControl(field.fieldName);
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.contact.customFieldJSONData[field.fieldName] === 'number' || this.contact.customFieldJSONData[field.fieldName] == null) {
              this.contact.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.contact.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          } 
        })
      }

      this.copyOfContact.customFieldJSONData = this._commonHelper.deepClone(this.contact.customFieldJSONData);
      this.getEntityStagesWithTaskAfterReset();
      this.contactForm.reset(this.copyOfContactFormValues);
      this.refreshJSONGridData()
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;

      //find countryCode
      if(this.contact.phone) {
        const phoneDetail = String(this.contact.phone).split('|');
        if (phoneDetail.length == 2) {
          this.contact['countryCode'] =  phoneDetail[0];
          this.contactForm.patchValue({'phone' : { countryCode : phoneDetail[0], phoneNumber : phoneDetail[1]}});
        }
      } else {
        this.contactForm.patchValue({ 'phone': { countryCode: null, phoneNumber: null } });
      }
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      this.bindDropdownData();
      setTimeout(() => { this.contactTxtNameRef.nativeElement.focus(); });
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    this.encryptSSN = true;
    this.decryptSSN = false;
   
  }

  refreshJSONGridData() {
    this.refreshCustomFieldJSONGrid = true;
     setTimeout(() => {
      this.refreshCustomFieldJSONGrid = false;
    }, 50);
  }

  toggleSSN() {
    this.encryptSSN = !this.encryptSSN;
    this.decryptSSN = !this.decryptSSN;
  }


  customfieldMultiSelectChange(event, fieldName) {
    const stringValue =  event.value.toString()
    this.contact.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  onActionChangeStatus() {
    if (!this.isEditContact) {
      return
    }

    let messageText = this.contact.isActive ? 'CRM.CONTACT.DETAIL.MESSAGE_CONFIRM_INACTIVE' : 'CRM.CONTACT.DETAIL.MESSAGE_CONFIRM_ACTIVE';
    let successText = this.contact.isActive ? 'CRM.CONTACT.DETAIL.MESSAGE_CONTACT_INACTIVATED' : 'CRM.CONTACT.DETAIL.MESSAGE_CONTACT_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._contactService.changeStatus(this.contact.id, !this.contact.isActive).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
            this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
            this.refreshOpporunityTab = true;
            this.refreshCaseTab = true;
          }
          this.getContactDetail()
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getContactDetail()
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }
  //#endregion

  //#region Private methods

  private fillNavTabsNameHideAction() {
    this.tabsNameHideAction = ['navWorkTasks', 'navRelatedOpportunities', 'navHistory','additionalTabs', 'navRelatedCases', 'navDocuments'];
  }

  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.contactId = Number(id);
      } 
      if (param['wf'] !== undefined) {
        if (param['wf'] != null) {
          this.entityWorkflowId = Number(param['wf']);
        }
        else {
          this.isEntityWorkflow = false;
        }
      }
    });

    this._activeRoute.queryParamMap.subscribe(params => {
      if (params != null && params.keys.length > 0) {
        params.keys.forEach(paramKey => {
          if (paramKey.toLocaleLowerCase() === 'tab') {
            this.forceRedirectionTabName = params.get(paramKey)?.trim() ?? '';
          }
        });
      }
    });

    // set storage key
    this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  private getGenderFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType:  RefType.Gender};
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.Gender}`;
      // get data
      const refTypeGender = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeGender == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            this.genders = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.genders));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else {
        this.genders = refTypeGender;
        resolve(null);
      }
    });
  }

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response:any) => {
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

  private getHoursInDay() {
    const hrsInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
    if (hrsInDay == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.hoursInDay = hrsInDay;
    }
  }

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Contacts));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Contacts, JSON.stringify(response));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.nativeTabDetails = nativeTabDetails;
    }
  }

  private getEntityRelationComponents() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._entityRelationService.getEntityRelationComponents(this.entityTypeId).then((res : EntityRelationComponentsModel[]) => {
        this._commonHelper.hideLoader();
        if (res) {
          this.entityRelationComponents = res;
          this.entityRelationComponents.forEach(data => {
            const tabData = {
              tabName : data.customHeaderName ?? this._commonHelper.getConfiguredEntityName('{{' +  Entity[data.isReverseRelation ? data.fromEntityTypeID : data.toEntityTypeID] + '_plural_p}}'),
              tabLink : 'nav_er' + Entity[data.isReverseRelation ? data.fromEntityTypeID : data.toEntityTypeID],
              isFirst : true,
              condition : true,
              displayOrder : data.displayOrder,
              isTabLoaded: false
            };
            this.entityRelationTabs.push(tabData);
            this.tabsNameHideAction.push('nav_er' + Entity[data.isReverseRelation ? data.fromEntityTypeID : data.toEntityTypeID]);
          });
          resolve(null);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        resolve(null);
      });
    });
  }

  //allow only 6 digits and '.'(dot)
  percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 15 digit number
    return event.target.value.length <= 6;
  }

  //allow only 13 digits and ','(comma)
  currencyEventHandler(event) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  private getContactCustomFields(): void {
    this._commonHelper.showLoader();
    this._contactService.getContactCustomFields(this.entityTypeId, this.contactId)
      .then((response: any) => {
        if (response) {
          this.contactCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getContactDetail();
        }
        else {
          this.isInitialLoading = false;
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.getTranslateErrorMessage(error);
      });
  }

  private prepareFormDataInJSON(): void {
    this.contactCustomFields.forEach((customField: any) => {
      if (customField.isVisible) {
        let isLabelView: boolean = false;
        let tabNameObject = this.getValueFromJSON(customField.tabDisplayName);
        if (!tabNameObject) {
          let dataObject = {
            tabName: customField.tabDisplayName,
            tabNumber: customField.tabDisplayOrder,
            isTabAlwaysVisible: customField.tabIsAlwaysVisible,
            sections: [
              {
                sectionName: customField.sectionName,
                isLabelView: isLabelView,
                controls: [
                  {
                    displayOrder: customField.displayOrder,
                    fieldName: customField.fieldName,
                    fieldType: customField.fieldType,
                    fieldClass: customField.fieldClass,
                    defaultValue: customField.defaultValue,
                    label: customField.label,
                    optionsJSON: customField.optionsJSON ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                    settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                    dataSourceId: customField.datasourceID,
                  dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                  }
                ]
              }
            ]
          }
          this.addControlToFormJSON(customField.tabDisplayName, dataObject);
        } else {
          let existingSection = tabNameObject.sections.find(s => s.sectionName == customField.sectionName);
          if (existingSection) {
            existingSection.controls.push({
              displayOrder: customField.displayOrder,
              fieldName: customField.fieldName,
              fieldType: customField.fieldType,
              fieldClass: customField.fieldClass,
              defaultValue: customField.defaultValue,
              label: customField.label,
              optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
              settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
              dataSourceId: customField.datasourceID,
              dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
            });
          } else {
            tabNameObject.sections.push({
              sectionName: customField.sectionName,
              isLabelView: isLabelView,
              controls: [
                {
                  displayOrder: customField.displayOrder,
                  fieldName: customField.fieldName,
                  fieldType: customField.fieldType,
                  fieldClass: customField.fieldClass,
                  defaultValue: customField.defaultValue,
                  label: customField.label,
                  optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                  settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                  dataSourceId: customField.datasourceID,
                  dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                }
              ]
            });
          }
        }
      }
    });
  }

  private getValueFromJSON(name: string): any {
    return this.formDataJSON.find(item => item.tabName == name);
  }

  private addControlToFormJSON(name: string, dataObject: any): void {
    let obj = this.formDataJSON.find(item => item[name]);
    if (obj) {
      obj[name] = dataObject[name];
    } else {
      this.formDataJSON.push(dataObject);
    }
  }

  private getContactDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._contactService.getContactById(this.contactId)
        .then((response: any) => {
          if (response) {
            this.contact = this._commonHelper.deepClone(response);
            Promise.all([
              this.isEntityExistsInWorkFlow()
            ]).then(() => {
              this.setContactDetails(this.contact || {});
              this.contactForm = this.createContactDetailForm();
              this.prepareFormCustomFields();
              if (this.contact.entityWorkflowId) {
                this.contactForm.addControl('entityStageId', new FormControl(this.contact.entityStageId ?? null, Validators.required));
              }
              //show/Hide Pause/Resume button
              this.contact.isShowPauseOrResume =  (this.contact?.entityWorkflowId  != null) ? true : false;

              this.workTaskSubTypeDetails = this.entitySubTypes.find(x => x.level == 1);

              // prepare tab with order
              this.setDefaultNavTabs();
              this.prepareTabsWithOrder();
              this.copyOfContactFormValues = this.contactForm.value;
              this.isLoaded = true;
              this.refreshCustomFieldJSONGrid = true;
              setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);

              //find countryCode
              if(this.contact.phone) {
                const phoneDetail = String(this.contact.phone).split('|');
                if (phoneDetail.length == 2) {
                  this.contactForm.patchValue({'phone' : { countryCode : phoneDetail[0], phoneNumber : phoneDetail[1]}});
                  this.contact['countryCode'] = phoneDetail[0];
                  this.contact['phoneNumber'] = phoneDetail[1];
                  this.contact['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
                }
              } else {
                this.contactForm.patchValue({ 'phone': { countryCode: null, phoneNumber: null } });
              }
            });

             
          }
          else {
            this.isInitialLoading = false;
          }
          resolve(null);
          this._commonHelper.hideLoader();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.isInitialLoading = false;
          this.backToList();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  private createContactDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.contactId],
      title: [this.contact.title, Validators.compose([Validators.maxLength(200)])],
      name: [this.contact.name, Validators.compose([Validators.maxLength(200), Validators.minLength(2)])],
      firstname: [this.contact.firstName, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      lastname: [this.contact.lastName, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      email: [this.contact.email, Validators.compose([Validators.email, Validators.maxLength(200), Validators.minLength(2)])],
      countryCode: [],
      phone: [this.contact.phone],
      birthDate: [this.contact.birthDate != null ? moment(new Date(this.contact.birthDate)).toDate() : this.contact.birthDate],
      gender: [this.contact.gender],
      ssn: [this.contact.ssn],
      assignedTo: [this.contact.assignedTo],
      selectedStageTaskIds: [this.contact.selectedStageTaskIds],
      typeId: [this.contact.typeId, Validators.compose([Validators.required])]
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.contact.customFieldJSONData[control.fieldName] != null && this.contact.customFieldJSONData[control.fieldName] != '') {
              this.contact.customFieldJSONData[control.fieldName] = moment(new Date(this.contact.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
              this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.contact.customFieldJSONData[control.fieldName] != null && this.contact.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.contact.customFieldJSONData[control.fieldName] === 'string') {
                this.contact.customFieldJSONData[control.fieldName] = JSON.parse(this.contact.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.contact.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.contact.customFieldJSONData[control.fieldName] != null && this.contact.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.contact.customFieldJSONData[control.fieldName];
              this.contact.customFieldJSONData[control.fieldName] = this.contact.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
              }
              this.contact.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
              if (control.settingsJSON) {
                let validatorFn: ValidatorFn[] = [];
                if (control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                  validatorFn.push(Validators.required);
                }
                if (control.settingsJSON.hasOwnProperty('minLength') && control.settingsJSON['minLength']) {
                  validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
                }
                if (control.settingsJSON.hasOwnProperty('maxLength') && control.settingsJSON['maxLength']) {
                  validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
                }
                if (validatorFn.length > 0) {
                  this.contactForm.controls[control.fieldName].setValidators(validatorFn);
                  this.contactForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.contact.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.contact.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
              this.contactForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.contactForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
              this.contactForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.contactForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName], Validators.email));
            let validatorFn: ValidatorFn[] = [];
            validatorFn.push(Validators.email);
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
              this.contactForm.controls[control.fieldName].setValidators(validatorFn);
              this.contactForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
            if (this.contact.customFieldJSONData[control.fieldName] != null && this.contact.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.contact.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.contactForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.contactForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.contactForm.addControl(control.fieldName, new UntypedFormControl(this.contact.customFieldJSONData[control.fieldName]));
            if (control.settingsJSON) {
              let validatorFn: ValidatorFn[] = [];
              if (control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                validatorFn.push(Validators.required);
              } 
              if (control.settingsJSON.hasOwnProperty('minLength') && control.settingsJSON['minLength']) {
                validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
              }
              if (control.settingsJSON.hasOwnProperty('maxLength') && control.settingsJSON['maxLength']) {
                validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
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
          }
        });
      });
    });
  }

  setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navWorkTasks', isFirst: false, condition: this.isListWorkTask, displayOrder: 201 },
      { tabName: '', tabLink: 'navRelatedOpportunities', isFirst: false, condition: this.isListOpportunities, displayOrder: 301 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 401 },
      { tabName: '', tabLink: 'navRelatedCases', isFirst: false, condition: this.isListCases, displayOrder: 801 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 901 }
    ];

    this.setNativeTabDetails();

    this.navTabsAll = [...this.navTabsAll, ...this.entityRelationTabs];

    this.navTabsAll.forEach(f=>{
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false),(f.showCloseTabIconBtn = false), (f.showButtonActive = false) 
    });
  }

  private setNativeTabDetails() {
    this.navTabsAll.forEach(tab => {
      const nativeTabDetail = this.nativeTabDetails != null ? this.nativeTabDetails.find(x => x != null && x.code?.toLocaleLowerCase() === tab.tabLink.toLocaleLowerCase()) : null;
      if (nativeTabDetail != null) {
        tab.tabName = nativeTabDetail.displayName;
        tab.displayOrder = nativeTabDetail.displayOrder;
        tab.condition = tab.condition && nativeTabDetail.isActive;
      }
      else {
        tab.condition = false;
      }
    });

    if (!this.navTabsAll.some(x => x.condition)) {
      this.navTabsAll.find(x => x.isFirst).condition = true;
    }
  }

  private prepareTabsWithOrder() : void {
    this.formDataJSON.forEach(tab => {
      var objNavTab  = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab:false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn : true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort(( a, b ) => a.displayOrder > b.displayOrder ? 1 : -1 );
    this.setTabLayout(); 
  }

  private setWorkTaskTabParameters(): void {
    this.tbWorktaskParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.contactId
    }]
  }

  private setRelatedOpportunitiesTabParameters(): void {
    this.tbRelatedOpportunitiesParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.contactId
    }]
  }

  private setRelatedCasesTabParameters(): void {
    this.tbRelatedCasesParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.contactId
    }]
  }
  
  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'contacts.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() == 'contacts.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.CONTACTS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      } else if (error.messageCode.toLowerCase() == 'contacts.alreadyassignedforcase') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.CONTACTS_ALREADYASSIGNEDFORCASE'));
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.' + error.messageCode.replace('.', '_').toUpperCase()));
      }
    }
  }

  private validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  private setContactDetails(response: any): void {
    this.contact.customFieldJSONData = this._commonHelper.tryParseJson(this.contact.customFieldJSONData);

    if (!this.contact.entityWorkflowId) {
      this.updateWorkFlowStageTaskDetail();
    } else {
      this.copyOfContact = this._commonHelper.deepClone(this.contact);
    }
    this.contact.birthDate = this.contact.birthDate != null ? moment(new Date(this.contact.birthDate)).toDate() : this.contact.birthDate;
    this.isRelatedAccount = this.contact?.accountName != null ? true : false;
    this.entityRecordTypeId = this.contact?.entityRecordTypeID;
    this.copyOfContact.customFieldJSONData = this._commonHelper.deepClone(this.contact.customFieldJSONData);
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.contact.customFieldJSONData) {
        this.contactCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.contact.customFieldJSONData[field.fieldName] && this.contact.customFieldJSONData[field.fieldName] != null && this.contact.customFieldJSONData[field.fieldName] != '') {
              this.contact.customFieldJSONData[field.fieldName] = moment(this.contact.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.contactForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.contact.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.contact.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.contactForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.contact.customFieldJSONData[field.fieldName] = data;
            } else {
              this.contact.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      this.contact.birthDate = this.contact.birthDate != null ? moment(this.contact.birthDate).format('YYYY-MM-DD') : this.contact.birthDate;

      //concat country code with phone number;
      const formValues = this.contactForm.getRawValue();
      if(formValues.phone) {
        if(formValues.phone.countryCode && formValues.phone.phoneNumber) {
          this.contact.phone = formValues.phone.countryCode +  '|' +  String(formValues.phone.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
        } else {
          this.contact.phone = null;
        }
      }

      let params = this._commonHelper.deepClone(this.contact);

      this.contactCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.contactForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });


      //set selectedStageTaskIDs
      if (params.selectedStageTaskIds != null) {
        if (Array.isArray(params.selectedStageTaskIds)) {
          params.selectedStageTaskIds = params.selectedStageTaskIds.map(task => task.id).toString()
        }
      } else {
        params.selectedStageTaskIds = '';
      }
        params.fromEntityStageId = this.fromEntityStageId;

      this._contactService.updateContact(params).then(() => {
        this.getContactDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => {
            this.refreshCustomFieldDatasource = false;
          }, 50);
          resolve(null)
        });

        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getContactDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => {
              this.refreshCustomFieldDatasource = false;
            }, 50);
          });
          resolve(null)
        } else {
          reject(null)
        }
        reject(null)
      });
    })
  }

  // set current active tab
  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceWorkTaskClicked && this.activeTab == 'navWorkTasks'){
      this.onceWorkTaskClicked = true;
    }

    if (!this.onceRelatedOpportunitiesClicked && this.activeTab == 'navRelatedOpportunities'){
      this.onceRelatedOpportunitiesClicked = true;
    }

    if(!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
      this.onceStageHistoryClicked = true;
    }

    if((!this.onceRelatedCasesClicked && this.activeTab == 'navRelatedCases')) {
      this.onceRelatedCasesClicked = true;
    }

    if (activeInfo.tab.hasOwnProperty("isTabLoaded") && !activeInfo.tab.isTabLoaded) {      
      activeInfo.tab.isTabLoaded = true;
      const selectedTab = this.entityRelationTabs.find(x => x.tabLink == activeInfo.tab.tabLink);
      if (selectedTab) {
        selectedTab['isTabLoaded'] = true;
      }
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
  }

  setRefreshActivityHistory() {
    this.refreshActivityHistory = false;
    setTimeout(() => {
      this.refreshActivityHistory = true;
    }, 500);
  }

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }

  //#endregion

  findInvalidControls() {
    const invalid = [];
    const controls = this.contactForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  navigateToTabByValidation() {
    let findInCustomTab: boolean = false;
    let customTabLink: string = '';
    let original_customTabLink: string = '';
    let inValidControls: any[] = this.findInvalidControls();
    if (inValidControls.length > 0) {
      this.formDataJSON.forEach(tab => {
        tab.sections.forEach(section => {
          section.controls.forEach(control => {
            const controlExists = inValidControls.find(x => x === control.fieldName);
            if (controlExists) {
              original_customTabLink = tab.tabName;
              customTabLink = tab.tabName.replace(/\s/g, "");
              findInCustomTab = true;
              return;
            }
          })
        });
      });
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
        //Auto Redirect to Tab which is depen
        if (findInCustomTab) {
          if (this.navTabs.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())) {
            document.getElementById('btn_nav' + customTabLink).click();
          }
          else {
            let tab = this.navTabsAll.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())
            if (tab) {
              this.selectedTab = tab.tabLink;
              let param: any = {};
              param.isAdditionalTab = tab.tabLink === "additionalTabs";
              param.isNativeTab = true; // always true
              param.tab = tab;
              this.checkTabCall(param, false)
            }
          }
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
      else {
        if (findInCustomTab) {
          document.getElementById('btn_nav' + customTabLink).click();
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
    }
  }

  //#region Workflow Related Functions
  getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowManagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
          (response: any[]) => {
            this.contactStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
            // stage tasks
            this.contactStages.forEach(stageElement => {
              if (stageElement.stageTasks != null) {
                stageElement.stageTasks = this._commonHelper.tryParseJson(stageElement.stageTasks);
                // all stage tasks - change label if task is required
                stageElement.stageTasks.forEach(stageTask => {
                  if (stageTask.isRequired) {
                    stageTask.name = stageTask.name + ' *';
                  }
                });
              }
            });
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.contactStages));
            this.getEntityStagesWithTaskAfterReset();
            this._commonHelper.hideLoader();
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.contactStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      }
    });
  }

  getEntityStagesWithTaskAfterReset() {
    // get current stage 
    this.currentStage = this.contactStages.find(f => this.contact && this.contact.entityStageId === f.id) || this.contactStages.find(f => f.isDefault);
    
    //set selected stage for mobile view
    this.selectedStage = this.currentStage;

    // get current stage tasks
    this.currentStageTask = this.contactStages.length > 0 ? this.contactStages.find(s => s.id == this.contact.entityStageId)?.stageTasks ?? null : '';
    if (this.contact.selectedStageTaskIds != null && this.contact.selectedStageTaskIds != "") {
      const taskIds: Array<number> = this.contact.selectedStageTaskIds
        ? this.contact.selectedStageTaskIds.split(",").map(m => Number(m))
        : [];
      // map and get only ID and Name
      this.contact.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
      this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.contact.selectedStageTaskIds));
    }
  }

  private isEntityExistsInWorkFlow() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowManagementService.isEntityExistsInWorkFlow(this.contactId, this.entityTypeId).then((response: any) => {
        if (response) {
          const entityWorkFlowStageValue = response;
          this.isEntityWorkflow = true;
          if (this.entityWorkflowId != null && entityWorkFlowStageValue.entityWorkFlowId != this.entityWorkflowId) {
            this.isInitialLoading = false;
          }
          else {
            this.contact.entityWorkflowId = this.entityWorkflowId = entityWorkFlowStageValue.entityWorkFlowId;
            this.contact.entityStageId = this.contactCurrentStage = entityWorkFlowStageValue.stageId;
            this.fromEntityStageId = this.contact.entityStageId;
            this.contact.isPaused = entityWorkFlowStageValue.isPaused;
            this.contact.selectedStageTaskIds = this.contactCurrentStageTaskIds = entityWorkFlowStageValue.taskIds;
            if (this.contact.entityWorkflowId != null) {
              Promise.all([
                this.getWorkflowDetail(this.entityWorkflowId),
                this.getEntityStagesWithTask()
              ]).then(() => {
                this.updateWorkFlowStageTaskDetail();
                if(this.isEntityWorkflow){
                  this.getEntityTotalReportingTime();
                }
              });
            }
          }
        }
        this._commonHelper.hideLoader();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.isInitialLoading = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  private updateWorkFlowStageTaskDetail() {
    this.contact.entityWorkflowId = this.entityWorkflowId;
    this.contact.entityStageId = this.contactCurrentStage;
    this.copyOfContact = this._commonHelper.deepClone(this.contact);
  }

  private saveEntityWorkflowStageValueNote(params) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowManagementService.saveEntityWorkflowStageValueNote(params).then(() => {
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

  private canUserChangeStage(currentStage, account): boolean {
    if (currentStage == null || account == null) {
      return true;
    }

    let canUserMoveAccount: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveAccount = canUserMoveAccount || (account.hasOwnProperty(associatePropertyName) ? (account[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveAccount = true;
    }
    return canUserMoveAccount;
  }
  //#endregion

  // stage transition
  onMarkStageAsComplete(dropEntityStageId) {
    var isShowStageChangeConfirmationBox: boolean = true;
    this.optionsForPopupDialog.size = 'md';
    const dropEntityStageDetail = this.contactStages.find(s => s.id == dropEntityStageId)
    if (dropEntityStageDetail != null && dropEntityStageId != this.contact.entityStageId) {
      const prevEntityStageDetail = this.contactStages.find(s => s.id == this.contact.entityStageId);
      const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.contact);

      if (!canUserChangeStage) {
        if (this.changeContactStage) {
          isShowStageChangeConfirmationBox = false;
          this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
              if (confirmed) {
                this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox);
              }
            });
        }
        else {
          this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
        }
      }
      else {
        this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox);
      }
    }
  }

  afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox: boolean) {
    const dropEntityStageDetail = this.contactStages.find(s => s.id == dropEntityStageId);

    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.contactStages.find(x => x.id == this.contact.entityStageId);
    let isAllTasksRequired = currentStage?.isAllTasksRequired;
    // see if current stage have stage tasks
    if (currentStage.stageTasks != null) {
      if (currentStage.stageTasks.length > 0) {
        currentStage.stageTasks.forEach(stageTask => {
          if (stageTask.isRequired) {
            anyTasksIsRequired = true;
            // add to list
            requiredTasks.push(stageTask.id);
          }
        })
      }
    }

    if (anyTasksIsRequired) {
      let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
      this._commonHelper.showLoader();
      this._workflowManagementService.isEntityStageTasksCompleted(this.contactId, this.entityTypeId, this.contact.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.MESSAGE_BEFORE_MOVE_CONTACT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired) {

      this._commonHelper.showLoader();
      this._workflowManagementService.isEntityStageTasksCompleted(this.contactId, this.entityTypeId, this.contact.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.MESSAGE_BEFORE_MOVE_CONTACT_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });

    } else {
      this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
    }
  }

  changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox: boolean) {
    if (dropEntityStageDetail.isNoteRequired) {
      isShowStageChangeConfirmationBox = false;
      this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.contactId;
      this.modalRef.componentInstance.noteSubject = dropEntityStageDetail.name;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail.name }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      
      this.modalRef.result.then(response => {
        if (response != undefined) {
          this.refreshActivity = true;
          this.setRefreshActivityHistory();
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: this.contactId,
            workflowId: this.entityWorkflowId,
            workflowStageId: dropEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              this.isEntityExistsInWorkFlow();
              if (this.isEntityWorkflow) {
                this.setRefreshStageHistory();
              }
            });
          }).catch(()=>{
            this.isEntityExistsInWorkFlow();
            if (this.isEntityWorkflow) {
              this.setRefreshStageHistory();
            }
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox),
      ]).then(() => {
        this.isEntityExistsInWorkFlow();
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
      }).catch(()=>{
        this.isEntityExistsInWorkFlow();
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(dropEntityStageId, dropEntityStageName, isShowStageChangeConfirmationBox: boolean) {
    return new Promise((resolve, reject) => {
      if(isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm("CRM.CONTACT.CHANGE_STAGE_CONFIRMATION", null, null, this.optionsForPopupDialog).then((confirmed: any) => {
          if(confirmed) {
            return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageName);  
          }
        })        
      }else {
        return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageName);
      }
    });
  }

  afterUpdateEntityStage(dropEntityStageId, dropEntityStageName) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let assignedToForDto = this.contact.assignedTo;
      let currentStageId = this.contactStages.find(x => x.id == this.contact.entityStageId)?.id;
      this._workflowManagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: this.contactId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          const contactAssignedTo = response;
          if (assignedToForDto != contactAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._contactService.saveContactAssignedTo({ entityId: this.contactId, assignedToId: contactAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: contactAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = contactAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.MESSAGE_CONTACT_MOVETO_STAGE',
                  { stageName: dropEntityStageName })
              );
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
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.MESSAGE_CONTACT_MOVETO_STAGE',
                { stageName: dropEntityStageName })
            );
          }
        }
        this.getContactDetail();
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
        resolve(null);
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    })
  }

  private getEntityTotalReportingTime() {
    this._workflowManagementService.getEntityTotalReportingTime(this.contactId, this.entityTypeId).then((response: any) => {
      if (response) {
        this.totalSpentTime = new TimeFramePipe().transform(+response?.totalSpentTime, this.hoursInDay);
        this.totalEffectiveTime = new TimeFramePipe().transform(+response?.totalEffectiveTime, this.hoursInDay);
        this.totalPauseTime = new TimeFramePipe().transform(+response?.totalPauseTime, this.hoursInDay);
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }

  //#region ASSIGNED TO USERS
  // get assigned users
  getAssignedToUsers(includeAllUsers = 1, searchString = null) {
    this.showAssignedToLoader = true;
    
    // get datasource details
    const params = this.prepareParamsForAssignedToUsers(this.contact.entityStageId, this.contact.assignedTo, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CONTACTASSIGNEDTO, params).then(response => {
      this.assignedToUsers = response as any[];
      this.showAssignedToLoader = false;
      if(!searchString)
        this.isForceReloadAssignedTo = false;
      else 
        this.isForceReloadAssignedTo = true;
    },
      (error) => {
        this.showAssignedToLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers = 1, searchString ='') {
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
  //#endregion
  /**
   * START
   * Moksh Dhameliya 25 May 2023
   * Additional Tabs Code 
   */
  async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length )  ) {
      let isAdditionalTabExist = false;
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
         this.navTabs = this.navTabsAll.filter(f => f.isNativeTab || f.isTabAlwaysVisible); // nativeTab 
        this.navTabsMore = this.navTabsAll.filter(f => !f.isNativeTab && !f.isTabAlwaysVisible); // custom tab
        //checking more tab exist for additional tab
        if (this.navTabsMore.length > 0) {
          isAdditionalTabExist = true;
          let objNavTab = {
            tabName: TabLayoutType.LABEL_ADDITIONAL_TAB,
            tabLink: 'additionalTabs',
            isFirst: false,
            condition: true,
            displayOrder: this.navTabs[this.navTabs.length - 1].displayOrder + 1,
            isNativeTab: true
          }
          objNavTab.condition = true;
          this.navTabs.push(objNavTab);
          this.nativeTabCount = this.navTabs.length;
        }
        else {
          isAdditionalTabExist = false;
        }
      }else {
        this.navTabsAll.forEach((f) => {
          (f.showCloseTabIconBtn = false)
        });
      }
      if (!isAdditionalTabExist) {
        this.navTabs = this._commonHelper.deepClone(this.navTabsAll);
        this.isNativeTab = true;
        this.isAdditionalTab = false;
      }
      //Tab Order Sorting
      this.navTabs = this.navTabs?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      this.navTabsMore = this.navTabsMore?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      // set first as default
      if (this.selectedTab == '') {
        this.setDefaultTab()
      }
    }
  }

  private setDefaultTab() {
    let defaultTab = this.navTabs[0];
    let isBypassAutoTabEvent: boolean = false;
    if (this.forceRedirectionTabName != null && this.forceRedirectionTabName != '') {
      if (this.navTabs?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabs.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Redirect to Native Tab
        let param: any = {};
        param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 1);
      }
      else if (this.navTabsMore?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabsMore.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Generate Tab and Redirect to Custom Tab
        let param: any = {};
        param.isAdditionalTab = false;
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 0);

        //No need to initiate autoTabEventEvent event as it is already initiated in CheckTabCall Function
        isBypassAutoTabEvent = true;
      }
    }
    else {
      // Redirect to first tab in the array which was already sorted by display order
      let param: any = {};
      param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
      param.isNativeTab = true; // always true
      param.tab = defaultTab;
      this.checkTabCall(param, 1);
    }

    this.selectedTab = defaultTab.tabLink;
    if (!isBypassAutoTabEvent) {
      this._commonHelper.autoTabEventEvent.next(defaultTab);
    }
  }

  //Checking Tab Return call from globle tab
  checkTabCall(paramTab, isNativeTab) {
    this.previousActiveTabIndex = this.currentActiveTabIndex;
    this.isNativeTab = paramTab.isNativeTab;
    this.isAdditionalTab = paramTab.isAdditionalTab;
    if (!isNativeTab) {
      const tabExist = this.navTabs.find(x => x.tabLink === paramTab.tab.tabLink);
      if(this.navTabs.lastIndexOf(paramTab.tab)) {
        paramTab.tab.showButtonActive = true;
      }
      if (!tabExist) {
        this.navTabs.push(paramTab.tab);
      }
      this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink)
      this.selectedTab = this.navTabs[this.currentActiveTabIndex].tabLink;
      this._commonHelper.autoTabEventEvent.next(paramTab.tab);
    }
    this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink);
    this.setTab(paramTab);
  }

  //close specific additionalTabs
  closeNavTab(paramTab) {
    let index: any;
    let isSameTab;

    const removeNavtab = this.navTabs.findIndex(e => e.tabLink === paramTab.tab.tabLink);
    if(this.previousActiveTabIndex > removeNavtab)
      this.previousActiveTabIndex--;
    if(removeNavtab > -1) {
      if(removeNavtab === this.navTabs.findIndex(e => e.tabLink === this.activeTab)) {
        isSameTab = true;
        index = this.previousActiveTabIndex;
        this.currentActiveTabIndex = this.previousActiveTabIndex;
      }else {
        index = this.currentActiveTabIndex;
      }
      this.navTabs.splice(removeNavtab, 1);
      paramTab.tab.showButtonActive = false
      if (this.previousActiveTabIndex > this.navTabs.length - 1) {
        this.previousActiveTabIndex = this.navTabs.length - 1;
        if(isSameTab) {
          index = this.previousActiveTabIndex;
        }
      }
    }

    const paramTab1 = this.navTabs[index];
    paramTab1.isAdditionalTab = paramTab1.tabLink === "additionalTabs";
    paramTab1.tab = paramTab1;
    this._commonHelper.autoTabEventEvent.next(paramTab1.tab);
    this.setTab(paramTab1.tab);
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.CONTACT_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CONTACT_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.CONTACT_TAB_LAYOUT}`, JSON.stringify(response));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            resolve(this.tabLayout);
          });

      }
      else {
        this.tabLayout = tabLayout;
        resolve(null);
      }
    });
  }
  /**
 * END
 * Additional Tabs Code 
 */

  
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

  onContactTypeSelectionChange(value) {
    this.contact.typeId = value;
  }

  getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isEntityWorkflow && entityWorkflowId > 0) {
        //storage key
        let storageKey = `${LocalStorageKey.ContactWorkflowDetailsKey}_${entityWorkflowId}`;
        // get data
        const workflowDetail = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
        if (workflowDetail == null) {
          this._commonHelper.showLoader();
          this.isInitialLoading = true;
          this._workflowManagementService.getWorkflowDetail(entityWorkflowId)
            .then((response: any) => {
              if (response.layoutTypeID == LayoutTypes.ListView) {
                this.isListViewLayout = true;
              } else { this.isListViewLayout = false; }

              this._commonHelper.hideLoader();
              // store in local storage
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
              resolve(response);
            }, (error) => {
              this._commonHelper.hideLoader();
              this.isInitialLoading = false;
              this._commonHelper.showToastrError(error.message);
              reject(null);
            });
        }
        else {
          if (workflowDetail && workflowDetail?.layoutTypeID == LayoutTypes.ListView) {
            this.isListViewLayout = true;
          } else { this.isListViewLayout = false; }

          resolve(workflowDetail);
        }
      }
      else {
        resolve(null);
      }
    });
  }

  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.contactId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
      }
    });
  }
  //delete work task - confirmation dialog
  deleteWorkTask(workTask) {
    this._commonHelper.showLoader();
    this._workTaskService.isSubWorkTaskExist(workTask.id).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasSubWorkTask: boolean = res?.isExist || false;

      if (hasSubWorkTask) {
        //available Subtask Types
        let worktaskTypeLevel: number = this.entitySubTypes.find(x => x.id == workTask.typeID)?.level ?? 0;
        this.availableSubWorkTaskTypeDetails = this.entitySubTypes.filter(x => x.parentID == workTask.typeID && x.level == worktaskTypeLevel + 1 && this._commonHelper.havePermission(x.listPermissionHash));
        this.availableSubWorkTaskTypeNamesForWorkTaskDelete = this.availableSubWorkTaskTypeDetails?.map(x => x.name).join(" or ")?.trim() ?? null;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
        );
        return false;
      } else {

        //option for confirm dialog settings
        let optionsForConfirmDialog = {
          size: "md",
          centered: false,
          backdrop: 'static',
          keyboard: false
        };

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? ''}), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? ''})
                );
                this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_OPPORTUNITIES.OPPORTUNITY_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }
  //navigate to edit page
  editWorkTask(workTaskId) {
    this._router.navigate(['/worktasks/details/' + workTaskId]);
  }

  refreshChildComponent() {
    this.refreshWorkTaskTab = false;
  }

  refreshChildComponentForOpportunity() {
    this.refreshOpporunityTab = false;
  }

  refreshChildComponentForCase() {
    this.refreshCaseTab = false;
  }

  addOpportunity() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.contactId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.opportunityRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.opportunityWorkflowList?.filter(s => s.value != 0)?.filter(s => s.parentEntityTypeID == Entity.Contacts || s.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityType = Entity.Contacts ;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshOpporunityTab = true;
      }
    });
  }

  editOpportunity(opporutnityId: number) {
    this._router.navigate(['/opportunities/details/' + opporutnityId]);
  }

  deleteOpportunity(opporutnityId: number) {
    this.optionsForConfirmDialog.size = 'md';

    this._confirmationDialogService.confirm('OPPORTUNITIES.LIST.MESSAGE_CONFIRM_OPPORTUNITY_DELETE', null, null, this.optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._opportunitiesService.deleteOpportunity(opporutnityId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_DELETE')
            );
            this.refreshOpporunityTab = true;
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.OPPORTUNITY_DISMISS_DIALOG')));
  }

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.contactId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList?.filter(x => x.value != 0)?.filter(x => x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCaseColumn;
    this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshCaseTab = true;
      }
    });
  }

  editCase(caseId: number) {
    this._router.navigate(['/cases/details/' + caseId]);
  }

  deleteCase(caseId: number) {
    this._commonHelper.showLoader();
    this._casesService.isSubCaseExist(caseId).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasSubCase: boolean = res?.isExist || false;

      if (hasSubCase) {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CASES.CASES_SUBCASEEXISTMESSAGEBEFOREPARENTTASKDELETE')
        );
        return false;
      } else {

        //option for confirm dialog settings
        this.optionsForConfirmDialog.size = 'md';

        this._confirmationDialogService.confirm('CASES.LIST.MESSAGE_CONFIRM_CASE_DELETE', null, null, this.optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._casesService.deleteCase(caseId).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_DELETE')
                );
                this.refreshCaseTab = true;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }

   //get Entity Record Type
   private getEntityRecordTypes(): Promise<any> {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    return new Promise((resolve, reject) => {
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.opportunityRecordTypes = response?.filter((s: any) => s.entityTypeID == Entity.Opportunities && s.parentEntityTypeID == this.entityTypeId);
            this.casesRecordTypes = response?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == this.entityTypeId));
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
      }
      else {
        this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
        this.opportunityRecordTypes = allEntityRecordTypes?.filter((s: any) => s.entityTypeID == Entity.Opportunities && s.parentEntityTypeID == this.entityTypeId);
        this.casesRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == this.entityTypeId));
        resolve(null);
      }
    });
  }

  private prepareParamsWorkflows(entityTypeId: number): any[] {
    return [
      { name: 'EntityTypeID', type: 'int', value:  entityTypeId}
    ]
  }

  private getWorktaskWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.WorkTasks}`;

      this.worktaskWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.worktaskWorkflowList == null) {
        const params = this.prepareParamsWorkflows(Entity.WorkTasks);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.worktaskWorkflowList = response;
            this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
            this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.worktaskWorkflowList));
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
        this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
        this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private getWorkflowListForOpportunity() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Opportunities}`;

      this.opportunityWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.opportunityWorkflowList == null) {
        const params = this.prepareParamsWorkflows(Entity.Opportunities);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.opportunityWorkflowList = response;
            this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_OPPORTUNITIES.FILTER_OPTION_TEXT_WORKFLOW') });
            this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.opportunityWorkflowList));
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
        this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_OPPORTUNITIES.FILTER_OPTION_TEXT_WORKFLOW') });
        this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private getEntityHiddenField() {
    return new Promise((resolve, reject) => {
      // storage key
      let storageKey = LocalStorageKey.AllEntityHiddenFieldSettings;
      // get data
      let hiddenFieldSettings = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (hiddenFieldSettings == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntityHiddenFields().then((response: any) => {
          if (response) {
            this.entityHiddenFieldSettings = response as [];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.entityHiddenFieldSettings));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          })
      }else {
        this.entityHiddenFieldSettings = hiddenFieldSettings;
        resolve(null);
      }
    });
  }

  private getWorkflowListForCase() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Cases}`;

      this.casesWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.casesWorkflowList == null) {
        const params = this.prepareParamsWorkflows(Entity.Cases);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.casesWorkflowList = response;
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_CASES.FILTER_OPTION_TEXT_WORKFLOW') });
            this.casesWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.casesWorkflowList));
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_CASES.FILTER_OPTION_TEXT_WORKFLOW') });
        this.casesWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private getEntitySubTypes() {
    return new Promise((resolve, reject) => {
      let storageKey = `${LocalStorageKey.ALLENTITYSUBTYPES}`;
      const allEntitySubTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntitySubTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntitySubTypes().then((response: any) => {
          if (response) {
            this.entitySubTypes = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this._commonHelper.hideLoader();
          resolve(this.entitySubTypes);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.entitySubTypes = allEntitySubTypes;
        resolve(this.entitySubTypes);
      }
    });
  }

  private getCountries() {
    const countries = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Countries));
    if (countries == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getCountries().then(response => {
          this.countries = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Countries, JSON.stringify(this.countries));
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
      this.countries = countries;
    }
  }

  onDeleteContact(Id) {
    let params = {
      "entityId": Id,
      "entityTypeId": Entity.Contacts
    }

    let messageText: string = "";
    this._commonHelper.showLoader();
    this._workTaskService.GetWorkTasksByEntity(params).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasWorktask: boolean = res != null && res.length > 0;
      messageText = hasWorktask ? 'CRM.CONTACT.DETAIL.MESSAGE_CONFIRM_DELETE_WITHTASK' : 'CRM.CONTACT.DETAIL.MESSAGE_CONFIRM_DELETE';
      this.optionsForPopupDialog.size = "md";
      this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            if (hasWorktask) {
              this.deleteContactWithRelatedWorkTasks(Id);
            }
            else {
              this.deleteContact(Id);
            }
          }
        });
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private deleteContactWithRelatedWorkTasks(Id) {
    this._commonHelper.showLoader();
    this._contactService.deleteContactWithRelatedWorkTasks(Id).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.MESSAGE_CONTACT_DELETED')
      );
      // Redirect Contact Listing Page.
      this._router.navigateByUrl('/contacts/list');
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private deleteContact(Id) {
    this._commonHelper.showLoader();
    this._contactService.deleteContact(Id).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.MESSAGE_CONTACT_DELETED')
      );
      // Redirect Contact Listing Page.
      this._router.navigateByUrl('/contacts/list');
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  onContactStagePauseChanged(contact: any, isPaused: boolean) {
    if (!this.isEditContact) { return; }
    if (contact.assignedTo !== this._loggedInUser.userId) {
      let message = "";
      if (contact.assignedTo == null || contact.assignedTo == "" || contact.assignedTo == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.contactStagePauseChange(contact, isPaused);
          }
        });
    }
    else if (contact.assignedTo == this._loggedInUser.userId) {
      this.contactStagePauseChange(contact, isPaused);
    }
  }
  private contactStagePauseChange(contact, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: contact.id,
      entityStageId: contact.entityStageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: contact.assignedTo,
      noteID: null
    };

    if (params.isPaused) {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = contact.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.PAUSE_REASON_NOTE_SUBJECT', { stageName: contact.stageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = contact.entityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate) {
          params.noteID = noteDate.id;
          this.saveEntityStagePauseTransition(params, contact);
        }
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: contact.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.RESUME_NOTE_DESCRIPTION', { stageName: contact.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransition(params, contact);
        }
        this._commonHelper.hideLoader();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
          );
        });
    }
  }

  private saveEntityStagePauseTransition(params, contact) {
    this._commonHelper.showLoader();
    this._workflowManagementService.saveEntityStagePauseTransition(params)
      .then(() => {
        const param = {
          entityTypeId: params.entityTypeId,
          entityId: params.entityId,
          workflowId: params.entityWorkflowId,
          workflowStageId: params.entityStageId,
          stageNoteID: null,
          pauseNoteID: params.isPaused ? params.noteID : null,
          processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.PauseNote
        };

        this._workflowManagementService.saveEntityWorkflowStageValueNote(param).then(() => {
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_SUCCESS'));
          contact.isPaused = params.isPaused;
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
  }

}