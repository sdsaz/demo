import { TestBed } from '@angular/core/testing';

import { EntitytagsService } from './entitytags.service';

describe('EntitytagsService', () => {
  let service: EntitytagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntitytagsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
