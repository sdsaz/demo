import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EntityRelationComponentsModel, FormControls, FormPanelGroup } from '../../../sharedModels/entity-relation.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, UntypedFormArray, UntypedFormControl, ValidatorFn, Validators } from '@angular/forms';
import { CommonHelper } from '../../../common-helper';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { Actions, LocalStorageKey, PublicTenantSettings } from '../../../enum';
import * as moment from 'moment';
import { Dropdown } from 'primeng/dropdown';
import { EntityRelationService } from '../../../sharedServices/entity-relation.service';
import { SettingsService } from '../../../../pages/settings/settings.service';
import { CommonService } from '../../../sharedServices/common.service';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'ngx-add-entity-relation',
  templateUrl: './add-entity-relation.component.html',
  styleUrls: ['./add-entity-relation.component.scss']
})
export class AddEntityRelationComponent implements OnInit {

  /**
   * Entity Relation Component Detail
   */
  @Input() entityRelationComponent: EntityRelationComponentsModel;

  /**
   * FromEntityId from Component(Parent) is called
   */
  @Input() fromEntityId: number;

  /**
   * ToEntityId new Entity is created
   */
  @Input() toEntityId: number;

  /**
   * Action Type : Add, Edit
   */
  @Input() action: Actions;

  /**
   * Entity Relation ID
   */
  @Input() entityRelationId: number;

  /**
   * Entity Relation Types 
   */
  @Input() entityRelationTypes: any[] = [];

  /**
   * Entity Relation Custom Fields 
   */
  @Input() customFields: any[] = [];

  /**
    It will give call back to the parent component
  */
  @Output() OnSubmitForm: EventEmitter<any> = new EventEmitter();

  //#region  Private variables

  submitted: boolean;

  formPanelGroup: FormPanelGroup[];
  formGroup: FormGroup;

  entityRelation: any = {};

  customFieldJsonData: any = {};
  customFieldControls: any[] = [];
  customDto: any = {};

  currencySymbol: any;
  countries: any= [];

  actionsEnum = Actions;
  //#endregion

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _dataSourceService: DatasourceService,
    private _entityRelationService: EntityRelationService,
    private _settingsService: SettingsService,
    private _commonService: CommonService) { }

  ngOnInit(): void {

    this.getCountries();
    this.getCurrencySymbol();
    this.formPanelGroup = this.entityRelationComponent.formLayoutSettings.panelGroup;
    this.createForm();

    if (this.action == Actions.Edit) {
      this.getEntityRelationData();
    } else if (this.entityRelationTypes.length == 1) {
      this.formGroup.controls['entityRelationTypeID'].patchValue(this.entityRelationTypes[0].value);
      if (this.customFields && this.customFields.length > 0) {
        this.prepareFormDataInJSON(this.entityRelationTypes[0].value);
        this.prepareFormCustomFields();
      }
    }
  }

  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  onFormSubmit() {

    this.submitted = true;
    if (this.formGroup.invalid) {
      this._commonHelper.validateAllFormFields(this.formGroup);
      return;
    }

    const fields = this.formGroup.getRawValue();

    if (this.action == Actions.Add) {
      fields["id"] = 0;
    } else {
      fields["id"] = this.entityRelationId;
    }

    fields["fromTenantID"] = this.entityRelationComponent.tenantID;
    fields["toTenantID"] = this.entityRelationComponent.toTenantID;
    fields["fromEntityID"] = this.fromEntityId;
    fields["toEntityID"] = this.toEntityId;
    fields["fromEntityTypeID"] = this.entityRelationComponent.fromEntityTypeID;
    fields["toEntityTypeID"] = this.entityRelationComponent.toEntityTypeID;

    if (this.formPanelGroup && this.formPanelGroup.length > 0) {
      this.formPanelGroup?.forEach(group => {
        group.controls.forEach(control => {
          if (control?.fieldType && control.fieldType.toLowerCase() == 'date') {
            if (fields[control.fieldName]) {
              fields[control.fieldName] = moment(fields[control.fieldName]).format('YYYY-MM-DD');
            }
          }
        });
      });
    }
    
    let customFields = {};
    this.customFieldControls.forEach(x => {
      x.controls.forEach(control => {
        if (fields[control.fieldName]) {
          if (control.fieldType == 'Date') {
            if (fields[control.fieldName]) {
              customFields[control.fieldName] = moment(fields[control.fieldName]).format('YYYY-MM-DD');
            }
          } else if (control.fieldType == 'JSON Grid') {
            const formArrayValues = fields[control.fieldName] || [];
            if (formArrayValues && formArrayValues.length > 0) {
              customFields[control.fieldName] = JSON.stringify(fields[control.fieldName]);
            } else {
              customFields[control.fieldName] = null;
            }
          } else if (control.fieldType == 'Phone') {
            const phoneControlValue = fields[control.fieldName];
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              customFields[control.fieldName] = data;
            } else {
              customFields[control.fieldName] = null;
            }
          } else if (control.fieldType == 'Picklist (MultiSelect)') {
            customFields[control.fieldName] = (fields[control.fieldName] as any[]).toString();
          } else {
            customFields[control.fieldName] = fields[control.fieldName];
          }
        } else {
          customFields[control.fieldName] = null;
        }
        delete fields[control.fieldName];
      });
    });

    const payload = {
      fields: fields,
      customFields: customFields
    };

    if (Array.isArray(payload.fields.entityRelationTypeID)) {
      payload.fields.entityRelationTypeID = (payload.fields.entityRelationTypeID as any[]).join(',');
    }

    this.OnSubmitForm.emit(payload);
  }
 
  onEntityRecordTypeChanged(dropdown: Dropdown) {
    if (dropdown.value && dropdown.value > 0) {
      if (this.customFields && this.customFields.length > 0) {
        this.clearCustomForms();
        this.prepareFormDataInJSON(dropdown.value);
        this.prepareFormCustomFields();
        if (this.action == Actions.Edit && dropdown.value== this.entityRelation['entityRelationTypeID']) {
          setTimeout(() => {
            this.fillCustomFieldFormGroup(this.customFieldJsonData);
          }, 300);
        }
      }
    } else {
      this.clearCustomForms();
    }
  }

  onEntityRecordTypeChangedMultiSelect(dropdown: MultiSelect) {
    if (dropdown.value && dropdown.value.length > 0) {
      if (this.customFields && this.customFields.length > 0) {
        this.clearCustomForms();
        dropdown.value.forEach(x => {
          this.prepareFormDataInJSON(x);
        });
        this.prepareFormCustomFields();
          if (this.action == Actions.Edit && dropdown.value == this.entityRelation['entityRelationTypeID']) {
            setTimeout(() => {
              this.fillCustomFieldFormGroup(this.customFieldJsonData);
            }, 300);
          }
      }
    } else {
      this.clearCustomForms();
    }
  }

  private clearCustomForms() {
    this.customFieldControls.forEach(section => {
      if (section.controls && section.controls.length > 0) {
        section.controls.forEach(control => {
          this.formGroup.removeControl(control.fieldName);
        });
      }
    });
    
    this.formGroup.updateValueAndValidity();
    this.customFieldControls = [];
  }

  private createForm() {

    let formControl = new FormControl();    
    formControl.addValidators(Validators.required);
    let controlsList = {};
    controlsList['entityRelationTypeID'] = formControl;

    if (this.formPanelGroup && this.formPanelGroup.length > 0) {
      this.formPanelGroup?.forEach(group => {
        group.controls.forEach(control => {
          if (control?.fieldType) {
            this.addControl(control, controlsList);
          }
        });
      });
    }
    
    this.formGroup = new FormGroup(controlsList);
  }

  private addControl(control: FormControls, controlsList: {}) {
    let formControl = new FormControl();
    if (control.validators && control.validators.length > 0) {
      let validatorFn: ValidatorFn[] = [];
      control.validators.forEach(validator => {
        if (validator.type?.toLowerCase() === 'required') {
          validatorFn.push(Validators.required);
        } else if (validator.type?.toLowerCase() === 'minlength') {
          validatorFn.push(Validators.minLength(Number(validator.value)));
        } else if (validator.type?.toLowerCase() === 'maxlength') {
          validatorFn.push(Validators.maxLength(Number(validator.value)));
        }
      });

      if (validatorFn.length > 0) {
        formControl.setValidators(validatorFn);
      }
    }
    controlsList[control.fieldName] = formControl;
  }

  private prepareDataSourceParamsForGetEntityRelation(): any[] {
    return [
      { name: 'EntityRelationID', type: 'int', value: this.entityRelationId }
    ];
  }

  private getEntityRelationData() {
    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByIDAndParams(this.entityRelationComponent.selectDataSourceID, this.prepareDataSourceParamsForGetEntityRelation())
      .then(res => {
        this._commonHelper.hideLoader();
        if (res) {

          this.entityRelation = res[0];

          this.formGroup.controls['entityRelationTypeID'].patchValue(this.entityRelation['entityRelationTypeID']);
          this.fromEntityId = this.entityRelation['fromEntityID'];
          this.toEntityId = this.entityRelation['toEntityID'];

          if (this.formPanelGroup && this.formPanelGroup.length > 0) {
            this.formPanelGroup?.forEach(group => {
              group.controls.forEach(control => {
                if (control?.fieldType && control.fieldType.toLowerCase() == 'date') {
                  if (this.entityRelation[control.fieldName]) {
                    this.formGroup.controls[control.fieldName].patchValue(new Date(this.entityRelation[control.fieldName]));
                  }
                } else {
                  this.formGroup.controls[control.fieldName].patchValue(this.entityRelation[control.fieldName]);
                }
              });
            });
          }
          
          if (this.customFields && this.customFields.length > 0) {
            this.prepareFormDataInJSON(this.entityRelation['entityRelationTypeID']);
            this.prepareFormCustomFields();
            this.getCustomFieldValues();
          }
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
      });
  }

  private prepareFormCustomFields(): void {
    this.customFieldControls.forEach(section => {
      section.controls.forEach(control => {
        if (String(control.fieldType).toLowerCase() === 'json grid') {
          this.formGroup.addControl(control.fieldName, new UntypedFormArray([]));
        } else {
          this.formGroup.addControl(control.fieldName, new UntypedFormControl());  
        }
        
        let validatorFn: ValidatorFn[] = [];

        if (String(control.fieldType).toLowerCase() === 'email') {
          validatorFn.push(Validators.email);
        } 
       
        if (control.settingsJSON) {
          if (control.settingsJSON['isRequired']) {
            validatorFn.push(Validators.required);
          }
          if (control.settingsJSON['minLength']) {
            validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
          }
          if (control.settingsJSON['maxLength']) {
            validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
          }
        }
        if (validatorFn.length > 0) {
          this.formGroup.controls[control.fieldName].setValidators(validatorFn);
          this.formGroup.controls[control.fieldName].updateValueAndValidity();
        }
      });
    });
  }

  private getCustomFieldValues() {
    const params = {
      entityRecordTypeId: this.entityRelation['entityRelationTypeID'],
      entityId: this.entityRelationId
    };

    this._commonHelper.showLoader();
    this._entityRelationService.getEntityRelationCustomFieldValues(params).then((response: any) => {
      if (response && response.customFieldJSONData) {
        this.customFieldJsonData = this._commonHelper.tryParseJson(response.customFieldJSONData);
        if (this.customFieldJsonData) {
          this.fillCustomFieldFormGroup(this.customFieldJsonData);
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
      if (customFieldsJson[property]) {
        const control = this.findControl(property);
        if (control) {
          if (control.fieldType == 'Picklist (MultiSelect)') {
            this.formGroup.get(property).patchValue((customFieldsJson[property]).split(','));
          }  else if (control.fieldType == 'Date') {
            this.formGroup.get(property).patchValue(new Date(customFieldsJson[property]));
          } else if (control.fieldType == 'JSON Grid') {
              if (typeof customFieldsJson[property] === 'string') {
                this.formGroup.get(property).patchValue(JSON.parse(customFieldsJson[property]));
            }
          } else if (control.fieldType == 'Phone') {
            const phoneDetail = String(customFieldsJson[property]).split('|');
            if (phoneDetail.length == 2) {
              this.formGroup.get(property).patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") });
            }
            else {
              this.formGroup.get(property).patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          } else {
            this.formGroup.get(property).patchValue(customFieldsJson[property]);
          }
        }
      }
    });
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  private prepareFormDataInJSON(value: number): void {

    this.customFields.filter(x => x.entityRecordTypeID == value).forEach((customField: any) => {
      if (customField.isVisible) {
        const sections = this.customFieldControls.find(x => String(x.sectionName).toLowerCase() === String(customField.sectionName).toLowerCase());
        if (sections) {
          sections.controls.push({
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
          });
        } else {
          const section = {
            sectionName: customField.sectionName,
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
          this.customFieldControls.push(section);
        }
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

  private findControl(property: any): any {
    let control = undefined;
    this.customFieldControls.forEach(section => {
      if (control) return control;
      if (section.controls && section.controls.length > 0) {
        control = section.controls.find(x => x.fieldName == property);
        if (control) return control;
      }
    });
    return control;
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
}