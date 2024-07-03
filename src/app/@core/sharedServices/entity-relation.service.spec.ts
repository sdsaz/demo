import { TestBed } from '@angular/core/testing';

import { EntityRelationService } from './entity-relation.service';

describe('EntityRelationService', () => {
  let service: EntityRelationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityRelationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
