import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonHelper } from '../../../common-helper';
import { WorkflowmanagementService } from '../../../../pages/workflowmanagement/workflowmanagement.service';
import { ActivityService } from '../../common-activity-section/activity.service';
import { FileSignedUrlService } from '../../../sharedServices/file-signed-url.service';
import { Entity, FieldNames, UserTypeID, SectionCodes } from '../../../enum';

@Component({
  selector: 'ngx-history-tab',
  templateUrl: './history-tab.component.html',
  styleUrls: ['./history-tab.component.scss']
})

export class HistoryTabComponent implements OnInit, OnChanges {

  @Input() entityWorkflowId: number;
  @Input() entityTypeId: number;
  @Input() entityId: number;
  @Input() hoursInDay: number = 24;
  @Input() refreshStageHistory: boolean;
  @Input() refreshActivityHistory: boolean;
  @Input() isListViewLayout: boolean;
  @Input() privacyLevel: number;
  @Input() entityHiddenFieldSettings: boolean;

  userTypeID = UserTypeID;

  selectedTab: string = '';
  navTabs: any[] = [];
  cols: any;

  entityStageTaskHistory: any[] = [];
  isStageHistoryLoaded: boolean = false;

  activityCols: any[] = [
    { field: 'type', header: 'HISTORY.TAB_ACTIVITY.TYPE' },
    { field: 'action', header: 'HISTORY.TAB_ACTIVITY.ACTION' },
    { field: 'name', header: 'HISTORY.TAB_ACTIVITY.NAME' },
    { field: 'createdBy', header: 'HISTORY.TAB_ACTIVITY.UPDATED_BY' },
    { field: 'createdOn', header: 'HISTORY.TAB_ACTIVITY.UPDATED_ON' }
  ];

  activityHistory: any[] = [];
  onceActivityHistoryClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  isActivityHistoryLoaded: boolean = false;
  isLoadMoreCompleted: boolean = true;

  activityLastAuditLogID: string = '0';
  activityLastAuditOperationLogID: string = '0';
  activityLastTaskID: string = '0';
  activityLastNoteID: string = '0';
  activityLastEventID: string = '0';
  activityLastTagID: string = '0';
  activityLastFileID: string = '0';

  isAssignedToFieldHistoryColumn: boolean;
  isVerifiedByFieldHistoryColumn: boolean;

  constructor(public _commonHelper: CommonHelper,
    private _workflowmanagementService: WorkflowmanagementService,
    private activityService: ActivityService,
    private _fileSignedUrlService: FileSignedUrlService) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    //refresh Stage Data
    if (changes?.refreshStageHistory?.previousValue != undefined && changes.refreshStageHistory.currentValue != changes.refreshStageHistory.previousValue) {
      this.onceStageHistoryClicked = false;
      setTimeout(() => {
        this.entityStageTaskHistory = [];
        this.getEntityStageTaskTransitionHistory();
        this.onceStageHistoryClicked = true;
      }, 500);
    }

    //refresh Activity Data
    if (changes?.refreshActivityHistory?.previousValue != undefined && changes.refreshActivityHistory.currentValue != changes.refreshActivityHistory.previousValue && changes.refreshActivityHistory.currentValue) {
      this.onceActivityHistoryClicked = false;
      setTimeout(() => {
        this.resetLastRecordIds();
        this.activityHistory = [];
        this.getActivitiesHistory(false);
        this.onceActivityHistoryClicked = true;
      }, 500);
    }
  }

  ngOnInit() {
     //hide assignedTo field Column;
     if(this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.HistoryColumn, FieldNames.AssignedTo)) {
      this.isAssignedToFieldHistoryColumn = true;
    }else {
      this.isAssignedToFieldHistoryColumn = false;
    }

    //hide verifiedBy field Column;
    if(this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.HistoryColumn, FieldNames.VerifiedBy)) {
      this.isVerifiedByFieldHistoryColumn = true;
    }else {
      this.isVerifiedByFieldHistoryColumn = false;
    }
    
    this.setColumns();
    this.setDefaultNavTabs();
    this.changeTableColumnName();

    if (this.selectedTab == 'navStageHistory') {
      this.getEntityStageTaskTransitionHistory();
      this.onceStageHistoryClicked = true;
    }
    else if (this.selectedTab == 'navActivityHistory') {
      this.getActivitiesHistory();
      this.onceActivityHistoryClicked = true;
    }

   
    
  }

  setColumns(): any {
    this.cols = [
      { field: 'name', header: 'HISTORY.TAB_STAGE_HISTORY.STAGE_TASK', sort: false, visible: true },
      { field: 'totalTime', header: 'HISTORY.TAB_STAGE_HISTORY.TOTAL_TIME', sort: false, showHrsInDayTooltip: true, visible: true },
      { field: 'spentTime', header: 'HISTORY.TAB_STAGE_HISTORY.SPENT_TIME', sort: false, showHrsInDayTooltip: true, visible: true },
      { field: 'pauseTime', header: 'HISTORY.TAB_STAGE_HISTORY.PAUSE_TIME', sort: false, showHrsInDayTooltip: true, visible: true },
      { field: 'assignedTo', header: 'HISTORY.TAB_STAGE_HISTORY.ASSIGNED_TO', sort: false, visible: !this.isAssignedToFieldHistoryColumn },
      { field: 'verifiedBy', header: 'HISTORY.TAB_STAGE_HISTORY.VERIFIED_BY', sort: false, visible: !this.isVerifiedByFieldHistoryColumn },
      { field: 'createdBy', header: 'HISTORY.TAB_STAGE_HISTORY.UPDATED_BY', sort: false , visible: true},
      { field: 'createdOn', header: 'HISTORY.TAB_STAGE_HISTORY.UPDATED_ON', sort: false, visible: true }
    ];
  }

  setDefaultNavTabs(): void {
    this.navTabs = [
      { tabName: 'HISTORY.TAB_STAGE_HISTORY.TITLE', tabLink: 'navStageHistory', condition: (this.entityWorkflowId != undefined || this.entityWorkflowId != null), displayOrder: 101 },
      { tabName: 'HISTORY.TAB_ACTIVITY.TITLE', tabLink: 'navActivityHistory', condition: true, displayOrder: 201 }
    ];

    if (this.entityWorkflowId && this.isListViewLayout) {
      let tabInfo = this.navTabs.find(x => x.tabLink === 'navStageHistory');
      tabInfo.tabName = 'HISTORY.TAB_STAGE_HISTORY.STAGE_TITLE';
    }
    
    this.selectedTab = this.navTabs.filter(x => x.condition)[0].tabLink;
  }

  changeTableColumnName() {
    if (!this.isListViewLayout) return;

    let tabInfo = this.cols.find(x => x.field === 'name');
    if (tabInfo) {
      tabInfo.header = 'HISTORY.TAB_STAGE_HISTORY.STATUS';
    }
  }

  // set current active tab
  setTab(tab) {
    this.selectedTab = tab.tabLink;

    if (!this.onceActivityHistoryClicked && this.selectedTab == 'navActivityHistory') {
      this.getActivitiesHistory();
      this.onceActivityHistoryClicked = true;
    }
  }

  onLoadMoreActivityClick() {
    this.getActivitiesHistory(true);
  }

  //START Region Private Methods

  // get entity stage task transition history
  private getEntityStageTaskTransitionHistory() {
    this.isStageHistoryLoaded = false;

    if ((+this.entityWorkflowId || 0) > 0) {
      let params = {
        entityWorkflowId: this.entityWorkflowId,
        entityTypeId: this.entityTypeId,
        entityId: this.entityId
      }

      this._workflowmanagementService.getEntityStageTaskHistory(params).then(response => {
        if (response) {
          let historyList: any[] = response as [];
          if (historyList.length > 0) {
            historyList.forEach(item => {
              //Stage Transition data
              let historyItem: any = {
                name: item.stageName,
                type: 0,
                assignedTo: item.assignedTo,
                assignedToName: item.assignedToName,
                assignedToImagePath: item.assignedToImagePath,
                assignedToAvatarBGColor: item.assignedToAvatarBGColor,
                assignedToShortName: item.assignedToShortName,
                verifiedBy: item.verifiedBy,
                verifiedByName: item.verifiedByName,
                created: item.created,
                createdBy: item.createdBy,
                createdByName: item.createdByName,
                createdByImagePath: item.createdByImagePath,
                totalTime: item.totalTime ?? 0,
                pauseTime: item.pauseTime ?? 0,
                spentTime: item.spentTime ?? 0
              }

              let tasksAndPauseData: any[] = [];
              //Tasks & Pause Data
              if (item.tasksAndPauseData != null) {
                item.tasksAndPauseData = JSON.parse(item.tasksAndPauseData);
                if (item.tasksAndPauseData.length > 0) {
                  item.tasksAndPauseData.forEach(subItem => {
                    let tasksAndPauseItem: any = {
                      name: subItem.Name,
                      type: subItem.Type,
                      created: subItem.Created,
                      createdBy: subItem.CreatedBy,
                      createdByName: subItem.CreatedByName,
                      createdByImagePath: subItem.CreatedByImagePath,
                    }

                    tasksAndPauseData.push({ data: tasksAndPauseItem });
                  });
                }
              }

              //push only if children exists
              if (tasksAndPauseData.length > 0) {
                this.entityStageTaskHistory.push({ data: historyItem, children: tasksAndPauseData });
                tasksAndPauseData.forEach(x => {
                  this._fileSignedUrlService.getObjectFileSignedUrl(x.data, Entity.Users, 'createdByImagePath', 'createdBySignedUrl');
                });
                
              }
              else {
                this.entityStageTaskHistory.push({ data: historyItem });
              }
              
              this._fileSignedUrlService.getObjectFileSignedUrl(historyItem, Entity.Users,'assignedToImagePath', 'assignedToSignedUrl')
                .then(() => {
                  this._fileSignedUrlService.getObjectFileSignedUrl(historyItem, Entity.Users,'createdByImagePath', 'createdBySignedUrl')
              });

            });
          }
        }
        else {
          this.entityStageTaskHistory = [];
        }

        this.isStageHistoryLoaded = true;
      }, (error) => {
        this.isStageHistoryLoaded = true;
        this.getTranslateErrorMessage(error);
      });
    }
  }

  private getActivitiesHistory(isLoadMore: boolean = false) {

    this.showHideActivityLoader(true, isLoadMore);

    let params = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      lastAuditLogID: this.activityLastAuditLogID,
      lastAuditOperationLogID: this.activityLastAuditOperationLogID,
      lastTaskID: this.activityLastTaskID,
      lastNoteID: this.activityLastNoteID,
      lastEventID: this.activityLastEventID,
      lastTagID: this.activityLastTagID,
      lastFileID: this.activityLastFileID,
    }

    this.activityService.getActivitiesHistory(params).then(response => {
      if (response) {
        const responseArray: any[] = response as [];
        //remove load more row
        this.addOrRemoveLastObjectFromArray(this.activityHistory, { isLoadMoreRow: true }, false);
        if (responseArray && responseArray.length > 0 && responseArray[0] != null) {
          
          if (isLoadMore) {
            this.activityHistory = this.activityHistory.concat(responseArray);
          }
          else {
            this.activityHistory = responseArray;
          }
          
          //set last record ids
          this.setLastRecordIds(responseArray[0], isLoadMore)
          // add load more row
          this.addOrRemoveLastObjectFromArray(this.activityHistory, { isLoadMoreRow: true }, responseArray[0]?.hasMoreRecords ?? true);

          this._fileSignedUrlService.getFileSingedUrl(this.activityHistory, 'actionByImage','actionBySignedUrl',Entity.Users);
        }
      }
      this.showHideActivityLoader(false, isLoadMore);
    }, (error) => {
      this.showHideActivityLoader(false, isLoadMore);
      this.getTranslateErrorMessage(error);
    });
  }

  private setLastRecordIds(firstItem: any, isLoadMore: boolean = false) {
    this.activityLastAuditLogID = isLoadMore ? (firstItem.lastAuditLogID ?? this.activityLastAuditLogID) : (firstItem.lastAuditLogID ?? '0');
    this.activityLastAuditOperationLogID = isLoadMore ? (firstItem.lastAuditOperationLogID ?? this.activityLastAuditOperationLogID) : (firstItem.lastAuditOperationLogID ?? '0');
    this.activityLastTaskID = isLoadMore ? (firstItem.lastTaskID ?? this.activityLastTaskID) : (firstItem.lastTaskID ?? '0');
    this.activityLastNoteID = isLoadMore ? (firstItem.lastNoteID ?? this.activityLastNoteID) : (firstItem.lastNoteID ?? '0');
    this.activityLastEventID = isLoadMore ? (firstItem.lastEventID ?? this.activityLastEventID) : (firstItem.lastEventID ?? '0');
    this.activityLastTagID = isLoadMore ? (firstItem.lastTagID ?? this.activityLastTagID) : (firstItem.lastTagID ?? '0');
    this.activityLastFileID = isLoadMore ? (firstItem.lastFileID ?? this.activityLastFileID) : (firstItem.lastFileID ?? '0');
  }

  private resetLastRecordIds() {
    this.activityLastAuditLogID = '0';
    this.activityLastAuditOperationLogID = '0';
    this.activityLastTaskID = '0';
    this.activityLastNoteID = '0';
    this.activityLastEventID = '0';
    this.activityLastTagID = '0';
    this.activityLastFileID = '0';
  }

  private addOrRemoveLastObjectFromArray(obj: any[], objItem: any, isAddValue: boolean) {
    if (obj != null && obj.length > 0 && objItem != null && Object.keys(objItem).length > 0) {
      if (isAddValue)
        obj.push(objItem);
      else {
        const arrayIndex = obj.findIndex(x => Object.keys(x).includes(Object.keys(objItem)[0]));
        if (arrayIndex > -1) {
          obj.splice(arrayIndex, 1);
        }
      }
    }
  }

  private showHideActivityLoader(isShowLoader, isLoadMore: boolean) {
    if (isLoadMore)
      this.isLoadMoreCompleted = !isShowLoader;
    else
      this.isActivityHistoryLoaded = !isShowLoader;
  }

  private getTranslateErrorMessage(error): void {
    if (error?.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('HISTORY.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  //END Region Private Methods
}
