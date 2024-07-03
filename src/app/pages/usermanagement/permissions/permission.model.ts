export class Permission {
    id: string;
    name: string;
    groupName: string;
    isChecked: boolean;
    totalRecords: number;
    constructor(permission) {
        this.id = permission.id || 0;
        this.name = permission.name || '';
        this.groupName = permission.groupName || '';
        this.isChecked = permission.isChecked || false;
        this.totalRecords = permission.totalRecords || 0;
    }
}
