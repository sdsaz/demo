import { TestBed } from '@angular/core/testing';

import { EntityReviewsService } from './entity-reviews.service';

describe('EntityReviewsService', () => {
  let service: EntityReviewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityReviewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
