import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityitemsAddComponent } from './opportunityitems-add.component';

describe('OpportunityitemsAddComponent', () => {
  let component: OpportunityitemsAddComponent;
  let fixture: ComponentFixture<OpportunityitemsAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpportunityitemsAddComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpportunityitemsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
