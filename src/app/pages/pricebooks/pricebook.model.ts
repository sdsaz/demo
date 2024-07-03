export class PriceBook {
    id: number;
    tenantId: number;
    name: string;
    description: string;
    startDate?: Date;
    endDate?: Date;

    constructor(priceBook) {
        this.id = priceBook.id || 0;
        this.tenantId = priceBook.tenantId;
        this.name = priceBook.name;
        this.description = priceBook.ein;
        this.startDate = priceBook.startDate;
        this.endDate = priceBook.endDate;
    }
}
