export class Carousel {
    id: number;
    imageSrc?: string;
    alt?: string;
    mimeType?: string;
    name: string;
    filePath: string;

    constructor(id: number, name: string, filePath: string, imageSrc?: string, alt?: string,
        mimeType?: string) {
        this.id = id;
        this.name = name;
        this.filePath = filePath;
        this.imageSrc = imageSrc;
        this.alt = alt;
        this.mimeType = mimeType
    }
}