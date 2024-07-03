  import { Component,EventEmitter,Input,OnChanges,OnInit,Output,SimpleChanges,ViewChild,forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonHelper } from '../../../common-helper';
import { CommonService } from '../../../sharedServices/common.service';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { DataSources, Entity } from '../../../enum';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-related-to-control',
  templateUrl: './related-to-control.component.html',
  styleUrls: ['./related-to-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR, 
      useExisting: forwardRef(() => RelatedToControlComponent),
      multi: true
    }
    // {
    //   provide: NG_VALIDATORS,
    //   useExisting: forwardRef(() => RelatedToControlComponent),
    //   multi: true,
    // }
  ] 
})
export class RelatedToControlComponent implements OnInit,OnChanges, ControlValueAccessor {
  @Input() entityTypeId: number
  @Input() entityWorkflowId:number
  @Input() entityRecordTypeId:number
  @Input() SelectedEntityTypeId:any
  @Input() parentEntityList:any[]
  @Input() relatedEntityTypeId:number
  @Input() isReadOnly:boolean=false
  @Input() SelectedEntityId:number

  @Output() onChangeRelatedTo = new EventEmitter<any>();

  @Output() valueChange = new EventEmitter();

  @Output() isAddRelatedTo = new EventEmitter<boolean>();

  @Output() isShowAddButton = new EventEmitter<boolean>();
  showRelatedToLoader: boolean = false;
  modalRef: NgbModalRef | null;
  relatedToList:any[];
  workflowsListAccount: any;
  workflowListContact: any;
  workflowsListProduct: any;
  WorkflowListopportunity:any;
  workflowListCase:any;

  recordTypesForAccount: any;
  recordTypesForContact: any;
  recordTypesForProduct: any;
  recordTypesForOpportunity:any;
  recordTypesForCase:any;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };
    /*
  event variables
  */
  value: any = {};
  disabled: boolean = false;
  relatedToPlaceholder:string;
  //isReadOnly: boolean = false;

  
  /*
  onChange event
  */
  onChange = (value: any) => {};
  /*
  onTouched event
  */
  onTouched = () => {};
  /*
  focusout event
  */
  focusout = (value: any) => {};
  /*
  keypress event
  */
  keypress = (value: any) => {};
  /*
  click event
  */
  click = (value: any) => {};
  constructor(public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _dataSourceService:DatasourceService,
    private _modalService: NgbModal) { 
     
     }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.SelectedEntityTypeId  && (changes.SelectedEntityTypeId.currentValue != changes.SelectedEntityTypeId.previousValue))
      {
        this.setRelatedToPlaceholder();
        this.getRelatedTo(this.SelectedEntityTypeId,0,"",this.SelectedEntityId);
      }
  }
    
  ngOnInit(): void {
    
    this.setRelatedToPlaceholder();

    this.getRelatedToParentEntity();
  }

  setRelatedToPlaceholder(){
    if(this.SelectedEntityTypeId == null)
      {
    this.relatedToPlaceholder=this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.RELATEDTO_SELECT'));
      }
    else{
      const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.SelectedEntityTypeId);
      let relatedToName = foundRecord?.['displayName'].toString().trim();
      this.relatedToPlaceholder=this._commonHelper.getInstanceTranlationData('CASES.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: relatedToName }).replace('(','').replace(')','').trim();
    }
  }
  getRelatedToParentEntity(){
    return new Promise((resolve, reject) => {
      this.parentEntityList = [];
      const entityTypeList = this._commonHelper.entityTypeList;
      const entityType = entityTypeList.find(de => de['id'] == this.entityTypeId);
      if (entityType && entityType.parentEntityTypeIDs) {
        let parentEntityTypeidArray = entityType?.parentEntityTypeIDs?.split(',');
        for(let i=0 ;i<parentEntityTypeidArray.length;i++){
            let entity = entityTypeList.find(de => de['id'] == parentEntityTypeidArray[i]);
            this.parentEntityList.push(entity);
        }
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  onRelatedToChange(e) {
    this.SelectedEntityId = null;
    if (e) {
      this.relatedEntityTypeId=e.value;
      this.getRelatedTo(e.value, 0, e.filter);
      this.onChangeRelatedTo.emit(e);
    } else {
      this.relatedToList = [];
    }
    
  }
  relatedToOnChange(){
      this.valueChange.emit(this.SelectedEntityId);
      this.writeValue(this.SelectedEntityId);
  }

  // get related to entities based on entity type
 private getRelatedTo(selectedEntities: any, includeAllEntities, searchString: any = '', SelectedEntityId = null) {
  return new Promise((resolve, reject) => {
    this.showRelatedToLoader = true;
    this.relatedToList = [];
    let params = [{
      name: 'EntityTypeIDs',
      type: 'string',
      value: selectedEntities > 0 ? selectedEntities.toString() : null
    },
    {
      name: 'SelectedEntityID',
      type: 'int',
      value: SelectedEntityId
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

onRelatedToClear(e) {
  if (e.value) {
    this.getRelatedTo([e['value'].id], 0, e.filter);
  } else {
    this.relatedToList = [];
    this.SelectedEntityId = null;
    this.relatedEntityTypeId = null;
    this.getRelatedTo([Entity.Accounts, Entity.Contacts, Entity.Products, Entity.Cases, Entity.Opportunities], 0, e.filter);
    this.onChangeRelatedTo.emit(e);
    this.isAddRelatedTo.emit(false);
    this.isShowAddButton.emit(false);
  }
}

relatedToOnFilter(e, selecteditemId) {
  let selectEntityId = selecteditemId;
  let entityTypeId: any = [];
  if (selectEntityId) {
    entityTypeId.push(selectEntityId);
  }
  this.getRelatedTo(entityTypeId,0,e.filter,selecteditemId?.toString());
}

registerOnChange(fn: any): void {
    this.onChange = fn;
}

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.SelectedEntityId=value
      this.onChange(value);
  }
}

}
