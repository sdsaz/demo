import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorktaskAddComponent } from './worktask-add.component';

describe('WorktaskAddComponent', () => {
  let component: WorktaskAddComponent;
  let fixture: ComponentFixture<WorktaskAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorktaskAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorktaskAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
