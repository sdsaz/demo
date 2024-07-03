export class BasicPagingParams {
    tenantId: number;  //current page index
    pageNo: number;  //current page index
    pageSize: number;     //page size
    searchString:string;   // text box searching string
    sortColumn :string;  //asc or desc
    sortOrder:string; //column name
}

export class PagingParams extends BasicPagingParams {
    roleIds: string;
    IsActive?: boolean;
}

export class AccountPagingParams extends BasicPagingParams {
    // status: boolean;
    entityRecordTypeIds: string;
    createdStartDate: Date;
    createdEndDate: Date;
    IsActive?: boolean;
    rating?: Number;
    showStarred?: boolean;
}

export class CampaignPagingParams extends BasicPagingParams {
    // status: boolean;
    createdStartDate: Date;
    createdEndDate: Date;
    IsActive?: boolean;
    rating?: number;
    showStarred?: boolean;
}

export class AppointmentPagingParams extends BasicPagingParams {
    entityTimespan?: string;
    statusIds? : string;
    ownerIDs?: string;
    attendeeIDs?:string;
    isShowOnlyMyEvents?: boolean;
    isStarred?:boolean;
    activityStartDate:Date;
    activityEndDate:Date;
}

export class NewsletterPagingParams extends BasicPagingParams {
    // status: boolean;
    createdStartDate: Date;
    createdEndDate: Date;
    IsActive?: boolean;
    rating?: number;
    showStarred?: boolean;
}

export class ContactsPagingParams extends BasicPagingParams {
    // status: boolean;
    entityRecordTypeIds: string;
    IsActive?: boolean;
    rating?: Number;
    showStarred?: boolean;
}

export class ProductCategoryPagingParams extends BasicPagingParams {
    // status: boolean;
    IsActive?: boolean;
    rating?: number;
    showStarred?: boolean;
}

export class ProductPagingParams extends BasicPagingParams {
    // status: boolean;
    entityRecordTypeIds: string;
    uomId:number;
    IsActive?: boolean;
    rating?: number;
    showStarred?: boolean;
}
export class PriceBookPagingParams extends BasicPagingParams {
    // status: boolean;
    IsActive?: boolean;
    rating?: number;
    showStarred?: boolean;
}

export class PriceBookItemsPagingParams extends BasicPagingParams {
    priceBookId: number;
}

export class DefaultPriceBookItemsPagingParams extends BasicPagingParams {
    priceBookId: number;
}

export class PriceBookItemsForOpportunityPagingParams extends BasicPagingParams {
    priceBookId: number;
    opportunityId: number;
}

export class OpportunityItemsPagingParams extends BasicPagingParams {
    opportunityId: number;
}

export class SearchParams {
    searchString:string;   // text box searching string
    sortColumn :string;  //asc or desc
    sortOrder:string; //column name
    
    pageNo: number;  //current page index
    pageSize: number;     //page size    
}

export class AccountWorkflowPagingParams extends BasicPagingParams {
      entityIDs: string;
      tagIDs: string;
      assignedToIDs: string;
      entityWorkflowId: number;
      entityTimespan: string;
      IsActive?: boolean;
}

export class WorktaskPagingParams extends BasicPagingParams {
    entityRecordTypeIds: string;
    entityWorkflowIds: string;
    entityWorkflowStageIds: string;
    assignToUserIds: string;
    verifiedByIds: string;
    typeIds:string;
    showMyTasks: boolean;
    showStarred: boolean;
    IsActive?: boolean;
    rating?: Number;
}

export class MiscTaskPagingParams extends BasicPagingParams
{
    reasonIds: string;
    startDate: Date;
    endDate: Date;
    assignToUserIds: string;
    showAllTasks: boolean;
    IsActive?: boolean;
}

export class AllOpportunitiesListPagingParams extends BasicPagingParams
{
    entityRecordTypeIds: string;
    entityWorkflowIds: string;
    stageIds: string;
    assignedToIds: string;
    accountIds:string;
    ownerIds: string;
    showMyOpportunities: boolean;
    IsActive?: boolean;
    rating?: Number;
    showStarred: boolean;
}

export class CasePagingParams extends BasicPagingParams {
    entityRecordTypeIds: string;
    entityWorkflowIDs: string;
    entityWorkflowStageIDs: string;
    assignToIDs: string;
    verifiedByIDs: string;
    showMyCases: boolean;
    IsActive?: boolean;
    rating?: Number;
    showStarred: boolean;
}

export class OrderPagingParams extends BasicPagingParams {
    entityRecordTypeIDs: string;
    entityWorkflowIDs: string;
    entityWorkflowStageIDs: string;
    showMyOrders: boolean;
    assignToUserIds: string;
    IsActive?: boolean;
    rating?: Number;
    showStarred: boolean;
}