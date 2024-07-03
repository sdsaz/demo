import { TestBed } from '@angular/core/testing';

import { EntityNotificationService } from './entity-notification.service';

describe('EntityNotificationService', () => {
  let service: EntityNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
