import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpHelperService } from '../../@core/http-helper.service';
import { CommonHelper } from '../../@core/common-helper';

@Injectable()
export class WorkTasksService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "WorkTaskService/"; //api gateway + service name

    constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
        super(_httpClient, _router, _commonHelper);
    }

    getWorkTaskList(params) {
        const url = this.apiGatewayUrl + 'GetWorkTaskList';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getWorkTasks(params) {
        const url = this.apiGatewayUrl + 'GetWorkTasks';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    /**
    * Export Work Tasks
    * @param params Pagination Payload
    * @returns 
    */
    exportWorkTasks(params) {
        return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportWorkTasks`, params);
    }

    GetWorkTasksByEntity(params) {
        const url = this.apiGatewayUrl + 'GetWorkTasksByEntity';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getWorkTasksByParentId(params) {
        const url = this.apiGatewayUrl + 'GetWorkTasksByParentId';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getWorkTaskCustomFields(entityTypeId: number, entityId: number) {
        let params = { entityTypeId, entityId };
        let url = this.apiGatewayUrl + 'GetWorkTasksCustomFields';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getEntityStagesWithTask(entityWorkflowId) {
        let params = { 'entityWorkflowId': entityWorkflowId };
        const url = this.apiGatewayUrl + 'GetEntityStagesWithTask';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getWorkTasksByStage(params) {
        const url = this.apiGatewayUrl + 'GetWorkTasksByStage';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getWorkTaskById(id, entityWorkflowId) {
        let params = null;
        if (entityWorkflowId) {
            params = { id, entityWorkflowId };
        }
        else {
            params = { id };
        }
        const url = this.apiGatewayUrl + 'GetWorkTask';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    updateWorkTask(workTask) {
        const url = this.apiGatewayUrl + 'UpdateWorkTask';
        return this.getHttpAuthrizedPostRequest(url, workTask);
    }

    deleteWorkTask(workTaskId) {
        const url = this.apiGatewayUrl + 'DeleteWorkTask';
        const params = { 'id': workTaskId };
        return this.getHttpAuthrizedDeleteRequest(url, params);
    }

    deleteWorkTasksByEntity(params) {
        const url = this.apiGatewayUrl + 'DeleteWorkTasksByEntity';
        return this.getHttpAuthrizedDeleteRequest(url, params);
    }


    updateWorkTaskEntityStage(params) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskEntityStage';
        return this.getHttpAuthrizedPutRequest(url, params);
    }

    // update work task assigned to
    updateWorkTaskAssignedTo(workTask) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskAssignedTo';
        return this.getHttpAuthrizedPutRequest(url, workTask);
    }

    updateWorktaskField(params) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskField';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    // import workTasks
    importBulkworkTasks(params) {
        const url = this.apiGatewayUrl + 'ImportData';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    // download workTasks template
    downloadImportTemplate(entityWorkflowId, parentEntityTypeId) {
        let params: any = {};
        
        if(parentEntityTypeId){
            params.parentEntityTypeId = parentEntityTypeId;
        }

        if(entityWorkflowId){
            params.entityWorkflowId=entityWorkflowId;
        }

        const url = this.apiGatewayUrl + 'DownloadImportTemplate';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    //get stage history
    getEntityStageTaskTransitionHistory(id) {
        let params = { 'workTaskId': id };
        const url = this.apiGatewayUrl + 'GetEntityStageTaskTransitionHistory';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    //get stage pause history
    getEntityStagePauseTransitionHistory(id) {
        let params = { 'workTaskId': id };
        const url = this.apiGatewayUrl + 'GetEntityStagePauseTransitionHistory';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    saveEntityStageTaskTransition(params) {
        const url = this.apiGatewayUrl + 'SaveEntityStageTaskTransition';
        return this.getHttpAuthrizedPutRequest(url, params);
    }

    updateWorkTaskAssignedToUsers(params) {
        let url = this.apiGatewayUrl + 'updateWorkTaskAssignedToUsers';
        return this.getHttpAuthrizedPutRequest(url, params);
    }

    // update work task priority
    updateWorkTaskPriority(workTask) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskPriority';
        return this.getHttpAuthrizedPutRequest(url, workTask);
    }

    // update work task severity
    updateWorkTaskSeverity(workTask) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskSeverity';
        return this.getHttpAuthrizedPutRequest(url, workTask);
    }

    // update work task dueDate
    updateWorkTaskDueDate(workTask) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskDueDate';
        return this.getHttpAuthrizedPutRequest(url, workTask);
    }

    linkWorkTask(workTaskRelation) {
        const url = this.apiGatewayUrl + 'LinkWorkTask';
        return this.getHttpAuthrizedPostRequest(url, workTaskRelation);
    }

    deleteWorkTaskLink(id) {
        const url = this.apiGatewayUrl + 'DeleteWorkTaskLink';
        const params = { 'id': id };
        return this.getHttpAuthrizedDeleteRequest(url, params);
    }

    getWorkTaskRelation(id){
        const url = this.apiGatewayUrl + 'GetWorkTaskRelationByID';
        const params = { 'id': id };
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    clearCache() {
        const url = this.apiGatewayUrl + 'ClearCache';
        return this.getHttpAuthrizedGetRequest(url);
    }

    changeEntityRecordType(workTaskIds, entityRecordTypeId) {
        let params = null;
        if (entityRecordTypeId) {
            params = { workTaskIds, entityRecordTypeId };
        }
        else {
            params = { workTaskIds };
        }
        const url = this.apiGatewayUrl + 'ChangeEntityRecordType';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    changeWorkTaskEntityType(workTaskIds, workflowId) {
        let params = { 'workTaskIds': workTaskIds, 'entityWorkflowId': workflowId };
        const url = this.apiGatewayUrl + 'ChangeWorkTaskEntityType';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    updateDefaultEstimatedTimeAndPoint(workTaskIds, workflowId) {
        let params = { workTaskIds, workflowId };
        const url = this.apiGatewayUrl + 'UpdateDefaultEstimatedTimeAndPoint';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    /**
     * Update Verified By for WorkTask
     * @param workTask WorkTask detail with selected verified by
     * @returns 
     */
    updateWorkTaskVerifiedBy(workTask) {
        let url = this.apiGatewayUrl + 'UpdateWorkTaskVerifiedBy';
        return this.getHttpAuthrizedPutRequest(url, workTask);
    }

    /**
     * Check Sub Work Task exist or not. API will return true or false in the response.
     * @param id: Id of the work task.
     * @returns boolean 
     */
    isSubWorkTaskExist(id) {
        let params = { id };
        const url = `${this.apiGatewayUrl}IsSubWorkTaskExist`;
        return this.getHttpAuthrizedGetRequest(url, params);
    }
    /**
    * Export WorkTask List
    * @param params Pagination Payload
    * @returns 
    */

    exportWorkTaskList(params) {
        return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportWorkTasksListing`, params);
    }

    /**
     * Fetch all miscellaneous task
     * @param params Pagination Payload
     * @returns 
     */
    getAllMiscTasks(params) {
        return this.getHttpAuthrizedPostRequest(this.apiGatewayUrl + 'GetAllMiscTask', params);
    }

    /**
    * Export Miscellaneous Tasks
    * @param params Pagination Payload
    * @returns 
    */
    exportMiscTasks(params) {
        return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportMiscTasks`, params);
    }


    /**
     * Save miscellaneous task
     * @param params 
     * @returns 
     */
    saveMiscTask(params) {
        return this.getHttpAuthrizedPostRequest(this.apiGatewayUrl + 'SaveMiscTask', params);
    }

    getMiscWorkTaskById(miscWorkTaskId, showAllWorkTasks) {
        const url = this.apiGatewayUrl + 'GetMiscTaskById';
        return this.getHttpAuthrizedGetRequest(url, { miscWorkTaskId, showAllWorkTasks });
    }

    getWorkTaskTimeLine(entityID: number) {
        return this.getHttpAuthrizedGetRequest(`${this.apiGatewayUrl}GetWorkTaskTimeline`, { 'id': entityID });
    }

    getStageTeamOwnerDetail(payload: any) {
        return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}GetStageTeamOwnerDetailWithPrivacy`, payload);
    }
}