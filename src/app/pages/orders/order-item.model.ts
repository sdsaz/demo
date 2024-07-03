export class OrderItem {
    id: number;
    tenantId: number;
    orderID: number;
    productID?: number;
    name: string;
    orderItemNumber: string;
    price?: number;
    discountAmount?: number; 
    discountRate?:number;
    taxAmount?: number; 
    taxRate?:number;
    discountType?:string; 
    quantity?:number;
    totalPrice?: number;
    constructor(orderItem) {
        this.id = orderItem.id || 0;
        this.tenantId = orderItem.tenantId;
        this.orderID = orderItem.orderID;
        this.productID = orderItem?.productID;
        this.name = orderItem.name;
        this.orderItemNumber = orderItem.orderItemNumber;
        this.price = orderItem.price;   
        this.discountAmount = orderItem.discountAmount;  
        this.discountRate = orderItem.discountRate;   
        this.discountType = orderItem.discountType;   
        this.quantity = orderItem.quantity;
        this.taxAmount = orderItem.taxAmount;  
        this.taxRate = orderItem.taxRate;   
        this.totalPrice = orderItem.totalPrice;
    }
}
