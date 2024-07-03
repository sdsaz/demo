export class UserLoginModel {
    email: string;
    password: string;
}

export class User {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    adName: string;
    imagePath: string;
    shortName: string;
    avatarBGColor: string;
    userName: string;
    password: string;
    email: string;
    phone: string;
    phoneMobile: string;
    address: string;
    roleId: number;
    timezone: string;
    roleName: string;
    isActive: boolean;
    userTenantsIsActive: boolean;
    isActiveDirectoryUser: boolean;
    permissionId: string;
    permissionName: string;
    roleIds: string;
    title: string;
    website: string;
    linkedInProfile: string;
    facebookProfile: string;
    twitterProfile: string;
    qualifications: string;
    countryCode: string;

    constructor(user) {
        {
            this.id = user.id || 0;
            this.name = user.name || '';
            this.firstName = user.firstName || '';
            this.lastName = user.lastName || '';
            this.adName = user.adName;
            this.imagePath = user.imagePath || '';
            this.shortName = user.shortName || '';
            this.avatarBGColor = user.avatarBGColor || '';
            this.userName = user.userName || '';
            this.password = user.password || '';
            this.email = user.email || '';
            this.phone = user.phone || '';
            this.address = user.address || '';
            this.roleId = user.roleId || '';
            this.timezone = user.timezone || '';
            this.roleName = user.roleName || '';
            this.isActive = user.isActive || 1;
            this.userTenantsIsActive = user.userTenantsIsActive || 1;
            this.isActiveDirectoryUser = user.isActiveDirectoryUser;
            this.permissionId = user.permissionId;
            this.permissionName = user.permissionName || '';
            this.roleIds = user.roleIds || '';
            this.title = user.title;
            this.website = user.website;
            this.linkedInProfile = user.linkedInProfile;
            this.facebookProfile = user.facebookProfile;
            this.twitterProfile = user.twitterProfile;
            this.qualifications = user.qualifications;
            this.countryCode = user.countryCode;
        }
    }
}

export class UserChangePassword {
    userId: number;
    password: string;
    confirmPassword: string;
    constructor(userChangePassword) {
        {
            this.userId = userChangePassword.userId || 0;
            this.password = userChangePassword.password || '';
            this.confirmPassword = userChangePassword.confirmPassword || '';
        }
    }
}

export class SingleSignOnModel {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    googleUserId: string;
    facebookUserId: string;
}