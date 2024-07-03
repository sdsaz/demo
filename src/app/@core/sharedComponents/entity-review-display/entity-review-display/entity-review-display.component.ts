import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { DataSources } from '../../../enum';
import { CommonHelper } from '../../../common-helper';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EntityReviewDialogComponent } from '../../entity-review/entity-review-dialog/entity-review-dialog.component';

@Component({
  selector: 'entity-review-display',
  templateUrl: './entity-review-display.component.html',
  styleUrls: ['./entity-review-display.component.scss']
})
export class EntityReviewDisplayComponent implements OnInit, OnDestroy, OnChanges {

  //input params
  @Input() entityTypeId: number;
  @Input() entityId: number;
  @Input() rating: number;
  @Input() review: number;
  @Input() entityReviewID: number;
  @Input() isFromKanbanOrListView: boolean = false;
  @Input() isEditPermission: boolean = true;

  entityReviewDetails:any=null;
  showSkeleton:boolean = true;
  hasError:boolean = false;
  refreshEntityReviewsDataSubscription: Subscription;
  reviewPostText: any

  constructor(public _commonHelper: CommonHelper, private _dataSourceService: DatasourceService, private _modalService: NgbModal) { 
    this.reviewPostText = this.review > 1 ? this._commonHelper.getConfiguredEntityName('{{EntityReviews_plural_p}}') : this._commonHelper.getConfiguredEntityName('{{EntityReviews_p}}');
  }

  ngOnChanges(changes: SimpleChanges): any {
    if (!this.isFromKanbanOrListView && changes && changes?.entityId?.currentValue != changes?.entityId?.previousValue) {
      this.getAverageRatingForEntity();
    }
  }

  ngOnInit() {
   if(!this.isFromKanbanOrListView){
    this.refreshEntityReviewsDataSubscription = this._commonHelper.entityReviewsChangeAsObs.subscribe((isRefreshEntityReviewsData: Boolean) => {
      if (isRefreshEntityReviewsData) {
        this.showSkeleton = true;
        this.hasError = false;
        this.getAverageRatingForEntity();
      }
    });
   }
  }

  ngOnDestroy() {
    if (!this.isFromKanbanOrListView) {
      this.refreshEntityReviewsDataSubscription.unsubscribe();
    }
  }

  private prepareParamsForAverageRating() {
    const params = [];
    const paramItem = {
      name: '@EntityTypeID',
      type: 'int',
      value: this.entityTypeId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: '@EntityID',
      type: 'int',
      value: this.entityId,
    };
    params.push(paramItem1);

    return params;
  }

  private getAverageRatingForEntity(data?: any) {
      let params = this.prepareParamsForAverageRating();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.AVERAGERATINGFORENTITIES, params).then((response:any) => {
        if(response && response.length > 0){
          this.entityReviewDetails = response[0];
          this.rating = this.entityReviewDetails['rating'];
          this.review = this.entityReviewDetails['totalReviews'];
          this.entityReviewDetails.postText = this.entityReviewDetails.totalReviews > 1 ? this._commonHelper.getConfiguredEntityName('{{EntityReviews_plural_p}}') : this._commonHelper.getConfiguredEntityName('{{EntityReviews_p}}');
          this.showSkeleton = false;
        }
        else{
          this.hasError = true;  
        }
      }, (error) => {
        this.hasError = true;
      });
  }

  openEntityReviewDialog() {
    if (!this.isEditPermission) return;
    
    const optionsForPopupDialog: any = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    let modalRef: NgbModalRef | null;

    let rating = this.isFromKanbanOrListView ? this.rating : this.entityReviewDetails['rating'];
    rating = rating <= 0 ? undefined : rating;

    modalRef = this._modalService.open(EntityReviewDialogComponent, optionsForPopupDialog);
    modalRef.componentInstance.entityReviewId = this.isFromKanbanOrListView ? this.entityReviewID : this.entityReviewDetails['entityReviewID'];
    modalRef.componentInstance.entityTypeId = this.entityTypeId;
    modalRef.componentInstance.entityId = this.entityId;
    modalRef.componentInstance.rating = rating;

    modalRef.result.then(response => {
      if (response != undefined) {
        this.entityReviewID = response.id;  //Update Entity Review Id 
        //this.ref.detectChanges();
        this.getAverageRatingForEntity();
      }
    });
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
