import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkTaskListComponent } from './worktask-list.component';

describe('WorkTaskListComponent', () => {
  let component: WorkTaskListComponent;
  let fixture: ComponentFixture<WorkTaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkTaskListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
