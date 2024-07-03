//ANGULAR
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
//COMMON
import { CommonHelper } from '../../../common-helper';
import { DataSourceParams } from '../../../enum';
//SERVICES
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { CommonService } from '../../../sharedServices/common.service';
//PIPE
import { TimeFramePipe } from '../../../pipes/time-frame-pipe/time-frame-pipe.pipe';
import { TimeFrameToMinutesPipe } from '../../../pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
//VALIDATOR
import { timeFrameValidator } from '../../../sharedValidators/time-frame.validator';
//PRIMENG
import { Dropdown } from 'primeng/dropdown';
import { Calendar} from 'primeng/calendar';
import { MultiSelect } from 'primeng/multiselect';
//OTHER
import * as moment from 'moment';
import { promises } from 'dns';

@Component({
  selector: 'ngx-key-field',
  templateUrl: './key-field.component.html',
  styleUrls: ['./key-field.component.scss']
})
export class KeyFieldComponent implements OnInit, OnChanges{

  //#region Global Declarations

  // inputs declaration starts
  @Input() entityID: number = null;
  @Input() entityTypeID: number = null;
  @Input() entityRecordTypeID: number = null;
  @Input() isEditPermission: boolean = true;
  @Input() keyfieldResponseData: any;
  @Input('currencySymbol') currencySymbol: any = null;
  @Input() hoursInDay: number = 24;

  @Input() isActive: boolean = true;
  @Input() isPaused: boolean = false;
  @Input() isClosedStage: boolean = false;
  @Input() isCompletedStage: boolean = false; 
  @Input() isDefault: boolean = false;
  // inputs declaration ends

  // Output declaration starts
  @Output() saveKeyFieldEvent = new EventEmitter<any>();
  @Output() onShowLoader = new EventEmitter();
  @Output() onHideLoader = new EventEmitter();
  // Output  declaration ends
  
  formGroup: FormGroup = this._fb.group({});
  submitted: any = false;
  keyFields: any = [];
  isInitialLoading:boolean = true;

  @ViewChildren('multiSelect') multiSelects: QueryList<MultiSelect>;
  @ViewChildren('dropdown') dropdowns: QueryList<Dropdown>;
  @ViewChildren('calendar') calendars: QueryList<Calendar>;
  @ViewChildren('textbox') textboxes: QueryList<ElementRef> ;
  @ViewChildren('textarea') textareas: QueryList<ElementRef>;
  @ViewChildren('checkbox') checkboxes: QueryList<ElementRef>;  
  @ViewChildren('radio') radios: QueryList<ElementRef>;

  //#endregion

  constructor(
    public _commonHelper: CommonHelper,
    private _dataSourceService: DatasourceService,
    private _fb: FormBuilder,
    private _commonService: CommonService,
    private _cdref: ChangeDetectorRef,
    private timeFramePipe: TimeFramePipe,
    private timeFrameToMinutesPipe: TimeFrameToMinutesPipe) { }

  //#region event hooks
  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes?.entityID?.currentValue && changes.entityID.currentValue != changes.entityID.previousValue)
      || (changes?.entityRecordTypeID?.currentValue != changes?.entityRecordTypeID?.previousValue)
    ) {
      this.isInitialLoading = true;
      setTimeout(() => { this.getEntityKeyFields(); }, 50);
    }

    if (changes?.keyfieldResponseData?.currentValue != null && changes?.keyfieldResponseData?.currentValue != undefined && changes.keyfieldResponseData.currentValue != '' && changes.keyfieldResponseData.currentValue != changes.keyfieldResponseData.previousValue) {
      if (this.keyfieldResponseData && this.keyfieldResponseData.keyfieldNameToHideLoader != '') {
        const field = this.keyFields.find(x => x.name === this.keyfieldResponseData.keyfieldNameToHideLoader);
        if (field) {
          field.showLoading = false;

          this.keyfieldResponseData.keyfieldNameToHideLoader = '';
          
          let typeCastedFieldValue: any;
          if (this.keyfieldResponseData.fieldValue == this.keyfieldResponseData.fieldOldValue) {

            if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'date') {
              typeCastedFieldValue = moment(this.keyfieldResponseData.fieldValue).format('MM/DD/YYYY') == 'Invalid date' ? null : moment(this.keyfieldResponseData.fieldValue).format('MM/DD/YYYY');
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'picklist (int)')) {
              typeCastedFieldValue = Number.parseInt(this.keyfieldResponseData.fieldValue)
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'checkbox')) {
              typeCastedFieldValue = (this.keyfieldResponseData.fieldValue != null && (this.keyfieldResponseData.fieldValue == 1 || this.keyfieldResponseData.fieldValue == true || this.keyfieldResponseData.fieldValue?.toString().toLowerCase() == "true")) ? true : false;
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'number')) {
              typeCastedFieldValue = (this.keyfieldResponseData.fieldValue != null && !isNaN(Number.parseFloat(this.keyfieldResponseData.fieldValue))) ? Number.parseFloat(this.keyfieldResponseData.fieldValue) : null;
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'percent')) {
              typeCastedFieldValue = (this.keyfieldResponseData.fieldValue != null && !isNaN(Number.parseFloat(this.keyfieldResponseData.fieldValue))) ? Number.parseFloat(this.keyfieldResponseData.fieldValue) : null;
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'currency')) {
              typeCastedFieldValue = (this.keyfieldResponseData.fieldValue != null && !isNaN(Number.parseFloat(this.keyfieldResponseData.fieldValue))) ? Number.parseFloat(this.keyfieldResponseData.fieldValue) : null;
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'whole number')) {
              typeCastedFieldValue = (this.keyfieldResponseData.fieldValue != null && !isNaN(Number.parseFloat(this.keyfieldResponseData.fieldValue))) ? Math.round(this.keyfieldResponseData.fieldValue) : null;
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'duration')) {
              typeCastedFieldValue =  this.timeFramePipe.transform(this.keyfieldResponseData.fieldValue, this.hoursInDay);
            }
            else {
              typeCastedFieldValue = this.keyfieldResponseData.fieldValue
            }


            field.value = typeCastedFieldValue;
            field.oldValue = field.value;
            
            this.formGroup.get(field.name).patchValue(field.value);
            this.formGroup.get(field.name).updateValueAndValidity();
          }
          else {
            
            if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'date') {
              typeCastedFieldValue = moment(this.keyfieldResponseData.fieldOldValue).format('MM/DD/YYYY') == 'Invalid date' ? null : moment(this.keyfieldResponseData.fieldOldValue).format('MM/DD/YYYY');
            }
            else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'picklist (int)')) {
              typeCastedFieldValue = Number.parseInt(this.keyfieldResponseData.fieldOldValue)
            }
            else {
              typeCastedFieldValue = this.keyfieldResponseData.fieldOldValue
            }

            field.value = typeCastedFieldValue;
            field.oldValue = field.value;

            this.formGroup.get(field.name).patchValue(field.value);
            this.formGroup.get(field.name).updateValueAndValidity();
          }
        }
      }
    }
  }

  private showLoader() {
    this.onShowLoader.emit();
  }

  private hideLoader() {
    this.onHideLoader.emit();
  }
  //#endregion

  //#region 'Text' Control 
  onTextFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }

  onTextFieldKeyPress(event, field) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        this.onSaveChanges(field);
      }
    }
  }
  //#endregion

  //#region 'Text (Long)' Control 
  onTextLongFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }

  onTextLongFieldKeyPress(event, field) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        this.onSaveChanges(field);
      }
    }
  }

  //allow only 4000 characters in total
  textLongEventHandler(event) {
    return event.target.value.length < 4000;
  }
  //#endregion

  //#region 'Percent' Control 
  onPercentFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }

  onPercentFieldKeyPress(event, field) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        this.onSaveChanges(field);
      }
    }
  }
  //allow only 6 digits and '.'(dot)
  percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 6 digit number
    return event.target.value.length <= 6;
  }
  //#endregion

  //#region 'Number' Control 
  onNumberFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      field.value = this.formGroup.get(field.name).value;
      this.onSaveChanges(field);
    }
  }

  onNumberFieldKeyPress(event, field) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        field.value = this.formGroup.get(field.name).value;
        this.onSaveChanges(field);
      }
    }
  }

  //allow only 13 digits and '.'(dot)
  numberEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 13 digit number
    return event.target.value.length <= 13;
  }
  //#endregion

  //#region 'Whole Number' Control 
  onWholeNumberFieldSubmit(field: any) {
    if (!this.formGroup.get(field?.name).errors) {
      field.value = this.formGroup.get(field.name).value;
      this.onSaveChanges(field);
    }
  }

  onWholeNumberFieldKeyPress(event: any, field: any) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field?.name).errors) {
        field.value = this.formGroup.get(field.name).value;
        this.onSaveChanges(field);
      }
    }
  }
  //#endregion

  //#region 'Currency' Control 
  onCurrencyFieldSubmit(field: any) {
    if (!this.formGroup.get(field?.name).errors) {
      field.value = this.formGroup.get(field.name).value;
      this.onSaveChanges(field);
    }
  }

  onCurrencyFieldKeyPress(event: any, field: any) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field?.name).errors) {
        field.value = this.formGroup.get(field.name).value;
        this.onSaveChanges(field);
      }
    }
  }

  //allow only 13 digits
  currencyEventHandler(event: any) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }
  //#endregion

  //#region 'CheckBox' Control 
  onCheckBoxFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      field.value = this.formGroup.get(field.name).value;
      this.onSaveChanges(field);
    }
  }
  //#endregion

   //#region 'Radio' Control 
   onRadioFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      field.value = this.formGroup.get(field.name).value;
      this.onSaveChanges(field);
    }
  }
  //#endregion

  //#region 'Date' Control 
  onDateSelected(field: any) {
    if (!this.formGroup.get(field.name).errors) {
      field.value = moment(field.value).format('MM/DD/YYYY');
      field.displayValue = field.value;
      this.formGroup.get(field.name).patchValue(field.value);
      this.formGroup.get(field.name).updateValueAndValidity();
      this.onSaveChanges(field);
    }
  }

  onDateFieldClose(field) {
    if (field) {
      this.formGroup.get(field.name).patchValue(field.value);
      this.formGroup.get(field.name).updateValueAndValidity();
      this.onSaveChanges(field);

      this.setFieldsReadonly();
    }
  }

  //#endregion

  //#region 'Dropdown' Controls

  //#region 'Email' Control 
  onEmailFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }

  onEmailFieldKeyPress(event, field) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        this.onSaveChanges(field);
      }
    }
  }
  //#endregion

  //#region 'phone' Control 
  onPhoneFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }

  onPhoneFieldKeyPress(event, field) {
    //this.onSaveChanges(field);
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        this.onSaveChanges(field);
      }
    }
  }
  //#endregion

  //#region 'duration' Control 
  onDurationFieldSubmit(field) {
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }

  onDurationFieldKeyPress(event, field) {
    if (event.key == 'Enter') {
      if (!this.formGroup.get(field.name).errors) {
        this.onSaveChanges(field);
      }
    }
  }
  //#endregion
  
  onDropdownClick(event: MouseEvent, field: any, elementIdPrefix: string): void {
    event.stopPropagation();

    let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();
    this.hideSingleSelectDropdown(elementId);
  }

  onDropdownChange(event: any, field: any, elementIdPrefix: string) {
    if (field?.dataSourceId && field?.dataSourceParams && field?.dataSourceParams?.length > 0 && !event.value) {
      let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();

      const params = this.prepareDataSourceParams(field, '')
      this.getDataSourceDataByIDAndParams(field, params, elementId);
    }
  }

  onDropdownSearchFilter(event: any, field: any, elementIdPrefix: string) {
    if (field?.dataSourceId && field?.dataSourceParams && field?.dataSourceParams?.length > 0) {

      let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();

      if ((event.filter ?? '') != '') {
        if (event.filter.trim().length > 2) {
          const params = this.prepareDataSourceParams(field, event.filter.trim())
          this.getDataSourceDataByIDAndParams(field, params, elementId);
        }
      } else {
        const params = this.prepareDataSourceParams(field, '')
        this.getDataSourceDataByIDAndParams(field, params, elementId);
      }
    }
  }
  
  onDropDownHide(field){
    if (!this.formGroup.get(field.name).errors) {
      this.onSaveChanges(field);
    }
  }
  //#endregion

  //#region MultiSelect 
  onMultiSelectDropdownSearchFilter(event: any, field: any, elementIdPrefix: string) {
    if (field?.dataSourceId && field?.dataSourceParams && field?.dataSourceParams?.length > 0) {

      let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();

      if ((event.filter ?? '') != '') {
        if (event.filter.trim().length > 2) {
          const params = this.prepareDataSourceParams(field, event.filter.trim())
          this.getDataSourceDataByIDAndParams(field, params, elementId);
        }
      } else {
        const params = this.prepareDataSourceParams(field, '')
        this.getDataSourceDataByIDAndParams(field, params, elementId);
      }
    }
  }

  onMultiSelectDropDownHide(field) {
    if (!this.formGroup.get(field.name).errors) {
      field.value = this.formGroup.get(field.name)?.value?.toString();
      this.onSaveChanges(field);
    }
  }
  //#endregion

  //#region Common Methods

  editField(field) {

    this.setFieldsReadonly();
    if (this.isEditPermission && this.isActive && !this.isPaused && !this.isClosedStage && !this.isCompletedStage && !this.isDefault && !field.isReadOnly) {
      field.isLabelView = false;

      if (field.fieldTypeName == 'Picklist' || field.fieldTypeName == 'Picklist (int)') {
        setTimeout(() => {
          this.dropdowns.toArray().forEach(singleSelectDropdown => {
            singleSelectDropdown.show();
          })
        }, 50);
      }
      if (field.fieldTypeName == 'Picklist (MultiSelect)') {
        //set value to null to avoid "EMPTY" text in dropdown
        this.formGroup.get(field.name)?.setValue(null);
        this.formGroup.get(field.name)?.updateValueAndValidity();
        setTimeout(() => {
          this.multiSelects.toArray().forEach(multiSelectDropdown => {
            let selectedValues = field?.value ? field.value.split(',') : '';
            this.formGroup.get(field.name).patchValue(selectedValues);
            this.formGroup.get(field.name).updateValueAndValidity();
            multiSelectDropdown.show();
          })
        }, 50);
      }
      else if (field.fieldTypeName == 'Date') {
        setTimeout(() => {
          this.calendars.toArray().forEach(calendarControl => {
            calendarControl.toggle();
          })
        }, 50);
      }
      else if (String(field.fieldTypeName).toLowerCase() == 'phone') {
        const phoneDetail = field.value?.split('|');
        if (phoneDetail && phoneDetail.length == 2) {
          this.formGroup.get(field.name).patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1] });
          this.formGroup.get(field.name).updateValueAndValidity();
        } else {
          this.formGroup.get(field.name).patchValue({ countryCode: null, phoneNumber: null });
          this.formGroup.get(field.name).updateValueAndValidity();
        }
      }
      else if (field.fieldTypeName == 'Text' || field.fieldTypeName == 'Percent' || field.fieldTypeName == 'Number' 
                || field.fieldTypeName == 'Whole Number' || field.fieldTypeName == 'Currency' || field.fieldTypeName == 'Email' 
                || field.fieldTypeName == 'Duration') {
        setTimeout(() => {
          this.textboxes.toArray().forEach(textBoxControl => {
            textBoxControl.nativeElement.focus();
          })
        }, 50);
      }
      else if (field.fieldTypeName == 'Text (Long)') {
        setTimeout(() => {
          this.textareas.toArray().forEach(textBoxControl => {
            textBoxControl.nativeElement.focus();
          })
        }, 50);
      }
    }
  }
  
  discardChanges(field) {
    if (field) {
      field.displayValue = field.oldDisplayvalue;
      field.value = field.oldValue;
      this.formGroup.get(field.name).patchValue(field.oldValue);
      this.formGroup.get(field.name).updateValueAndValidity();
      this.setFieldsReadonly();
    }
  }

  onSaveChanges(field: any) {
    if (field) {
      field.showLoading = true;
      let paramFieldValue: any;
      if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'date') {
        paramFieldValue = !this.formGroup.controls[field.name].value ? null : moment(this.formGroup.controls[field.name].value).format('YYYY-MM-DD');
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'number') {
        paramFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Number.parseFloat(field.value) : null;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'percent') {
        paramFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Number.parseFloat(field.value) : null;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'currency') {
        paramFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Number.parseFloat(field.value) : null;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'picklist (multiselect)') {
        paramFieldValue = field.value;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'checkbox') {
        paramFieldValue = (field?.value == 1 || field?.value == true || field?.value?.toString().toLowerCase() == "true") ? true : false;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'radiogroup (boolean)') {
        paramFieldValue = field.value;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'whole number') {
        paramFieldValue =  (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Math.round(field.value) : null ;
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'duration') {
        paramFieldValue = this.timeFrameToMinutesPipe.transform(field.value, this.hoursInDay);
      }
      else if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'phone') {
        const phoneInfo = this.formGroup.get(field.name)?.value;
        if (phoneInfo && phoneInfo?.countryCode && String(phoneInfo.countryCode) != '' && phoneInfo.phoneNumber && String(phoneInfo.phoneNumber) != '') {
          paramFieldValue = phoneInfo.countryCode + '|' + String(phoneInfo.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
        }else {
          paramFieldValue = null;  
        }
      }
      else {
        paramFieldValue = this.formGroup.controls[field.name].value;
      }

      let params = {
        entityTypeId: this.entityTypeID,
        entityId: this.entityID,
        isCustomField: field.isCustomField,
        type: field.fieldTypeName,
        field: field.name,
        fieldValue: paramFieldValue != null ? paramFieldValue.toString() : null,
        fieldOldValue: field.oldValue
      };

      this.saveKeyFieldEvent.emit(params);
      this.setFieldsReadonly();
    }
  }

  setFieldsReadonly() {
    if (this.keyFields) {
      this.keyFields.forEach(f => { f.isLabelView = true; })
    }
  }

  getEntityKeyFields() {
    let params = {
      entityId: this.entityID,
      entityTypeId: this.entityTypeID,
      entityRecordTypeId: this.entityRecordTypeID
    };
    
    this.showLoader();
    this._commonService.getEntityKeyFields(params).then((response) => {
      if (response) {
        this.prepareFormData(response as []);
        this.createDynamicForm();
        Promise.all([
          this.bindKeyFieldOptionsFromDataSource()
        ]).then(() => {
          this.isInitialLoading = false;
        });
        this.hideLoader();
      }
    }, (error) => {
      this._commonHelper.showToastrError(error.message);
      this.isInitialLoading = false;
      this.hideLoader();
    });
  }

  prepareFormData(dataJson: any[]) {
    this.keyFields = [];

    if (dataJson && dataJson.length > 0) {

      dataJson.forEach((field) => {

        let typeCastedFieldValue: any;
        if (field.fieldTypeName && field.fieldTypeName.toLowerCase() == 'date') {
          typeCastedFieldValue = moment(field.value).format('MM/DD/YYYY') == 'Invalid date' ? null : moment(field.value).format('MM/DD/YYYY');
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'picklist (int)')) {
          typeCastedFieldValue = Number.parseInt(field.value)
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'picklist (multiselect)')) {
          typeCastedFieldValue = field.value;
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'number')) {
          typeCastedFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Number.parseFloat(field.value) : null;
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'percent')) {
          typeCastedFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Number.parseFloat(field.value) : null;
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'currency')) {
          typeCastedFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Number.parseFloat(field.value) : null;
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'checkbox')) {
          typeCastedFieldValue = (field?.value == 1 || field?.value == true || field?.value?.toString().toLowerCase() == "true") ? true : false;
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'whole number')) {
          typeCastedFieldValue = (field.value != null && !isNaN(Number.parseFloat(field.value))) ? Math.round(field.value) : null;
        }
        else if (field.fieldTypeName && (field.fieldTypeName.toLowerCase() == 'duration')) {
          typeCastedFieldValue =  this.timeFramePipe.transform(field.value, this.hoursInDay);
        }
        else {
          typeCastedFieldValue = field.value
        }

        let dataObject = {
          showLoading: false,
          isLabelView: true,
          isSubmitted: false,
          fieldTypeId: field.fieldTypeId,
          fieldTypeName: field.fieldTypeName,
          name: field.name,
          value: typeCastedFieldValue,
          oldValue:  typeCastedFieldValue,
          displayName: field.displayName,
          displayValue: field.displayValue,
          oldDisplayvalue: typeCastedFieldValue,
          isCustomField: field.isCustomField,
          defaultValue: field.defaultValue,
          optionsJSON: field.optionsJSON ? this._commonHelper.tryParseJson(field.optionsJSON) : '',
          dataSourceId: field.dataSourceId,
          dataSourceParams: field.dataSourceParams ? this._commonHelper.tryParseJson(field.dataSourceParams) : '',
          settingsJson: field.settingsJson ? this._commonHelper.tryParseJson(field.settingsJson) : '',
          isReadOnly: field.isReadOnly
        }
        this.keyFields.push(dataObject);
      });
    }
  }

  createDynamicForm(){
    let fieldValidators = [];
    for(const field of this.keyFields)
    {
      fieldValidators = [];

      if(field.fieldTypeName.toLowerCase() == 'email'){
        fieldValidators.push(Validators.email);
      }

      if(field.fieldTypeName.toLowerCase() == 'duration'){
        if(field?.settingsJson?.isRequired){
          fieldValidators.push(timeFrameValidator());
        }
        else{
          fieldValidators.push(timeFrameValidator(false));
        }
      }

      for (const [key,value] of Object.entries(field?.settingsJson))
      {
        switch (key) {
          case 'isRequired':
            if(field.fieldTypeName.toLowerCase() != 'duration'){
              fieldValidators.push(Validators.required);
            }
            break;
          case 'minLength':
            fieldValidators.push(Validators.minLength(value as number));
            break;
          case 'maxLength':
            fieldValidators.push(Validators.maxLength(value as number));
            break;
          case 'min':
            fieldValidators.push(Validators.min(value as number));
            break;
          case 'max':
            fieldValidators.push(Validators.max(value as number));
            break;
          default:
            break;
        }
      }
      this.formGroup.addControl(field.name, this._fb.control(field.value, fieldValidators));
    }
  }

  async bindKeyFieldOptionsFromDataSource() {
    return new Promise(async (resolve, reject) => {
      // for datasouce - wait for all the iteration promise values received
      await Promise.all(
        this.keyFields.map(async (field) => {
          if (field.dataSourceId && field.dataSourceId > 0) {
            await this.getDataSourceDataByID(field);
          }
        }));
      resolve(null);
    });
  }

  getDataSourceDataByID(field: any) {
    return new Promise((resolve, reject) => {
      field.showLoading = true;
      if (!field.dataSourceParams) {
        this._dataSourceService.getDataSourceDataByID(field.dataSourceId).then((response: any[]) => {
          this.setOptionJsonData(field, response);
          field.showLoading = false;
          resolve(null);
        }, (error) => {
          field.showLoading = false;
          resolve(null);
        });
      } else {
        const params = this.prepareDataSourceParams(field, "");
        this._dataSourceService.getDataSourceDataByIDAndParams(field.dataSourceId, params).then((response: any[]) => {
          this.setOptionJsonData(field, response);
          field.showLoading = false;
          resolve(null);
        }, (error) => {
          field.showLoading = false;
          resolve(null);
        });
      }
    });
  }
  
  getDataSourceDataByIDAndParams(control: any, params: any, elementId: string) {
    this._dataSourceService.getDataSourceDataByIDAndParams(control?.dataSourceId, params).then((response: any[]) => {

      if (response) {
        if (control.fieldType == 'Picklist (MultiSelect)') {
          control.optionsJSON = this._commonHelper.deepClone(response.map((item: any) => ({ value: String(item.value || ""), label: item.label })));

        } else {
        control.optionsJSON = this._commonHelper.deepClone(response);
      }
        this._cdref.detectChanges();

        //Search String Params Value
        let searchString = "";
        const searchStringParam = params?.find((param: any) => param.name.toLowerCase() == DataSourceParams.SearchString.toLowerCase());
        if (searchStringParam != null) {
          searchString = searchStringParam.value;
        }

        if (control.fieldType == 'Picklist (int)' || control.fieldType == 'Picklist') {
          setTimeout(() => {
            this.showHideSingleSelectDropdown(elementId, searchString);
          }, 0);
        }
        if (control.fieldType == 'Picklist (MultiSelect)') {
          setTimeout(() => {
            this.showHideMultiSelectDropdown(elementId, searchString);
          }, 0);
        }
      }
    }).catch(() => {
      
    });
  }

  setOptionJsonData(field: any, response: any[]) {
    if (response && response.length > 0) {
      if (field.fieldTypeName == 'Picklist (MultiSelect)' && (typeof response[0].value != 'string')) {
        field.optionsJSON = response.map((item: any) => ({ value: String(item.value || ""), label: item.label }));
        field.copyOfoptionsJSON = this._commonHelper.deepClone(field.optionsJSON);
        if (field.name) {
          let selectedValues = String(this.keyFields[field.name]) || "";
          if (selectedValues && selectedValues != "") {
            const selectedMultiSelectData = field.optionsJSON.filter(i => selectedValues.split(',').includes(i.value)).sort((a, b) => (a.label > b.label) ? 1 : -1).map(x => x.value).join(',');
            if (selectedMultiSelectData && selectedMultiSelectData.length > 0) {
              this.keyFields[field.name] = selectedMultiSelectData;

              this.formGroup.get(field.name).patchValue(selectedMultiSelectData ? selectedMultiSelectData.split(',') : null);
              this.formGroup.get(field.name).updateValueAndValidity();
            }
          }
        }
      } else {
        field.optionsJSON = response;
        field.copyOfoptionsJSON = this._commonHelper.deepClone(field.optionsJSON);
      }
    }
  }

  prepareDataSourceParams(field: any, searchText: string) {
    const params = [];
    
    if (field?.dataSourceParams && field?.dataSourceParams?.length > 0) {
      
      //Search String
      const searchStringParam = field?.dataSourceParams.find(param  => param.name.toLowerCase() == DataSourceParams.SearchString.toLowerCase());
      if (searchStringParam != null) {
        searchStringParam.value = searchText;
        params.push(searchStringParam);
      }

      //EntityIDs
      const entityIDsParam = field?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityIDs.toLowerCase());
      if (entityIDsParam != null) {
        entityIDsParam.value = String(this.keyFields[field.name] || "");
        params.push(entityIDsParam);
      }

      //EntityID
      const entityIDParam = field?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityID.toLowerCase());
      if (entityIDParam != null) {
        entityIDParam.value = this.entityID;
        params.push(entityIDParam);
      }

      //EntityTypeID
      const entityTypeIdParam = field?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityTypeID.toLowerCase());
      if (entityTypeIdParam != null) {
        entityTypeIdParam.value = this.entityTypeID;
        params.push(entityTypeIdParam);
      }

      //EntityRecordTypeID
      const entityRecordTypeIdParam = field?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityRecordTypeID.toLowerCase());
      if (entityRecordTypeIdParam != null) {
        entityRecordTypeIdParam.value = this.entityRecordTypeID;
        params.push(entityRecordTypeIdParam);
      }
    }

    return params;
  }

  hideSingleSelectDropdown(elementId: string) {
    if (this.dropdowns) {
      this.dropdowns.toArray().forEach(drp => {
        if (drp.el.nativeElement.id.toLowerCase() != elementId && drp.overlayVisible) {
          let filterValue = drp?.filterViewChild?.nativeElement?.value || "";
          drp.hide();

          if (drp.filterViewChild && drp.filterViewChild.nativeElement) {
            drp.filterValue = filterValue;
            drp.filterViewChild.nativeElement.value = filterValue;
          }
        }
      })
    }
  }

  showHideSingleSelectDropdown(id: string, filterValue: string) {
    if (this.dropdowns) {
      this.dropdowns.toArray().forEach(singleSelectDropdown => {

        if (singleSelectDropdown.overlayVisible)
            singleSelectDropdown.hide();

        if (singleSelectDropdown.el.nativeElement.id.toLowerCase() == id.toLowerCase()) {

          if (singleSelectDropdown.filterViewChild && singleSelectDropdown.filterViewChild.nativeElement) {
            singleSelectDropdown.filterValue = filterValue;
            singleSelectDropdown.filterViewChild.nativeElement.value = filterValue;
          }

          singleSelectDropdown.show();
        }
      })
    }
  }

  onMultiSelectChange(event, field: any, elementIdPrefix: string) {
    let selectedValues = event.value.toString();
    field.value = selectedValues != '' ? selectedValues.split(',') : null;

    this.formGroup.get(field.name).patchValue(field.value);
    this.formGroup.get(field.name).updateValueAndValidity();
    
    if (field?.dataSourceId && field?.dataSourceParams && field?.dataSourceParams?.length > 0 && !event.value) {
      let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();

      const params = this.prepareDataSourceParams(field, '')
      this.getDataSourceDataByIDAndParams(field, params, elementId);
    }
  }

  showHideMultiSelectDropdown(id: string, filterValue: string) {
    if (this.multiSelects) {
      this.multiSelects.toArray().forEach(multiSelectDropdown => {

        if (multiSelectDropdown.overlayVisible)
          multiSelectDropdown.hide();

        if (multiSelectDropdown.el.nativeElement.id.toLowerCase() == id.toLowerCase()) {

          if (multiSelectDropdown.filterInputChild && multiSelectDropdown.filterInputChild.nativeElement) {
            multiSelectDropdown.filterValue = filterValue;
            multiSelectDropdown.filterInputChild.nativeElement.value = filterValue;
          }

          multiSelectDropdown.show();
        }
      })
    }
  }

  onMultiSelectClick(event: MouseEvent, field: any, elementIdPrefix: string) {
    event.stopPropagation();

    let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();

    this.hideMultiSelectDropdown(elementId);
    this.hideSingleSelectDropdown("");
  }

  onMultiSelectClear(field: any, elementIdPrefix: string) {
    field.name = null;

    if (field?.dataSourceId && field?.dataSourceParams && field?.dataSourceParams?.length > 0) {
      let elementId: string = `${elementIdPrefix}-${field.name}`.toLowerCase();

      const params = this.prepareDataSourceParams(field, '')
      this.getDataSourceDataByIDAndParams(field, params, elementId);
    }
  }

  hideMultiSelectDropdown(elementId: string) {
    if (this.multiSelects) {
      this.multiSelects.toArray().forEach(ms => {
        if (ms.el.nativeElement.id.toLowerCase() != elementId && ms.overlayVisible) {
          let filterValue = ms?.filterInputChild?.nativeElement?.value || "";
          ms.hide();

          if (ms.filterInputChild && ms.filterInputChild.nativeElement) {
            ms.filterValue = filterValue
            ms.filterInputChild.nativeElement.value = filterValue;
          }
        }
      })
    }
  }
  
  onFocusOutEvent(field){
    if (field) {
      field.displayValue = field.oldDisplayvalue;
      field.value = field.oldValue;
      this.formGroup.get(field.name).patchValue(field.oldValue);
      this.formGroup.get(field.name).updateValueAndValidity();
      this.setFieldsReadonly();
    }
 }

 stopPropagation(event: MouseEvent): void {
  event.stopPropagation();
}

  //#endregion
}
