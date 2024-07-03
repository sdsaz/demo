import { TestBed } from '@angular/core/testing';

import { DynamicformService } from './dynamicform.service';

describe('DynamicformService', () => {
  let service: DynamicformService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
