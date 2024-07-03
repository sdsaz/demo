export class Order {
    id: number;
    tenantId: number;
    name: string;
    orderNumber: string;
    totalAmount: string;
    description: string;
    entityRecordTypeID: number;
    billToContactID?:number;
    billToAccountID?:number; 
    entityWorkflowId?: number;
    assignedTo?: number;

    constructor(order) {
        this.id = order.id || 0;
        this.tenantId = order.tenantId;
        this.name = order.name;
        this.orderNumber = order.orderNumber;
        this.totalAmount = order.totalAmount;
        this.description = order.description;
        this.entityRecordTypeID = order.entityRecordTypeID;
        this.billToContactID = order.billToContactID;
        this.billToAccountID = order.billToAccountID;
        this.entityWorkflowId = order.entityWorkflowId;
        this.assignedTo = order.assignedTo; 
    }
}
