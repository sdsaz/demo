export class User {
    username: string;
    password: string;
}

export class UserDetail {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    userName: string;
    imagePath: string;
    roleId: number;
    roleName: string;
    phone: string;
    isDefaultAdmin: string;
    fullName: string;
    TotalRecords: number;
    title: string;
    website: string;
    linkedInProfile: string;
    facebookProfile: string;
    twitterProfile: string;
    qualifications: string;
}

export class LoggedUser {
    accessToken: string;
    isSuperAdmin: boolean;
    email: string;
    firstName: string;
    imagePath: string;
    lastName: string;
    middleName: string;
    phone: string;
    phoneMobile: string;
    roleName: string;
    tenantId: number
    tenantName: string;
    userId: number;
    userPermissionHash: string;
}

export interface UserMenuItem {
    id: number,
    parentId: number,
    code: string,
    name: string,
    link: string,
    isGroup: boolean,
    iconClass: string,
    level: number
}