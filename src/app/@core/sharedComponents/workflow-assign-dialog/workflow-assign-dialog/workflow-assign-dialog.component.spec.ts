import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowAssignDialogComponent } from './workflow-assign-dialog.component';

describe('WorkflowAssignDialogComponent', () => {
  let component: WorkflowAssignDialogComponent;
  let fixture: ComponentFixture<WorkflowAssignDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowAssignDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowAssignDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
