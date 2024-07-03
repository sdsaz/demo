export class Newsletter {
    id: number;
    tenantId: number;
    name: string;
    description: string;
    title: string;
    bodyText: string;
    isActive: boolean;

    constructor(campaign) {
        this.id = campaign.id || 0;
        this.tenantId = campaign.tenantId;
        this.name = campaign.name;
        this.title = campaign.title;
        this.description = campaign.description;
        this.bodyText = campaign.bodyText;
        this.isActive = campaign.isActive;
    }
}
