import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricebookAddComponent } from './pricebook-add.component';

describe('PricebookAddComponent', () => {
  let component: PricebookAddComponent;
  let fixture: ComponentFixture<PricebookAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricebookAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricebookAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
