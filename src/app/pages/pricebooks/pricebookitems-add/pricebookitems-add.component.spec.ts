import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricebookitemsAddComponent } from './pricebookitems-add.component';

describe('PricebookitemsAddComponent', () => {
  let component: PricebookitemsAddComponent;
  let fixture: ComponentFixture<PricebookitemsAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricebookitemsAddComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricebookitemsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
