export class WorkTaskSearchParams {
    tenantId: number
    pageNo: number;  //current page index
    pageSize: number;     //page size    
    searchString:string;   // text box searching string
    sortColumn :string;  //asc or desc
    sortOrder:string; //column name
    tagIDs: string;
    assignedToIDs: string;
    entityIDs: string;
}

export class WorkTaskSearchParamsByStage {
    tenantId: number
    searchText:string;   // text box searching string
    tagIDs: string;
    entityWorkflowId: number;
    stageId: number;
    startDate: Date;
    endDate: Date;
    assignedToIDs: string;
    entityIDs: string;
}