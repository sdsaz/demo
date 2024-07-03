import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricebookListComponent } from './pricebook-list.component';

describe('PricebookListComponent', () => {
  let component: PricebookListComponent;
  let fixture: ComponentFixture<PricebookListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricebookListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricebookListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
