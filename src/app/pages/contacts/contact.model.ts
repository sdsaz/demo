export class Contact {
    
    id: number;
    tenantId: number;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    birthdate: any;
    gender: number;
    ssn: string;
    entityRecordTypeId: number;

    constructor(contact) {
        this.id = contact.id || 0;
        this.tenantId = contact.tenantId;
        this.firstname = contact.firstname;
        this.lastname = contact.lastname;
        this.email = contact.email;
        this.phone = contact.phone;
        this.birthdate = contact.birthDate
        this.gender = contact.gender
        this.ssn = contact.ssn
        this.entityRecordTypeId = contact.entityRecordTypeId
    }
}
