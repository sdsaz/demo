import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { EntityReviewDialogComponent } from '../../sharedComponents/entity-review/entity-review-dialog/entity-review-dialog.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatasourceService } from '../../sharedServices/datasource.service';
import { DataSources, UserTypeID } from '../../enum';
import { CommonHelper } from '../../common-helper';

@Component({
  selector: 'ngx-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, OnChanges {

  /**
   * Emit event to parent when new entity is added
   */
  @Output() addEntity = new EventEmitter<any>();

  /**
   * Emit event to parent when entity is deleted
   */
  @Output() deleteEntity = new EventEmitter<number>();

  
  @Input() entityID: number;

  @Input() entityTypeID: number = null;

  @Input() entitySubTypeID: number = null;

  @Input() isEntityActive: boolean = true;

  @Input() entityRecordTypeId: number = null;

  @Input() entityRelatedToId: number = null;

  /**
   * Timeline Data of Parent
   */
  @Input() timeLineData: any[] = [];

  /**
   * Routing url for Entity
   */
  @Input() redirectUrl: string;

  /**
   * Entity Sub Types of Entity
   */
  @Input() entitySubTypes: any[] = [];

  /**
   * When wants to show Add button panel
   */
  @Input() isShowAddPanel: boolean = false;

  /**
   * List of Sub Types buttons which needs to show in Add Panel
   */
  @Input() subTypesButtonList: any[] = [];

  userTypeID = UserTypeID;

  reviewTextSingular: string;
  reviewTextPlural: string;

  constructor(private _modalService: NgbModal,
    private _dataSourceService: DatasourceService,
    public _commonHelper: CommonHelper,
    private ref: ChangeDetectorRef,
    private _router: Router) {
  }

  ngOnInit(): void {
    this.reviewTextPlural = this._commonHelper.getConfiguredEntityName('{{EntityReviews_plural_p}}');
    this.reviewTextSingular = this._commonHelper.getConfiguredEntityName('{{EntityReviews_p}}');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeLineData?.currentValue != changes.timeLineData?.previousValue) {
      this.addContextMenu(this.timeLineData);
    }
  }

  /**
   * Add context menu according to Entity Subtypes relation (Recursive)
   * @param timeLineData Entity Timeline Data
   * @returns 
   */
  private addContextMenu(timeLineData: any[]) {
    timeLineData.forEach(item => {

      const subType = this.entitySubTypes.find(x => x.id == item.typeID);
      item['viewPermissionHash'] = subType['viewPermissionHash'];
      item['deletePermissionHash'] = subType['deletePermissionHash'];
      const level: number = this.entitySubTypes.find(x => x.id == item.typeID)?.level ?? 0;
      item['contextMenu'] = this.entitySubTypes.filter(x => x.parentID == item.typeID && x.level == level + 1);
      item['isContextMenuVisible']= this._commonHelper.havePermission(subType['deletePermissionHash']);  

      if (item['contextMenu'] && item['contextMenu'].length > 0) {
        item['contextMenu'].forEach(element => {
          item['isContextMenuVisible'] = item['isContextMenuVisible'] || this._commonHelper.havePermission(element['addPermissionHash']);
        });
      }

      if (item.children && item.children.length > 0) {
        this.addContextMenu(item.children);
      }
    });
  }

  /**
   * It will emit data to parent entity add operation according to selected item.
   * @param selectedItem Selected Item
   * @param parent immediate  Parent of the clicked item
   */
  addEvent(selectedItem: any, parent?: any) {
    const obj = {
      typeID: selectedItem.id,
      typeName: selectedItem.name,
      entityID: parent?.id ?? this.entityID,
      parentTypeID: parent?.typeID ?? this.entitySubTypeID, //Parent Entity Sub Type ID
      entityTypeID: selectedItem.entityTypeID //Selected Entity Sub Type ID
    }
    this.addEntity.emit(obj);
  }

  //#region Entity Review Related Logic
  openEntityReviewDialog(data: any) {
    if (!this.isEntityActive || !data.isActive) return;

    const optionsForPopupDialog: any = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    let modalRef: NgbModalRef | null;
    
    let rating = data.rating;
    rating = rating <= 0 ? undefined : rating;

    modalRef = this._modalService.open(EntityReviewDialogComponent, optionsForPopupDialog);
    modalRef.componentInstance.entityReviewId = data.entityReviewID;
    modalRef.componentInstance.entityTypeId = this.entityTypeID;
    modalRef.componentInstance.entityId = data.id;
    modalRef.componentInstance.rating =  rating;

    modalRef.result.then(response => {
      if (response != undefined) {
        data.entityReviewID = response.id;  //Update Entity Review Id 
        //this.ref.detectChanges();
        this.getAverageRatingForEntity(data);
      }
    });
  }

  private prepareParamsForAverageRating(entityID: number): any[] {
    return [
      { name: '@EntityTypeID', type: 'int', value: this.entityTypeID },
      { name: '@EntityID', type: 'int', value: entityID }
    ];
  }

  private getAverageRatingForEntity(data: any) {
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.AVERAGERATINGFORENTITIES, this.prepareParamsForAverageRating(data.id)).then((response: any) => {
      if (response && response.length > 0) {
        data.rating = response[0].rating;
        data.totalReviews = response[0].totalReviews;
        //this.ref.detectChanges();
      }
    });
  }
  //#endregion

  //#region Action Code
  editRow(rowData: any) {
    this._router.navigateByUrl(`/${this.redirectUrl}/details/${rowData.id}`);
  }

  deleteRow(rowData: any) {
    this.deleteEntity.emit(rowData);
  }
  //#endregion

  identify(index: number, item: any) {
    return item.id;
  }
}
