import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';

@Injectable()
export class WorkflowmanagementService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "entityworkflowservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getWorkflowDetail(entityWorkflowId: number) {
    let params = { workflowId: entityWorkflowId };
    const url = this.apiGatewayUrl + 'GetWorkflowDetail';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getWorkflowDetailById(entityWorkflowId: number) {
    let params = { workflowId: entityWorkflowId };
    const url = this.apiGatewayUrl + 'GetWorkflowDetailById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getEntityWorkflows(params) {
    const url = this.apiGatewayUrl + 'GetEntityWorkflows';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  updateEntityWorkflow(entityWorkflow: any) {
    const url = this.apiGatewayUrl + 'UpdateEntityWorkflow';
    return this.getHttpAuthrizedPostRequest(url, entityWorkflow);
  }
  getEntityStagesWithTask(entityTypeId: number, entityWorkflowId: number) {
    let params = { entityTypeId, entityWorkflowId };
    const url = this.apiGatewayUrl + 'GetEntityStageTasks';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getEntityStageTaskTransitionHistory(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    const url = this.apiGatewayUrl + 'GetEntityStageTransitionHistory';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getEntityStagePauseTransitionHistory(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    const url = this.apiGatewayUrl + 'GetEntityStagePauseTransitionHistory';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getEntityStageTaskHistory(params) {
    const url = this.apiGatewayUrl + 'GetEntityStageTaskHistory';
    return this.getHttpAuthrizedGetRequest(url, params);
}

  updateWorkflowEntityStage(params) {
    let url = this.apiGatewayUrl + 'UpdateWorkflowEntityStage';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  saveEntityStageTaskTransition(params) {
    const url = this.apiGatewayUrl + 'SaveEntityStageTaskTransition';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  saveEntityStagePauseTransition(params) {
    const url = this.apiGatewayUrl + 'SaveEntityStagePauseTransition';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  saveEntityStageTransition(params) {
    const url = this.apiGatewayUrl + 'SaveEntityStageTransitions';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  postSaveEntityProcess(params) {
    const url = this.apiGatewayUrl + 'PostSaveEntityProcess';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  IsEntityEligibleToChangeWorkflow(entityTypeId: number, entityId: number, bypassWokflowChecking: boolean)
  {
    let params = { entityTypeId, entityId, bypassWokflowChecking };
    const url = this.apiGatewayUrl + 'IsEntityEligibleToChangeWorkflow';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  BulkCheckIsEntityEligibleToChangeWorkflow(params)
  {
    const url = this.apiGatewayUrl + 'BulkCheckIsEntityEligibleToChangeWorkflow';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  DeleteRelatedDataToChangeWorkflow(entityTypeId: number, entityId: number)
  {
    let params = { entityTypeId, entityId };
    const url = this.apiGatewayUrl + 'DeleteRelatedDataToChangeWorkflow';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  BulkDeleteRelatedDataToChangeWorkflow(params)
  {
    const url = this.apiGatewayUrl + 'BulkDeleteRelatedDataToChangeWorkflow';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  isEntityExistsInWorkFlow(entityId: number, entityTypeId: number) {
    let params = { entityId,entityTypeId};
    const url = this.apiGatewayUrl + 'IsEntityExistsInWorkFlow';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  clearCache(){
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  assignBulkWorkFlowForTask(params) {
    const url = this.apiGatewayUrl + 'AssignBulkWorkFlowForTask';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getEntityTotalReportingTime(entityId:number, entityTypeId:number) {
    let params = { 'entityId': entityId, 'entityTypeId': entityTypeId };
    const url = this.apiGatewayUrl + 'GetEntityTotalReportingTime';
    return this.getHttpAuthrizedGetRequest(url, params);
}

  getEntityWorkflowStageValuesByEntityIdAndEntityTypeId(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    const url = this.apiGatewayUrl + 'GetEntityWorkflowStageValuesByEntityIdAndEntityTypeId';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveEntityStageRaiseHandTransition(params) {
    const url = this.apiGatewayUrl + 'SaveEntityStageRaiseHandTransition';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  saveEntityWorkflowStageValueNote(params) {
    const url = this.apiGatewayUrl + 'SaveEntityWorkflowStageValueNote';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  isEntityStageTasksCompleted(entityId: number, entityTypeId: number, stageId: number, workflowId: number, requiredTaskIds: string) {
    let params = { entityId, entityTypeId, stageId, workflowId, requiredTaskIds };
    const url = this.apiGatewayUrl + 'IsEntityStageTasksCompleted';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  isEntityStageRaiseHandTransitionExist(entityId: number, entityTypeId: number, workflowId: number, stageId: number) {
    let params = { entityId, entityTypeId, workflowId, stageId };
    const url = this.apiGatewayUrl + 'IsEntityStageRaiseHandTransitionExist';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  isEntityStageIsPaused(entityId: number, entityTypeId: number, workflowId: number) {
    const url = this.apiGatewayUrl + 'IsEntityStageIsPaused';
    return this.getHttpAuthrizedGetRequest(url, { entityId, entityTypeId, workflowId });
  }

}
