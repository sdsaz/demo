import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Dropdown } from 'primeng/dropdown';
import { MultiSelect } from 'primeng/multiselect';
import { CommonHelper } from '../../../common-helper';
import { DataSourceParams } from '../../../enum';
import { DatasourceService } from '../../../sharedServices/datasource.service';

@Component({
  selector: 'ngx-custom-field',
  templateUrl: './custom-field.component.html',
  styleUrls: ['./custom-field.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CustomFieldComponent implements OnInit, OnChanges {

  @Input() section: any = {};
  @Input() controls: any[];
  @Input() customFieldJSONData: any = {};
  @Input() isReadOnly: boolean = true;
  @Input() formGroup: UntypedFormGroup;
  @Input() submitted: boolean;
  @Input() currencySymbol: any;
  @Input() controlClass: string = "";
  @Input() refreshTabularDataSource: boolean = false;
  @Input() entityID: number = null;
  @Input() entityTypeID: number = null;
  @Input() entityRecordTypeID: number = null;
  @ViewChildren('multiSelect') multiSelects: QueryList<MultiSelect>;
  @ViewChildren('dropdown') dropdowns: QueryList<Dropdown>;
  @Input() refreshFieldJSONGrid: boolean = false;
  
  countryCode: any;
  phoneNumber: any;
  phoneMask: any;

  customeField_validation_messages = {
    'estimatedMins': [
      // { type: 'required', message: 'COMMON.CUSTOMFIELD_COMMON.ESTIMATION_TIME_VALIDATION_REQUIRED' },
      { type: 'invalidTimeFrame', message: 'COMMON.CUSTOMFIELD_COMMON.ESTIMATION_TIME_VALIDATION' },
      { type: 'timeTooLarge', message: 'COMMON.CUSTOMFIELD_COMMON.ESTIMATION_TIME_LENGTH_VALIDATION' },
      { type: 'timeTooSmall', message: 'COMMON.CUSTOMFIELD_COMMON.ESTIMATION_TIME_MINIMUM_VALIDATION' }
    ],
    'phone': [{ type: 'mask', message: 'COMMON.CUSTOMFIELD_COMMON.PHONE_PATTERN' }],
    'email': [{ type: 'validEmailMessage', message: 'COMMON.CUSTOMFIELD_COMMON.EMAIL_VALIDATION' }]
  };
  constructor(public _commonHelper: CommonHelper, private _dataSourceService: DatasourceService, private _cdref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.bindCustomFieldOptionJSONFromDataSource();
    //find phone mask for phoneField
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes != null) {
      if (changes?.isReadOnly && !changes?.isReadOnly?.currentValue) {
        //Refresh the Option JSON of Pick List custom field controls. (If data source is defined)
        let pickListControls = this.controls?.filter(i => (i.dataSourceId && i.dataSourceId > 0) && (i.fieldType == 'Picklist (MultiSelect)' || i.fieldType == 'Picklist (int)' || i.fieldType == 'Picklist'));
        if (pickListControls && pickListControls.length > 0) {
          pickListControls.forEach(control => {
            this.getDataSourceDataByID(control);
          });
        }
      }

      if (changes?.refreshTabularDataSource && !changes?.refreshTabularDataSource?.currentValue) {
        //Refresh the Option JSON of tabular custom field controls. (If data source is defined)
        let pickListControls = this.controls?.filter(i => (i.dataSourceId && i.dataSourceId > 0) && (i.fieldType == 'Tabular'));
        if (pickListControls && pickListControls.length > 0) {
          pickListControls.forEach(control => {
            this.getDataSourceDataByID(control);
          });
        }
      }

      if(changes?.refreshCustomFieldJSONGrid && !changes?.refreshCustomFieldJSONGrid?.currentValue) {
        this.refreshFieldJSONGrid = true;
      }
    }
  }

  bindCustomFieldOptionJSONFromDataSource() {
    this.controls.forEach((control) => {
      if (control.dataSourceId && control.dataSourceId > 0) {
        this.getDataSourceDataByID(control);
      }
    });
  }

  getDataSourceDataByID(control: any) {
    control["showLoading"] = true;
    if (!control.dataSourceParams) {
      this._dataSourceService.getDataSourceDataByID(control.dataSourceId).then((response: any[]) => {
        this.setOptionJsonData(control, response);
        control["showLoading"] = false;
      }, (error) => {
        control["showLoading"] = false;
      });
    } else {
      const params = this.prepareDataSourceParams(control, "");
      this._dataSourceService.getDataSourceDataByIDAndParams(control.dataSourceId, params).then((response: any[]) => {
        this.setOptionJsonData(control, response);
        control["showLoading"] = false;
      }, (error) => {
        control["showLoading"] = false;
      });
    }
  }

  setOptionJsonData(control: any, response: any[]) {
    if (response && response.length > 0) {
      if (control.fieldType == 'Picklist (MultiSelect)' && (typeof response[0].value != 'string')) {
        control.optionsJSON = response.map((item: any) => ({ value: String(item.value || ""), label: item.label }));
        control.copyOfoptionsJSON = this._commonHelper.deepClone(control.optionsJSON);
        if (control.fieldName) {
          let selectedValues = String(this.customFieldJSONData[control.fieldName]) || "";
          if (selectedValues && selectedValues != "") {
            const selectedMultiSelectData = control.optionsJSON.filter(i => selectedValues.split(',').includes(i.value)).sort((a, b) => (a.label > b.label) ? 1 : -1).map(x => x.value).join(',');
            if (selectedMultiSelectData && selectedMultiSelectData.length > 0) {
              this.customFieldJSONData[control.fieldName] = selectedMultiSelectData;

              this.formGroup.get(control.fieldName).patchValue(selectedMultiSelectData ? selectedMultiSelectData.split(',') : null);
              this.formGroup.get(control.fieldName).updateValueAndValidity();
            }
          }
        }
      } else {
        control.optionsJSON = response;
        control.copyOfoptionsJSON = this._commonHelper.deepClone(control.optionsJSON);
      }
    }
  }

  //allow only 13 digits and ','(comma)
  currencyEventHandler(event: any) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }

  //allow only 6 digits and '.'(dot)
  percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 15 digit number
    return event.target.value.length <= 6;
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  customFieldMultiSelectChange(event, control: any, elementIdPrefix: string) {
    let selectedValues = event.value.toString();
    this.customFieldJSONData[control.fieldName] = selectedValues != '' ? selectedValues : null;

    if (control?.dataSourceId && control?.dataSourceParams && control?.dataSourceParams?.length > 0 && !event.value) {
      let elementId: string = `${elementIdPrefix}-${control.fieldName}`.toLowerCase();

      const params = this.prepareDataSourceParams(control, '')
      this.getDataSourceDataByIDAndParams(control, params, elementId);
    }
  }

  onSearchPicklistFilter(event: any, control: any, elementIdPrefix: string) {
    if (control?.dataSourceId && control?.dataSourceParams && control?.dataSourceParams?.length > 0) {

      let elementId: string = `${elementIdPrefix}-${control.fieldName}`.toLowerCase();

      if ((event.filter ?? '') != '') {
        if (event.filter.trim().length > 2) {
          const params = this.prepareDataSourceParams(control, event.filter.trim())
          this.getDataSourceDataByIDAndParams(control, params, elementId);
        }
      } else {
        const params = this.prepareDataSourceParams(control, '')
        this.getDataSourceDataByIDAndParams(control, params, elementId);
      }
    }
  }

  onChangePicklist(event: any, control: any, elementIdPrefix: string) {
    if (control?.dataSourceId && control?.dataSourceParams && control?.dataSourceParams?.length > 0 && !event.value) {
      let elementId: string = `${elementIdPrefix}-${control.fieldName}`.toLowerCase();

      const params = this.prepareDataSourceParams(control, '')
      this.getDataSourceDataByIDAndParams(control, params, elementId);
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


  prepareDataSourceParams(control: any, searchText: string) {
    const params = [];

    if (control?.dataSourceParams && control?.dataSourceParams?.length > 0) {
      //Search String
      const searchStringParam = control?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.SearchString.toLowerCase());
      if (searchStringParam != null) {
        searchStringParam.value = searchText;
        params.push(searchStringParam);
      }

      //EntityIDs
      const entityIDsParam = control?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityIDs.toLowerCase());
      if (entityIDsParam != null) {
        entityIDsParam.value = String(this.customFieldJSONData[control.fieldName] || "");
        params.push(entityIDsParam);
      }

      //EntityID
      const entityIDParam = control?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityID.toLowerCase());
      if (entityIDParam != null) {
        entityIDParam.value = this.entityID;
        params.push(entityIDParam);
      }

      //EntityTypeID
      const entityTypeIdParam = control?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityTypeID.toLowerCase());
      if (entityTypeIdParam != null) {
        entityTypeIdParam.value = this.entityTypeID;
        params.push(entityTypeIdParam);
      }

      //EntityRecordTypeID
      const entityRecordTypeIdParam = control?.dataSourceParams.find((param: any) => param.name.toLowerCase() == DataSourceParams.EntityRecordTypeID.toLowerCase());
      if (entityRecordTypeIdParam != null) {
        entityRecordTypeIdParam.value = this.entityRecordTypeID;
        params.push(entityRecordTypeIdParam);
      }
    }

    return params;
  }

  getDataSourceDataByIDAndParams(control: any, params: any, elementId: string) {
    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByIDAndParams(control?.dataSourceId, params).then((response: any[]) => {
      this._commonHelper.hideLoader();
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

        if (control.fieldType == 'Picklist (MultiSelect)') {
          setTimeout(() => {
            this.showHideMultiSelectDropdown(elementId, searchString);
          }, 0);
        } else if (control.fieldType == 'Picklist (int)' || control.fieldType == 'Picklist') {
          setTimeout(() => {
            this.showHideSingleSelectDropdown(elementId, searchString);
          }, 0);
        }
      }
    }).catch(() => {
      this._commonHelper.hideLoader();
    });
  }


  trackByCustomFieldControl(index: number, data: any) {
    return data.fieldName;
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  onDropdownClick(event: MouseEvent, control: any, elementIdPrefix: string): void {
    event.stopPropagation();

    let elementId: string = `${elementIdPrefix}-${control.fieldName}`.toLowerCase();

    this.hideMultiSelectDropdown("");
    this.hideSingleSelectDropdown(elementId);
  }

  onMultiSelectClear(control: any, elementIdPrefix: string) {
    this.customFieldJSONData[control.fieldName] = null;

    if (control?.dataSourceId && control?.dataSourceParams && control?.dataSourceParams?.length > 0) {
      let elementId: string = `${elementIdPrefix}-${control.fieldName}`.toLowerCase();

      const params = this.prepareDataSourceParams(control, '')
      this.getDataSourceDataByIDAndParams(control, params, elementId);
    }
  }

  onMultiSelectClick(event: MouseEvent, control: any, elementIdPrefix: string) {
    event.stopPropagation();

    let elementId: string = `${elementIdPrefix}-${control.fieldName}`.toLowerCase();

    this.hideMultiSelectDropdown(elementId);
    this.hideSingleSelectDropdown("");
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
}
