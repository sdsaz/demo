import { KanbanBoardTokenTypes } from "../enum";
import { IdValuePair } from "./pair.model";

declare interface KanbanStageEvent {
    card: KanbanStageCard;
    stage: KanbanStage;
}

export interface KanbanStageCard {
    id: number;
    stageId?: number;
    title?: string;
    titleTooltip?: string;
    label1?: string;
    label1RedirectURL?: string;
    labelTooltip1?: string;
    labelType1?: KanbanBoardTokenTypes;
    label1IconClass?: string;
    label2?: string;
    label2RedirectURL?: string;
    labelTooltip2?: string;
    labelType2?: KanbanBoardTokenTypes;
    currencySymbol2?: string;
    label3?: string;
    label3RedirectURL?: string;
    labelTooltip3?: string;
    labelType3?: KanbanBoardTokenTypes;
    currencySymbol3?: string;
    entityId?: number;
    entityTypeId?: number;
    entityTypeName?: string;
    relatedToLabel?: string;
    relatedToRedirectURL? : string;
    relatedToTooltip?: string;
    relatedToIconClass?: string;
    relatedToIconToolTip?: string;
    selectedTasks?: Array<IdValuePair>;
    selectedTasksDisabled?: boolean;
    isActive?: boolean;
    isPaused?: boolean;
    rating?: number;
    review?: number;
    isPausedTooltip?: string;
    pausedLabel?: string;
    resumeLabel?: string;
    resumeNotAccess?: string;
    showPauseResumeButtons?: boolean;
    availableSubWorkTaskTypeDetails?: any;
    entitySubTypeId?: number;
    showAddSubWorkTaskButton?: boolean;
    subWorkTaskToolTipPrefix?: string;
    canUserChangeStage?: boolean;
    owner1Id?: number;
    owner1Name?: string;
    owner1ShortName?: string;
    owner1Image?: string;
    owner1Tooltip?: string;
    owner1BGColor?: string;
    owner1SignedUrl?: string;
    owner2Id?: number;
    owner2Name?: string;
    owner2ShortName?: string;
    owner2Image?: string;
    owner2Tooltip?: string;
    owner2BGColor?: string;
    owner2SignedUrl?: string;
    owner3Id?: number;
    owner3Name?: string;
    owner3ShortName?: string;
    owner3Image?: string;
    owner3Tooltip?: string;
    owner3BGColor?: string;
    owner3SignedUrl?: string;
    footerLabel1?: string;
    footerLabelTooltip1?: string;
    footerHtml?: string;
    disabled?: boolean;
    priority?: number;
    priorityName?: string;
    priorityTooltip?: string;
    priorityDefaultTooltip?: string;
    severity?: number;
    severityName?: string;
    severityTooltip?: string;
    severityDefaultTooltip?: string;
    dueDate?: Date;
    dueDateTooltip?: string;
    dueDateDefaultTooltip?: string;
    isSubTask?: boolean;
    isHandRaised?: boolean;
    showRaiseHandButtons?: boolean;
    handRaisedTooltipText?: string;
    parentID?: number;
    parentTokenType?: KanbanBoardTokenTypes;
    parentLabel?: string;
    parentLabelTooltip1?: string;
    parentLabelRedirectUrl?: string;
    parentLabelIconClass?: string;
    parentName?: string;
    parentNameToolTip?:string;
    cardColorClass?: string;
    isClosedStage?: boolean;
    isCompletedStage?: boolean;
    stageName?: string;
    entityIcon?: string;
    entityName?: any;
    entityRecordTypeName?: any;
    entityRecordTypeId?: number;
    stagesTasks?: any;
    created?: string;
    createdBy?: number;
    privacyLevel?: number;
    privacyIcon?: string;
    privacyToolTip?: string;
    workTaskTypeIconClass?: string;
    workTaskTypeName?: string;
    isViewParentSubTypePermission?: boolean;   
    isEditParentSubTypePermission?: boolean;
    isEditSubTypePermission?: boolean;
    isViewSubTypePermission?: boolean;
    isShowMoreDetailButton?: boolean;
    owner1userTypeId?: number;
    owner2userTypeId?: number;
    owner3userTypeId?: number;
    userLabel1?: any;
    userLabel2?: any;
    userLabel3?: any;
    entityReviewID?: number;
    isEntityReviewEditable: boolean;
    isStarred?: boolean;
    isEditPermission?: boolean;
    isViewPermission?: boolean;
    isResumeRecord?: boolean;
    loggedInUser?: number;
    settingsJson?: any;
    isShowPauseOrResume?: boolean;
}

export interface KanbanStage {
    id: number;
    name: string;
    stage: string;
    totalItems: number;
    totalOpportunityValue: number;
    isCompleted: boolean;
    isClosed: boolean;
    isFrozen: boolean;
    isNoteRequired: boolean;
    created: string;
    tasks?: Array<IdValuePair>;
    cards?: Array<KanbanStageCard>;
    pagination?: KanbanPagination;
    displayOrder: number;
    isAllTasksRequired: boolean;
    transitionAssociates?: string;
    showLoader?: boolean;
    isCollapsed?: boolean;
}

export interface KanbanStageTaskEvent extends KanbanStageEvent {
    tasks: Array<IdValuePair>;
}

export interface KanbanStagePauseEvent extends KanbanStageEvent {
    isPaused: boolean;
}

export interface KanbanStageOwnerEvent extends KanbanStageEvent {
    owner: IdValuePair;
}

export interface KanbanStageRaiseHandEvent extends KanbanStageEvent {
    isHandRaised: boolean;
}

export interface KanbanStagePaginationEvent {
    id: number;
    stage: string;
    nextPage: number;
    totalPages: number;
}

export interface KanbanPagination {
    pageNo: number;
    totalPages: number;
}

export interface KanbanStagePriorityEvent extends KanbanStageEvent {
    priority: IdValuePair;
}

export interface KanbanStageSeverityEvent extends KanbanStageEvent {
    severity: IdValuePair;
}
export interface KanbanStageDueDateEvent extends KanbanStageEvent {
    dueDate: Date;
}