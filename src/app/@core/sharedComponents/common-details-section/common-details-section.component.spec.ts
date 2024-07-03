import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonDetailsSectionComponent } from './common-details-section.component';

describe('CommonDetailsSectionComponent', () => {
  let component: CommonDetailsSectionComponent;
  let fixture: ComponentFixture<CommonDetailsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonDetailsSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonDetailsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
