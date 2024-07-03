import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { InputTypeList } from './filterConstants';
import { CommonHelper } from '../../../common-helper';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'ngx-dynamic-common-filter',
  templateUrl: './dynamic-common-filter.component.html',
  styleUrls: ['./dynamic-common-filter.component.scss']
})
export class DynamicCommonFilterComponent implements OnInit {

  @Input() filterConfigList: any[];
  @Output() getFilterValues = new EventEmitter<any>();
  @Output() multiSelectFilterEvent = new EventEmitter<any>();
  @Output() multiSelectOnchangeEvent = new EventEmitter<any>();
  @Output() isFilterVisibleChange =  new EventEmitter<boolean>();

  inputTypeList = InputTypeList;
  minToDateValue: any;
  maxDate: any;
  currentDate = new Date();

  public getCurrentDate() {
    return this.currentDate;
  }
  currentYearRange: string = this.currentDate.getFullYear().toString() + ":" + this._commonHelper.globalMaxDate.getFullYear().toString();

  hideAdvanceFilter: boolean = false;

  //date range picker start 
  dateSelectOptionsButtonBar = ['today', 'yesterday', 'last7days'];
  //date range picker end
  constructor(public _commonHelper: CommonHelper) { }

  ngOnInit(): void {
    this.filterConfigList.forEach(
      (filter: any) => {
        filter.show =true;
        //SDC-1653 search by group name
        if(filter?.options){
          filter.options.forEach(op => {
            if(op?.items){
               op.items.forEach(pl=>pl.groupLabel = op.label)
            }
          });
        }
        if (filter.inputType == 'MultiSelect' && filter.ngModel) {
          this.onChangeMultiSelect(null,filter);
        }
      });
  }

  sendFilterData(mode: string) {
    let filterData = [];
    this.filterConfigList.forEach(
      (filter: any) => {
        let obj = {};
        if (mode == 'SET') {
          if (filter.inputType == 'MultiSelect') {
            obj[filter.name] = filter.ngModel == '' || filter.ngModel == null || filter.ngModel == undefined ? '' : filter.ngModel.join(',');
            obj['isCountableFilter'] = filter.isCountableFilter; 
          }
          else if (filter.inputType == 'DateRangePicker') {
            const selectedValue = filter.ngModel || [];

            if (this.filterConfigList.some(controlItem => controlItem.name == filter.fromDateControlName)) {
              const fromDateObj = this.filterConfigList.find(controlItem => controlItem.name == filter.fromDateControlName).ngModel = selectedValue[0] || null;
              filterData.forEach((objectItem: any) => {
                if (Object.keys(objectItem)[0] == filter.fromDateControlName) {
                  objectItem[filter.fromDateControlName] = fromDateObj;
                }
              });
            }

            if (this.filterConfigList.some(controlItem => controlItem.name == filter.toDateControlName)) {
              const toDateObj = this.filterConfigList.find(controlItem => controlItem.name == filter.toDateControlName).ngModel = selectedValue[1] || null;
              filterData.forEach((objectItem: any) => {
                if (Object.keys(objectItem)[0] == filter.toDateControlName) {
                  objectItem[filter.toDateControlName] = toDateObj;
                }
              });

            }

            obj[filter.name] = filter.ngModel;
            obj['isCountableFilter'] = filter.isCountableFilter; 
          }
          else {
            obj[filter.name] = filter.ngModel;
            obj['isCountableFilter'] = filter.isCountableFilter; 
          }
        }
        else if (mode == 'RESET') {
          this.minToDateValue = null;
          if (filter.inputType == 'Calendar') {
            filter.ngModel = filter.hasOwnProperty("ngModelDefaultValue") && filter.ngModelDefaultValue != null ? filter.ngModelDefaultValue : null;
          }
          else if (filter.inputType == 'DateFrom') {
            filter.ngModel = filter.hasOwnProperty("ngModelDefaultValue") && filter.ngModelDefaultValue != null ? filter.ngModelDefaultValue : null;
          }
          else if (filter.inputType == 'DateTo') {
            filter.ngModel = filter.hasOwnProperty("ngModelDefaultValue") && filter.ngModelDefaultValue != null ? filter.ngModelDefaultValue : null;
          }
          else if (filter.inputType == 'DateRangePicker') {
            filter.ngModel = filter.hasOwnProperty("ngModelDefaultValue") && filter.ngModelDefaultValue != null ? filter.ngModelDefaultValue : [];
          }
          else if (filter.inputType == 'MultiSelect') {
            if (filter.hasOwnProperty("ngModelDefaultValue") && (filter.ngModelDefaultObject && filter.ngModelDefaultObject.length > 0)) {
              if (filter?.options && !filter?.options?.some((x: any) => x[filter.optionValue] == filter.ngModelDefaultValue)) {
                filter.options = filter?.ngModelDefaultObject;
              }
            } 
            if (filter.hasOwnProperty("bindValues") && (filter.bindValues && filter.bindValues.length > 0)) {
              delete filter.bindValues;
            }
            if (filter.hasOwnProperty("bindValues") && (filter.bindValues && filter.bindValues.length > 0)) {
              delete filter.bindValues;
            }
            if(filter.isOnChangeEvent){
              this.multiSelectOnchangeEvent.emit({ event: [], controlName: filter.name, selectedIds: ''});
            }
            filter.ngModel = filter.hasOwnProperty("ngModelDefaultValue") && filter.ngModelDefaultValue != null ? filter.ngModelDefaultValue : [];                       
          }
          else {
            filter.ngModel = filter.hasOwnProperty("ngModelDefaultValue") && filter.ngModelDefaultValue != null ? filter.ngModelDefaultValue : null;
          }
          obj[filter.name] = this.setNgModelValues(filter.inputType, filter.ngModel);
          obj['isCountableFilter'] = filter.isCountableFilter;
        }
        else {
          obj[filter.name] = '';
          obj['isCountableFilter'] = 0; 
        }

        filterData.push(obj);
      }
    ); 
    filterData = this.removeExtraParameters(filterData) 
    this.getFilterValues.emit(filterData);
  }

  setNgModelValues(ControlType: string, ngModel: any) {
    if (ControlType == 'MultiSelect') {
      return ngModel == '' || ngModel == null || ngModel == undefined ? '' : ngModel.join(',')
    }
    else {
      return ngModel;
    }
  }

  showhideFilter(){
    this.isFilterVisibleChange.emit(false)
  }

  SetMinToDate(selectedDate) {
    if (selectedDate != null && selectedDate != undefined) {
      this.filterConfigList.forEach(group => {
        let fromToDateType = group.inputType;
        if (fromToDateType == 'DateTo') {
          this.minToDateValue = selectedDate;
          group.ngModel = null;
        }
      });
    }
  }

  multiSelectFilter(e, controlName, selectedIds, multiSelect: MultiSelect) {   

    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();

    if (this.multiSelectFilterEvent) {
      this.multiSelectFilterEvent.emit({ filter: e.filter.trim(), controlName: controlName, selectedIds: selectedIds?.toString() });
    }
  }
 
  onChangeMultiSelect(event,filterConfig: any) {
    if(filterConfig.isOnChangeEvent && event){
      this.multiSelectOnchangeEvent.emit({ event: event, controlName: filterConfig.name, selectedIds: event.itemValue?.toString() });
    }
    if (!filterConfig.relatedToIconClass || filterConfig.relatedToIconClass === '') return;
     this.setBindValues(filterConfig);
  }
  
  setBindValues(filterConfig: any){
    filterConfig['bindValues'] = [];
    filterConfig.ngModel.forEach(relatedValue => {
      filterConfig.options.forEach(optionValue => {
        if (optionValue.value == relatedValue) {
          filterConfig['bindValues'].push(optionValue.label)
        }
      });
    });
  }

  removeExtraParameters(parameters: any[]): any {
    let deletedIndex = [];

    parameters.forEach((objectItem : any, index) => {
      if (Object.keys(objectItem)[0] == 'rangeDates') {
        deletedIndex.push(index);
      }
    });

    deletedIndex.forEach((indexItem) => { 
      parameters.splice(indexItem, 1); 
    });

    return parameters;
  }

  // date filter validation
  onCustomCalenderValueChange(event,model)
  {
    if (event == null) 
    {
      this.filterConfigList.find(x => x.ngModel == model).ngModel = []
       this.minToDateValue = null;
       this.maxDate = null;
    }
    if (event[0] < this._commonHelper.globalMinDate || event[0] > this._commonHelper.globalMaxDate || event[1] > this._commonHelper.globalMaxDate || event[1] < this._commonHelper.globalMinDate) 
    {
      this.filterConfigList.find(x => x.ngModel == model).ngModel = []
      this.minToDateValue = null;
      this.maxDate = null;
    }
  }
}
