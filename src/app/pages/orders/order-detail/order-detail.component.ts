//ANGULAR
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl, ValidatorFn, UntypedFormArray, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

//COMPONENT
import { OrderItemAddComponent } from '../order-item-add/order-item-add.component';

//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, Entity, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, ReferenceType, RefType, TabLayoutType } from '../../../@core/enum';
import { timeFrameValidator } from '../../../@core/sharedValidators/time-frame.validator';

//PIPES
import { TimeFramePipe } from '../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { DynamicTableParameter } from '../../../@core/sharedModels/dynamic-table.model';
import { TimeFrameToMinutesPipe } from '../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';

//THIRD-PARTY-MODULES
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

//SERVICES
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { SettingsService } from '../../settings/settings.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { OrdersService } from '../orders.service';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';

@Component({
  selector: 'ngx-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {

  private orderTxtNumberRef: ElementRef;
  @ViewChild('orderTxtNumber', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.orderTxtNumberRef = content;
    }
  }


  orderNumber?: number = null;
  orderId: number;
  entityWorkflowId: number;
  entityTypeId: number = Entity.Orders;
  entityRecordTypeID: number = null;

  order: any;
  copyOfOrder: any;
  orderForm: UntypedFormGroup;
  copyOfOrderFormValues: any;
  orderCustomFields: any[] = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;

  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  activeTab = '';

  //user detail
  _loggedInUser: any;

  isListViewLayout: boolean = true;

  // permissions
  hasPermission: boolean = false;
  isViewOrder: boolean = false;
  isEditOrder: boolean = false;
  changeOrderStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAllowToReopen: boolean = false;
  isAssignOrder: boolean = false;
  isResumeRecord: boolean = false;

  isInitialLoading: boolean = true;

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
  orderTypeNative: any[] = [];
  orderTypes: any = null;
  orderSubTypes: any = null;
  currencySymbol: any = null;
  hoursInDay:number = null;
  shippingMethods: any = null;

  //drop-down for address state and country
  countries: any;
  billingStates: any;
  shippingStates: any;

  // assigned users
  assignedToUsers: any[] = [];
  priorityList: any;
  severityList: any;

  //Assigned To Loader
  showAssignedToLoader: boolean;
  isForceReloadAssignedTo: boolean = true;

  refreshOrderItems: boolean = false;
  refreshCustomFieldDatasource: boolean = false;

  entityWorkFlowStageValue: any;
  isEntityWorkflow: boolean = false;
  orderAssignedTo: any;
  orderStages: Array<any> = [];

  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any;

  currentStageTask: any;
  currentStage: any;
  isCompleted: boolean = false;
  isClosed: boolean = false;
  selectedStage: any;
  oldStageTask: any;
  orderCurrentStage: number;
  orderCurrentStageTaskIds: string;
  //datasource
  discountTypeList: any[] = [];
  selectedDiscountType: string = null;

  //custom tab variables
  onceCustomerTabClicked: boolean = false;
  onceOrderItemTabClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  tbOrderCustomerTabParameters: Array<DynamicTableParameter> = [];
  tbOrderItemTabParameters: Array<DynamicTableParameter> = [];

  entityStagesWithTasksStorageKey: string = LocalStorageKey.OrderEntityStageWithTasksKey;

  refreshCustomFieldJSONGrid: boolean = false;

  //validations obj
  orderValidationMessages = {
    'name': [
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' }
    ],
    'orderNumber': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_DETAILS.ORDERNO_REQUIRED' },
      { type: 'minlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_ORDERNO_MIN' },
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_ORDERNO_MAX' }
    ],
    'billToContactID': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_DETAILS.CONTACT_REQUIRED' }
    ],
    'description': [
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MIN' }
    ],
    'discountRate': [
      { type: 'max', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_DISCOUNT_PERCENTAGE' }
    ],
    'discountAmount': [
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_DISCOUNT_AMOUNT' }
    ],
    'discountType': [],
    'deliveryDate': [{ type: 'inValid', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_DELIVERYDATE_GREATER_THAN_ORDERDATE' }],
    'assignedTo': [],
    'entityRecordTypeID': [],
    'entityRecordSubTypeID': [],
    'shippingMethodID': [],
    'orderDate': [{ type: 'mask', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_ORDERDATE_PATTERN' }],
    'totalAmount': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_DETAILS.AMOUNT_REQUIRED' },
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_DETAILS.MESSAGE_AMOUNT_MAX' }
    ],
    'entityStageId': [{ type: 'required', message: 'ORDERS.DETAIL.TAB_DETAILS.STATUS_REQUIRED' }],
  }  

  private createOrderDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.orderId],
      orderNumber: [this.order.orderNumber, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      description: [this.order.description, Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
      billToAccountID: [this.order.billToAccountID],
      billToContactID: [this.order.billToContactID, Validators.compose([Validators.required])],
      entityRecordTypeID: [this.order.entityRecordTypeID],
      assignedTo: [this.order.assignedTo],
      totalAmount: [this.order?.totalAmount, Validators.compose([Validators.required, Validators.maxLength(15)])],
      entityRecordSubTypeID: [this.order.entityRecordSubTypeID],
      orderDate: [this.order.orderDate != null ? moment(new Date(this.order.orderDate)).toDate() : null],
      deliveryDate: [this.order.deliveryDate != null ? moment(new Date(this.order.deliveryDate)).toDate() : null, Validators.compose([])],
      discountType: [this.order.discountType],
      discountRate: [this.order.discountRate, Validators.compose([Validators.max(100), Validators.min(0)])],
      discountAmount: [this.order.discountAmount, Validators.compose([Validators.maxLength(15)])],
      selectedStageTaskIds: [this.order.selectedStageTaskIds],
      shippingMethodID: [this.order?.shippingMethodID],
      priority: [this.order?.priority],
      severity: [this.order?.severity],
    });
  }

  //navTabs
  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;
  forceRedirectionTabName: string = '';
  
  fromEntityStageId: any;
  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _ordersService: OrdersService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _formBuilder: UntypedFormBuilder,
    private _modalService: NgbModal,
    private _location: Location,
    private _confirmationDialogService: ConfirmationDialogService,
    private _workFlowManagementService: WorkflowmanagementService,
    private _noteService: NoteService    
  ) {
  
    this.isEditOrder = this._commonHelper.havePermission(enumPermissions.EditOrder);
    this.isViewOrder = this._commonHelper.havePermission(enumPermissions.ViewOrder);
    this.changeOrderStage = this._commonHelper.havePermission(enumPermissions.ChangeOrderStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadOrderDocument);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    this.isAssignOrder = this._commonHelper.havePermission(enumPermissions.AssignOrders);
    this.isResumeRecord = this._commonHelper.havePermission(enumPermissions.ResumeTask);

    this.hasPermission = this.isViewOrder || this.isEditOrder;

    this.readRouteParameter();

    Promise.all([
      this.getTabLayoutTenantSetting()
    ]).then(()=>{
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    if (this.isViewOrder) {
      this.setOrderItemTabTabParameters();
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCountries(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getDiscountFromReferenceType(),
        this.getAssignedToUsers( 1, ''),
        this.getShippingMethods(),
        this.getOrderTypeWithSubType()
      ]).then(() => this.getOrderCustomFields());
    }
  }

 

  //#region Events  
  // region Public

  get orderfrm() { return this.orderForm.controls; }

  public backToList(): void {
    this._location.back();
  }

  public showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.orderForm.invalid) {
        this.validateAllFormFields(this.orderForm);
        this.navigateToTabByValidation();
        return;
      }

      this.refreshActivity = true;
      
      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = true;
        this.submitted = false;
      })
    }
    else if (frmMode === 'CANCEL') {
      this.order = this._commonHelper.deepClone(this.copyOfOrder);
      
      if(this.order.customFieldJSONData && this.order.customFieldJSONData !== null && this.order.customFieldJSONData !== '' && this.order.customFieldJSONData !== undefined) {
        this.orderCustomFields.forEach((field: any) => {
          if(field.fieldType == 'Date') {
            if (this.order.customFieldJSONData[field.fieldName] && this.order.customFieldJSONData[field.fieldName] != null && this.order.customFieldJSONData[field.fieldName] != '' && this.order.customFieldJSONData[field.fieldName] != undefined) {
              this.order.customFieldJSONData[field.fieldName] = moment(new Date(this.order.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.order.customFieldJSONData[field.fieldName] && this.order.customFieldJSONData[field.fieldName] != null && this.order.customFieldJSONData[field.fieldName] != '' && this.order.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.order.customFieldJSONData[field.fieldName] === 'string') {
                this.order.customFieldJSONData[field.fieldName] = JSON.parse(this.order.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.orderForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.order.customFieldJSONData[field.fieldName] === 'number' || this.order.customFieldJSONData[field.fieldName] == null) {
              this.order.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.order.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        })
      }
      this.changeDiscountType(this.order.discountType);
      
      this.orderForm.reset(this.copyOfOrderFormValues);
      this.refreshJSONGridData()
      this.order.selectedStageTaskIds = this.orderCurrentStageTaskIds;
      this.order.entityStageId = this.orderCurrentStage;
      this.getEntityStagesWithTaskAfterReset();

      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      this.bindDropdown();
      setTimeout(() => { if (this.orderTxtNumberRef !== undefined) { this.orderTxtNumberRef?.nativeElement.focus(); } });
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

	setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceCustomerTabClicked && this.activeTab == 'navOrderCustomers') {
      this.onceCustomerTabClicked = true;
    }

    if (!this.onceOrderItemTabClicked && this.activeTab == 'navOrderItems') {
      this.onceOrderItemTabClicked = true;
    }

    if (!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
      this.onceStageHistoryClicked = true;
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  public setRefreshEntityTag() {
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

  onReopenStage() {
    if(!this.isAllowToReopen) {
      return;
    }

    if(this.isCompleted || this.isClosed) {
      //get default stage details
      const dropEntityStageDetail: any = this.orderStages?.find(s => s.isDefault);
      this.onMarkStageAsComplete(dropEntityStageDetail?.id, true);
    }
  }
  
  // stage transition
  public onMarkStageAsComplete(dropEntityStageId, isReopenedStage: boolean = false) {
    var isShowStageChangeConfirmationBox: boolean = true; 
    this.optionsForPopupDialog.size = 'md';
    const dropEntityStageDetail = this.orderStages.find(s => s.id == dropEntityStageId);
    if (dropEntityStageDetail != null && dropEntityStageId != this.order.entityStageId) 
    {
      const prevEntityStageDetail = this.orderStages.find(s => s.id == this.order.entityStageId);
      const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.order);

      if (!canUserChangeStage) {
        if (this.changeOrderStage) {
          isShowStageChangeConfirmationBox = false;
          this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
              if (confirmed) {
                this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
              }
            });
        }
        else {
          this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
        }
      }
      else {
        this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
      }
    }
  }

  public changeDiscountType(value: any) {
    this.selectedDiscountType = this.discountTypeList.find(c => c.intValue1 == value)?.name || null;
  }


  public onSelectDate() {
    if (this.order.deliveryDate != null && this.order.orderDate != null) {
      if (this.order.deliveryDate.getTime() < this.order.orderDate.getTime()) {
        this.orderForm.controls['deliveryDate'].setErrors({ 'inValid': true });
      }
    }
  }
  public assignedToOnFilter(e) {
    this.getAssignedToUsers(0, e.filter);
  }

  public assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(1, null);
    }
  }

  public openOrderItemModalPopup() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(OrderItemAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.orderID = this.order.id;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data 
        this.refreshOrderItems = true;
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.SUCCESS_MESSAGE'));
      }
    });
  }

  public refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "OrderItem": {
        this.refreshOrderItems = false;
        break;
      }
    }
  }

  public deleteOrderItem(id: any) {
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_ITEMS.DELETE_ORDER_ITEM_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._ordersService.deleteOrderItem(id).then((response: any) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_ITEMS.MESSAGE_DELETE_ORDER_ITEM_SUCCESS'));
            this.refreshOrderItems = true;
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }

  //#endregion

  //#region Private methods

  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.orderId = Number(id);
      } else {
        this._router.navigate(['orders', 'list']);
      }

      if (param['wf'] !== undefined) {
        if (param['wf'] != null) {
          this.entityWorkflowId = param['wf'];
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
            this.forceRedirectionTabName = params.get(paramKey)?.trim()?.trim() ?? '';
          }
        });
      }
    });

    // set storage key
    this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
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
        }, (error) => {
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

  private prepareParamsForStatesDropdown(countryId: number, stateId: number) {
    const params = [];
    const paramItem = {
      name: 'CountryID',
      type: 'int',
      value: countryId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SelectedStateID',
      type: 'int',
      value: stateId,
    };
    params.push(paramItem1);

    return params;
  }

  private getStatesByCountryId(countryId: number, stateId: number) {
    return new Promise((resolve, reject) => {
      let params = this.prepareParamsForStatesDropdown(countryId, stateId);
      this._commonHelper.showLoader();
      // get datasource details
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.STATESBYCOUNTRY, params).then(response => {
        this._commonHelper.hideLoader();
        resolve(response);
      }, (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
        reject(null);
      }).catch(() => {
        resolve(null);
      });
    });
  }

  private customfieldMultiSelectChange(event, fieldName) {
    const stringValue = event.value.toString()
    this.order.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  private getValueFromJSON(name: string): any {
    return this.formDataJSON.find(item => item.tabName == name);
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
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
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
      this.hoursInDay = hrsInDay;
    }
  }

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Orders));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Orders, JSON.stringify(response));
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

  //allow only 6 digits and '.'(dot)
  private percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 15 digit number
    return event.target.value.length <= 6;
  }

  //allow only 13 digits and ','(comma)
  private currencyEventHandler(event) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }

  //allow only 8000 characters in total
  private textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  private getOrderCustomFields(): void {
    this._commonHelper.showLoader();
    this._ordersService.getOrderCustomFields(this.entityTypeId, this.orderId)
      .then((response: any) => {
        if (response) {
          this.orderCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getOrderDetail();
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
    this.orderCustomFields.forEach((customField: any) => {
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

  private getOrderDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let params = { id: this.orderId };
      this._ordersService.getOrderByID(params).then((response: any) => {
        if (response) {
          this.order = this._commonHelper.deepClone(response);
          this.order.billingCountryID = this.order?.billingCountryID != null ? this.order?.billingCountryID : this._commonHelper.defaultCountryId;
          this.order.shippingCountryID = this.order?.shippingCountryID != null ? this.order?.shippingCountryID : this._commonHelper.defaultCountryId;
          Promise.all([
            this.isEntityExistsInWorkFlow(),
            this.getStatesByCountryId(this.order?.billingCountryID, this.order.billingStateId).then((response) => {
              this.billingStates = response;
            }),

            this.getStatesByCountryId(this.order?.shippingCountryID, this.order.shippingStateId).then((response) => {
              this.shippingStates = response;
            }),
          ]).then(() => {
            this.setOrderDetails(response || {});
            this.orderForm = this.createOrderDetailForm();
            this.prepareFormCustomFields();
            if (this.order.entityWorkflowId) {
              this.orderForm.addControl('entityStageId', new FormControl(this.order.entityStageId ?? null, Validators.required));
            }
            //show/Hide Pause/Resume button
            this.order.isShowPauseOrResume = (this.order?.entityWorkflowId != null) ? true : false;
            this.setDefaultNavTabs();
            this.prepareTabsWithOrder();
            this.copyOfOrderFormValues = this.orderForm.value;
            this.refreshCustomFieldJSONGrid = true;
            setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
            this.isLoaded = true;
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
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private addControlToFormJSON(name: string, dataObject: any): void {
    let obj = this.formDataJSON.find(item => item[name]);
    if (obj) {
      obj[name] = dataObject[name];
    } else {
      this.formDataJSON.push(dataObject);
    }
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.order.customFieldJSONData[control.fieldName] != null && this.order.customFieldJSONData[control.fieldName] != '') {
              this.order.customFieldJSONData[control.fieldName] = moment(new Date(this.order.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.order.customFieldJSONData[control.fieldName] != null && this.order.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.order.customFieldJSONData[control.fieldName] === 'string') {
                this.order.customFieldJSONData[control.fieldName] = JSON.parse(this.order.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.order.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.order.customFieldJSONData[control.fieldName] != null && this.order.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.order.customFieldJSONData[control.fieldName];
              this.order.customFieldJSONData[control.fieldName] = this.order.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
              }
              this.order.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
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
                  this.orderForm.controls[control.fieldName].setValidators(validatorFn);
                  this.orderForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.order.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.order.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
              this.orderForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.orderForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
              this.orderForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.orderForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName], Validators.email));
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
              this.orderForm.controls[control.fieldName].setValidators(validatorFn);
              this.orderForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
            if (this.order.customFieldJSONData[control.fieldName] != null && this.order.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.order.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.orderForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.orderForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.orderForm.addControl(control.fieldName, new UntypedFormControl(this.order.customFieldJSONData[control.fieldName]));
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
                this.orderForm.controls[control.fieldName].setValidators(validatorFn);
                this.orderForm.controls[control.fieldName].updateValueAndValidity();
              }
            }
          }
        });
      });
    });
  }

  private setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navOrderCustomers', isFirst: false, condition: this.isViewOrder, displayOrder: 201 },
      { tabName: '', tabLink: 'navOrderItems', isFirst: false, condition: this.isViewOrder, displayOrder: 301 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: this.isViewOrder, displayOrder: 401 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 501 }
    ];

    this.setNativeTabDetails();

    this.navTabsAll.forEach((f) => {
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
        showCloseTabIconBtn: true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });
          
    this.navTabsAll = this.navTabsAll.sort(( a, b ) => a.displayOrder > b.displayOrder ? 1 : -1 );
    this.setTabLayout();
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'orders.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() == 'orders.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.ORDERS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ORDERS.' + error.messageCode.replace('.', '_').toUpperCase()));
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

  private setOrderDetails(response: any): void {
    this.orderNumber = this.order.orderNumber;
    this.order.orderDate = this.order.orderDate != null ? moment(new Date(this.order.orderDate)).toDate() : this.order.orderDate;
    this.order.deliveryDate = this.order.deliveryDate != null ? moment(new Date(this.order.deliveryDate)).toDate() : this.order.deliveryDate;
    this.order.totalAmount = (this.order.totalAmount == null || this.order.totalAmount == undefined) ? null : this.order.totalAmount.toString();
    this.order.discountAmount = (this.order.discountAmount == null || this.order.discountAmount == undefined) ? null : this.order.discountAmount.toString();
    this.order.discountRate = (this.order.discountRate == null || this.order.discountRate == undefined) ? null : this.order.discountRate.toString();
    this.order.customFieldJSONData = this._commonHelper.tryParseJson(this.order.customFieldJSONData);
    const selectedOrderTypeID = this.order.entityRecordTypeID || null;
    this.selectedDiscountType = this.discountTypeList.find(c => c.intValue1 == this.order.discountType)?.name || null;
    this.onSelectOrderTypes(selectedOrderTypeID);
    if (!this.order.entityWorkflowId) {
      this.updateWorkFlowStageTaskDetail();
    }
    else {
      this.copyOfOrder = this._commonHelper.deepClone(this.order);
    }
    this.entityRecordTypeID = this.order.entityRecordTypeID;
    this.copyOfOrder.customFieldJSONData = this._commonHelper.deepClone(this.order.customFieldJSONData);
  }

  private updateWorkFlowStageTaskDetail() {
    this.order.entityWorkflowId = this.entityWorkflowId;
    this.order.entityStageId = this.orderCurrentStage;
  
    this.copyOfOrder = this._commonHelper.deepClone(this.order);
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.order.customFieldJSONData) {
        this.orderCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.order.customFieldJSONData[field.fieldName] && this.order.customFieldJSONData[field.fieldName] != null && this.order.customFieldJSONData[field.fieldName] != '') {
              this.order.customFieldJSONData[field.fieldName] = moment(this.order.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.orderForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.order.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.order.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.orderForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.order.customFieldJSONData[field.fieldName] = data;
            } else {
              this.order.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }
      // 1 for percentage and 2 for amount
      if (this.selectedDiscountType == 'Percentage') {
        this.order.discountAmount = null;
      }
      else if (this.selectedDiscountType == 'Amount') {
        this.order.discountRate = null;
      }
      else {
        this.order.discountAmount = null;
        this.order.discountRate = null;
      }
      this.order.orderDate = this.order.orderDate != null ? moment(this.order.orderDate).format('YYYY-MM-DD') : this.order.orderDate;
      this.order.deliveryDate = this.order.deliveryDate != null ? moment(this.order.deliveryDate).format('YYYY-MM-DD') : this.order.deliveryDate;

      let params = this._commonHelper.deepClone(this.order);
      
      this.orderCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.orderForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      //set selectedStageTaskIds 
      if (params.selectedStageTaskIds != null) {
        if (Array.isArray(params.selectedStageTaskIds)) {
          params.selectedStageTaskIds = params.selectedStageTaskIds.map(task => task.id).toString()
        }
      } else {
        params.selectedStageTaskIds = '';
      }
        params.fromEntityStageId = this.fromEntityStageId;

      let isLoadStageTransition = false;
      let isLoadEntityWorkFlow = false;

      if (this.copyOfOrder.assignedTo != this.order.assignedTo ||
        ((this.order.selectedStageTaskIds && this.order.selectedStageTaskIds.map(st => st.id).join(',')) !=
          (this.copyOfOrder.selectedStageTaskIds && this.copyOfOrder.selectedStageTaskIds))) {

        if ((this.order.selectedStageTaskIds && this.order.selectedStageTaskIds.map(st => st.id).join(',')) !=
          (this.copyOfOrder.selectedStageTaskIds && this.copyOfOrder.selectedStageTaskIds))
          isLoadEntityWorkFlow = true;
        else
          isLoadStageTransition = true;
      }

      this._ordersService.saveOrder(params).then(() => {
        this.getOrderDetail().then(() => {
          if (this.isEntityWorkflow) {
            this.setRefreshStageHistory();
          }

          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getOrderDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
          resolve(null)
        } else {
          reject(null)
        }
        reject(null)
      });
    })
  }

  //#endregion

  private getEntityTypeOptionsRef(): any {
    let params = { entityTypeId: Entity.Orders };
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._commonService.getEntityRecordTypesByEntityTypeId(params).then(response => {
        if (response) {
          this.orderTypes = response as [];
          if (this.orderTypes) {
            this.onSelectOrderTypes(this.orderTypes[0].id)
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
    });
  }


  private getDiscountFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.DiscountType };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.DiscountType}`;
      // get data
      const refTypeGender = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeGender == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.discountTypeList = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.discountTypeList));
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
        this.discountTypeList = refTypeGender;
        resolve(null);
      }
    });
  }


  private onSelectOrderTypes(entityRecordTypeID) {
    if (entityRecordTypeID == null) {
      this.orderSubTypes = [];
    }
    else {
      this.orderSubTypes = this.orderTypeNative.filter(c => c.parentID == entityRecordTypeID);
    }
  }


  private getShippingMethods(): any {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._commonService.getActiveShipingMethods().then(response => {
        if (response) {
          this.shippingMethods = response as [];
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

  private isEntityExistsInWorkFlow() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workFlowManagementService.isEntityExistsInWorkFlow(this.orderId, this.entityTypeId).then((response: any) => {
        if (response) {
          this.entityWorkFlowStageValue = response;
          this.isEntityWorkflow = true;
          if (this.entityWorkflowId != null && this.entityWorkFlowStageValue.entityWorkFlowId != this.entityWorkflowId) {
            this.isInitialLoading = false;
          }
          else {
            this.order.entityWorkflowId = this.entityWorkflowId = this.entityWorkFlowStageValue.entityWorkFlowId;
            this.order.entityStageId = this.orderCurrentStage = this.entityWorkFlowStageValue.stageId;
            this.fromEntityStageId = this.order.entityStageId;

            this.order.isPaused = this.entityWorkFlowStageValue.isPaused;
            this.order.selectedStageTaskIds = this.orderCurrentStageTaskIds = this.entityWorkFlowStageValue.taskIds;
           
            if (this.order.entityWorkflowId != null) {
              Promise.all([
                this.getWorkflowDetail(this.entityWorkflowId),
                this.getEntityStagesWithTask()
              ]).then(() => {
                  this.updateWorkFlowStageTaskDetail();
                  
                  if(this.isEntityWorkflow){
                    this.getEntityTotalReportingTime();
                  }

                  this.getAssignedToUsers(1, '');
                  this.getPriority();
                  this.getSeverity();
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

  private canUserChangeStage(currentStage, order): boolean {
    if (currentStage == null || order == null) {
      return true;
    }

    let canUserMoveOrder: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveOrder = canUserMoveOrder || (order.hasOwnProperty(associatePropertyName) ? (order[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveOrder = true;
    }
    return canUserMoveOrder
  }

  private getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workFlowManagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
          (response: any[]) => {
            this.orderStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
            // stage tasks
            this.orderStages.forEach(stageElement => {
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
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.orderStages));
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
        this.orderStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      }
    });
  }

  private getEntityStagesWithTaskAfterReset() {
    // get current stage 
    this.currentStage = this.orderStages.find(f => this.order && this.order.entityStageId === f.id) || this.orderStages.find(f => f.isDefault);
    if(this.currentStage != undefined){
    this.isCompleted = this.currentStage.isCompleted;
    this.isClosed = this.currentStage.isClosed;
    if(this.isCompleted || this.isClosed)
    {
      this.isReadOnly = true;
    }
    }
    //set selected stage for mobile view
    this.selectedStage = this.currentStage;

    // get current stage tasks
    if (this.orderStages != undefined && this.orderStages.length > 0) {
      this.currentStageTask = this.orderStages.length > 0 ? this.orderStages.find(s => s.id == this.order.entityStageId)?.stageTasks ?? null : '';
      if (!Array.isArray(this.order.selectedStageTaskIds)) {
        if (this.order.selectedStageTaskIds != null && this.order.selectedStageTaskIds != "") {
          const taskIds: Array<number> = this.order.selectedStageTaskIds
            ? this.order.selectedStageTaskIds.split(",").map(m => Number(m))
            : [];
          // map and get only ID and Name
          this.order.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
          this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.order.selectedStageTaskIds));
        }
      }
      else {
        const taskIds: Array<number> = this.order.selectedStageTaskIds.map(m => Number(m));
        this.order.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
        this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.order.selectedStageTaskIds));

      }
    }
  }


  private afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage: boolean) {
    const dropEntityStageDetail = this.orderStages.find(s => s.id == dropEntityStageId);
    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.orderStages.find(x => x.id == this.order.entityStageId);
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
      /**
        * Call API to validate worktask has completed the stage tasks (which are required) before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (OrderID)
        * */
      let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
      this._commonHelper.showLoader();
      this._workFlowManagementService.isEntityStageTasksCompleted(this.orderId, this.entityTypeId, this.order.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_DETAILS.MESSAGE_BEFORE_MOVE_ORDER_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired) {
      /**
       * Call API to validate order has completed all the stage tasks before moving on to other stage.
       * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (OrderId)
       * */
      this._commonHelper.showLoader();
      this._workFlowManagementService.isEntityStageTasksCompleted(this.orderId, this.entityTypeId, this.order.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_DETAILS.MESSAGE_BEFORE_MOVE_ORDER_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });

    } else {
      this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
    }
  }

  private changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean) {
    let noteSubjectName: any;
    if(!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail?.name }))}`
    }else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (dropEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.orderId;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
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
            entityId: this.orderId,
            workflowId: this.entityWorkflowId,
            workflowStageId: dropEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox, isReopenedStage),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              this.isEntityExistsInWorkFlow();
            });
          }).catch(()=>{
            this.isEntityExistsInWorkFlow();
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox, isReopenedStage),
      ]).then(() => {
        this.isEntityExistsInWorkFlow();
      }).catch(()=>{
        this.isEntityExistsInWorkFlow();
      });
    }
  }

  // update workflow entity stage values
  private updateEntityStage(dropEntityStageId, dropEntityStageName, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean) {
    return new Promise((resolve, reject) => {
      if(isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm("ORDERS.CHANGE_STAGE_CONFIRMATION", null, null, this.optionsForPopupDialog).then((confirmed: any) => {
          if(confirmed) {
            return this.afterupdateEntityStage(dropEntityStageId, dropEntityStageName, isReopenedStage)
          }
        })
      }else {
        return this.afterupdateEntityStage(dropEntityStageId, dropEntityStageName, isReopenedStage)
      }
    });
  }

  afterupdateEntityStage(dropEntityStageId, dropEntityStageName, isReopenedStage: boolean) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let assignedToForDto = this.order.assignedTo;
      let currentStageId = this.orderStages.find(s => s.id == this.order.entityStageId)?.id;
      let dropStage = this.orderStages.find(x => x.id == dropEntityStageId);
      this._workFlowManagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeID, entityId: this.orderId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if(dropStage.isCompleted || dropStage.isClosed)
          {
            this.refreshOrderItems = true;
          }
          this.orderAssignedTo = response;
          if (assignedToForDto != this.orderAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._ordersService.updateOrderAssignedTo({ entityId: this.orderId, assignedToId: this.orderAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.orderAssignedTo.isForcedAssignment }).then((updateOrderResponse: any) => {

              if (updateOrderResponse) {
                assignedToForDto = this.orderAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_DETAILS.MESSAGE_ORDER_MOVETO_STAGE',
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
            if(isReopenedStage) {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.MESSAGE_ORDER_STAGE_REOPEN', {
                  entityName: this.order?.name !== null ? this.order?.name : " " })
              )
            }else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TAB_DETAILS.MESSAGE_ORDER_MOVETO_STAGE',
                  { stageName: dropEntityStageName })
              );
            }
          }
        }
        this.getOrderDetail();
        this.setRefreshStageHistory();
        resolve(null);
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    })
  }

  private saveEntityWorkflowStageValueNote(params) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workFlowManagementService.saveEntityWorkflowStageValueNote(params).then(() => {
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

  private setOrderItemTabTabParameters(): void {
    this.tbOrderItemTabParameters = [{
      name: 'OrderID',
      type: 'int',
      value: this.orderId
    }];
  }

  private getOrderTypeWithSubType() {
    let params = this.prepareParamsForOrderAndSubTypeDropdown();
    this._commonHelper.showLoader();
    // get datasource details 
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ORDERTYPE, params).then(response => {
      this.orderTypeNative = response as [];
      this.orderTypes = JSON.parse(JSON.stringify(this.orderTypeNative.filter(c => c.parentID == null)));
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
      });
  }


  private prepareParamsForOrderAndSubTypeDropdown() {
    const params = [];
    const paramItem = {
      name: 'EntityTypeId',
      type: 'int',
      value: Entity.Orders
    };
    params.push(paramItem);
    return params;
  }

  private getEntityTotalReportingTime() {
    this._workFlowManagementService.getEntityTotalReportingTime(this.orderId, this.entityTypeId).then((response: any) => {
      if (response) {
        this.totalSpentTime = new TimeFramePipe().transform(+response?.totalSpentTime, this.hoursInDay);
        this.totalEffectiveTime = new TimeFramePipe().transform(+response?.totalEffectiveTime, this.hoursInDay);
        this.totalPauseTime = new TimeFramePipe().transform(+response?.totalPauseTime, this.hoursInDay);
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }  

 private getAssignedToUsers(includeAllUsers = 1, searchString = null) {
    return new Promise((resolve, reject) => {
      this.showAssignedToLoader = true;
      // prepare params
      let assignedToId = this.order?.assignedTo || ''; // owner 1 is assigned to
      let orderTaskStageId = this.order?.entityStageId || '';
      const params = this.prepareParamsForAssignedToUsers(orderTaskStageId, assignedToId, includeAllUsers, searchString);
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params).then(response => {
        if (response) {
          this.assignedToUsers = response as [];
        }
        this.showAssignedToLoader = false;
        this.isForceReloadAssignedTo = !searchString ? false : true;
        resolve(null);
      },
        (error) => {
          this.showAssignedToLoader = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  private prepareParamsForAssignedToUsers(stageId, assignedTo, IncludeAllUsers = 1, searchString = '') {
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
      value: IncludeAllUsers
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


  // get priority
  private getPriority() {
    this._commonHelper.showLoader();
    // get datasource details
    this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY).then(response => {
      this.priorityList = response;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get severity
  private getSeverity() {
    this._commonHelper.showLoader();
    // get datasource details
    this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY).then(response => {
      this.severityList = response;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
      });
  }

  private bindDropdown() {
    if (this.isForceReloadAssignedTo) this.getAssignedToUsers(1, '');
  }

  private findInvalidControls() {
    const invalid = [];
    const controls = this.orderForm.controls;
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
  
  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ORDER_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.ORDER_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ORDER_TAB_LAYOUT}`, JSON.stringify(response));
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

  getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isEntityWorkflow && entityWorkflowId > 0) {
        //storage key
        let storageKey = `${LocalStorageKey.OrderWorkflowDetailKey}_${entityWorkflowId}`;
        // get data
        const workflowDetail = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
        if (workflowDetail == null) {
          this._commonHelper.showLoader();
          this.isInitialLoading = true;
          this._workFlowManagementService.getWorkflowDetail(entityWorkflowId)
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
  /**
 * END
 * Additional Tabs Code 
 */

  onOrderStagePauseChanged(order: any, isPaused: boolean) {
    if (order.assignedTo !== this._loggedInUser.userId) {
      let message = "";
      if (order.assignedTo == null || order.assignedTo == "" || order.assignedTo == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.orderStagePauseChange(order, isPaused);
          }
        });
    }
    else if (order.assignedTo == this._loggedInUser.userId) {
      this.orderStagePauseChange(order, isPaused);
    }
  }

  orderStagePauseChange(order, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: order.id,
      entityStageId: order.entityStageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: order.assignedTo,
      noteID: null
    };

    if (params.isPaused) {
      this._commonHelper.showLoader();
      this._workFlowManagementService.isEntityStageIsPaused(order.id, this.entityTypeId, this.entityWorkflowId).then(res => {
        this._commonHelper.hideLoader();
        if (!res) {
          this.optionsForPopupDialog.size = 'md';
          this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
          this.modalRef.componentInstance.entityId = order.id;
          this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.PAUSE_REASON_NOTE_SUBJECT', { stageName: order.stageName }))}`;
          this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
          this.modalRef.componentInstance.stageId = order.entityStageId;
          this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
          this.modalRef.componentInstance.isSaveNote = true;

          this.modalRef.result.then(noteDate => {
            if (noteDate) {
              params.noteID = noteDate.id;
              this.saveEntityStagePauseTransition(params, order);
            }
          });
        } else {
          this.getOrderDetail();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('WORKTASK.WORKTASKS_PAUSEDORDELETEERROR')
          );
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: order.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.RESUME_NOTE_DESCRIPTION', { stageName: order.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransition(params, order);
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

  saveEntityStagePauseTransition(params, order) {
    this._commonHelper.showLoader();
    this._workFlowManagementService.saveEntityStagePauseTransition(params)
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

        this._workFlowManagementService.saveEntityWorkflowStageValueNote(param).then(() => {
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_SUCCESS'));
          order.isPaused = params.isPaused;
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
