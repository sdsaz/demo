export class Profile {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    imagePath: string;
    phone: string;
    phoneMobile: string;
    timezone:string;
    isActive:boolean;
    avatarBGColor: string;
    shortName: string;
    addresses: ProfileAddress;
    title: string;
    website: string;
    linkedInProfile: string;
    facebookProfile: string;
    twitterProfile: string;
    qualifications: string;
    aboutMe: string;
    achievements: string;

    constructor(profile) {
        this.id = profile.id || 0;
        this.firstName = profile.firstName || '';
        this.middleName = profile.middleName || '';
        this.lastName = profile.lastName || '';
        this.imagePath = profile.imagePath || 'assets/images/default/users/no-image.jpg';
        this.email = profile.email || '';
        this.phone = profile.phone || '';
        this.phoneMobile = profile.phone || '';
        this.timezone = profile.timezone || '';
        this.timezone = profile.timezone || '';
        this.isActive = profile.timezone || false;
        this.avatarBGColor = profile.avatarBGColor || '';
        this.shortName = profile.shortName || '';
        this.addresses = new ProfileAddress(profile.addresses != undefined ? profile.addresses : {});
        this.title = profile.title;
        this.website = profile.website;
        this.linkedInProfile = profile.linkedInProfile;
        this.facebookProfile = profile.facebookProfile;
        this.twitterProfile = profile.twitterProfile;
        this.qualifications = profile.qualifications;
        this.aboutMe = profile.aboutMe;
        this.achievements = profile.achievements;

        // this.addresses.id = profile.address.id != null ? profile.address.id : 0;
        // this.addresses.address1 = profile.address.address1 != null ? profile.address.address1 : '';
        // this.addresses.address2 = profile.address.address2 != null ? profile.address.address2 : '';
        // this.addresses.city = profile.address.city != null ? profile.address.city : '';
        // this.addresses.stateCode = profile.address.stateCode != null ? profile.address.stateCode : '';
        // this.addresses.postalCode = profile.address.postalCode != null ? profile.address.postalCode : '';
        // this.addresses.country = profile.address.country != null ? profile.address.country : '';
    }
}

export class ProfileAddress {
    id: number;
    address1: string;
    address2: string;
    city: string;
    stateCode: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
    stateId: number;
    stateName: string;
    countryId: number;

    constructor(profileAddress) {
        this.id = profileAddress.id || 0;
        this.address1 = profileAddress.address1 || '';
        this.address2 = profileAddress.address2 || '';
        this.city = profileAddress.city || '';
        this.stateCode = profileAddress.stateCode || '';
        this.postalCode = profileAddress.postalCode || '';
        this.country = profileAddress.country || '';        
        this.stateId = profileAddress.stateId || null;
        this.stateName = profileAddress.stateName || '';
        this.stateOrProvince = profileAddress.stateOrProvince || '';
        this.countryId = profileAddress.countryId || null;
    }
}

export class ProfileChangePassword {
    id: number;
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}