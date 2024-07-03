import { TestBed } from '@angular/core/testing';

import { WorkflowmanagementService } from './workflowmanagement.service';

describe('WorkflowmanagementService', () => {
  let service: WorkflowmanagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowmanagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
