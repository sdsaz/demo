import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';
import { ProductCategoryPagingParams, ProductPagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable()
export class ProductsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "ProductService/";

  constructor(
    public _httpClient: HttpClient,
    public _router: Router,
    public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getProducts(pagination: ProductPagingParams) {
    const url = this.apiGatewayUrl + 'GetProducts';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getProductById(productId: number) {
    let params = { productId };
    const url = this.apiGatewayUrl + 'GetProductById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getProductsByStage(params) {
    const url = this.apiGatewayUrl + 'GetProductsByWorkflowIDAndStageID';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getWorkFlowProducts(pagination) {
    const url = this.apiGatewayUrl + 'GetProductsByWorkflowIDWithPagination';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  updateProduct(product: any) {
    const url = this.apiGatewayUrl + 'SaveProduct';
    return this.getHttpAuthrizedPostRequest(url, product);
  }

  saveProductAssignedTo(product) {
    let url = this.apiGatewayUrl + 'SaveProductAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, product);
  }

  updateProductField(params) {
    let url = this.apiGatewayUrl + 'UpdateProductField';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteProduct(productId: number) {
    let params = { productId };
    const url = this.apiGatewayUrl + 'DeleteProduct';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  DeleteProductWithRelatedWorkTasks(productId: number) {
    let params = { productId };
    const url = this.apiGatewayUrl + 'DeleteProductWithRelatedWorkTasks';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }


  getProductCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetProductCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }
  
  downloadImportTemplate(entityWorkflowId: number) {
    let param: any = {};
    if(entityWorkflowId) {
      param.entityWorkflowId = entityWorkflowId;
    }
    const url = this.apiGatewayUrl + 'DownloadProductsImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, param);
  }

  downloadKanbanImportTemplate(entityWorkflowId) {
    let params = { 'entityWorkflowId': entityWorkflowId };
    const url = this.apiGatewayUrl + 'DownloadProductsKanbanImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  importBulkProducts(params) {
    const url = this.apiGatewayUrl + 'ImportProducts';
    return this.getHttpAuthrizedPostRequest(url, params); 
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  //Product Categories
  saveProductCategory(productCategory: any) {
    const url = this.apiGatewayUrl + 'SaveProductCategory';
    return this.getHttpAuthrizedPostRequest(url, productCategory);
  } 

  updateProductCategoryField(workTask) {
    const url = this.apiGatewayUrl + 'UpdateProductCategoryField';
    return this.getHttpAuthrizedPostRequest(url, workTask);
  }
  
  getProductCategoryDetailById(productCategoryId: number) {
    let params = { productCategoryId: productCategoryId };
    const url = this.apiGatewayUrl + 'GetProductCategoryDetailById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getProductCategoryCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetProductCategoryCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getProductCategories(pagination: ProductCategoryPagingParams) {
    const url = this.apiGatewayUrl + 'GetProductCategories';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  exportProductCategories(pagination: ProductCategoryPagingParams) {
    const url = this.apiGatewayUrl + 'ExportProductCategories';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }
  
  changeStatus(productCategoryId, status) {
    const url = this.apiGatewayUrl + 'ChangeStatus';
    const params = {
      'productCategoryId': productCategoryId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteProductCategory(productCategoryId) {
    const url = this.apiGatewayUrl + 'DeleteProductCategory';
    const params = { 'productCategoryId': productCategoryId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  } 
  
  //Product Category Products
  saveProductCategoryProduct(productCategory: any) {
    const url = this.apiGatewayUrl + 'SaveProductCategoryProduct';
    return this.getHttpAuthrizedPostRequest(url, productCategory);
  }

  deleteProductCategoryProduct(productCategoryId) {
    const url = this.apiGatewayUrl + 'DeleteProductCategoryProduct';
    const params = { 'id': productCategoryId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  } 

  setProductPrimaryImage(params) {
    const url = this.apiGatewayUrl + 'SetProductPrimaryImage';
    return this.getHttpAuthrizedPostRequest(url, params);
  } 

  changeProductStatus(productId, status) {
    const url = this.apiGatewayUrl + 'ChangeProductStatus';
    const params = {
      'productId': productId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  //Product Skus
  saveProductSku(productSku: any) {
    const url = this.apiGatewayUrl + 'SaveProductSku';
    return this.getHttpAuthrizedPostRequest(url, productSku);
  } 
  
  getProductSkuDetailById(productSkuId: number) {
    let params = { productSkuId: productSkuId };
    const url = this.apiGatewayUrl + 'GetProductSkuDetailById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getProductSkuCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetProductSkuCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  changeSkuStatus(productSkuId, status) {
    const url = this.apiGatewayUrl + 'ChangeSkuStatus';
    const params = {
      'productSkuId': productSkuId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteProductSku(productSkuId) {
    const url = this.apiGatewayUrl + 'DeleteProductSku';
    const params = { 'productSkuId': productSkuId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }
  
  getProductSkuAssemblyById(productSkuAssemblyId: number) {
    let url = this.apiGatewayUrl + 'GetProductSkuAssemblyDetail';
    return this.getHttpAuthrizedGetRequest(url, { productSkuAssemblyId: productSkuAssemblyId });
  }

  saveUpdateSkuAssembly(productSkuAssembly: any) {
    const url = this.apiGatewayUrl + 'SaveProductSkuAssembly';
    return this.getHttpAuthrizedPostRequest(url, productSkuAssembly);
  }

  deleteProductSkuAssembly(productSkuAssemblyId) {
    const url = this.apiGatewayUrl + 'DeleteProductSkuAssembly';
    return this.getHttpAuthrizedDeleteRequest(url, { 'productSkuAssemblyId': productSkuAssemblyId });
  }
  UpdateProductBulkAssignedToUsers(param: any) {
    return this.getHttpAuthrizedPutRequest(this.apiGatewayUrl + 'UpdateProductBulkAssignedToUsers', param);
  }

  //Export Product List 
  exportProductList(pagination: ProductPagingParams) {
    const url = this.apiGatewayUrl + 'ExportProductsListing';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  //Export Products
  exportProduct(pagination: ProductPagingParams) {
    const url = this.apiGatewayUrl + 'ExportProduct';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }
}
