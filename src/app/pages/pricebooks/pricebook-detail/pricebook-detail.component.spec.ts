import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricebookDetailComponent } from './pricebook-detail.component';

describe('PricebookDetailComponent', () => {
  let component: PricebookDetailComponent;
  let fixture: ComponentFixture<PricebookDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricebookDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricebookDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
