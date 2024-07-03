import { TestBed } from '@angular/core/testing';

import { WorkflowautomationService } from './workflowautomation.service';

describe('WorkflowautomationService', () => {
  let service: WorkflowautomationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowautomationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
