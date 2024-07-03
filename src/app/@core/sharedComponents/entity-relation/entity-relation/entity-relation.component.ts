import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonHelper } from '../../../common-helper';
import { EntityRelationComponentsModel, FormLayout } from '../../../sharedModels/entity-relation.model';
import { PagingParams } from '../../../sharedModels/paging-params.model';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Actions, DataSources, DynamicTableColumnType, Entity, LocalStorageKey, PublicTenantSettings, UserTypeID } from '../../../enum';
import { Table } from 'primeng/table';
import { ConfirmationDialogService } from '../../../sharedModules/confirmation-dialog/confirmation-dialog.service';
import { Router } from '@angular/router';
import { AccountAddComponent } from '../../../../pages/accounts/account-add/account-add.component';
import { ContactAddComponent } from '../../../../pages/contacts/contact-add/contact-add.component';
import { ProductAddComponent } from '../../../../pages/products/product-add/product-add.component';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AddEntityRelationComponent } from '../add-entity-relation/add-entity-relation.component';
import { EntityRelationService } from '../../../sharedServices/entity-relation.service';
import { Dropdown } from 'primeng/dropdown';
import { FileSignedUrlService } from '../../../sharedServices/file-signed-url.service';
import { CommonService } from '../../../sharedServices/common.service';
import { SettingsService } from '../../../../pages/settings/settings.service';
import { ProductskuAddComponent } from '../../../../pages/products/productsku/productsku-add/productsku-add.component';


@Component({
  selector: 'ngx-entity-relation',
  templateUrl: './entity-relation.component.html',
  styleUrls: ['./entity-relation.component.scss']
})
export class EntityRelationComponent implements OnInit, OnDestroy {

  @ViewChild('drpSearchToEntity') drpSearchToEntity : Dropdown;
  /**
   * Entity Relation Component Detail
   */
  @Input() entityRelationComponent: EntityRelationComponentsModel;

  /**
   * EntityId from Component(Parent) is called
   */
  @Input() entityId: number;

  /**
   * Entity Type Id of Entity
   */
  @Input() entityTypeId: number;

  /**
   * Should show search or not
   */
  @Input() enableSearch: boolean = true;

  /**
   * If Entity is Closed, Completed, InActive Or Paused
   */
  @Input() isShowToEntityAndAddEntity: boolean;

  //#region  PRIVATE VARIABLE
  showLoadingBar: number = 0;

  @ViewChild('erPTable') private pTable: Table;

  userTypeID = UserTypeID;

  // pagination and searching
  searchString: string;
  paginationEnabled: boolean = true;
  pagingParams: PagingParams;
  totalRecords: number = 0;
  start: number = 0;
  end: number = 0;
  first: number = 0;
  totalPages: number = 0;

  // subscriptions
  private searchValueChanged: Subject<string> = new Subject<string>();
  private searchBoxSubscription: Subscription;

  values: any[] = [];

  isShowLoaderForDropDown: boolean = true;
  toEntityValues: any[] = [];
  selectedExistingToEntity: any;

  dropDownPlaceHolder: string;
  relatedEntityConfigureName: string;
  relatedEntityName: string;

  private modalRef: NgbModalRef | null;

  hasAddPermission: boolean;

  entityRelationTypes: any[] = []

  customFields: any[] = [];

  imageTypeColumns: any[] = [];

  entityWorkflows: any[] = [];
  entityRecordTypes: any[] = [];

  currencySymbol: any;
  //#endregion

  constructor(public _commonHelper: CommonHelper, private _dataSourceService: DatasourceService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _router: Router, private _modalService: NgbModal,
    private _entityRelationService: EntityRelationService,
    private _fileSignedUrlService: FileSignedUrlService,
    private _commonService: CommonService,
    private _settingsService: SettingsService) {

    this.initializePagination();
    this.subscribeSearchBoxEvent();

    this._router.routeReuseStrategy.shouldReuseRoute = function () { return false; };
  }

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.getEntityRelationTypes();
    this.getCustomFields();
    this.mapColumnSettings();
    this.getImageColumnFields();
    this.getDataFromSource();
    this.getDataForToEntity();
    this.generateLanguageTranslation();
    this.getWorkflowListByEntityTypeID();
    this.getEntityRecordTypes();
  }

  ngOnDestroy(): void {
    if (this.searchBoxSubscription) {
      this.searchBoxSubscription.unsubscribe();
    }
  }

  onFilter(e: any) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.searchString = e.filter.trim();
        this.getDataForToEntity(e.filter.trim());
      }
    } else {
      this.searchString = '';
      this.getDataForToEntity();
    }
  }

  search(val: string): void {
    this.searchValueChanged.next(val || '');
  }

  get dynamicTableColumnType(): typeof DynamicTableColumnType {
    return DynamicTableColumnType;
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.getDataFromSource();
  }

  changeOrder(column: any): void {
    if (column.sortable) {
      this.pagingParams.sortOrder = this.pTable.sortOrder == 1 ? 'ASC' : 'DESC';
      this.pagingParams.sortColumn = column.field;
      this.getDataFromSource();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.getDataFromSource();
    } else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    } else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetPaginator() {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return;
    }
    this.getDataFromSource();
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prev() {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0
      ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return;
    }
    this.getDataFromSource();
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  next() {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages
      ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return;
    }
    this.getDataFromSource();
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onActionClick(recordId: number, type: string, rowData: any) {
    if (recordId && recordId > 0) {
      if (type.toLowerCase() === 'delete') {
        this.deleteRecord(recordId);
      } else if (type.toLowerCase() == 'edit') {
        this.editRecord(recordId);
      }
    }
  }

  showHideColumns() {
    if (this.entityRelationComponent.columnSettings && this.entityRelationComponent.columnSettings?.fields && this.entityRelationComponent.columnSettings?.fields.length > 0) {
      let firstData = null;

      if (this.values && this.values.length > 0) {
        firstData = this.values[0];
      }

      this.entityRelationComponent.columnSettings?.fields.forEach(column => {
        if (!column.hasOwnProperty("isVisible") || column.isVisible) {
          column.isVisible = true;
        }

        if (firstData) {
          if ((column.visibilityExpression || "") && firstData.hasOwnProperty(column.visibilityExpression) && firstData[column.visibilityExpression] === false) {
            column.isVisible = false;
          } else {
            column.isVisible = true;
          }
        }
      });
    }
  }

  addRelatedTo() {

    let optionsForPopupDialog: NgbModalOptions = this.getOptionForPopupOptions();

    if (this.entityRelationTypes.length == 1) {
      this.customFields = this.customFields.filter(x => x.entityRecordTypeID == this.entityRelationTypes[0].value);
    }

    if (this.selectedExistingToEntity) {
      if (this.entityRelationTypes.length > 1 || (this.customFields && this.customFields.length > 0)) {
        this.openEntityRelation(optionsForPopupDialog, Number(this.selectedExistingToEntity));
      } else if (this.entityRelationComponent.formLayoutSettings.panelGroup && this.entityRelationComponent.formLayoutSettings.panelGroup.length > 0) {
        this.openEntityRelation(optionsForPopupDialog, Number(this.selectedExistingToEntity));
      } else {
        this.saveEntityRelation(Number(this.selectedExistingToEntity)).then(() => {
          this.selectedExistingToEntity = null;
          this.getDataForToEntity(this.searchString);
          this.getDataFromSource();
        }, (error) => {
          this.getTranslateErrorMessage(error);
        });
      }
    } else {

      this.openEntityDialog(optionsForPopupDialog);

      this.modalRef.result.then((response: any) => {
        if (response) {
          if (this.entityRelationTypes.length > 1 || (this.customFields && this.customFields.length > 0)) {
            this.openEntityRelation(optionsForPopupDialog, Number(response['id']));
          } else if (this.entityRelationComponent.formLayoutSettings.panelGroup && this.entityRelationComponent.formLayoutSettings.panelGroup.length > 0) {
            this.openEntityRelation(optionsForPopupDialog, Number(response['id']));
          } else {
            this.saveEntityRelation(Number(response['id'])).then(() => {
              this.selectedExistingToEntity = null;
              this.getDataForToEntity(this.searchString);
              this.getDataFromSource();
            }, (error) => {
              this.getTranslateErrorMessage(error);
            });
          }
        }
      });
    }
  }

  
  //#region  Private Methods

  private initializePagination(): void {
    this.pagingParams = new PagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private subscribeSearchBoxEvent(): void {

    if (!this.enableSearch) return;

    this.searchBoxSubscription = this.searchValueChanged
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.pagingParams.pageNo = 1;
        this.pagingParams.searchString = val;
        this.getDataFromSource();
      });
  }

  private prepareDataSourceParamsForList(): any[] {
    return [
      { name: 'EntityTypeID', type: 'int', value: this.entityTypeId },
      { name: 'EntityID', type: 'int', value: this.entityId },
      { name: 'SearchString', type: 'string', value: this.pagingParams.searchString },
      { name: 'PageNo', type: 'int', value: this.pagingParams.pageNo },
      { name: 'PageSize', type: 'int', value: this.pagingParams.pageSize },
      { name: 'SortColumn', type: 'string', value: this.pagingParams.sortColumn },
      { name: 'SortOrder', type: 'string', value: this.pagingParams.sortOrder }
    ];
  }

  private prepareDataSourceParamsForDelete(relationId: number): any[] {
    return [
      { name: 'EntityRelationID', type: 'int', value: relationId }
    ];
  }

  private prepareDataSourceParamsForToEntity(searchString?: string): any[] {
    return [
      { name: 'FromEntityTypeID', type: 'int', value: this.entityRelationComponent.fromEntityTypeID },
      { name: 'ToTenantID', type: 'int', value: this.entityRelationComponent.toTenantID },
      { name: 'ToEntityTypeID', type: 'int', value: this.entityRelationComponent.toEntityTypeID },
      { name: 'EntityID', type: 'int', value: this.entityId },
      { name: 'IsReverseRelation', type: 'bit', value: this.entityRelationComponent.isReverseRelation },
      { name: 'SearchString', type: 'string', value: searchString },
    ];
  }

  private getDataFromSource() {
    this.showLoadingPanel();
    this._dataSourceService.getDataSourceDataByIDAndParams(this.entityRelationComponent.listDataSourceID, this.prepareDataSourceParamsForList())
      .then((response: Array<any>) => {
        this.values = response || [];
        this.refreshPagination();
        this.showHideColumns();
        this.hideLoadingPanel();
        this.setSignedImageUrl();
      }, (error) => {
        this.hideLoadingPanel();
        this._commonHelper.showToastrError(error.message);
      });
  }

  private getDataForToEntity(searchString?: string) {

    if (this.entityRelationComponent.toEntityTypeDatasourceID && this.entityRelationComponent.toEntityTypeDatasourceID == 0) return;

    this.isShowLoaderForDropDown = true;
    this._dataSourceService.getDataSourceDataByIDAndParams(this.entityRelationComponent.toEntityTypeDatasourceID, this.prepareDataSourceParamsForToEntity(searchString))
      .then((response: Array<any>) => {
        this.toEntityValues = response || [];
        this.isShowLoaderForDropDown = false;

        if (this.searchString && this.drpSearchToEntity && !this.drpSearchToEntity.filterValue) {
         this.drpSearchToEntity.filterValue = this.searchString.trim();
        }

      }, (error) => {
        this.isShowLoaderForDropDown = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private refreshPagination(): void {
    this.totalRecords = this.values && this.values.length > 0
      ? this.values[0][this.entityRelationComponent.columnSettings['totalRecordsKey']] : 0;
    this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
    this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
    this.start = this.end == this.totalRecords ? (this.totalRecords - this.values.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
  }

  private deleteRecord(recordId: number) {
    const optionsForPopupDialog: any = {
      size: 'md',
      centered: false,
      backdrop: 'static',
      keyboard: false
    };
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.TABLE.DELETE_CONFIRMATION_DIALOG_TEXT'), null, null, optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this.showLoadingPanel();
          this._dataSourceService.getDataSourceDataByIDAndParams(this.entityRelationComponent.deleteDataSourceID, this.prepareDataSourceParamsForDelete(recordId))
            .then((response: Array<any>) => {
              if (response[0]['isSuccess']) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.TABLE.MESSAGE_DELETE_SUCCESS', { entityName: this.relatedEntityConfigureName }));
                this.getDataForToEntity(this.searchString);
              } else {
                this._commonHelper.showToastrError(response[0]['message']);
              }
              this.totalRecords = this.totalRecords - 1;
              this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
              this.hideLoadingPanel();
              this.getDataFromSource();
            }, (error) => {
              this.hideLoadingPanel();
              this._commonHelper.showToastrError(error.message);
            });
        }
      });
  }

  private openEntityDialog(optionsForPopupDialog: NgbModalOptions) {

    const toEntityTypeId = this.entityRelationComponent.isReverseRelation ? this.entityRelationComponent.fromEntityTypeID : this.entityRelationComponent.toEntityTypeID;
    optionsForPopupDialog.size = this.entityRelationComponent.formLayoutSettings.optionsForParentFormDialog?.size ?? 'md';

    if (toEntityTypeId == Entity.Accounts) {
      this.modalRef = this._modalService.open(AccountAddComponent, optionsForPopupDialog);
      this.modalRef.componentInstance.isFromSameEntity = false;
      this.modalRef.componentInstance.isShowAssignedTo = true;
    } else if (toEntityTypeId == Entity.Contacts) {
      this.modalRef = this._modalService.open(ContactAddComponent, optionsForPopupDialog);
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.isFromSameEntity = false;
      this.modalRef.componentInstance.isShowAssignTo  = true;
    } else if (toEntityTypeId == Entity.Products) {
      this.modalRef = this._modalService.open(ProductAddComponent, optionsForPopupDialog);
      this.modalRef.componentInstance.isShowAccountProductControls = false;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.isShowAssignTo  = true;
      this.modalRef.componentInstance.isFromSameEntity = false;
    } else if (toEntityTypeId == Entity.ProductSkus) {
      this.modalRef = this._modalService.open(ProductskuAddComponent, optionsForPopupDialog);
      this.modalRef.componentInstance.isShowProductControl = true;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.isFromSameEntity = false;
    }

    this.modalRef.componentInstance.workflows = this.entityWorkflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.entityRecordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowWorkflow = true;
  }

  private openEntityRelation(optionsForPopupDialog: NgbModalOptions, toEntityId: number) {

    if (this.entityRelationComponent.formLayoutSettings) {
      if (this.entityRelationComponent.formLayoutSettings.optionsForFormDialog) {
        optionsForPopupDialog.size = this.entityRelationComponent.formLayoutSettings.optionsForFormDialog.size ?? 'md';
      }
    }

    this.modalRef = this._modalService.open(AddEntityRelationComponent, optionsForPopupDialog);
    this.modalRef.componentInstance.entityRelationComponent = this.entityRelationComponent;
    this.modalRef.componentInstance.fromEntityId = !this.entityRelationComponent.isReverseRelation ? this.entityId : toEntityId;
    this.modalRef.componentInstance.toEntityId = !this.entityRelationComponent.isReverseRelation ? toEntityId: this.entityId ;
    this.modalRef.componentInstance.entityRelationTypes = this.entityRelationTypes;
    this.modalRef.componentInstance.customFields = this.customFields;
    this.modalRef.componentInstance.action = Actions.Add;

    this.modalRef.componentInstance.OnSubmitForm.subscribe((payload: any) => {
      if (payload) {
        this.saveEntityRelation(toEntityId, payload).then(res => {
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.ADD_RELATION_DIALOG.MESSAGE_ADD_SUCCESS', { entityName :  this.relatedEntityConfigureName}));
          this.modalRef.close();
          this.selectedExistingToEntity = null;
          this.getDataForToEntity(this.searchString);
          this.getDataFromSource();
        }, (error) => {
          this.getTranslateErrorMessage(error);
          if (error?.messageCode?.toLowerCase() !== 'staticmessage' && error?.messageCode?.toLowerCase() !== 'entityrelation.alreadyexists') {
            this.modalRef.close();
          }
        });
      }
    });
  }

  private editRecord(recordId: number) {

    let optionsForPopupDialog: NgbModalOptions = this.getOptionForPopupOptions();

    if (this.entityRelationComponent.formLayoutSettings) {
      if (this.entityRelationComponent.formLayoutSettings.optionsForFormDialog) {
        optionsForPopupDialog.size = this.entityRelationComponent.formLayoutSettings.optionsForFormDialog.size ?? 'md';
      }
    }

    this.modalRef = this._modalService.open(AddEntityRelationComponent, optionsForPopupDialog);
    this.modalRef.componentInstance.entityRelationComponent = this.entityRelationComponent;
    this.modalRef.componentInstance.entityRelationTypes = this.entityRelationTypes;
    this.modalRef.componentInstance.action = Actions.Edit;
    this.modalRef.componentInstance.customFields = this.customFields;
    this.modalRef.componentInstance.entityRelationId = recordId;

    this.modalRef.componentInstance.OnSubmitForm.subscribe((payload: any) => {
      if (payload) {
        this.saveEntityRelation(0, payload).then(res => {
          this.modalRef.close();
          if (res) {            
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.ADD_RELATION_DIALOG.MESSAGE_UPDATE_SUCCESS', { entityName :  this.relatedEntityConfigureName}));
            this.selectedExistingToEntity = null;
            this.getDataForToEntity(this.searchString);
            this.getDataFromSource();
          }
        }, (error) => {
          this.getTranslateErrorMessage(error);
          if (error?.messageCode?.toLowerCase() !== 'staticmessage' && error?.messageCode?.toLowerCase() !== 'entityrelation.alreadyexists') {
            this.modalRef.close();
          }
        });
      }
    });
  }

  private mapColumnSettings() {
    this.entityRelationComponent.columnSettings = this._commonHelper.tryParseJson(this.entityRelationComponent.listColumnSettings);
    this.entityRelationComponent.formLayoutSettings = this._commonHelper.tryParseJson(this.entityRelationComponent.formColumnSettings) as FormLayout;

    if (this.entityRelationComponent.formLayoutSettings && this.entityRelationComponent.formLayoutSettings.permission) {
      this.hasAddPermission = this._commonHelper.havePermission(this.entityRelationComponent.formLayoutSettings.permission.addPermission ?? '');
    }
  }

  private generateLanguageTranslation() {
    this.relatedEntityName = String(Entity[this.entityRelationComponent.isReverseRelation ? this.entityRelationComponent.fromEntityTypeID : this.entityRelationComponent.toEntityTypeID]);
    this.relatedEntityConfigureName = this._commonHelper.getConfiguredEntityName('{{' + Entity[this.entityRelationComponent.isReverseRelation ? this.entityRelationComponent.fromEntityTypeID : this.entityRelationComponent.toEntityTypeID] + '_l}}');
    this.dropDownPlaceHolder = this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.TABLE.DROPDOWN_PLACEHOLDER', { entityName: this.relatedEntityConfigureName });
  }

  private getOptionForPopupOptions(): NgbModalOptions {
    const popupOptions: NgbModalOptions = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false,
      animation: true
    };

    return popupOptions;
  }

  private getEntityRelationTypes() {

    const payload = {
      'fromEntityTypeId': this.entityRelationComponent.fromEntityTypeID,
      'toEntityTypeId': this.entityRelationComponent.toEntityTypeID,
      'isReverseRelation': this.entityRelationComponent.isReverseRelation
    };

    this.showLoadingPanel();
    this._entityRelationService.getEntityRelationTypes(payload)
      .then((response: Array<any>) => {
        this.entityRelationTypes = response || [];
        if (this.entityRelationTypes.length > 0) {
          this.entityRelationTypes = this.entityRelationTypes.map((x: any) => { return { 'label': x.name, 'value': x.id } });
        }
        this.hideLoadingPanel();
      }, (error) => {
        this.hideLoadingPanel();
        this.getTranslateErrorMessage(error);
      });
  }

  private getCustomFields(): void {
    const param = { 'entityTypeId': Entity.EntityRelation };
    this.showLoadingPanel();
    this._entityRelationService.getEntityRelationCustomField(param).then((response: any) => {
      if (response) {
        this.customFields = response as any[] || [];
      }
      this.hideLoadingPanel();
    }, () => {
      this.hideLoadingPanel();
    });
  }

  private saveEntityRelation(toEntityId: number, payload?: any) {

    return new Promise((resolve, reject) => {
      let fields = {};

      if (!payload?.fields) {
        fields = {
          id: 0,
          fromTenantID: this.entityRelationComponent.tenantID,
          toTenantID: this.entityRelationComponent.toTenantID,
          entityRelationTypeID: this.entityRelationTypes[0].value,
          fromEntityID: !this.entityRelationComponent.isReverseRelation ? this.entityId : toEntityId,
          toEntityID: !this.entityRelationComponent.isReverseRelation ? toEntityId: this.entityId ,
          fromEntityTypeID: this.entityRelationComponent.fromEntityTypeID,
          toEntityTypeID: this.entityRelationComponent.toEntityTypeID,
          isReverseRelation: this.entityRelationComponent.isReverseRelation
        };
      } else {
        payload.fields.isReverseRelation = this.entityRelationComponent.isReverseRelation;
        fields = payload?.fields;
      }

      fields = {
        Fields: fields,
        CustomFieldsJson: payload?.customFields
      };

      this._commonHelper.showLoader();
      this._entityRelationService.saveEntityRelation(fields).then((res) => {
        if (res) {
          this._commonHelper.hideLoader();
          resolve(res);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        reject(error);
      });

    });
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'entityrelation.alreadyexists') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.ENTITYRELATION_ALREADYEXISTS',
          {
            relationName: error.data.relationName,
            fromEntityName: error.data.fromEntityName,
            toEntityName: error.data.toEntityName
          }));
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  private showLoadingPanel() {
    this.showLoadingBar++;
  }

  private hideLoadingPanel() {
    this.showLoadingBar--;
  }

  private getImageColumnFields()  {
    this.imageTypeColumns = this.entityRelationComponent.columnSettings.fields.filter((field : any) => field.type === 'person');
    this.imageTypeColumns.forEach((x : any) => {
      if (x.person) {
        x.person['imageSignedUrl'] = x.person.image + 'SignedUrl';
      }
    });
  }

  private setSignedImageUrl() {
    this.imageTypeColumns.forEach((x : any) => {
      if (x.person) {
        this._fileSignedUrlService.getFileSingedUrl(this.values, x.person.image, x.person.imageSignedUrl, Entity.Users);
      }
    });
  }

  private getWorkflowListByEntityTypeID() {
    return new Promise((resolve, reject) => {
      //storage key

      const params = this.prepareParamsWorkflows(!this.entityRelationComponent.isReverseRelation ? this.entityRelationComponent.toEntityTypeID : this.entityRelationComponent.fromEntityTypeID);
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
        if (response) {
          this.entityWorkflows = response;
          this.entityWorkflows.sort((a, b) => a.value - b.value);
          resolve(this.entityWorkflows);
        }
        resolve(null);
      },
        (error) => {
          this.getTranslateErrorMessage(error);
          reject(null);
        });

    });
  }

  private prepareParamsWorkflows(entityTypeId: number): any[] {
    return [
      { name: 'EntityTypeID', type: 'int', value: entityTypeId }
    ]
  }

  //get Entity Record Type
  private getEntityRecordTypes(): Promise<any> {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    return new Promise((resolve, reject) => {
      const entityTypeID = !this.entityRelationComponent.isReverseRelation ? this.entityRelationComponent.toEntityTypeID : this.entityRelationComponent.fromEntityTypeID;
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.entityRecordTypes = response?.filter(x => x.entityTypeID == entityTypeID).map(x => ({ 'label': x.name, 'value': x.id }));
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.entityRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == entityTypeID).map(x => ({ 'label': x.name, 'value': x.id }));
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
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      });
    }
    else {
      this.currencySymbol = currencySymbol;
    }
  }
  //#endregion
}
