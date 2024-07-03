import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityReviewDisplayComponent } from './entity-review-display.component';

describe('EntityReviewDisplayComponent', () => {
  let component: EntityReviewDisplayComponent;
  let fixture: ComponentFixture<EntityReviewDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityReviewDisplayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityReviewDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
