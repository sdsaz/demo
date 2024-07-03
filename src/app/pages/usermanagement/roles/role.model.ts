export class Role {
    id: string;
    name: string;
    permissionSetId: string;
    permissionSetName: string;
    filterId?: number;
    constructor(role) {
        this.id = role.id || 0;
        this.name = role.name || '';
        this.permissionSetId = role.permissionSetId;
        this.permissionSetName = role.permissionSetName || '';
        this.filterId = role.filterId;
    }
}
