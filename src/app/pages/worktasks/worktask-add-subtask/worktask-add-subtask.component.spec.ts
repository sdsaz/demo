import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorktaskAddSubTaskComponent } from './worktask-add-subtask.component';

describe('WorktaskAddSubTaskComponent', () => {
  let component: WorktaskAddSubTaskComponent;
  let fixture: ComponentFixture<WorktaskAddSubTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorktaskAddSubTaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorktaskAddSubTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
