import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';

@Injectable()
export class OrdersService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "OrderService/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getOrderByID(params) {
    const url = this.apiGatewayUrl + 'GetOrderByID';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getOrdersByWorkFlowID(params) {
    const url = this.apiGatewayUrl + 'GetOrdersbyWorkFlowID';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getOrdersByWorkFlowIDAndStageID(params) {
    let url = this.apiGatewayUrl + 'GetOrdersbyWorkFlowIDAndStageID';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getOrderCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetOrderCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveOrder(workTask) {
    const url = this.apiGatewayUrl + 'SaveOrder';
    return this.getHttpAuthrizedPostRequest(url, workTask);
  }

  updateOrderBulkAssignedTo(params) {
    let url = this.apiGatewayUrl + 'UpdateOrderBulkAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOrderAssignedTo(workTask) {
    let url = this.apiGatewayUrl + 'UpdateOrderAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, workTask);
  }

  updateOrderPriority(workTask) {
    let url = this.apiGatewayUrl + 'UpdateOrderPriority';
    return this.getHttpAuthrizedPutRequest(url, workTask);
  }

  updateOrderSeverity(workTask) {
    let url = this.apiGatewayUrl + 'UpdateOrderSeverity';
    return this.getHttpAuthrizedPutRequest(url, workTask);
  }

  updateOrderDueDate(workTask) {
    let url = this.apiGatewayUrl + 'UpdateOrderDueDate';
    return this.getHttpAuthrizedPutRequest(url, workTask);
  }

  updateOrderField(params) {
    let url = this.apiGatewayUrl + 'UpdateOrderField';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
  
  saveOrderItem(orderItem) {
    const url = this.apiGatewayUrl + 'SaveOrderItem';
    return this.getHttpAuthrizedPostRequest(url, orderItem);
  }

  deleteOrderItem(Id: number) {
    let params = { Id };
    const url = this.apiGatewayUrl + 'DeleteOrderItem';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }
  
  changeStatus(orderId, status) {
    const url = this.apiGatewayUrl + 'ChangeStatus';
    const params = {
      'orderId': orderId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  changeEntityRecordType(orderIds, entityRecordTypeId) {
    let params = null;
    if (entityRecordTypeId != null) {
      params = { ordersIds: orderIds, entityRecordTypeId: entityRecordTypeId };
    } else {
      params = { ordersIds: orderIds };
    }
    const url = this.apiGatewayUrl + 'ChangeEntityRecordType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  changeOrderEntityType(ordersIds, workflowId) {
    let params = { 'ordersIds': ordersIds, 'entityWorkflowId': workflowId };
    const url = this.apiGatewayUrl + 'ChangeOrderEntityType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  updateDefaultEstimatedTimeAndPoint(ordersIds, workflowId) {
    let params = { ordersIds, workflowId };
    const url = this.apiGatewayUrl + 'UpdateDefaultEstimatedTimeAndPoint';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  deleteOrder(orderId) {
    const url = this.apiGatewayUrl + 'DeleteOrder';
    const params = { 'id': orderId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  getOrderListWithPagination(params: any) {
    const url = this.apiGatewayUrl + 'GetOrderListWithPagination';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  exportOrdersList(params) {
    const url = this.apiGatewayUrl + 'ExportOrderListing';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  exportOrder(params) {
    const url = this.apiGatewayUrl + 'ExportOrder';
    return this.getHttpAuthrizedPostRequest(url, params);
  }
}
