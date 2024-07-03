export class ProductCategory {
    
    id: number;
    tenantId: number;
    parentId?:number;
    code?:string;
    name:string;
    description:string; 
    productId:number;
    constructor(productCategory : any) {
        this.id = productCategory.id || 0;
        this.tenantId = productCategory.tenantId;
        this.parentId = productCategory.parentId;
        this.code = productCategory.code;
        this.name = productCategory.name;
        this.description = productCategory.description; 
        this.productId = productCategory.productId;
    }
}
