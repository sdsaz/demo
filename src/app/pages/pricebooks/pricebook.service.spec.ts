import { TestBed } from '@angular/core/testing';

import { PricebookService } from './pricebook.service';

describe('PricebookService', () => {
  let service: PricebookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PricebookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
