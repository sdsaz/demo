export class Campaign {
    id: number;
    tenantId: number;
    name: string;
    description: string;
    startDate: any;
    endDate: any;
    isActive: boolean;

    constructor(campaign) {
        this.id = campaign.id || 0;
        this.tenantId = campaign.tenantId;
        this.name = campaign.name;
        this.description = campaign.description;
        this.startDate = campaign.startDate;
        this.endDate = campaign.endDate;
        this.isActive = campaign.isActive;
    }
}
