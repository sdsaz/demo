import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductskuAddComponent } from './productsku-add.component';

describe('ProductskuAddComponent', () => {
  let component: ProductskuAddComponent;
  let fixture: ComponentFixture<ProductskuAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductskuAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductskuAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
