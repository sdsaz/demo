import { Component, Input, SimpleChanges } from '@angular/core';
import { ActivityService } from '../../common-activity-section/activity.service';
import { CommonHelper } from '../../../common-helper';

@Component({
  selector: 'ngx-bookmark',
  templateUrl: './bookmark.component.html',
  styleUrls: ['./bookmark.component.scss']
})
export class BookmarkComponent {
  @Input() entityTypeId: any;
  @Input() entityId: any;
  @Input() isStarred: boolean;
  @Input() isEditPermission: boolean;
  @Input() isFromKanbanOrListView: boolean = false;

  bookmarkData: any;
  constructor(private _commonHelper: CommonHelper,
    public _activityService: ActivityService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isFromKanbanOrListView && changes && (changes?.entityId?.currentValue != changes?.entityId?.previousValue) && changes?.entityId?.previousValue != undefined) {
      this.getBookMarkDetailsById();
    }
  }
  ngOnInit(): void {
    if (!this.isFromKanbanOrListView) {
      this.getBookMarkDetailsById();
    }
  }

  private getBookMarkDetailsById() {
    let params = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId
    };
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._activityService.GetBookmarkById(params).then(
        (response: any) => {
          if (response == null) {
            this.isStarred = false;
          }
          if (response) {
            this.isStarred = response?.isStarred;
          }
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        }).catch(() => {
          resolve(null);
        })
    });
  }

  onClickBookMark() {
    if (!this.isEditPermission) return;
    this._commonHelper.showLoader();
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      IsStarred: !this.isStarred
    }
    this._activityService.SaveBookmark(params).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        if (response.isStarred) {
          this.isStarred = response.isStarred;
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYBOOKMARK.BOOKMARKED_ADD')
          );
        }
        if (!response.isStarred) {
          this.isStarred = response.isStarred;
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYBOOKMARK.BOOKMARKED_REMOVE')
          );
        }
      }
    }, (error: any) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    })
  }

  private getTranslateErrorMessage(error): void {
    if (error?.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYBOOKMARK.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
