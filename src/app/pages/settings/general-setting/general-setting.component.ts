import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { SettingsService } from '../settings.service';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper'
import { AccountsService } from '../../accounts/accounts.service';
import { ActivityService } from '../../../@core/sharedComponents/common-activity-section/activity.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { CommunicationService } from '../../../@core/sharedServices/communication.service';
import { ContactsService } from '../../contacts/contacts.service';
import { DashboardService } from '../../../@core/sharedServices/dashboard.service';
import { DocumentService } from '../../../@core/sharedComponents/documents/document.service';
import { EntityrequestService } from '../../../@core/sharedServices/entityrequest.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ProductsService } from '../../products/products.service';
import { ReportsService } from '../../reports/reports.service';
import { UsersService } from '../../usermanagement/users/users.service';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { FieldTypesFromReferenceType } from '../../../@core/enum';
import { OrdersService } from '../../orders/orders.service';
import { WorkflowautomationService } from '../../workflowautomation/workflowautomation.service';
import { CampaignsService } from '../../campaigns/campaigns.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { PricebookService } from '../../pricebooks/pricebook.service';
import { NewslettersService } from '../../newsletters/newsletters.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { EntityRelationService } from '../../../@core/sharedServices/entity-relation.service';
import { CasesService } from '../../cases/cases.service';
import { EntityNotificationService } from '../../../@core/sharedComponents/entity-notification/services/entity-notification.service';

@Component({
  selector: 'ngx-general-setting',
  templateUrl: './general-setting.component.html',
  styleUrls: ['./general-setting.component.scss']
})
export class GeneralSettingComponent implements OnInit {

  tenantSettingForm: UntypedFormGroup[] = [];

  tenantSettingGroupsArray: any[];
  tenantSettingsArray: any[];

  isLoading: boolean = false;
  submitted = false;

  //user permission
  isGeneralSettings: boolean = false;

  fieldTypesFromReferenceType = FieldTypesFromReferenceType;

  constructor(private _formBuilder: UntypedFormBuilder,
    private _commonHelper: CommonHelper,
    private _accountsService: AccountsService,
    private _activityService: ActivityService,
    private _campaignsService: CampaignsService,
    private _commonService: CommonService,
    private _communicationService: CommunicationService,
    private _contactsService: ContactsService,
    private _dashboardService: DashboardService,
    private _dataSourceService: DatasourceService,
    private _documentService: DocumentService,
    private _entityrequestService: EntityrequestService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _ordersService: OrdersService,
    private _opportunitiesService: OpportunitiesService,
    private _priceBooksService: PricebookService,
    private _newslettersService: NewslettersService,
    private _productsService: ProductsService,
    private _reportsService: ReportsService,
    private _usersService: UsersService,
    private _workTasksService: WorkTasksService,
    private settingsService: SettingsService,
    private _worfkflowAutomationService: WorkflowautomationService,
    private _settingsService: SettingsService,
    private _entityRelationService: EntityRelationService,
    private _casesService: CasesService,
    private _entityNotificationService: EntityNotificationService) {
    //init permissions
    this.isGeneralSettings = this._commonHelper.havePermission(enumPermissions.GeneralSettings);
  }

  ngOnInit() {
    this.isLoading = true;
    this._commonHelper.showLoader();
    this.settingsService.getTenantSettings().then((response:any[] )=> {
      if (response != undefined) {
        this.tenantSettingsArray = response;
        let groups = new Set(this.tenantSettingsArray.map(item => item['groupName']));
        this.tenantSettingGroupsArray = [];
        let index = 0;
        groups.forEach((grp) => {
          this.tenantSettingGroupsArray.push({
            groupName: grp,
            values: this.tenantSettingsArray.filter(i => i['groupName'] === grp)
          });
          this.tenantSettingForm[index] = this._formBuilder.group({});
          this.tenantSettingForm[index] = this.createControl(this.tenantSettingGroupsArray[index]['values']);
          index++;
        });
        this.isLoading = false;
      }
      this.isLoading = false;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.isLoading = false;
      });
  }

  createControl(fields) {
    const group = this._formBuilder.group({});

    const control = this._formBuilder.control(fields[0]['groupName']);
    group.addControl('groupName', control);
    fields.forEach(field => {
      if (field.fieldType == this.fieldTypesFromReferenceType.MULTISELECT && field.dataSource ? field.dataSource.length > 0 : false) {
        let selectedValues: any[] = [];
        if (field.dataSource.length > 0) {
          if (field.value != "") {
            var values = field.value.split(',') as [];
            if (values.length > 0) {
              values.forEach((_value) => {
                const obj = field.dataSource.find(x => x.value == _value)
                selectedValues.push(obj.value);
              });
            }
          }

          field.value = selectedValues;
        }
      }

      let control;
      if (field.settingsJson && JSON.parse(field.settingsJson)) {
        let settingsJson = JSON.parse(field.settingsJson);
        field.min = +settingsJson.min;
        field.max = +settingsJson.max;
        field.minValMessage = settingsJson.minValMessage;
        field.maxValMessage = settingsJson.maxValMessage;
      }
      if (field.isRequired) {
        if (field.fieldType == this.fieldTypesFromReferenceType.NUMBER.toString() && field?.min >= 0 && field?.max) {
          control = this._formBuilder.control(field.value, Validators.compose([Validators.required,
            Validators.min(field.min),
            Validators.max(field.max)
            ]));
        }
        else {
          control = this._formBuilder.control(field.value, Validators.compose([Validators.required]));
        }
        group.addControl(field.code, control);
      }
      else {
        if (field.fieldType == this.fieldTypesFromReferenceType.NUMBER.toString() && field?.min >= 0 && field?.max) {
          control = this._formBuilder.control(field.value, Validators.compose([
            Validators.min(field.min),
            Validators.max(field.max)
            ]));
        }
        else {
          control = this._formBuilder.control(field.value);
        }
        group.addControl(field.code, control);
      }
      //SDC-1914 General Settings Enhancements
      if (field.isDisplayTextRequired) {
        control = this._formBuilder.control(field.displayText, Validators.compose([Validators.maxLength(500)]));
        group.addControl(field.code + "_DT", control);
      }
    });
    
    return group;
  }

  saveForm(formData: UntypedFormGroup) {
    this.submitted = true;
    if (formData.invalid) {
      return;
    }
    this._commonHelper.showLoader();
    let saveGroupName = formData.value.groupName;

    //convert to comma saperated string from object if there is dropdown
    for (const key in formData.value) {
      if (Array.isArray(formData.value[key])) {
        let strSelectedIds = '';
          formData.value[key].forEach(x => {
            strSelectedIds += x + ",";
          });
          strSelectedIds = strSelectedIds.substring(0, strSelectedIds.length - 1);
          formData.value[key] = strSelectedIds;
      }
    }

    this.settingsService.saveTenantSettings(formData.value).then(response => {
      this._commonHelper.hideLoader();
      if (response != undefined) {
        this.getAllWebAccessibleTenantSettingsWithValue();
        this.getAllWebAccessibleUserTenantSettingsWithValue();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('MENU.SETTINGS.GENERALSETTING.MESSAGE_SETTINGS_SAVE', { groupName: saveGroupName}) );
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, saveGroupName);
      });
  }

  getTranslateErrorMessage(error,  interpolateParams?: Object) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData(
                    'MENU.SETTINGS.GENERALSETTING.' + error.messageCode.replace('.', '_').toUpperCase(),
                    { groupName: interpolateParams}
                  )
      );
    }
  }

  onClearCache() {
    this._commonHelper.showLoader();
    Promise.all([
      this._accountsService.clearCache(),
      this._activityService.clearCache(),
      this._campaignsService.clearCache(),
      this._commonService.clearCache(),
      this._communicationService.clearCache(),
      this._contactsService.clearCache(),
      this._dashboardService.clearCache(),
      this._dataSourceService.clearCache(),
      this._documentService.clearCache(),
      this._entityrequestService.clearCache(),
      this._workflowmanagementService.clearCache(),
      this._ordersService.clearCache(),
      this._productsService.clearCache(),
      this._reportsService.clearCache(),
      this._usersService.clearCache(),
      this._workTasksService.clearCache(),
      this._opportunitiesService.clearCache(),
      this._newslettersService.clearCache(),
      this._priceBooksService.clearCache(),
      this._entityRelationService.clearCache(),
      this._casesService.clearCache(),
      this._entityNotificationService.clearCache(),
      this._worfkflowAutomationService.clearCacheForApService(),
      this._worfkflowAutomationService.clearCacheForApTaskCompletion(),
      this._worfkflowAutomationService.clearCacheForApSendEmail(),
      this._worfkflowAutomationService.clearCacheForApSendSms(),
      this._worfkflowAutomationService.clearCacheForApEntityFieldChange(),
      this._worfkflowAutomationService.clearCacheForApTagAdd(),
      this._worfkflowAutomationService.clearCacheForEhStageMove(),
      this._worfkflowAutomationService.clearCacheForEhTagHandler(),
      this._worfkflowAutomationService.clearCacheForEhTaskCompletionHandler(),
      this._worfkflowAutomationService.clearCacheForEhTaskCompletionHandler(),
      this._worfkflowAutomationService.clearCacheForEhAddChangeDropEntity(),
      this._worfkflowAutomationService.clearCacheForApCreateEntity()
    ]).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('MENU.SETTINGS.GENERALSETTING.MESSAGE_SUCCESS_CLEARCACHE')
      );
    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('MENU.SETTINGS.GENERALSETTING.MESSAGE_ERROR_CLEARCACHE')
      );
    });
  }

  private getAllWebAccessibleTenantSettingsWithValue() {
    this._settingsService.getAllWebAccessibleTenantSettingsWithValue().then((response: any) => {
      if (response) {
        this._commonHelper.setTenantSettingInLocalStorage(response);
      }
    });
  }

  private getAllWebAccessibleUserTenantSettingsWithValue() {
    this._settingsService.getAllWebAccessibleUserTenantSettingsWithValue().then((response: any) => {
      if (response) {
        this._commonHelper.setUserTenantSettingInLocalStorage(response);
      }
    });
  }
}
