//Angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { AbstractControl, FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
//common
import { FileUploader } from 'ng2-file-upload';
import { SettingsService } from '../../../settings/settings.service';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DataSources, Entity, PublicTenantSettings, EntityRecordTypeCode, ProcessEntityWorkflowStageValueNoteType, TabLayoutType, LocalStorageKey, LayoutTypes, SectionCodes, FieldNames, Actions } from '../../../../@core/enum';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
//services
import { DocumentService } from '../../../../@core/sharedComponents/documents/document.service';
import { WorkflowmanagementService } from '../../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { ProductsService } from '../../products.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
//pipes
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
//components
import { ReasonDialogComponent } from '../../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { ProductskuAddComponent } from '../../productsku/productsku-add/productsku-add.component';
import { ProductcategoryAddComponent } from '../../productcategories/productcategory-add/productcategory-add.component';
import { EntityReferencesListComponent } from '../../../../@core/sharedComponents/entity-references-list/entity-references-list.component';
import { EntityRelationComponentsModel } from '../../../../@core/sharedModels/entity-relation.model';
//primeng
import { Dropdown } from 'primeng/dropdown';
//other
import * as moment from 'moment';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { WorkTasksService } from '../../../worktasks/worktasks.service';
import { WorktaskAddComponent } from '../../../worktasks/worktask-add/worktask-add.component';
import { CaseAddComponent } from '../../../cases/case-add/case-add.component';
import { CasesService } from '../../../cases/cases.service';
import { EntityRelationService } from '../../../../@core/sharedServices/entity-relation.service';
import { NoteService } from '../../../../@core/sharedComponents/notes/notes.service';


@Component({
  selector: 'ngx-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private productTxtNameRef: ElementRef;
  @ViewChild('productTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.productTxtNameRef = content;
    }
  }

  private fileuploadcontrolRef: ElementRef;
  @ViewChild('fileuploadcontrol', { static: false }) set content1(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.fileuploadcontrolRef = content;
    }
  }

  // product model
  entityTypeId: number = Entity.Products;
  productId: number;
  entityRecordTypeId: number = null;
  shortCode: string;

  product: any;
  copyOfProduct: any;
  copyOfProductFormValues: any;
  productCustomFields: any[] = [];
  imageUploadMsg: any;

  tbWorktaskParameters: Array<DynamicTableParameter> = [];
  tbRelatedCasesParameters: Array<DynamicTableParameter> = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';
  productForm: UntypedFormGroup;

  isListViewLayout: boolean = false;

  //user detail
  _loggedInUser: any;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  isListWorkTask: boolean = false;
  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  isHelpCode: boolean = false;
  hasRelatedAccount: boolean = false;
  activeTab = '';

  //drop-down for address state and country
  countries: any;
  states: any;
  isDefaultCountryId: boolean = false;
  copyOfIsDefaultCountryId: boolean = false;
  currencySymbol: any = null;
  hoursInDay:number = null;
  productImageTypes: any = null;
  visibleProductTypes: any = null;
  productImageSizeInMB: any = null;
  maximumProductImages: any = null;

  // permissions
  hasPermission: boolean = false;
  isViewProduct: boolean = false;
  isAddProduct: boolean = false;
  isEditProduct: boolean = false;
  isListContacts: boolean = false;
  isViewAccount: boolean = false;
  isAddProductSku: boolean = false;
  isViewProductSku: boolean = false;
  changeProductStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isListCases: boolean = false;
  isAddCase: boolean = false;
  isDeleteProduct: boolean = false;
  isResumeRecord:  boolean = false;

  isInitialLoading: boolean = true;
  productName: string = '';
  productValidationMessages = {
    name:
      [{ type: 'required', message: 'PRODUCTS.DETAIL.TAB_DETAILS.NAME_REQUIRED' },
      { type: 'maxlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' }],
    code:
      [{ type: 'maxlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_CODE_MAX' },
      { type: 'minlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_CODE_MIN' }],
    stockQty:
      [{ type: 'maxlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_STOCK_QUANTITY_MAXLENGTH' }],
    price:
      [
        { type: 'required', message: 'PRODUCTS.ADD_DIALOG.PRICE_REQUIRED' },
        { type: 'maxlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_PRICE_MAX' }],
    description: [
      { type: 'maxlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'PRODUCTS.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MIN' }
    ],
    postalCode:
      [{ type: 'mask', message: 'PRODUCTS.DETAIL.TAB_DETAILS.PRODUCT_ADDRESS_INFO.POSTAL_CODE_PATTERN' }],
    address1:
      [{ type: 'required', message: 'PRODUCTS.DETAIL.TAB_DETAILS.PRODUCT_ADDRESS_INFO.ADDRESS_REQUIRED' }],
    entityStageId: [{ type: 'required', message: 'PRODUCTS.DETAIL.TAB_DETAILS.STATUS_REQUIRED' }],
  }

  //product sku variables 
  tbProductSkuParameters: Array<DynamicTableParameter> = [];
  // product category variables
  tbProductCategoryParameters: Array<DynamicTableParameter> = [];
  onceProductCategoryClicked: boolean = false;
  onceProductClicked: boolean = false;
  refreshProductCategories: boolean = false;
  refreshProductSkus: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  selectedCategory: any;

  onceVisualsTabClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;

  //all popup dialog open option settings  
  private modalRef: NgbModalRef | null;
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  categoriesForProductCategories: any;

  @ViewChild('relatedCategoryDrp', { static: false }) relatedCategoryDrpRef: Dropdown;

  uploader: FileUploader | null = null;
  hasDropZoneOver: boolean = false;
  productImages: any;
  productPrimaryImage: any;
  productPrimaryImageLoaded: boolean = false;
  allowToUploadImage: boolean = true;

  //#region Workflow related declaration
  entityWorkflowId: number;
  isEntityWorkflow: boolean = false;
  productStages: any[] = [];
  entityStagesWithTasksStorageKey: string = LocalStorageKey.ProductEntityStageTaskKey;

  //#endregion

  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any;

  currentStageTask: any;
  currentStage: any;
  selectedStage: any;
  oldStageTask: any;
  productCurrentStageTaskIds: string;
  productCurrentStage: number;
  //#endregion

  // assigned users
  assignedToUsers: any[] = [];

  //Assigned To Loader
  showAssignedToLoader: boolean = false;
  isForceReloadAssignedTo: boolean = true;

  //State Loader
  showStateLoader: boolean = false;

  //Data Sources
  groupedUOMTypes: any = [];

  showUOMLoader: boolean = false;
  
  //navTabs
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;
  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  forceRedirectionTabName: string = '';
  tabsNameHideAction: any[] = [];

  refreshCustomFieldJSONGrid: boolean = false;

  entityRelationComponents: EntityRelationComponentsModel[] = [];
  entityRelationTabs: any[] = [];
  
  // Visual Tab
  currentImage: number = 0;
  totalImages: number = 0;

  fromEntityStageId: any;

  // worktask tab
  onceWorkTaskClicked: boolean = false;
  refreshWorkTaskTab: boolean = false;
  onceDocumentClicked: boolean = false;
  
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeDetails:any;
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  isMaxFilePopupShown: boolean = false;
  isFromDropArea: boolean = false;

  casesRecordTypes: any;
  casesWorkflowList: any;

  isShowLoaderForCase: boolean = false;
  onceRelatedCasesClicked: boolean = false;
  refreshCaseTab: boolean = false;

  entityHiddenFieldSettings: any;
  fieldName = FieldNames;
  sectionCodeName = SectionCodes;

  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _productService: ProductsService,
    private _commonService: CommonService,
    private _formBuilder: UntypedFormBuilder,
    private _location: Location,
    private _modalService: NgbModal,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _documentService: DocumentService,
    private _workflowManagementService: WorkflowmanagementService,
    private _workTaskService: WorkTasksService,
    private _timeFramePipe: TimeFramePipe,
    private _casesService: CasesService,
    private _entityRelationService: EntityRelationService,
    private _noteService: NoteService) {
    this.isEditProduct = this._commonHelper.havePermission(enumPermissions.EditProduct);
    this.isAddProduct = this._commonHelper.havePermission(enumPermissions.AddAccount);
    this.isViewProduct = this._commonHelper.havePermission(enumPermissions.ViewProduct);
    this.isListWorkTask = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isViewAccount = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.changeProductStage = this._commonHelper.havePermission(enumPermissions.ChangeProductStage);
    this.isAddProductSku = this._commonHelper.havePermission(enumPermissions.AddProductSku);
    this.isViewProductSku = this._commonHelper.havePermission(enumPermissions.ViewProductSku);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadProductDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isListCases = this._commonHelper.havePermission(enumPermissions.ListCases);
    this.isDeleteProduct = this._commonHelper.havePermission(enumPermissions.DeleteProduct);
    this.isResumeRecord = this._commonHelper.havePermission(enumPermissions.ResumeTask);

    this.hasPermission = this.isViewProduct || this.isEditProduct;
    this.readRouteParameter();

    Promise.all([
      this.getTabLayoutTenantSetting(),
      this.getEntityRecordTypes(),
      this.getWorktaskWorkflowList(),
      this.getWorkflowListForCase()
    ]).then(() => {
      this.setTabLayout();
    });

  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    this.fillNavTabsNameHideAction();
    this.setWorkTaskTabParameters();
    this.setRelatedProductSkuTabParameters();
    this.setProductCategoryTabParameters();
    this.setRelatedCasesTabParameters();
    if (this.isViewProduct) {
      this._commonHelper.showLoader();
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getEntityRelationComponents(),
        this.getCountries(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getProductImageTypes(),
        this.getVisibleProductTypes(),
        this.getProductImageSize(),
        this.getMaximumProductImage(),
        this.getUOMTypes(),
        this.getEntityHiddenField(),
        this.getEntitySubTypes()
      ]).then(() => {
        this._commonHelper.hideLoader();
        this.getProductCustomFields();
        this.initFileUploaded();
      }, (error => {
        this._commonHelper.hideLoader();
      }));
    }
  }

  //#region Events
  get productfrm() { return this.productForm.controls; }

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

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.productForm.invalid) {
        this.validateAllFormFields(this.productForm);
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
      this.product = this._commonHelper.deepClone(this.copyOfProduct);
      
      if (this.product.customFieldJSONData && this.product.customFieldJSONData !== null && this.product.customFieldJSONData !== '' && this.product.customFieldJSONData !== undefined) {
        this.productCustomFields.forEach((field: any) => {
          if (field.fieldType == 'Date') {
            if (this.product.customFieldJSONData[field.fieldName] && this.product.customFieldJSONData[field.fieldName] != null && this.product.customFieldJSONData[field.fieldName] != '' && this.product.customFieldJSONData[field.fieldName] != undefined) {
              this.product.customFieldJSONData[field.fieldName] = moment(new Date(this.product.customFieldJSONData[field.fieldName])).toDate();
            }
          } else if (field.fieldType == 'JSON Grid') {
            if (this.product.customFieldJSONData[field.fieldName] && this.product.customFieldJSONData[field.fieldName] != null && this.product.customFieldJSONData[field.fieldName] != '' && this.product.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.product.customFieldJSONData[field.fieldName] === 'string') {
                this.product.customFieldJSONData[field.fieldName] = JSON.parse(this.product.customFieldJSONData[field.fieldName]);
              }
            } else {
              this.productForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.product.customFieldJSONData[field.fieldName] === 'number' || this.product.customFieldJSONData[field.fieldName] == null) {
              this.product.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.product.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        })
      }
      
      this.productForm.reset(this.copyOfProductFormValues);
      this.refreshJSONGridData()
      this.isDefaultCountryId = this.copyOfIsDefaultCountryId;

      //set address validators
      this.onAddressChangeValidation(this.productForm);

      if (this.states.filter(x => x.value == this.product.stateID).length <= 0) {
        this.getStatesByCountryId(this.product.countryID, this.product.stateID).then((response) => {
          this.states = response;
        });
      }
      this.isReadOnly = !this.isReadOnly;
       this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      this.bindDropdownData();
      setTimeout(() => { this.productTxtNameRef.nativeElement.focus(); });
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

  bindDropdownData() {
    if (this.isForceReloadAssignedTo) this.getAssignedToUsers(1, null)
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "ProductCategories": {
        this.refreshProductCategories = false;
        break;
      }
      case "ProductSkus": {
        this.refreshProductSkus = false;
        break;
      }
      case "WorkTask": {
        this.refreshWorkTaskTab = false;
        break;
      }
      case "RelatedCases": {
        this.refreshCaseTab = false;
        break;
      }
    }
  }

  // set current active tab

  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceProductClicked && this.activeTab == 'navSkus') {
      this.onceProductClicked = true;
    }

    if (!this.onceProductCategoryClicked && this.activeTab == 'navCategories') {
      this.getCategoriesForProductCategories('');
      this.onceProductCategoryClicked = true;
    }

    if (!this.onceVisualsTabClicked && this.activeTab == 'navVisuals') {
      this.getImagesForVisuals();
      this.onceVisualsTabClicked = true;
    }

    if (!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
      this.onceStageHistoryClicked = true;
    }

    if (!this.onceWorkTaskClicked && this.activeTab == 'navWorkTasks') {
      this.onceWorkTaskClicked = true;
    }

    if((!this.onceRelatedCasesClicked && this.activeTab == 'navRelatedCases')) {
      this.onceRelatedCasesClicked = true;
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }

    if (activeInfo.tab.hasOwnProperty("isTabLoaded") && !activeInfo.tab.isTabLoaded) {      
      activeInfo.tab.isTabLoaded = true;
      const selectedTab = this.entityRelationTabs.find(x => x.tabLink == activeInfo.tab.tabLink);
      if (selectedTab) {
        selectedTab['isTabLoaded'] = true;
      }
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
    this.getVisibleProductTypes();
    this.getProductImageTypes();
    this.getImagesForVisuals();
  }

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }

  addProductSku() {
    this.modalRef = this._modalService.open(ProductskuAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.productId = this.productId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_PRODUCTSKU.MESSAGE_ADD_PRODUCTSKU_SUCCESS'));
        this.refreshProductSkus = true;
      }
    });
  }

  onEditProductSku(id: any) {
    if (!this.isViewProductSku) {
      return;
    }

    // if not undefined then redirect
    if (id != undefined) {
      this._router.navigateByUrl('/productskus/details/' + id);
    }
  }

  onDeleteProductSku(id: any) {
    const params = {
      EntityTypeId: Entity.ProductSkus,
      EntityId: id,
    };
    this._commonHelper.showLoader();
    this._commonService.getEntityReferences(params).then((res: any) => {
      this._commonHelper.hideLoader();
      if (res != undefined && res.length != 0) {
        if (this._modalService.hasOpenModals()) {
          return;
        }
        this.optionsForPopupDialog.size = "lg";
        this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.entityList = res;
        this.modalRef.componentInstance.entityId = id;
        this.modalRef.componentInstance.entityTypeId = Entity.ProductSkus;
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData("PRODUCTSKU.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL");
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData("PRODUCTSKU.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE");
      }
      else {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData("PRODUCTS.DETAIL.TAB_PRODUCTSKU.DELETE_PRODUCTSKU_DIALOG_TEXT"), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._productService.deleteProductSku(id).then((response) => {
                this.refreshProductSkus = true;
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData(
                    "PRODUCTS.DETAIL.TAB_PRODUCTSKU.MESSAGE_DELETE_PRODUCTSKU_SUCCESS"
                  )
                );
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            }
          });
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // stage transition
  onMarkStageAsComplete(dropEntityStageId) {
    var isShowStageChangeConfirmationBox: boolean = true;
    this.optionsForPopupDialog.size = 'md';
    const dropEntityStageDetail = this.productStages.find(s => s.id == dropEntityStageId);
    if (dropEntityStageDetail != null && dropEntityStageId != this.product.entityStageId) {
      const prevEntityStageDetail = this.productStages.find(s => s.id == this.product.entityStageId);
      const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.product);

      if (!canUserChangeStage) {
        if (this.changeProductStage) {
          isShowStageChangeConfirmationBox = false;
          this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
              if (confirmed) {
                this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox);
              }
            });
        }
        else {
          this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
        }
      }
      else {
        this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox);
      }
    }
  }

  isGetMultiLineAddressLine() {
    let finalAddress = '';
    let add1 = this.product?.address1;
    let add2 = this.product?.address2;

    if (add1 != undefined && add1 != null && add1 != '') {
      finalAddress = add1;
    }

    if (add2 != undefined && add2 != null && add2 != '') {
      if (finalAddress != null && finalAddress != undefined && finalAddress != null && finalAddress != '') {
        finalAddress = finalAddress + ", ";
      }

      finalAddress = finalAddress + add2;
    }
    return finalAddress;
  }

  relatedCategoriesOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getCategoriesForProductCategories(e.filter.trim());
      }
    }
    else {
      this.getCategoriesForProductCategories('');
    }
  }

  relatedCategoriesOnChange(e) {
    this._commonHelper.showLoader();
    let param = {
      ProductCategoryID: e.value,
      ProductID: this.product.id
    }
    this._productService.saveProductCategoryProduct(param).then(response => {
      this.refreshProductCategories = true;
      this.relatedCategoryDrpRef.resetFilter();
      this.getCategoriesForProductCategories('');
      this.selectedCategory = null;
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_PRODUCTCATEGORY.MESSAGE_ADD_PRODUCTCATEGORY_SUCCESS'));
    }, (error) => {
      this.relatedCategoryDrpRef.resetFilter();
      this.getCategoriesForProductCategories('');
      this.selectedCategory = null;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // open add popup    
  addProductCategory() {
    this.modalRef = this._modalService.open(ProductcategoryAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.productId = this.productId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        let param = { value: response }
        this.relatedCategoriesOnChange(param);
      }
    });
  }

  deleteProductCategoryProduct(id: any) {
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_PRODUCTCATEGORY.DELETE_PRODUCTCATEGORY_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._productService.deleteProductCategoryProduct(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_PRODUCTCATEGORY.MESSAGE_DELETE_PRODUCTCATEGORY_SUCCESS'));
            this.refreshProductCategories = true;
            this.relatedCategoryDrpRef.resetFilter();
            this.getCategoriesForProductCategories('');
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }

  removeImage(fileId) {
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };
    this.refreshActivity = false;
    this._confirmationDialogService.confirm('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_IMAGE_DELETE_CONFIRM', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          let params = { id: fileId }
          this._commonHelper.showLoader();
          this._documentService.deleteDocument(params).then(() => {
            this._commonHelper.hideLoader();
            this.refreshActivity = true;
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_IMAGE_DELETED'));
            this.getImagesForVisuals();
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      })
  }

  setImageAsPrimary(fileId, filePath) {
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_SET_PRIMARY_CONFIRM', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          const params = { fileId: fileId, productId: this.productId };
          this._productService.setProductPrimaryImage(params).then(() => {
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_SET_PRIMARY_SUCCESS'));
            this.productPrimaryImage = filePath;
            this.product.primaryImageID = fileId;
            this.refreshActivity = true;
            this.setRefreshActivityHistory();
            this._commonHelper.hideLoader();
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
  }

  setRefreshFileDeleted() {
    this.getImagesForVisuals();
  }

  private changeProductStatusMessage(id, status, isconfirmed) {
    this.optionsForPopupDialog.size = "md";
    let messageText = this.product.isActive ? 'PRODUCTS.DETAIL.MESSAGE_CONFIRM_INACTIVE' : 'PRODUCTS.DETAIL.MESSAGE_CONFIRM_ACTIVE';
    let successText = this.product.isActive ? 'PRODUCTS.DETAIL.MESSAGE_CONTACT_INACTIVATED' : 'PRODUCTS.DETAIL.MESSAGE_CONTACT_ACTIVATED';
    
    if(isconfirmed){
      this.changeProductStatus(id, status, successText);
    } else {
    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this.changeProductStatus(id, status, successText);
      }
    });
   }
  }

  private changeProductStatus(id: any, status: any, successText: string) {
    this._commonHelper.showLoader();
    this._productService.changeProductStatus(id, !status).then((response: any[]) => {
      if (response) {
        this.refreshProductSkus = true;
        this.refreshProductCategories = true;
        this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
        this.refreshCaseTab = true;
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData(successText)
        );
      }
      this.getProductDetail();
      this.isReadOnly = true;
      this._commonHelper.hideLoader();
    }, (error) => {
      this.getProductDetail();
      this.isReadOnly = true;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

    onActionChangeStatus() {
    if (!this.isEditProduct) {
      return
    }
    if (this.product.isActive) {
      const params = {
        EntityTypeId: Entity.Products,
        EntityId: this.product.id
      };
      this._commonHelper.showLoader();
      this._commonService.getEntityReferences(params).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response != undefined && response.length != 0) {
          if (this._modalService.hasOpenModals()) {
            return;
          }
          this.optionsForPopupDialog.size = "xl";
          this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityId = this.product.id;
          this.modalRef.componentInstance.entityTypeId = Entity.Products;
          this.modalRef.componentInstance.entityList = response;
          this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DEACTIVE_LABEL');
          this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
          this.modalRef.componentInstance.action = Actions.InActive;
          this.modalRef.result.then((response: any) => {
            if (response) {
              this.changeProductStatusMessage(this.product.id,this.product.isActive,true);
            }
          });
        }
        else { 
          this.changeProductStatusMessage(this.product.id,this.product.isActive,false)
        }
      });
    }
    else{
      this.changeProductStatusMessage(this.product.id,this.product.isActive,false)
    }    
  }

  onCountrySelectionChange(value, addressFormGroup: AbstractControl) {
    this.isDefaultCountryId = false;
    this.onAddressChangeValidation(addressFormGroup);

    this.getStatesByCountryId(value, null).then((response) => {
      this.states = response;
    });

    this.product.stateID = null;
  }

  onUOMSelectionChange(value) {
    this.product.uomid = value;
  }

  onAddressChangeValidation(addressFormGroup: AbstractControl) {
    if ((addressFormGroup.get('city').value == null || addressFormGroup.get('city').value == '')
      && (addressFormGroup.get('stateId').value == null || addressFormGroup.get('stateId').value == '')
      && (addressFormGroup.get('postalCode').value == null || addressFormGroup.get('postalCode').value == '')
      && (this.isDefaultCountryId ? true : (addressFormGroup.get('countryId').value == null || addressFormGroup.get('countryId').value == ''))
    ) {
      addressFormGroup.get('address1').removeValidators([Validators.required]);
      addressFormGroup.get('address1').updateValueAndValidity();
    }
    else {
      addressFormGroup.get('address1').setValidators([Validators.required]);
      addressFormGroup.get('address1').updateValueAndValidity();
    }
  }
  //#endregion

  //#region Private methids
  private customfieldMultiSelectChange(event, fieldName) {
    const stringValue = event.value.toString()
    this.product.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      const id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.productId = Number(id);
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

  private getCountries() {
    const countries = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Countries));
    if (countries == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getCountries().then(response => {
          this.countries = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Countries, JSON.stringify(this.countries));
          resolve(null);
        }, (error) => {
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
      this.showStateLoader = true;
      // get datasource details
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.STATESBYCOUNTRY, params).then(response => {
        this.showStateLoader = false;
        resolve(response);
      }, (error) => {
        this.showStateLoader = false;
        this._commonHelper.showToastrError(error.message);
        reject(null);
      }).catch(() => {
        resolve(null);
      });
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
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Products));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Products, JSON.stringify(response));
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

  private prepareFormDataInJSON(): void {
    this.productCustomFields.forEach((customField: any) => {
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

  private getProductDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._productService.getProductById(this.productId).then((response: any) => {
        if (response) {
          this.product = this._commonHelper.deepClone(response);
          this.setDefaultCountry();
          Promise.all([
            this.isEntityExistsInWorkFlow(),
            this.getStatesByCountryId(this.product.countryID, this.product.stateID).then((response) => {
              this.states = response;
            }),
          ]).then(() => {
            this.setProductDetails(this.product || {});
            this.productForm = this.createProductDetailForm();
            this.prepareFormCustomFields();
            if (this.product.entityWorkflowId) {
              this.productForm.addControl('entityStageId', new FormControl(this.product.entityStageId ?? null, Validators.required));
            }
            //show/Hide Pause/Resume button
            this.product.isShowPauseOrResume =  (this.product?.entityWorkflowId  != null) ? true : false;
            //set address validators
            this.onAddressChangeValidation(this.productForm);

            this.workTaskSubTypeDetails = this.entitySubTypes.find(x => x.level == 1);

            // prepare tab with order
            this.setDefaultNavTabs();
            this.prepareTabsWithOrder();
            this.copyOfProductFormValues = this.productForm.value;
            this.isLoaded = true;
            this.refreshCustomFieldJSONGrid = true;
            setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
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


  private createProductDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.productId],
      name: [this.product.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      code: [this.product.code, Validators.compose([Validators.maxLength(100), Validators.minLength(2)])],
      stockQty: [this.product.stockQty, Validators.compose([Validators.maxLength(15)])],
      uomid: [this.product.uomid],
      uomName: [this.product.uomName],
      price: [this.product.price, Validators.compose([Validators.required, Validators.maxLength(15)])],
      assignedTo: [this.product.assignedTo],
      selectedStageTaskIds: [this.product.selectedStageTaskIds],
      description: [this.product.description, Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
      entityRecordTypeId: [this.product.entityRecordTypeID],
      address1: [this.product.address1],
      address2: [this.product.address2],
      city: [this.product.city],
      stateId: [this.product.stateID],
      postalCode: [this.product.postalCode],
      countryId: [this.product.countryID != null && this.product.countryID != '' ? this.product.countryID : this._commonHelper.defaultCountryId]
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.product.customFieldJSONData[control.fieldName] != null && this.product.customFieldJSONData[control.fieldName] != '') {
              this.product.customFieldJSONData[control.fieldName] = moment(new Date(this.product.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.product.customFieldJSONData[control.fieldName] != null && this.product.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.product.customFieldJSONData[control.fieldName] === 'string') {
                this.product.customFieldJSONData[control.fieldName] = JSON.parse(this.product.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.product.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.product.customFieldJSONData[control.fieldName] != null && this.product.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.product.customFieldJSONData[control.fieldName];
              this.product.customFieldJSONData[control.fieldName] = this.product.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
              }
              this.product.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
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
                  this.productForm.controls[control.fieldName].setValidators(validatorFn);
                  this.productForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.product.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.product.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
              this.productForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.productForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
              this.productForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.productForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName], Validators.email));
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
              this.productForm.controls[control.fieldName].setValidators(validatorFn);
              this.productForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
            if (this.product.customFieldJSONData[control.fieldName] != null && this.product.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.product.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.productForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.productForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.productForm.addControl(control.fieldName, new UntypedFormControl(this.product.customFieldJSONData[control.fieldName]));
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
                this.productForm.controls[control.fieldName].setValidators(validatorFn);
                this.productForm.controls[control.fieldName].updateValueAndValidity();
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
      { tabName: '', tabLink: 'navSkus', isFirst: false, condition: this.isViewProduct, displayOrder: 201 },
      { tabName: '', tabLink: 'navCategories', isFirst: false, condition: this.isViewProduct, displayOrder: 301 },
      { tabName: '', tabLink: 'navVisuals', isFirst: false, condition: this.isViewProduct, displayOrder: 401 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 501 },
      { tabName: 'WorkTask', tabLink: 'navWorkTasks', isFirst: true, condition: this.isListWorkTask, displayOrder: 601 },
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

  private prepareTabsWithOrder(): void {
    this.formDataJSON.forEach(tab => {
      var objNavTab = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab: false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn: true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
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
      value: this.productId
    }]
  }

  private setRelatedProductSkuTabParameters(): void {
    this.tbProductSkuParameters = [{
      name: 'ProductID',
      type: 'int',
      value: this.productId
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
      value: this.productId
    }]
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'products.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() == 'products.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.PRODUCTS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      } else if (error.messageCode.toLowerCase() == 'products.productinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.PRODUCTS_PRODUCTINOTHERENTITIES')));
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
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

  private setProductDetails(response: any): void {
    this.product = response;
    this.productName = this.product?.name || '';

    if (this.product.shortCode != null) {
      this.isHelpCode = true;
    }
    else {
      this.isHelpCode = false;
    }
    if (!this.product.entityWorkflowId) {
      this.updateWorkFlowStageTaskDetail();
    } else {
      this.copyOfProduct = this._commonHelper.deepClone(this.product);
    }
      this.hasRelatedAccount = (this.product.accountName && this.product.accountName.trim() != '') ? true : false;

      this.product.price = (this.product.price == null || this.product.price == undefined) ? null : this.product.price.toString();
      this.copyOfProduct = this._commonHelper.deepClone(this.product);
      this.product.customFieldJSONData = this._commonHelper.tryParseJson(this.product.customFieldJSONData);
      this.copyOfProduct.customFieldJSONData = this._commonHelper.deepClone(this.product.customFieldJSONData);
      this.copyOfIsDefaultCountryId = this.isDefaultCountryId;
      this.entityRecordTypeId = this.product?.entityRecordTypeID;

      this.getPrimaryImage();
  }

  private setDefaultCountry() {
    if (this.product?.countryID == null || this.product?.countryID == '') {
      this.product.countryID = this._commonHelper.defaultCountryId;
      this.isDefaultCountryId = true;
    }
    else {
      this.isDefaultCountryId = false;
    }
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.product.customFieldJSONData) {
        this.productCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.product.customFieldJSONData[field.fieldName] && this.product.customFieldJSONData[field.fieldName] != null && this.product.customFieldJSONData[field.fieldName] != '') {
              this.product.customFieldJSONData[field.fieldName] = moment(this.product.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.productForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.product.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.product.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.productForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.product.customFieldJSONData[field.fieldName] = data;
            } else {
              this.product.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }
      let params = this._commonHelper.deepClone(this.product);

      this.productCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.productForm.get(field.fieldName)?.value || [];
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

      this._productService.updateProduct(params).then(() => {
        this.getProductDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });

        //Refresh Stage History
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getProductDetail().then(() => {
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

  private getProductCustomFields(): void {
    this._commonHelper.showLoader();
    this._productService.getProductCustomFields(this.entityTypeId, this.productId)
      .then((response: any) => {
        if (response) {
          this.productCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getProductDetail();
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

  // get work tasks by stage
  private getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowManagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
          (response: any[]) => {
            this.productStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
            // stage tasks
            this.productStages.forEach(stageElement => {
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
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.productStages));
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
        this.productStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      }
    });
  }

  private getEntityStagesWithTaskAfterReset() {
    // get current stage 
    this.currentStage = this.productStages.find(f => this.product && this.product.entityStageId === f.id) || this.productStages.find(f => f.isDefault);
    
    //set selected stage for mobile view
    this.selectedStage = this.currentStage;

    // get current stage tasks
    this.currentStageTask = this.productStages.length > 0 ? this.productStages.find(s => s.id == this.product.entityStageId)?.stageTasks ?? null : '';
    if (this.product.selectedStageTaskIds != null && this.product.selectedStageTaskIds != "") {
      const taskIds: Array<number> = this.product.selectedStageTaskIds
        ? this.product.selectedStageTaskIds.split(",").map(m => Number(m))
        : [];
      // map and get only ID and Name
      this.product.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
      this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.product.selectedStageTaskIds));
    }
  }

  private isEntityExistsInWorkFlow() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowManagementService.isEntityExistsInWorkFlow(this.productId, this.entityTypeId).then((response: any) => {
        if (response) {
          const entityWorkFlowStageValue = response;
          this.isEntityWorkflow = true;
          
          if (this.entityWorkflowId != null && entityWorkFlowStageValue.entityWorkFlowId != this.entityWorkflowId) {
            this.isInitialLoading = false;
          }
          else {
            this.product.entityWorkflowId = this.entityWorkflowId = entityWorkFlowStageValue.entityWorkFlowId;
            this.product.entityStageId = this.productCurrentStage = entityWorkFlowStageValue.stageId;
            this.fromEntityStageId = this.product.entityStageId;
            this.product.isPaused = entityWorkFlowStageValue.isPaused;
            this.product.selectedStageTaskIds = this.productCurrentStageTaskIds = entityWorkFlowStageValue.taskIds;
            if (this.product.entityWorkflowId != null) {
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
    this.product.entityWorkflowId = this.entityWorkflowId;
    this.product.entityStageId = this.productCurrentStage;
    this.copyOfProduct = this._commonHelper.deepClone(this.product);
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

  private canUserChangeStage(currentStage, product): boolean {
    if (currentStage == null || product == null) {
      return true;
    }

    let canUserMoveProduct: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveProduct = canUserMoveProduct || (product.hasOwnProperty(associatePropertyName) ? (product[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveProduct = true;
    }
    return canUserMoveProduct
  }

  // get assigned users
  private getAssignedToUsers(includeAllUsers = 1, searchString = null) {
    this.showAssignedToLoader = true;

    // get datasource details
    const params = this.prepareParamsForAssignedToUsers(this.product.entityStageId, this.product.assignedTo, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.PRODUCTASSIGNEDTO, params).then(response => {
      this.assignedToUsers = response as any[];
      this.showAssignedToLoader = false;

      if (!searchString)
        this.isForceReloadAssignedTo = false;
      else
        this.isForceReloadAssignedTo = true;
    },
      (error) => {
        this.showAssignedToLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers = 1, searchString) {
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

  private afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox) {
    const dropEntityStageDetail = this.productStages.find(s => s.id == dropEntityStageId);

    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.productStages.find(x => x.id == this.product.entityStageId);
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
      this._workflowManagementService.isEntityStageTasksCompleted(this.productId, this.entityTypeId, this.product.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.MESSAGE_BEFORE_MOVE_PRODUCT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired) {

      this._commonHelper.showLoader();
      this._workflowManagementService.isEntityStageTasksCompleted(this.productId, this.entityTypeId, this.product.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.MESSAGE_BEFORE_MOVE_PRODUCT_STAGE_TASK_SHOULD_BE_COMPLETED'));
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

  private changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox) {
    if (dropEntityStageDetail.isNoteRequired) {
      isShowStageChangeConfirmationBox = false;
      this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.productId;
      this.modalRef.componentInstance.noteSubject = dropEntityStageDetail.name;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail.name }))}`;
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
            entityId: this.productId,
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
            });
          }).catch(() => {
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
        this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox),
      ]).then(() => {
        this.isEntityExistsInWorkFlow();
      }).catch(() => {
        this.isEntityExistsInWorkFlow();
      });
    }
  }

  // update workflow entity stage values
  private updateEntityStage(dropEntityStageId, dropEntityStageName, isShowStageChangeConfirmationBox: boolean) {
    return new Promise((resolve, reject) => {
      if (isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm("PRODUCTS.CHANGE_STAGE_CONFIRMATION", null, null, this.optionsForPopupDialog).then((confirmed: any) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageName)
          }
        })
      } else {
        return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageName)
      }
    });
  }

  afterUpdateEntityStage(dropEntityStageId, dropEntityStageName) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let assignedToForDto = this.product.assignedTo;
      let currentStageId = this.productStages.find(x => x.id == this.product.entityStageId)?.id;
      let dropStage = this.productStages.find(x => x.id == dropEntityStageId);
      this._workflowManagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: this.productId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          const productAssignedTo = response;
          if (assignedToForDto != productAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._productService.saveProductAssignedTo({ entityId: this.productId, assignedToId: productAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: productAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = productAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.MESSAGE_PRODUCT_MOVETO_STAGE',
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
              this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.MESSAGE_PRODUCT_MOVETO_STAGE',
                { stageName: dropEntityStageName })
            );
          }
        }
        this.getProductDetail();
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
    this._workflowManagementService.getEntityTotalReportingTime(this.productId, this.entityTypeId).then((response: any) => {
      if (response) {
        this.totalSpentTime = new TimeFramePipe().transform(+response?.totalSpentTime, this.hoursInDay);
        this.totalEffectiveTime = new TimeFramePipe().transform(+response?.totalEffectiveTime, this.hoursInDay);
        this.totalPauseTime = new TimeFramePipe().transform(+response?.totalPauseTime, this.hoursInDay);
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }

  private getCategoriesForProductCategories(searchString: any) {
    let params = this.prepareParamsForCategoriesDropdown(searchString);
    this._commonHelper.showLoader();
    // get datasource details 
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDPRODUCTCATEGORY, params).then(response => {
      this.categoriesForProductCategories = response;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
      });
  }

  private prepareParamsForCategoriesDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'ProductID',
      type: 'int',
      value: this.product.id,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem1);

    return params;
  }

  private setProductCategoryTabParameters(): void {
    this.tbProductCategoryParameters = [{
      name: 'ProductID',
      type: 'int',
      value: this.productId
    }]
  }

  private initFileUploaded() {
    let uploadFileUrl: string = this._documentService.getAddDocumentUrl();

    this.uploader = new FileUploader({
      url: uploadFileUrl,
      allowedFileType: ["image"],
      removeAfterUpload: true,
      maxFileSize: this.productImageSizeInMB * 1024 * 1024,
      authTokenHeader: "Authorization",
      authToken: this._loggedInUser.accessToken,
      itemAlias: "Files",
      queueLimit: this.maximumProductImages
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

      if ((files.length + this.productImages.length) > this.maximumProductImages) {
        this.uploader.clearQueue();
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_ALLOW_TO_UPLOAD', { MaxFiles: this.maximumProductImages }));
        return;
      }

      files.forEach((file: any) => {
        let ext = file.file.name.split('.').pop().toLowerCase();
        if (this.productImageTypes.split(',').indexOf(ext) == -1) {
          this.uploader.clearQueue();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.UNSUPPORTEDFILE', {
              fileName: file.name
            })
          );
          return;
        }
      });
    };

    this.uploader.onWhenAddingFileFailed = (item, filter, options) => {

      if (this.isMaxFilePopupShown) return;

      if (filter.name == "queueLimit") {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_ALLOW_TO_UPLOAD', { MaxFiles: this.maximumProductImages }));
        this.isMaxFilePopupShown = true;
      }
      else if (item.size > options.maxFileSize) {
        if (this.fileuploadcontrolRef.nativeElement.files.length > this.maximumProductImages) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_ALLOW_TO_UPLOAD', { MaxFiles: this.maximumProductImages }));
          this.uploader.cancelAll();
          this.uploader.clearQueue();
          this.isMaxFilePopupShown = true;
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MAX_FILE_SIZE', { fileName: item.name })
          );
        }
      } else {
        if (this.fileuploadcontrolRef.nativeElement.files.length > this.maximumProductImages) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_ALLOW_TO_UPLOAD', { MaxFiles: this.maximumProductImages }));
          this.uploader.cancelAll();
          this.uploader.clearQueue();
          this.isMaxFilePopupShown = true;
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.UNSUPPORTEDFILE', { fileName: item.name })
          );
        }
      }
    };

    this.refreshActivity = false;
    this.uploader.onSuccessItem = (item: any, response: string, status: number, headers: any): any => {
      if (response) {
        let responseData = JSON.parse(response);
        if (responseData.statusCode == 200) {
          if (responseData?.data?.length < 1) {
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('DOCUMENTS.FILES_VALIDATION_UNKNOWNERROR', { fileName: item.file.name }));
          } else {
            this.getImagesForVisuals();
            this.refreshActivity = true;
            this.setRefreshActivityHistory();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_IMAGE_ADD', { fileName: item.file.name }));
          }
        }
        else {
          this._commonHelper.showToastrError(responseData.message);
        }
      }
    }
    //supported file document upload label.
    this.imageUploadMsg = this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.SUPPORTED_FILE_TYPES', { allowedFileType: this.productImageTypes.trim().replace(/,/g, ', ').replace(/,(?=[^,]+$)/g, ', or'), maxFileSize: this.productImageSizeInMB });
  }

  public fileOverBase(e: any): void {
    this.isMaxFilePopupShown = false;
    this.hasDropZoneOver = e;
    this.isFromDropArea = true;
  }
  
  public onSelectFileClick() {
    this.isMaxFilePopupShown = false;
  }

  public fileDropped(e: any): void {
    if (this.uploader.queue.length > 0) {
      this.uploader.onBuildItemForm = (fileItem: any, form: any) => {
        form.append('EntityTypeID', this.entityTypeId);
        form.append('EntityID', this.productId);
      };
      this.uploader.uploadAll();
    }
    this.isMaxFilePopupShown = false;
  }

  public fileDroppedArea(e: any): void {
    if (this.isFromDropArea && e.length > this.maximumProductImages) {
      this.uploader.clearQueue();
      this.uploader.cancelAll();
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_VISUALS.MESSAGE_ALLOW_TO_UPLOAD', { MaxFiles: this.maximumProductImages }));
      this.isFromDropArea = false;
      return;
    }
    this.isFromDropArea = false;
    if (this.uploader.queue.length > 0) {
      this.uploader.onBuildItemForm = (fileItem: any, form: any) => {
        form.append('EntityTypeID', this.entityTypeId);
        form.append('EntityID', this.productId);
      };
      this.uploader.uploadAll();
    }
    this.isMaxFilePopupShown = false;
  }

  private getImagesForVisuals() {
    
    let params: any = {
      entityTypeId: this.entityTypeId,
      entityId: this.productId,
      entityRecordTypeId: this.visibleProductTypes != null && this.visibleProductTypes.length > 0 ? this.visibleProductTypes.toString() : '',
      timespanName: 'ALLTIME',
      pageSize: 1000
    }

    const deepCopyOfProductImages = this._commonHelper.deepClone(this.productImages);
    this.productImages = [];
    this.totalImages = 0;
    this._documentService.getAllDocuments(params).then((response: any) => {
      if (response) {
        if (!this.visibleProductTypes || (this.visibleProductTypes && this.visibleProductTypes == '')) {
          response.forEach((file: any,) => {
            let ext = file.name.split('.').pop().toLowerCase();
            if (this.productImageTypes.includes(ext)) {
              const found = this.productImages.find((obj) => { return obj.id === file.id; });
              if (!found) { this.productImages.push(file); }
            }
          });
        }
        else {
          response.forEach((file: any,) => {
            let ext = file.name.split('.').pop().toLowerCase();
            let visibleEntityRecordId = file.entityRecordTypeID ?? -9999;

              if (this.productImageTypes.includes(ext)) {
              if (visibleEntityRecordId != -9999 && this.visibleProductTypes && this.visibleProductTypes.length > 0 && this.visibleProductTypes.includes(visibleEntityRecordId) && !this.productImages.includes(file)) {
                const found = this.productImages.find((obj) => { return obj.id === file.id; });
                if (!found) { this.productImages.push(file); }
              }
              else if (visibleEntityRecordId != -9999 && this.visibleProductTypes && this.visibleProductTypes.length == 0 && !this.productImages.includes(file)) {
                const found = this.productImages.find((obj) => { return obj.id === file.id; });
                if (!found) { this.productImages.push(file); }
              }
            }
          });
        }

        this.allowToUploadImage = this.productImages.length < this.maximumProductImages;
        this.currentImage = 1;
        this.totalImages = this.productImages.length;
      }
      this.getPrimaryImage();
    },
      (error) => {
        this.productImages = deepCopyOfProductImages;
        this.currentImage = 1;
        this.totalImages = this.productImages ? this.productImages.length : 0;
        this.getTranslateErrorMessage(error);
      });
  }

  public setImageCount(navDirection){
    if(navDirection == 'prev')
    {
      this.currentImage -= 1;
      if(this.currentImage<1)
      {
        this.currentImage = this.totalImages;
      }
    }
    if(navDirection == 'next')
    {
      this.currentImage += 1;
      if(this.currentImage> this.totalImages)
      {
        this.currentImage = 1;
      }
    }
  }

  private getPrimaryImage() {
    if (this.product.primaryImageID > 0) {
      let params = { id: this.product.primaryImageID }
      this._commonHelper.showLoader();
      this._documentService.getDocumentDetailById(params).then((response: any) => {
        if (response) {
          this.productPrimaryImage = response.signedFileUrl;
        }
        else {
          this.productPrimaryImage = '';
          this.productPrimaryImageLoaded = false;
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.productPrimaryImage = '';
        this.productPrimaryImageLoaded = false;
        if (error && error.messageCode && error.messageCode.toLowerCase() != 'files.notexists' && error.messageCode.toLowerCase() != 'files.filesnotexists') {
          this.getTranslateErrorMessage(error);
        }
      });
    }
  }

  private getProductImageTypes() {
    const cacheData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.PRODUCT_IMAGE_TYPES));
    if (cacheData == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRODUCT_IMAGE_TYPES).then(response => {
          this.productImageTypes = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.PRODUCT_IMAGE_TYPES, JSON.stringify(this.productImageTypes));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.productImageTypes = cacheData;
    }
  }


  private getVisibleProductTypes() {
    const cacheData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.VISIBLE_PRODUCT_TYPES));
    if (cacheData == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.VISIBLE_PRODUCT_TYPES).then(response => {
          this.visibleProductTypes = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.VISIBLE_PRODUCT_TYPES, JSON.stringify(this.visibleProductTypes));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.visibleProductTypes = cacheData;
    }
  }

  private getProductImageSize() {
    const cacheData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.PRODUCT_IMAGE_SIZE));
    if (cacheData == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRODUCT_IMAGE_SIZE).then(response => {
          this.productImageSizeInMB = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.PRODUCT_IMAGE_SIZE, JSON.stringify(this.productImageSizeInMB));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.productImageSizeInMB = cacheData;
    }
  }

  private getMaximumProductImage() {
    const cacheData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.MAXIMUM_PRODUCT_IMAGES));
    if (cacheData == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.MAXIMUM_PRODUCT_IMAGES).then(response => {
          this.maximumProductImages = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.MAXIMUM_PRODUCT_IMAGES, JSON.stringify(this.maximumProductImages));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.maximumProductImages = cacheData;
    }
  }

  private findInvalidControls() {
    const invalid = [];
    const controls = this.productForm.controls;
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
  //#endregion
  /**
   * START
   * Moksh Dhameliya 25 May 2023
   * Additional Tabs Code 
   */
  async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length)) {
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

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRODUCT_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRODUCT_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRODUCT_TAB_LAYOUT}`, JSON.stringify(response));
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
  private getUOMTypes() {
    return new Promise((resolve, reject) => {
      this.showUOMLoader = true;
      let storageKey = LocalStorageKey.UOM_TypeKey;
      let localUOMTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (!localUOMTypes) {
        // get datasource details
        this._dataSourceService.getDataSourceDataByCode(DataSources.UOM_TYPES).then(response => {
          this.showUOMLoader = false;
          if (response) {
            let responseList = response as [];
            let filteredGroups = Array.from(new Set(responseList.map((item: any = []) => item.group)));
            filteredGroups.forEach(groupLabel => {
              let items = responseList.filter((obj: any) => { return obj.group === groupLabel }).map((s: any) => { return { label: s.label, value: s.value, groupLabel:groupLabel } });
              this.groupedUOMTypes.push(
                {
                  label: groupLabel,
                  items: items as []
                }
              );
            });
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.groupedUOMTypes));
          }
          resolve(null);
        }, (error) => {
          this.showUOMLoader = false;
          this._commonHelper.showToastrError(error.message);
          reject(null);
        }).catch(() => {
          resolve(null);
        });
      }
      else {
        this.showUOMLoader = false;
        this.groupedUOMTypes = localUOMTypes;
        resolve(null);
      }
    });
  }

  getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isEntityWorkflow && entityWorkflowId > 0) {
        //storage key
        let storageKey = `${LocalStorageKey.ProductWorkflowDetailsKey}_${entityWorkflowId}`;
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
    this.modalRef.componentInstance.relatedEntityId = this.productId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Products;
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
          this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
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

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
                );
                this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.WORKTASK_DISMISS_DIALOG')));
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

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.productId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList?.filter(x => x.value != 0)?.filter(x => x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCasePopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Products;
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
        this.optionsForPopupDialog.size = 'md';

        this._confirmationDialogService.confirm('CASES.LIST.MESSAGE_CONFIRM_CASE_DELETE', null, null, this.optionsForPopupDialog)
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
        this.casesRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == this.entityTypeId));
        resolve(null);
      }
    });
  }

  private prepareParamsForWorkflows(entityTypeId: number): any[] {
    return [
      { name: 'EntityTypeID', type: 'int', value: entityTypeId }
    ]
  }

  private getWorktaskWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.WorkTasks}`;

      this.worktaskWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.worktaskWorkflowList == null) {
        const params = this.prepareParamsForWorkflows(Entity.WorkTasks);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.worktaskWorkflowList = response;
            this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
        this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
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
        const params = this.prepareParamsForWorkflows(Entity.Cases);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.casesWorkflowList = response;
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_CASES.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_CASES.FILTER_OPTION_TEXT_WORKFLOW') });
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

  private fillNavTabsNameHideAction() {
    this.tabsNameHideAction = ['navWorkTasks', 'navRelatedCases', 'navCategories', 'navSkus', 'navVisuals', 'navContacts', 'navAttachment', 'navProducts', 'navHistory', 'additionalTabs', 'navDocuments'];
  }

  onDeleteProductClick(productID) {
    let params = {
      "entityId": productID,
      "entityTypeId": Entity.Products
    }
    this._commonHelper.showLoader();
    this._commonService.getEntityReferences(params).then((res: any) => {
      this._commonHelper.hideLoader();
      if (res != undefined && res.length != 0) {
        if (this._modalService.hasOpenModals()) {
          return;
        }
        this.optionsForPopupDialog.size = "lg";
        this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.entityList = res;
        this.modalRef.componentInstance.entityId = productID;
        this.modalRef.componentInstance.entityTypeId = Entity.Products;
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData("PRODUCTS.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL");
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData("PRODUCTS.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE");
      } else {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm("PRODUCTS.DETAIL.MESSAGE_CONFIRM_DELETE", null, null, this.optionsForPopupDialog).then((confirmed) => {
          if (confirmed) {
            this.deleteProduct(productID);
          }
        });
        (error: any) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        };
      }
    });
  }

  private deleteProduct(productID) {
    this._commonHelper.showLoader();
    this._productService.deleteProduct(productID).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.MESSAGE_PRODUCT_DELETED')
      );
      // Redirect Product Listing Page.
      this._router.navigateByUrl('/products/list');
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  onStatusChange(productSku) {
    if (productSku.isActive) {
      const params = {
        EntityTypeId: Entity.ProductSkus,
        EntityId: productSku.id
      };
      this._commonHelper.showLoader();
      this._commonService.getEntityReferences(params).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response != undefined && response.length != 0) {
          if (this._modalService.hasOpenModals()) {
            return;
          }
          this.optionsForPopupDialog.size = "lg";
          this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityList = response;
          this.modalRef.componentInstance.entityId = productSku.id;
          this.modalRef.componentInstance.entityTypeId = Entity.ProductSkus;
          this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.ENTITY_PRODUCTSKUS_REFERENCE_LIST_DIALOG.DIALOG_DEACTIVE_LABEL');
          this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.ENTITY_PRODUCTSKUS_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
          this.modalRef.componentInstance.action = Actions.InActive;
          this.modalRef.result.then((response: any) => {
            if (response) {
              this.changeProductSkuStatusMessage(productSku.id, productSku.isActive, true)
            }
          });
        }
        else {
          this.changeProductSkuStatusMessage(productSku.id, productSku.isActive, false);
          this.optionsForPopupDialog.size = "md";
        }
      });
    }
    else {
      this.isProductActive(productSku.productID).then((res) => {
        if (res) {
          this.changeProductSkuStatusMessage(productSku.id, productSku.isActive, false)
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }

  private changeProductSkuStatusMessage(id, status, isconfirmed) {
    this.optionsForPopupDialog.size = "md";
    let messageText = status ? 'PRODUCTS.DETAIL.ENTITY_PRODUCTSKUS_CONFIRM_DIALOG.MESSAGE_CONFIRM_INACTIVE' : 'PRODUCTS.DETAIL.ENTITY_PRODUCTSKUS_CONFIRM_DIALOG.MESSAGE_CONFIRM_ACTIVE';
    let successText = status ? 'PRODUCTS.DETAIL.ENTITY_PRODUCTSKUS_CONFIRM_DIALOG.MESSAGE_PRODUCTSKUS_INACTIVATED' : 'PRODUCTS.DETAIL.ENTITY_PRODUCTSKUS_CONFIRM_DIALOG.MESSAGE_PRODUCTSKUS_ACTIVATED';

    if (isconfirmed) {
      this.changeProductSkuStatus(id, status, successText);
    } else {
      this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
        if (confirmed) {
          this.changeProductSkuStatus(id, status, successText);
        }
      });
    }
  }

  private changeProductSkuStatus(id: any, status: any, successText: string) {
    this._commonHelper.showLoader();
    this._productService.changeSkuStatus(id, !status).then((response: any[]) => {
      if (response) {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData(successText)
        );
      }
      this.refreshProductSkus = true;
      this._commonHelper.hideLoader();
    }, (error) => {
      this.refreshProductSkus = true;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private isProductActive(productId) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._productService.getProductById(productId).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if (response.isActive) {
            resolve(true);
          } else {
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.MESSAGE_PRODUCTSKUS_HAS_INACTIVE_PRODUCT'));
            resolve(false);
          }
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(true);
        });
    });
  }

  onProductStagePauseChanged(product: any, isPaused: boolean) {
    if (product.assignedTo !== this._loggedInUser.userId) {
      let message = "";
      if (product.assignedTo == null || product.assignedTo == "" || product.assignedTo == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.productStagePauseChangeList(product, isPaused);
          }
        });
    }
    else if (product.assignedTo == this._loggedInUser.userId) {
      this.productStagePauseChangeList(product, isPaused);
    }
  }  
  private productStagePauseChangeList(product, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: product.id,
      entityStageId: product.entityStageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: product.assignedTo,
      noteID: null
    };

    if (params.isPaused) {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = product.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.PAUSE_REASON_NOTE_SUBJECT', { stageName: product.stageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = product.entityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate) {
          params.noteID = noteDate.id;
          this.saveEntityStagePauseTransitionFromList(params, product);
        }
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: product.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.RESUME_NOTE_DESCRIPTION', { stageName: product.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransitionFromList(params, product);
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

  private saveEntityStagePauseTransitionFromList(params, product) {
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
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('PRODUCTS.MESSAGE_RESUME_SUCCESS'));
          product.isPaused = params.isPaused;
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