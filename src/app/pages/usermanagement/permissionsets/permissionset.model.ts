export class PermissionSet {
    id: string;
    name: string;
    isActive: boolean;
    permissionId: string;
    permissionName: string;
    totalRecords: string;

    constructor(permissionset) {
        this.id = permissionset.id || 0;
        this.name = permissionset.name || '';
        this.isActive = permissionset.isActive;
        this.permissionId = permissionset.permissionId;
        this.permissionName = permissionset.permissionName || '';
        this.totalRecords = permissionset.permissionName || '';
    }
}
