export class Entitytags {
    id: number;
    entityTypeId: number;
    entityRecordTypeId: number;
    entityName: string;
    tagCategoryId: number;
    tagCategoryName: string;
    name: string;
    displayOrder: number;
    shapeID: any;
    tagFontColor: string;
    tagImage: string;
    tagIsActive: string;

    constructor(entityTags) {
        this.id = entityTags.id || 0;
        this.name = entityTags.name;
        this.entityTypeId = entityTags.entityTypeId;
        this.entityRecordTypeId = entityTags.entityRecordTypeId;
        this.entityName = entityTags.entityName;
        this.tagCategoryId = entityTags.tagCategoryId;
        this.tagCategoryName = entityTags.tagCategoryName;
        this.displayOrder = entityTags.displayOrder;
        this.shapeID = entityTags.shapeID;
        this.tagFontColor = entityTags.TagFontColor;
        this.tagImage = entityTags.tagImage;
        this.tagIsActive = entityTags.tagIsActive;
    }
}

export class EntitytagCategories {
    id: number;
    entityTypeId: number;
    entityRecordTypeId: number;
    name: string;
    isSingular: boolean = false;
    isPrivate: boolean = false;
    entityName: string;

    constructor(entitytagCategories) {
        this.id = entitytagCategories.id;
        this.entityTypeId = entitytagCategories.entityTypeId;
        this.entityRecordTypeId = entitytagCategories.entityRecordTypeId;
        this.name = entitytagCategories.company;
        this.isSingular = entitytagCategories.isSingular;
        this.isPrivate = entitytagCategories.isPrivate;
        this.entityName = entitytagCategories.entityName;
    }
}
