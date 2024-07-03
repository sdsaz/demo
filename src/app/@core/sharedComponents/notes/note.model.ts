export class Note {
    id:number;
    tenantId:number;
    entityTypeId:number;
    entityId:number;
    entityRecordTypeID:number;
    subject:string;
    description:string;
    isPrivate:boolean;
    createdBy:number;
    constructor(note) {        
        this.id = note.id | 0;
        this.tenantId = note.tenantId || 0;
        this.entityTypeId = note.entityTypeId || 0;
        this.entityId = note.entityId || 0;
        this.entityRecordTypeID = note.entityRecordTypeID || 0;
        this.subject = note.subject || '';
        this.description = note.description || '';
        this.isPrivate = note.isPrivate || false;
        this.createdBy = note.createdBy || 0;        
    }
}