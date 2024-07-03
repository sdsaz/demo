import { Injectable } from '@angular/core';
import { adapter } from '../interfaces/adapter';
import { Carousel } from '../sharedModels/carousel';

@Injectable({
  providedIn: 'root'
})
export class CarouselAdapterService implements adapter<Carousel> {

  constructor() { }

  adapt(item: any): Carousel {
    return new Carousel(item.id, item.name, item.filePath, item.imageSrc, item.alt, item.mimeType);
  }
}
