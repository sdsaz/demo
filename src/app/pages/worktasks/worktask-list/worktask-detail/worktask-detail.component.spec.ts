import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkTaskDetailComponent } from './worktask-detail.component';

describe('WorkTaskDetailComponent', () => {
  let component: WorkTaskDetailComponent;
  let fixture: ComponentFixture<WorkTaskDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkTaskDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkTaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
