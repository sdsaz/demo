import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppointmentService } from '../../../../@core/sharedServices/appointment.service';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { UsersService } from '../../../usermanagement/users/users.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { EntityNotificationService } from '../../../../@core/sharedComponents/entity-notification/services/entity-notification.service';
import { AppointmentStatus, DataSources, Entity, LocalStorageKey, PublicTenantSettings, RefType, TabLayoutType } from '../../../../@core/enum';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
import { SettingsService } from '../../../settings/settings.service';
import { Events } from '@tinymce/tinymce-angular/editor/Events';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'ngx-appointments-detail',
  templateUrl: './appointments-detail.component.html',
  styleUrls: ['./appointments-detail.component.scss']
})
export class AppointmentsDetailComponent implements OnInit {

  private appointmentTxtSubjectRef: ElementRef;
  @ViewChild('appointmentTxtSubject', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.appointmentTxtSubjectRef = content;
    }
  }
 
   // Appointment model
   entityTypeId: number = Entity.Events;
   appointmentId: number;
   appointment: any;
   entityRecordTypeId: number = null;
   appointmentSubject: String = '';
   copyOfAppointment: any;
   copyOfAppointmentFormValues: any;
   appointmentCustomFields: any[] = [];
   appointmentForm: UntypedFormGroup;
   isInitialLoading: boolean = true;

  appointmentStages: Array<any> = [];
  currentStage: any;
  eventStatusOptions: any;
  users: any;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshDocument: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  currencySymbol: any = null;
  formDataJSON: any[] = [];
  refreshCustomFieldJSONGrid: boolean = false;

  isEntityWorkflow: boolean = false;
  isListViewLayout: boolean = true;
  selectedStage: any;
  countries: any;

  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any;
  hoursInDay: number = null;
  endTimeError: string = '';
  totalMinDifference: any = null;
  //next round up time get from uram
  nextRoundUpTime: any;
  roundUpMinDate: Date;


  // permissions
  isViewAppointment: boolean = false;
  isAddAppointment: boolean = false;
  isEditAppointment: boolean = false;
  isDeleteAppointment: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  hasPermission: boolean = false;
  
  //navTabs
  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  isNativeTab: boolean = true;
  isReadOnly: boolean = true;
  activeTab = '';
  isAdditionalTab: boolean = false;
  selectedTab: string = '';
  forceRedirectionTabName: string = '';
  nativeTabDetails: any = [];
  nativeTabCount: number = 0;
  tabLayout: string = 'Default';
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;

  //user detail
  _loggedInUser: any;

  attendees: any[] = [];
  selectedAttendees: any[] = [];

  parentEntityList: any = [];
  selectedEntity: any = null;
  relatedToList: any = [];
  selectRelatedto: any = [];
  showRelatedToLoader: boolean = false;
  fromAppointment: boolean = true;

  relatedToName: string;
  relatedToNamePlaceholder: string;
  relatedToNameForHeader: string;
  relatedToIcon: string;
  relatedToIconToolTip: string;

  isCompleted: boolean = false;
  isCanceled: boolean = false;

   //all popup dialog open option settings
   optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  appointment_validation_messages = {
    'subject': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_SUBJECT' }
    ],
    'activityDate': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_DATE' }
    ],
    'startTime': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_START_TIME' }
    ],
    'endTime': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_END_TIME' }
    ],
    'ownerId': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_ASSIGN_ACCOUNT_MANAGER' }
    ],
    'providerId': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_PROVIDER' }
    ],
    'relatedto': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_RELATEDTO' }
    ]
  }

  constructor(
    private _ngbActiveModal: NgbActiveModal,
    private _appointmentService: AppointmentService,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _usersService: UsersService,
    private _datasourceService: DatasourceService,
    private _modalService: NgbModal,
    private _entityNotificationService: EntityNotificationService,
    private _dataSourceService: DatasourceService,
    private _location: Location,
    private _activeRoute: ActivatedRoute,
    private _router: Router,
    private _settingsService: SettingsService,
    private _formBuilder: UntypedFormBuilder,
    private _confirmationDialogService: ConfirmationDialogService,
    private _timeFrameToMinutesPipe: TimeFrameToMinutesPipe,) {
    Promise.all([
        this.getTabLayoutTenantSetting()
    ]).then(() => {
        this.setTabLayout();
    });
    this.isViewAppointment = this._commonHelper.havePermission(enumPermissions.ViewAppointment);
    this.isAddAppointment = this._commonHelper.havePermission(enumPermissions.AddAppointment);
    this.isEditAppointment = this._commonHelper.havePermission(enumPermissions.EditAppointment);
    this.isDeleteAppointment = this._commonHelper.havePermission(enumPermissions.DeleteAppointment);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadProductCategoryDocument);
    
    this.hasPermission = this.isViewAppointment || this.isEditAppointment;
    this.readRouteParameter();
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    this.endTimeError = '';
    // get details
    if (this.isViewAppointment) {
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getCountries()
      ]).then(() => { this.getAppointmentCustomFields(); });
    }
  }

//#region Events
get appointmentfrm() { return this.appointmentForm.controls; }

backToList(): void {
  this._location.back();
}

showHideDetailTab(frmMode: string) {
  this.submitted = true;
  if (frmMode === 'SAVE') {
    if (this.appointmentForm.invalid) {
      this.validateAllFormFields(this.appointmentForm);
      this.navigateToTabByValidation();
      return;
    }
    const startTime = moment(this.appointment.startTime).format("HH:mm");
    const endTime = moment(this.appointment.endTime).format("HH:mm");
    if (startTime >= endTime) {
      this.endTimeError = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_ENDTIME_LATER_STARTTIME');
      return false;
    }

    this.refreshActivity = true;
    Promise.all([
      this.saveData()
    ]).then(() => {
      this.isReadOnly = !this.isReadOnly
      this.submitted = false;
    })
 }
  else if (frmMode === 'CANCEL') {
    this.appointment = this._commonHelper.deepClone(this.copyOfAppointment);

    if(this.appointment.customFieldJSONData && this.appointment.customFieldJSONData !== null && this.appointment.customFieldJSONData !== '' && this.appointment.customFieldJSONData !== undefined) {
      this.appointmentCustomFields.forEach((field: any) => {
        if(field.fieldType == 'Date') {
          if (this.appointment.customFieldJSONData[field.fieldName] && this.appointment.customFieldJSONData[field.fieldName] != null && this.appointment.customFieldJSONData[field.fieldName] != '' && this.appointment.customFieldJSONData[field.fieldName] != undefined) {
            this.appointment.customFieldJSONData[field.fieldName] = moment(new Date(this.appointment.customFieldJSONData[field.fieldName])).toDate();
          }
        }else if (field.fieldType == 'JSON Grid') {
          if (this.appointment.customFieldJSONData[field.fieldName] && this.appointment.customFieldJSONData[field.fieldName] != null && this.appointment.customFieldJSONData[field.fieldName] != '' && this.appointment.customFieldJSONData[field.fieldName] != undefined) {
            if (typeof this.appointment.customFieldJSONData[field.fieldName] === 'string') {
              this.appointment.customFieldJSONData[field.fieldName] = JSON.parse(this.appointment.customFieldJSONData[field.fieldName]);
            }
          }else {
            this.appointmentForm.removeControl(field.fieldName)
          }
        } else if (String(field.fieldType).toLowerCase() === 'duration') {
          if (typeof this.appointment.customFieldJSONData[field.fieldName] === 'number' || this.appointment.customFieldJSONData[field.fieldName] == null) {
            this.appointment.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.appointment.customFieldJSONData[field.fieldName], this.hoursInDay);
          }
        } 
      });
    }
    
    this.appointmentForm.reset(this.copyOfAppointmentFormValues);
     
    this.appointment.activityDate = this.appointment.activityDate != null ? moment(new Date(this.appointment.activityDate)).toDate() : this.appointment.activityDate;
    this.appointment.startTime = this.appointment.startTime != null ? moment(new Date(this.appointment.startTime)).toDate() : this.appointment.startTime;
    this.appointment.endTime = this.appointment.endTime != null ? moment(new Date(this.appointment.endTime)).toDate() : this.appointment.endTime;

    if (this.appointment.attendeeIDs != "" && this.appointment.attendeeIDs != null && this.appointment.attendeeIDs != undefined) {
      this.selectedAttendees = this.appointment.attendeeIDs.split(",").map(x => Number(x));
    }

    this.getRelatedToParentEntity().then((res: any) => {
      if (res) {
        this.selectedEntity = this.parentEntityList.find(de => de['id'] == this.appointment.entityTypeId);
        let selectEntityId = this.appointment.entityTypeId;
        let EntityIdArray: any = [];
        if (selectEntityId) {
          EntityIdArray.push(selectEntityId);
        }
        this.getRelatedTo(EntityIdArray, 0, "", this.appointment.entityId).then((res: any) => {
          if (res) {
            this.selectRelatedto = Number(this.appointment.entityId);
          }
        }, (error) => {
          this._commonHelper.showToastrError(error.message);
        });
      }
    });
    this.refreshJSONGridData()
    this.isReadOnly = !this.isReadOnly
    this.submitted = false;
  }
  else if (frmMode === 'EDIT' && this.isReadOnly) {
    setTimeout(() => { this.appointmentTxtSubjectRef.nativeElement.focus(); });
    this.isReadOnly = !this.isReadOnly;
    this.submitted = false;
  }
}

refreshJSONGridData() {
  this.refreshCustomFieldJSONGrid = true;
   setTimeout(() => {
    this.refreshCustomFieldJSONGrid = false;
  }, 50);
}

  // set current active tab
	setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;

    if((!this.onceStageHistoryClicked && this.activeTab == 'navHistory')) {
      this.onceStageHistoryClicked = true;
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
      if (this.selectedTab == ''){
        this.setDefaultTab();
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

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }
  
  //on select event date
  onSelectEventDate($event) {
    let selectedActivityDate = new Date($event);
    this.appointment.startTime.setFullYear(selectedActivityDate.getFullYear(), selectedActivityDate.getMonth(), selectedActivityDate.getDate());
    this.appointment.endTime.setFullYear(selectedActivityDate.getFullYear(), selectedActivityDate.getMonth(), selectedActivityDate.getDate());
  }

  onSelectStartTime(ev) {
    if (ev != null && ev != undefined) {
      this.endTimeError = '';
      if (this.appointment.startTime.getDate() == new Date(moment(ev).add(1, 'hours').format("YYYY-MM-DD HH:mm")).getDate()) {
        this.appointment.endTime = new Date(moment(ev).add(1, 'hours').format("YYYY-MM-DD HH:mm"));
      } else {
        if (this.appointment.startTime.getDate() == new Date(moment(ev).add(15, 'minutes').format("YYYY-MM-DD HH:mm")).getDate()) {
          this.appointment.endTime = new Date(moment(ev).add(15, 'minutes').format("YYYY-MM-DD HH:mm"));
        } else {
          this.endTimeError = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_ENDTIME_LATER_STARTTIME');
          this.appointment.endTime = this.appointment.startTime;
        }
      }
    }
  }

  onSelectEndTime(ev) {
    if (ev != null && ev != undefined) {
     this.endTimeError = '';
      if (new Date(moment(this.appointment.startTime).format("YYYY-MM-DD HH:mm")).getTime() > new Date(moment(ev).format("YYYY-MM-DD HH:mm")).getTime()) {
        this.appointment.startTime = new Date(moment(ev).add(-1, 'hours').format("YYYY-MM-DD HH:mm"));
      }
    }
  }

  getEventStatusRef() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.EventStatus };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EventStatus}`;
      // get data
      const refTypeEventStatus = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeEventStatus == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {

            this.eventStatusOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.eventStatusOptions));
          }
          if (this.appointmentId <= 0) {
            if (this.eventStatusOptions.length > 0) {
              this.appointment.statusID = this.eventStatusOptions[3]
            }
          }
          else if (this.appointmentId > 0) {
            let statusId = this.appointment.statusID;

            let filteredValue = this.eventStatusOptions.filter(rep => {
              if (rep.intValue1 == statusId) {
                return rep;
              }
            });
            if (filteredValue.length > 0) {
              this.appointment.statusID = filteredValue[0];
            }
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
        this.eventStatusOptions = refTypeEventStatus;
        if (this.appointmentId <= 0) {
          if (this.eventStatusOptions.length > 0) {
            this.appointment.statusID = this.eventStatusOptions[3]
          }
        }
        else if (this.appointmentId > 0) {
          let statusId = this.appointment.statusID;

          let filteredValue = this.eventStatusOptions.filter(rep => {
            if (rep.intValue1 == statusId) {
              return rep;
            }
          });
          if (filteredValue.length > 0) {
            this.appointment.statusID = filteredValue[0];
          }
        }
        resolve(null);
      }
    });
  }

  assignedToOnFilter(e, selectedUserIds) {
    this.getAssignUsers(selectedUserIds?.toString(), 0, e.filter);
  }

  getAssignUsers(selectedUserId, includeAllUsers = 1, searchString = null) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      const params = this.prepareParamsForEventsAssignedTo(selectedUserId, includeAllUsers, searchString);
      this._datasourceService.getDataSourceDataByCodeAndParams(DataSources.EVENTASSIGNEDTO, params).then(
        (response: any) => {
          if (response) {
            this.users = response;
          }
          if (this.appointmentId <= 0) {
            let filteredUser = this.users.filter(u => {
              if (u.value == this._loggedInUser.userId) {
                this.appointment.ownerUserId = filteredUser[0].value;
                return u;
              }
            });
            if (filteredUser.length > 0) {
              this.appointment.ownerUserId = filteredUser[0].value;
            }
          } else if (this.appointmentId > 0) {
            let filteredUser = this.users.filter(u => {
              if (u.value == selectedUserId) {
                return u;
              }
            });
            if (filteredUser.length > 0) {
              this.appointment.ownerUserId = filteredUser[0].value;
            }
          }
          this._commonHelper.hideLoader();
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    });
  }

  prepareParamsForEventsAssignedTo(ownerId, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: ownerId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }

  getAttendees(selectedUserId, includeAllUsers = 1, searchString = null) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      if (selectedUserId == null) {
        this._commonHelper.hideLoader();
      }
      const params = this.prepareParamsForEventsAttendees(selectedUserId, includeAllUsers, searchString);
      this._datasourceService.getDataSourceDataByCodeAndParams(DataSources.EVENTATTENDEES, params).then(
        (response: any) => {
          if (response) {
            this.attendees = response as [];
          }
          this._commonHelper.hideLoader();
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    });
  }

  prepareParamsForEventsAttendees(attendeesId, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: attendeesId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }

  attendeesOnFilter(e, selectedUserIds) {
    this.getAttendees(selectedUserIds?.toString(), 0, e.filter);
  }

  onClearSelectedAttendees() {
    this.selectedAttendees = [];
  }

  relatedToOnFilter(e, selecteditemId) {
    let selectEntityId = this.selectedEntity.id;
    let EntityId: any = [];
    if (selectEntityId) {
      EntityId.push(selectEntityId);
    }
    this.getRelatedTo(EntityId, 0, e.filter, selecteditemId?.toString());
  }

  // get related to entities based on entity type
  private getRelatedTo(selectedEntities: any, includeAllEntities, searchString: any = '', selectedEntityID = null) {
    return new Promise((resolve, reject) => {
      this.showRelatedToLoader = true;
      this.relatedToList = [];
      let params = [{
        name: 'EntityTypeIDs',
        type: 'string',
        value: selectedEntities && selectedEntities.length > 0 ? selectedEntities.toString() : null
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

  onRelatedToChange(e) {
    if (e.value) {
      this.getRelatedTo([e['value'].id], 0, e.filter);
    } else {
      this.relatedToList = [];
      this.selectRelatedto = [];
    }
  }

  onRelatedToClear(e) {
    if (e.value) {
      this.getRelatedTo([e['value'].id], 0, e.filter);
    } else {
      this.relatedToList = [];
      this.selectRelatedto = [];
    }
  }

  getRelatedToParentEntity() {
    return new Promise((resolve, reject) => {
      this.parentEntityList = [];
      const entityTypeList = this._commonHelper.entityTypeList;
      const entityType = entityTypeList.find(de => de['id'] == this.entityTypeId);
      if (entityType && entityType.parentEntityTypeIDs) {
        let parentEntityTypeidArray = entityType?.parentEntityTypeIDs?.split(',');
        for (let i = 0; i < parentEntityTypeidArray.length; i++) {
          let entity = entityTypeList.find(de => de['id'] == parentEntityTypeidArray[i]);
          this.parentEntityList.push(entity);
        }
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  /**
 * END
 * Additional Tabs Code 
 */

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

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
     
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }


  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.appointmentId = Number(id);
      } else {
        this._router.navigate(['appointments', 'list']);
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
  }
 

  private getAppointmentCustomFields(): void {
    this._commonHelper.showLoader();
    this._appointmentService.getAppointmentCustomFields(this.entityTypeId, this.appointmentId)
      .then((response: any) => {
        if (response) {
          this.appointmentCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getAppointmentDetail();
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
    this.appointmentCustomFields.forEach((customField: any) => {
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

  private getAppointmentDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let params = { eventId: this.appointmentId };
      this._appointmentService.getEventDetailById(params).then((response: any) => {
        if (response) {
            this.setAppointmentDetails(response || {});
            this.getEventStatusRef(),
            this.getAttendees(this.appointment.attendeeIDs, 0, ''),
            this.getAssignUsers(this.appointment.ownerUserId, 0, ''),
            this.getRelatedToParentEntity().then((res: any) => {
              if (res) {
                this.selectedEntity = this.parentEntityList.find(de => de['id'] == this.appointment.entityTypeId);
                let selectEntityId = this.appointment.entityTypeId;
                let EntityIdArray: any = [];
                if (selectEntityId) {
                  EntityIdArray.push(selectEntityId);
                }
                this.getRelatedTo(EntityIdArray, 0, "", this.appointment.entityId).then((res: any) => {
                  if (res) {
                    this.selectRelatedto = Number(this.appointment.entityId);
                  }
                }, (error) => {
                  this._commonHelper.showToastrError(error.message);
                });
              }
            }, (error) => {
              this._commonHelper.showToastrError(error.message);
            })
            this.findDiff(this.appointment.startTime,this.appointment.endTime);

            this.appointmentForm = this.createAppointmentDetailForm();
            this.prepareFormCustomFields();
            // prepare tab with order
            this.setDefaultNavTabs();
            this.prepareTabsWithOrder();
            const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.appointment.entityTypeId);
            if (foundRecord) {
              this.relatedToName = foundRecord?.['displayName'].toString().trim();
              this.relatedToNamePlaceholder = (this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: foundRecord?.['displayName'].toString().trim()}));
              this.relatedToNameForHeader = foundRecord?.['displayName'].toString().trim();
              this.relatedToIcon = this._commonHelper.getEntityIconClass(this.appointment.entityTypeId);
              this.relatedToIconToolTip = foundRecord?.['displayName'].toString().trim();
            }
            else{
              this.relatedToName = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO');
              this.relatedToNamePlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: this.relatedToName }).replace('(','').replace(')','').trim();
              this.relatedToNameForHeader = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.ENTITY_NAME_LABEL');
            }

            this.copyOfAppointmentFormValues = this.appointmentForm.value;
            this.isLoaded = true;
            this.refreshCustomFieldJSONGrid = true;
            setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
            resolve(null);
          
        }
        else {
          this.isInitialLoading = false;
          resolve(null);
        }
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

  private setAppointmentDetails(response: any): void {
    this.appointment = response;
    this.appointmentSubject = this.appointment?.subject;
    this.entityRecordTypeId = this.appointment?.entityRecordTypeID;

    this.appointment.activityDate = this.appointment.activityDate != null ? moment(new Date(this.appointment.activityDate)).toDate() : this.appointment.activityDate;
    this.appointment.startTime = this.appointment.startTime != null ? moment(new Date(this.appointment.startTime)).toDate() : this.appointment.startTime;
    this.appointment.endTime = this.appointment.endTime != null ? moment(new Date(this.appointment.endTime)).toDate() : this.appointment.endTime;

    if (this.appointment.attendeeIDs != "" && this.appointment.attendeeIDs != null && this.appointment.attendeeIDs != undefined) {
      this.selectedAttendees = this.appointment.attendeeIDs.split(",").map(x => Number(x));
    }

    this.appointment.customFieldJSONData = this._commonHelper.tryParseJson(this.appointment.customFieldJSONData);
    this.copyOfAppointment = this._commonHelper.deepClone(this.appointment);
   
    if (this.appointment.statusID == AppointmentStatus.Completed) {
      this.isCompleted = true;
    }
    if (this.appointment.statusID == AppointmentStatus.Canceled) {
      this.isCanceled = true;
    }
  }
 
  private createAppointmentDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.appointmentId],
      entityTypeId: [this.appointment.entityTypeId, Validators.compose([Validators.required]) ],
      entityId: [this.appointment.entityId, Validators.compose([Validators.required])],
      entityRecordTypeID: [this.appointment.entityRecordTypeID],
      subject: [this.appointment.subject, Validators.compose([Validators.required])],
      location: [this.appointment.location],
      description: [this.appointment.description],
      statusId: [this.appointment.statusID],
      activityDate: [moment(new Date(this.appointment.activityDate)).toDate()],
      startTime: [moment(new Date(this.appointment.startTime)).toDate(), Validators.compose([Validators.required])],
      endTime: [moment(new Date(this.appointment.endTime)).toDate(), Validators.compose([Validators.required])],
      ownerUserId: [this.appointment.ownerUserId],
      attendeesId: [this.appointment.attendeeIDs],
      notes: [this.appointment.notes]
    });
  }

  private setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 401 }
    ];

    this.setNativeTabDetails();

    this.navTabsAll.forEach((f) => {
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false),(f.showCloseTabIconBtn = false),  (f.showButtonActive = false)
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

  private prepareTabsWithOrder(): void {
    this.formDataJSON.forEach(tab => {
      var objNavTab = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab:false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn: true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.appointment.customFieldJSONData[control.fieldName] != null && this.appointment.customFieldJSONData[control.fieldName] != '') {
              this.appointment.customFieldJSONData[control.fieldName] = moment(new Date(this.appointment.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.appointment.customFieldJSONData[control.fieldName] != null && this.appointment.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.appointment.customFieldJSONData[control.fieldName] === 'string') {
                this.appointment.customFieldJSONData[control.fieldName] = JSON.parse(this.appointment.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.appointment.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.appointment.customFieldJSONData[control.fieldName] != null && this.appointment.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.appointment.customFieldJSONData[control.fieldName];
              this.appointment.customFieldJSONData[control.fieldName] = this.appointment.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
              }
              this.appointment.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
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
                  this.appointmentForm.controls[control.fieldName].setValidators(validatorFn);
                  this.appointmentForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.appointment.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.appointment.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
              this.appointmentForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.appointmentForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
              this.appointmentForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.appointmentForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName], Validators.email));
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
              this.appointmentForm.controls[control.fieldName].setValidators(validatorFn);
              this.appointmentForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
            if (this.appointment.customFieldJSONData[control.fieldName] != null && this.appointment.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.appointment.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.appointmentForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") });
              }
            } else {
              this.appointmentForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.appointmentForm.addControl(control.fieldName, new UntypedFormControl(this.appointment.customFieldJSONData[control.fieldName]));
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
                this.appointmentForm.controls[control.fieldName].setValidators(validatorFn);
                this.appointmentForm.controls[control.fieldName].updateValueAndValidity();
              }
            }
          }
        });
      });
    });
  }


  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response: any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
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
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Appointments));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Appointments, JSON.stringify(response));
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

  
// get tenant setting for tab layout
private getTabLayoutTenantSetting() {
  return new Promise((resolve, reject) => {
    const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.APPOINTMENT_TAB_LAYOUT}`));
    if (tabLayout == null) {
      this._commonHelper.showLoader();
      this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.APPOINTMENT_TAB_LAYOUT).then((response: any) => {
        this.tabLayout = response;
        // store in local storage
        this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.APPOINTMENT_TAB_LAYOUT}`, JSON.stringify(response));
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

  private findInvalidControls() {
    const invalid = [];
    const controls = this.appointmentForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.appointment.customFieldJSONData) {
        this.appointmentCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.appointment.customFieldJSONData[field.fieldName] && this.appointment.customFieldJSONData[field.fieldName] != null && this.appointment.customFieldJSONData[field.fieldName] != '') {
              this.appointment.customFieldJSONData[field.fieldName] = moment(this.appointment.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.appointmentForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.appointment.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.appointment.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.appointmentForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.appointment.customFieldJSONData[field.fieldName] = data;
            } else {
              this.appointment.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      let statusId = this.appointment.statusID['intValue1'];
      let entityId = this.fromAppointment ? this.selectRelatedto : this.appointment.entityId;
      let entityTypeId = this.fromAppointment ? this.selectedEntity?.id : this.appointment.entityTypeId;

      let data = {
        id: this.appointment.id,
        entityTypeId: entityTypeId,
        entityId: entityId,
        entityRecordTypeID: this.appointment.entityRecordTypeID,
        ownerId: this.appointment.ownerUserId,
        eventAttendees: this.selectedAttendees != null ? this.selectedAttendees.toString(): null,
        subject: this.appointment.subject,
        location: this.appointment.location,
        description: this.appointment.description,
        statusId: statusId,
        activityDate: moment(new Date(this.appointment.activityDate.getFullYear(), this.appointment.activityDate.getMonth(), this.appointment.activityDate.getDate(), this.appointment.startTime.getHours(), this.appointment.startTime.getMinutes())).format("YYYY-MM-DDTHH:mm"),
        startTime: moment(this.appointment.startTime).format("YYYY-MM-DDTHH:mm"),
        endTime: moment(this.appointment.endTime).format("YYYY-MM-DDTHH:mm"),
        notes: this.appointment.notes,
        customFieldJSONData : this.appointment.customFieldJSONData
      }

      const params = this._commonHelper.cloneObject(data);

      this.appointmentCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.appointmentForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = this._timeFrameToMinutesPipe.transform(formArrayValues, this.hoursInDay);
        }
      });

      this._appointmentService.saveAppointment(params).then(() => {
        this.getAppointmentDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getAppointmentDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
          resolve(null);
        } else {
          reject(null)
        }
        reject(null)
      });
    })
  }
  //#endregion


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
  
  onDeleteAppointmentClick(appointmentId) {
    this._confirmationDialogService.confirm('CRM.APPOINTMENT.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._appointmentService.deleteAppointment(appointmentId).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.DETAIL.MESSAGE_APPOINTMENT_DELETED')
          ); // Redirect Appointment Listing Page.
          this._router.navigateByUrl('/appointments/list');
        },
          (error: any) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          }
        );
      }
    });
  }

  findDiff(startTime, endTime) {
    startTime = new Date(startTime)
    endTime = new Date(endTime)
    let diff = ((endTime.getTime() - startTime.getTime())/(3600*1000))*60
    this.totalMinDifference = new TimeFramePipe().transform(diff, );
    return this.totalMinDifference;
  }
}
