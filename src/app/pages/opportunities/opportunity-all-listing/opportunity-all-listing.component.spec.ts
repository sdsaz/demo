import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityAllListingComponent } from './opportunity-all-listing.component';

describe('OpportunityAllListingComponent', () => {
  let component: OpportunityAllListingComponent;
  let fixture: ComponentFixture<OpportunityAllListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpportunityAllListingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpportunityAllListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
