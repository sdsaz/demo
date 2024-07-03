export class Appointment {
    id: number;
    subject: string;
    location: string;
    description: string;
    startTime: Date;
    durationMins: string;
    constructor(appointment) {
        this.id = appointment.id || 0;
        this.subject = appointment.subject || '';
        this.location = appointment.location || '';
        this.description = appointment.description || '';
        this.startTime = appointment.startDate || new Date();
        this.durationMins = appointment.durationMins || '';
    }
}

export class Activity {
    id: number;
    taskType:string;
    entityTypeId: number;
    entityId: number;
    entityRecordTypeID: number;    
    name: string;
    description: string;
    taskDate: Date;
    dueDate: Date;
    assignedUserId: any;
    assignedAttendeesId: any;
    statusId: number;
    notes: any;
    isEditable: boolean;

    constructor(activity) {
        this.id = activity.id || 0;
        this.taskType = activity.taskType || '';
        this.entityTypeId = activity.entityTypeId || 0;
        this.entityId = activity.entityId || 0;
        this.entityRecordTypeID = activity.entityRecordTypeID || 0;        
        this.name = activity.name || '';
        this.description = activity.description || '';
        this.taskDate = activity.taskDate || new Date();
        this.dueDate = activity.dueDate || null;
        this.assignedUserId = activity.assignedUserId || null;
        this.statusId = activity.statusId || 0;
        this.notes = activity.notes || '';
        this.isEditable = activity.isEditable;
    }
}

export class Events {
    id: number;
    taskType:string;
    entityTypeId: number;
    entityId: number;
    entityRecordTypeID: number;  
    subject:string;
    location: string;
    description: string;
    activityDate: Date;
    startTime: Date;
    endTime: Date;
    ownerId?:number;
    attendeesId:any;
    eventAttendees: any;
    eventTypeId?: number;
    statusID: number;
    notes: any;
    isEditable: boolean

    constructor(event) {
        this.id = event.id || 0;
        this.taskType = event.taskType || '';
        this.entityTypeId = event.entityTypeId || 0;
        this.entityId = event.entityId || 0;
        this.entityRecordTypeID = event.entityRecordTypeID || 0;        
        this.subject = event.subject || '';
        this.location = event.location || '';
        this.description = event.description || '';
        this.activityDate = event.activityDate || new Date();
        this.startTime = event.startTime || new Date();
        this.endTime = event.endTime || new Date();
        this.ownerId = event.ownerId || null;   
        this.attendeesId = null;
        this.eventAttendees = event.eventAttendees || null;   
        this.eventTypeId = event.eventTypeId || null;
        this.statusID = event.statusID || 0;
        this.notes = event?.notes || ''
        this.isEditable = event.isEditable;
    }
}


export class EventRelations {
    id: number;
    eventId: number;
    entityTypeId: number;
    entityId: number;
    statusId: number;

   
    constructor(eventRelations) {
        this.id = eventRelations.id || 0;
        this.eventId = eventRelations.eventId || 0;
        this.entityTypeId = eventRelations.entityTypeId || 0;
        this.entityId = eventRelations.entityId || 0;
        this.statusId = eventRelations.statusId || 0;
    }
}

export class EventProvider {
    id: number;
    entityTypeId: number;
    name:string;   

    constructor(eventProvider) {
        this.id = eventProvider.id || 0;
        this.entityTypeId = eventProvider.entityTypeId || 0;
        this.name = eventProvider.name || '';
    }
}