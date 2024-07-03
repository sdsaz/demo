import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../common-helper';
import { CommonService } from '../../sharedServices/common.service';
import { Actions } from '../../enum';

@Component({
  selector: 'ngx-entity-references-list',
  templateUrl: './entity-references-list.component.html',
  styleUrls: ['./entity-references-list.component.scss']
})

export class EntityReferencesListComponent implements OnInit {

  @Input() entityList: any = [];
  @Input() dialogTitle: string;
  @Input() label: string;
  @Input() entityTypeId: any;
  @Input() entityId: any;
  @Input() action?: Actions;

  //card data
  cardData: any[] = [];
  uniqueValues: any[] = [];
  showHyperLinks: any[] = [];
  entityNameTitle: any;
  totalRecords: any;
  showLoadingPanel: number = 0;
  actionEnums = Actions;
  

  constructor(private _ngbActiveModal: NgbActiveModal,
  public _commonHelper: CommonHelper,
  private _commonService: CommonService) { }

  ngOnInit(){
    this.loadData();
  }

  public onCloseForm() {
    this._ngbActiveModal.close();
  }

  public cancel() {
    this._ngbActiveModal.close();
  }

  public accept(){
    this._ngbActiveModal.close(true);
  }
  
  private getUniquePropertyValues(arr: any[], property: string, totalRecords: string, entityName: string, hyperlink: string, entityTypeID: any): any[] {
    this.uniqueValues = [];
    const uniqueValueSet = new Set();
    for (const object of arr) {
      if (!uniqueValueSet.has(object[property])) {
        uniqueValueSet.add(object[property]);
        let dataInObj: any = { 
          entityTypeName: object[property], 
          totalRecords: object[totalRecords], 
          entityTypeID: object[entityTypeID],
          entityName: object[entityName],
          hyperlink: object[hyperlink]
        };
        this.uniqueValues.push(dataInObj);
      }
    }
    return this.uniqueValues;
  }

  private loadData() {
    this.cardData = [];
    if (this.entityList.length > 0) {
      this.cardData = this.entityList.map(item => ({ 
        entityTypeName: item?.entityTypeName, 
        entityName: item?.entityName, 
        hyperlink: item?.hyperlink, 
        totalRecords: item?.totalRecords, 
        entityTypeID: item?.entityTypeID 
      }));
      this.getUniquePropertyValues(this.cardData, 'entityTypeName', 'totalRecords', 'entityName', 'hyperlink', 'entityTypeID');
      this.showHyperLinks = this.entityList.filter(x => x.entityTypeID == this.uniqueValues[0].entityTypeID);
      let showEntityTypeName = this.entityList.filter(x => x.entityTypeName == this.uniqueValues[0]?.entityTypeName);
      this.entityNameTitle = showEntityTypeName[0]?.entityTypeName;
    }
    else {
      this.cardData = this.entityList.map(item => ({ 
        entityTypeName: item?.entityTypeName, 
        entityName: item?.entityName, 
        hyperlink: item?.hyperlink, 
        totalRecords: item?.totalRecords, 
        entityTypeID: item?.entityTypeID 
      }));
      this.getUniquePropertyValues(this.cardData, 'entityTypeName', 'totalRecords', 'entityName', 'hyperlink', 'entityTypeID');
      this.showHyperLinks = this.entityList.filter(x => x.entityTypeID == this.uniqueValues[0].entityTypeID);
      let showEntityTypeName = this.entityList.filter(x => x.entityTypeName == this.uniqueValues[0]?.entityTypeName);
      this.entityNameTitle = showEntityTypeName[0]?.entityTypeName;
    }
  }
  
  refreshData() {
    const params = {
      EntityTypeId: this.entityTypeId,
      EntityId: this.entityId
    } 
    this.showLoader();
    this._commonService.getEntityReferences(params).then((response: any) => {
      this.hideLoader();
      if(response) {
        this.entityList = response;
        if(this.entityList.length == 0) {
          this.onCloseForm();
        }else {
          this.loadData();
        }
      }
    }, (error: any) => {
      this.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  getEntityHyperLinks(item: any) {
    let data = this.entityList.filter(x => x.entityTypeName == item.entityTypeName);
    this.showHyperLinks = data.map(s => ({ hyperlink: s?.hyperlink, entityName: s?.entityName, totalRecords: s?.totalRecords, entityId: this.entityId }));
    let records = this.showHyperLinks.map(k => k?.totalRecords);
    this.totalRecords = records[0];
    let entityTypeName = data.map(m => m.entityTypeName);
    this.entityNameTitle = entityTypeName[0];
  }

  showLoader() {
    this.showLoadingPanel++;
  }

  hideLoader() {
    if (this.showLoadingPanel > 0) {
      this.showLoadingPanel--;
    }
  }

  ngOnDestroy(): void {
   
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.USER.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

}