import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductskuDetailComponent } from './productsku-detail.component';

describe('ProductskuDetailComponent', () => {
  let component: ProductskuDetailComponent;
  let fixture: ComponentFixture<ProductskuDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductskuDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductskuDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
