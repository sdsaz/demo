import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSkuAssemblyComponent } from './add-sku-assembly.component';

describe('AddSkuAssemblyComponent', () => {
  let component: AddSkuAssemblyComponent;
  let fixture: ComponentFixture<AddSkuAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddSkuAssemblyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSkuAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
