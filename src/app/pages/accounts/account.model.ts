export class Account {
    id: number;
    tenantId: number;
    name: string;
    email: string;
    phone: string;
    ein: string;
    entityRecordTypeId: number;
    typeId: number;
    entityWorkflowId: number;
    assignedTo?: string;

    constructor(account) {
        this.id = account.id || 0;
        this.tenantId = account.tenantId;
        this.name = account.name;
        this.email = account.email;
        this.phone = account.phone;
        this.ein = account.ein;
        this.entityRecordTypeId = account.entityRecordTypeId;
        this.typeId = account.typeId;
        this.entityWorkflowId = account.entityWorkflowId;
        this.assignedTo = account.assignedTo;
    }
}
