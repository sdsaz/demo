import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityReviewDialogComponent } from './entity-review-dialog.component';

describe('EntityReviewDialogComponent', () => {
  let component: EntityReviewDialogComponent;
  let fixture: ComponentFixture<EntityReviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityReviewDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityReviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
