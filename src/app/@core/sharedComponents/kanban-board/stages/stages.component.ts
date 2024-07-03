import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonHelper } from '../../../common-helper';
import { FieldNames, UserTypeID, KanbanBoardTokenTypes, LocalStorageKey, SectionCodes } from '../../../enum';
import { KanbanPagination, KanbanStage, KanbanStageCard, KanbanStageOwnerEvent, KanbanStagePaginationEvent, KanbanStageTaskEvent, KanbanStagePriorityEvent, KanbanStageSeverityEvent, KanbanStageDueDateEvent, KanbanStagePauseEvent, KanbanStageRaiseHandEvent } from '../../../sharedModels/kanban-board.model';
import { IdValuePair } from '../../../sharedModels/pair.model';

@Component({
  selector: 'app-stages',
  templateUrl: './stages.component.html',
  styleUrls: ['./stages.component.scss']
})
export class StagesComponent implements OnInit, OnChanges {

  @Input() isViewPermission: boolean = false;
  @Input() isEditPermission: boolean = false;
  @Input() cardsPerStage: number = 0;
  @Input() stages: Array<KanbanStage> = [];
  @Input() iconflag: boolean = true;
  @Input() showStageSubheader: boolean = false;
  @Input() entityTypeId: number;
  @Input() collapseStage:boolean = false;
  @Input() hasOwner1: boolean = false;
  @Input() owner1List: Array<IdValuePair> = [];
  @Input() hasOwner2: boolean = false;
  @Input() owner2List: Array<IdValuePair> = [];
  @Input() hasOwner3: boolean = false;
  @Input() owner3List: Array<IdValuePair> = [];
  @Input() priorityList: Array<IdValuePair> = [];
  @Input() severityList: Array<IdValuePair> = [];
  @Input() priorityDetails:any = [];
  @Input() severityDetails:any = [];
  // @Input() entityIcon: any;
  @Input() isViewDetailsTab: boolean = false;
  @Input() entityHiddenFieldSettings: any;
  @Input() entityWorkflowId: number;
  

  @Output() onCardDrop = new EventEmitter<CdkDragDrop<KanbanStageCard>>();
  @Output() onCardClick = new EventEmitter<KanbanStageCard>();
  @Output() onCardTaskChange = new EventEmitter<KanbanStageTaskEvent>();
  @Output() onCardPauseChange = new EventEmitter<KanbanStagePauseEvent>();
  @Output() onCardRaiseHandChange = new EventEmitter<KanbanStageRaiseHandEvent>();
  @Output() onCardOwner1Click = new EventEmitter<KanbanStageOwnerEvent>();
  @Output() onCardOwner2Click = new EventEmitter<KanbanStageOwnerEvent>();
  @Output() onCardOwner3Click = new EventEmitter<KanbanStageOwnerEvent>();
  @Output() onLoadMore = new EventEmitter<KanbanStagePaginationEvent>();
  @Output() onActivityCenterClick = new EventEmitter<KanbanStageCard>();
  @Output() onAddSubTaskClick = new EventEmitter<KanbanStageCard>();
  @Output() onCardPriorityClick = new EventEmitter<KanbanStagePriorityEvent>();
  @Output() onCardSeverityClick = new EventEmitter<KanbanStageSeverityEvent>();
  @Output() onCardDueDateClick = new EventEmitter<KanbanStageDueDateEvent>();

  selectedCard: number = 0;
  quickViewConfig: any;
  
  sectionCodeName = SectionCodes;
  fieldNames = FieldNames;
  userTypeID = UserTypeID;

  loggedInUserDetails: any;
  localStorageKeyPrefix: string = '';

  //#region component variables
  private pagination: KanbanPagination;
  //#endregion

  public _kanbanBoardTokenTypes = KanbanBoardTokenTypes;

  constructor(public _commonHelper: CommonHelper) {
    // set default page size
    this.cardsPerStage = this._commonHelper.DefaultPageSizeForKanban;
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    this.localStorageKeyPrefix = `${this.loggedInUserDetails?.tenantId}_${this.loggedInUserDetails?.userId}`;

  }

  ngOnInit(): void {
    this.getStageCollapsed();
    this.pagination = { pageNo: 1, totalPages: 1 };
    //for each stage - need to keep track of pagination
    this.stages.forEach(stage => {
      stage.pagination = this.pagination;
      stage.pagination.totalPages = stage.totalItems > this.cardsPerStage ? Math.ceil(stage.totalItems / this.cardsPerStage) : 1;
    })
    this.setQuickViewConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setQuickViewConfig();

    if (changes?.stages.currentValue != changes?.stages.previousValue && changes?.stages.currentValue.length > 0) {

      this.stages.forEach(stage => {
        let json = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.localStorageKeyPrefix + "_" + LocalStorageKey.Stage_Collapsible_Key));
        if (json) {
          let ids = json[this.entityWorkflowId] as any[]; 
          if(ids){
            stage.isCollapsed = (ids.indexOf(stage.id) > -1);
          }
        }
      });
    }
  }

  setQuickViewConfig() {

    let quickViewConfigStr = '';
    switch (this.entityTypeId) {
      case 7:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Accounts_Workflow_SelectedItem);
        break;
      case 8:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Contacts_Workflow_SelectedItem);
        break;
      case 16:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Worktasks_Workflow_SelectedItem);
        break;
      case 29:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Products_Workflow_SelectedItem);
        break;
      case 36:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Orders_Workflow_SelectedItem);
        break;
      case 59:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Opportunities_Workflow_SelectedItem);
        break;
      case 62:
        quickViewConfigStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Cases_Workflow_SelectedItem);
        break;
    }
    
    if (quickViewConfigStr) {
      this.quickViewConfig = JSON.parse(quickViewConfigStr);
      this.selectedCard = this.quickViewConfig.selectedCardEntityId;
    }
  }

  //#region Events
  onCardDropEvent(event: CdkDragDrop<KanbanStageCard>): void {
    this.onCardDrop.emit(event);
  }

  onCardClickEvent(card: KanbanStageCard): void {
   this.selectedCard = card.id;

    this.onCardClick.emit(card);
    this.isViewDetailsTab = true;
  }

  onCardTaskChangeEvent(card: KanbanStageCard, stage: KanbanStage, tasks: Array<IdValuePair>): void {
    this.onCardTaskChange.emit({ card, stage, tasks });
  }

  onCardPauseChangeEvent(card: KanbanStageCard, stage: KanbanStage, isPaused: boolean): void {
    this.onCardPauseChange.emit({ card, stage, isPaused });
  }

  updateEntityPauseStatus(card: KanbanStageCard) {
    const stage = this.stages.find(i => i.id === card.stageId);

    if (stage && stage.cards && stage.cards.length > 0) {
      const stageCard = stage.cards.find(i => i.id === card.id);

      if (stageCard) {
        stageCard.isPaused = card.isPaused;
        stageCard.disabled = card.disabled;
        stageCard.isPausedTooltip = card.isPausedTooltip;
      }
    }
  }

  onCardRaiseHandChangeEvent(card: KanbanStageCard, stage: KanbanStage, isHandRaised: boolean): void {
    this.onCardRaiseHandChange.emit({ card, stage, isHandRaised: isHandRaised });
  }

  updateRaiseHandStatus(card: KanbanStageCard) {
    const stage = this.stages.find(i => i.id === card.stageId);

    if (stage && stage.cards && stage.cards.length > 0) {
      const stageCard = stage.cards.find(i => i.id === card.id);

      if (stageCard) {
        stageCard.isHandRaised = card.isHandRaised;
        stageCard.handRaisedTooltipText = card.handRaisedTooltipText;
      }
    }
  }

  onCardPriorityClickEvent(card: KanbanStageCard, stage: KanbanStage, priorityId: number): void {
    if (!this.isEditPermission || stage.isFrozen || card.disabled) {
      return;
    }

    const priority = this.findPriority(priorityId, this.priorityList);
    if (priority) {
      this.onCardPriorityClick.emit({ card, stage, priority });
    }
  }

  onCardSeverityClickEvent(card: KanbanStageCard, stage: KanbanStage, severityId: number): void {
    if (!this.isEditPermission || stage.isFrozen || card.disabled) {
      return;
    }

    const severity = this.findSeverity(severityId, this.severityList);
    if (severity) {
      this.onCardSeverityClick.emit({ card, stage, severity });
    }
  }

  onCardOwner1ClickEvent(card: KanbanStageCard, stage: KanbanStage, ownerId: number): void {
    if (!this.isEditPermission || stage.isFrozen || card.disabled) {
      return;
    }

    const owner = this.findOwner(ownerId, this.owner1List);
    if (owner) {
      this.onCardOwner1Click.emit({ card, stage, owner });
    }
  }
  
  onCardDueDateClickEvent(card: KanbanStageCard, stage: KanbanStage, dueDate: Date): void {
    if (!this.isEditPermission || stage.isFrozen || card.disabled) {
      return;
    }
    this.onCardDueDateClick.emit({ card, stage, dueDate });
  }

  onCardOwner2ClickEvent(card: KanbanStageCard, stage: KanbanStage, ownerId: number): void {
    if (!this.isEditPermission || stage.isFrozen || card.disabled) {
      return;
    }

    const owner = this.findOwner(ownerId, this.owner2List);
    if (owner) {
      this.onCardOwner2Click.emit({ card, stage, owner });
    }
  }

  onCardOwner3ClickEvent(card: KanbanStageCard, stage: KanbanStage, ownerId: number): void {
    if (!this.isEditPermission || stage.isFrozen || card.disabled) {
      return;
    }

    const owner = this.findOwner(ownerId, this.owner3List);
    if (owner) {
      this.onCardOwner3Click.emit({ card, stage, owner });
    }
  }

  onLoadMoreEvent(stage: KanbanStage): void {
    // get current stage
    var currentStageIndex = this.stages.findIndex(s => s.id == stage.id);
    // find total pages
    this.stages[currentStageIndex].pagination.totalPages = stage.totalItems > this.cardsPerStage
      ? Math.ceil(stage.totalItems / this.cardsPerStage)
      : 1;
    // send next page to load more data
    if (this.stages[currentStageIndex].pagination.pageNo < this.stages[currentStageIndex].pagination.totalPages) {
      let objParam = {
        id: stage.id,
        stage: stage.stage,
        nextPage: ++this.stages[currentStageIndex].pagination.pageNo,
        totalPages: this.stages[currentStageIndex].pagination.totalPages
      };
      this.onLoadMore.emit(objParam);
      this.setQuickViewConfig();
    }
  }

  onActivityCenterClickEvent(card: KanbanStageCard): void {
    this.onActivityCenterClick.emit(card);
  }

  onAddSubTaskClickEvent(card: KanbanStageCard): void {
    this.onAddSubTaskClick.emit(card);
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
  //#endregion

  //#region Private Methods
  private findOwner(id: number, owners: Array<IdValuePair>): IdValuePair {
    return owners.find(f => f.id === id) ?? {} as IdValuePair;
  }

  private findPriority(id: number, priorities: Array<IdValuePair>): IdValuePair {
    return priorities.find(f => f.id === id) ?? {} as IdValuePair;
  }

  private findSeverity(id: number, severities: Array<IdValuePair>): IdValuePair {
    return severities.find(f => f.id === id) ?? {} as IdValuePair;
  }
  //#endregion

  stageExpand(stage: any) {
    $('#cardSections-'+ stage.id).toggleClass("collapsedStage");
    this.setStageCollapsed(stage.id);
    stage.isCollapsed = !stage.isCollapsed;
  }

  setStageCollapsed(stageId) {
    let json = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.localStorageKeyPrefix + "_" + LocalStorageKey.Stage_Collapsible_Key));
    if (!json) {
      json = {
        [this.entityWorkflowId]: [stageId]
      };
    } else {
      let ids = json[this.entityWorkflowId] as any[];
      if (ids && ids.length > 0) {
        const index = ids.indexOf(stageId);
        if (index < 0) {
          ids.push(stageId);
        } else {
          ids.splice(index, 1);
        }
        json[this.entityWorkflowId] = ids;
      }
      else {
        json[this.entityWorkflowId] = [stageId];
      }
    }
    this._commonHelper.setLocalStorageEncryptData(this.localStorageKeyPrefix + "_" + LocalStorageKey.Stage_Collapsible_Key, JSON.stringify(json));
  }

  getStageCollapsed() {
    if (this._commonHelper.getLocalStorageDecryptData(this.localStorageKeyPrefix + "_" + LocalStorageKey.Stage_Collapsible_Key)) {
      return this._commonHelper.getLocalStorageDecryptData(this.localStorageKeyPrefix + "_" + LocalStorageKey.Stage_Collapsible_Key);
    }
  }
}
