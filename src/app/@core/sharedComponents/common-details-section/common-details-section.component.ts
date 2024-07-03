import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonHelper } from '../../common-helper';
import { WorkflowmanagementService } from '../../../pages/workflowmanagement/workflowmanagement.service';
import { KanbanBoardTokenTypes } from '../../enum';

@Component({
  selector: 'ngx-common-details-section',
  templateUrl: './common-details-section.component.html',
  styleUrls: ['./common-details-section.component.scss']
})
export class CommonDetailsSectionComponent implements OnInit, OnChanges {
  
  /*
  Angular Decorators
  */
  @Input() entityDetailsData: any;
  @Input() entityId: number;
  @Input() entityTypeId: number;
  @Input() entityRecordTypeId: number;
  @Input() isEditPermission: boolean = true;
  @Input() keyfieldResponseData: any;
  @Input() showSubTaskCreateOption: boolean = false;
  @Input() showLinkWorkTaskCreateOption: boolean = false;
  @Input() addWorkTaskCreateOption: boolean = false;
  @Input() isAddWorkTask: boolean = false;
  @Input() isAddSubWorkTask: boolean = false;
  @Input('currencySymbol') currencySymbol: any = null;
  @Input() hoursInDay: number = 24;
  @Input() isAddOpportunity: boolean = false;
  @Input() isAddCase: boolean = false;
  @Input() isFromKanbanOrListView:boolean = false;

  @Input() isActive: boolean = true;
  @Input() isPaused: boolean = false;
  @Input() isClosedStage: boolean = false;
  @Input() isCompletedStage: boolean = false;
  @Input() isDefault: boolean = false;
  
  @Output() onEntityStagesTasks = new EventEmitter();
  @Output() saveKeyFieldEvent = new EventEmitter<any>();
  @Output() onShowLoader = new EventEmitter();
  @Output() onHideLoader = new EventEmitter();
  @Output() onSubTaskCreate = new EventEmitter<any>();
  @Output() onLinkWorkTaskCreate = new EventEmitter<any>();
  @Output() onAddWorkTask = new EventEmitter<any>();
  @Output() onAddOpportunity = new EventEmitter<any>();
  @Output() onAddCase = new EventEmitter<any>();
  @Output() raiseHandChange = new EventEmitter<any>();
  @Output() pauseOrResumeChanges = new EventEmitter<any>();

  constructor(private _commonHelper: CommonHelper, private _workflowmanagementService: WorkflowmanagementService) { }
  
  public _kanbanBoardTokenTypes = KanbanBoardTokenTypes;
  ngOnChanges(changes: SimpleChanges): any {
    if(changes) {
      if(changes?.entityDetailsData?.currentValue && changes?.entityDetailsData?.currentValue != changes?.entityDetailsData?.previousValue){
        this.entityDetailsData = changes?.entityDetailsData?.currentValue;
      }

      if (changes?.entityRecordTypeId?.currentValue && changes?.entityRecordTypeId?.currentValue != changes?.entityRecordTypeId?.previousValue) {
        this.entityRecordTypeId = changes?.entityRecordTypeId?.currentValue;
      }
    }
  }

  ngOnInit(): void { }

  onEntityStageTasksSelectClick() {
    this.onEntityStagesTasks.emit(this.entityDetailsData);
  }

  onSaveKeyFieldEvent(event) {
     this.saveKeyFieldEvent.emit(event);
   }

  onRaiseHandChangeEvent(event, isHandRaised: boolean): void {
    this.raiseHandChange.emit({ event, isHandRaised: isHandRaised });
  }

  onPauseOrResumeChangesEvent(event, isPaused: boolean): void {
    this.pauseOrResumeChanges.emit({ event, isPaused: isPaused });
  }

  showLoader() {
    this.onShowLoader.emit();
  }

  hideLoader() {
    this.onHideLoader.emit();
  }

  onCardTaskChangeEvent() {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      entityStageId: this.entityDetailsData?.stageId,
      entityTaskIds: this.entityDetailsData?.selectedTasks ? this.entityDetailsData?.selectedTasks.map(t => t.id).toString() : '',
      entityWorkflowId: this.entityDetailsData?.entityWorkflowId,
      assignedTo: this.entityDetailsData?.owner1Id
    };
    this.showLoader();
    this._workflowmanagementService.saveEntityStageTaskTransition(params).then(() => {
      this.hideLoader()
    }, (error) => {
      this.hideLoader();
      this.getTranslateErrorMessage(error, '');
    });
  }

  onSubTaskClick(subTaskTypeId: number, subTaskTypeName: string) {
    let param:any = this.entityDetailsData;
    param.subTaskTypeId = subTaskTypeId;
    param.subTaskTypeName = subTaskTypeName;
    this.onSubTaskCreate.emit(param);
  }

  onLinkWorkTaskClick() {
    this.onLinkWorkTaskCreate.emit(this.entityDetailsData);
  }

  onAddWorkTaskClick()
  {
   this.onAddWorkTask.emit(this.entityDetailsData);
  }

  addOpportunity() {
    this.onAddOpportunity.emit(this.entityDetailsData);
  }

  addCase() {
    this.onAddCase.emit(this.entityDetailsData);
  }

  getTranslateErrorMessage(error, node) {
    if (error && error.messageCode) {
      if (node.length > 0) { node = node + '.' }
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.' + node + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }
}
