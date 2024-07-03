import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductcategoryDetailComponent } from './productcategory-detail.component';

describe('ProductcategoryDetailComponent', () => {
  let component: ProductcategoryDetailComponent;
  let fixture: ComponentFixture<ProductcategoryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductcategoryDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductcategoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
