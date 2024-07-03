import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorktaskListingComponent } from './worktask-listing.component';

describe('WorktaskListingComponent', () => {
  let component: WorktaskListingComponent;
  let fixture: ComponentFixture<WorktaskListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorktaskListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorktaskListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
