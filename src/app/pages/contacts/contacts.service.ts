import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';
import { ContactsPagingParams, PagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable()
export class ContactsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "ContactService/";

  constructor(
    public _httpClient: HttpClient,
    public _router: Router,
    public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getContacts(pagination: ContactsPagingParams) {
    const url = this.apiGatewayUrl + 'GetContacts';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getContactCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetContactCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getContactById(contactId: number) {
    let params = { contactId };
    const url = this.apiGatewayUrl + 'GetContact';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getContactsByStage(params) {
    const url = this.apiGatewayUrl + 'GetContactsByWorkflowIDAndStageID';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getWorkFlowContacts(pagination) {
    const url = this.apiGatewayUrl + 'GetContactsByWorkflowIDWithPagination';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  updateContact(contact: any) {
    const url = this.apiGatewayUrl + 'SaveContact';
    return this.getHttpAuthrizedPostRequest(url, contact);
  }

  updateContactField(params) {
    let url = this.apiGatewayUrl + 'UpdateContactField';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  saveContactAssignedTo(contact) {
    let url = this.apiGatewayUrl + 'SaveContactAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, contact);
  }

  downloadImportTemplate(entityWorkflowId) {
    let param: any = {};
    if(entityWorkflowId) {
      param.entityWorkflowId = entityWorkflowId;
    }
    const url = this.apiGatewayUrl + 'DownloadImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, param);
  }

  downloadKanbanImportTemplate(entityWorkflowId) {
    let params = { 'entityWorkflowId': entityWorkflowId };
    const url = this.apiGatewayUrl + 'DownloadKanbanImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  importBulkContacts(params) {
    const url = this.apiGatewayUrl + 'ImportContacts';
    return this.getHttpAuthrizedPostRequest(url, params); 
  }

  deleteContact(contactId) {
    const url = this.apiGatewayUrl + 'DeleteContact';
    const params = { 'contactId': contactId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  deleteContactWithRelatedWorkTasks(contactId) {
    const url = this.apiGatewayUrl + 'DeleteContactWithRelatedWorkTasks';
    const params = { 'contactId': contactId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  changeStatus(contactId, status) {
    const url = this.apiGatewayUrl + 'ChangeStatus';
    const params = {
      'contactId': contactId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  UpdateContactBulkAssignedToUsers(param: any) {
    return this.getHttpAuthrizedPutRequest(this.apiGatewayUrl + 'UpdateContactBulkAssignedToUsers', param);
  }

  exportContactsList(pagination: ContactsPagingParams) {
    const url = this.apiGatewayUrl + 'ExportContactsList';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  exportContacts(pagination: ContactsPagingParams) {
    const url = this.apiGatewayUrl + 'ExportContact';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

}
