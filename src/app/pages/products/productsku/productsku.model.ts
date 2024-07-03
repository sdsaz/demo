export class ProductSku {
    id: number;
    tenantId: number;
    name: string;
    sku: string;
    uomId: number;
    uomName: string;
    price: string;
    stockQty: number;
    entityRecordTypeId: number;
    productId: number;

    constructor(productSku) {
        this.id = productSku.id || 0;
        this.tenantId = productSku.tenantId;
        this.name = productSku.name;
        this.sku = productSku.sku;
        this.uomId = productSku.uomId;
        this.uomName = productSku.uomName;
        this.price = productSku.price;
        this.stockQty = productSku.stockQty;
        this.entityRecordTypeId = productSku.entityRecordTypeId;
        this.productId = productSku.productId;
    }
}
