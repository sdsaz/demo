export class Product {
    id: number;
    tenantId: number;
    name: string;
    productCategoryIds: string;
    code: string;
    stockQty: number;
    uomId: number;
    price: string;
    description: string;
    entityRecordTypeId: number;
    startDate?: Date;
    assignedTo?: number;
    endDate?: Date;
    entityWorkflowId: number;

    constructor(product) {
        this.id = product.id || 0;
        this.tenantId = product.tenantId;
        this.name = product.name;
        this.productCategoryIds = product.productCategoryIds;
        this.code = product.email;
        this.stockQty = product.stockQty;
        this.uomId = product.uomId;
        this.price = product.phone;
        this.description = product.ein;
        this.entityRecordTypeId = product.entityRecordTypeId;
        this.startDate = product.startDate;
        this.endDate = product.endDate;
        this.assignedTo = product.assignedTo;
        this.entityWorkflowId = this.entityWorkflowId;
    }
}