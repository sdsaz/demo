import { TestBed } from '@angular/core/testing';

import { EntityrequestService } from './entityrequest.service';

describe('EntityrequestService', () => {
  let service: EntityrequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityrequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
