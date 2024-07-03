import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductWorkflowListComponent } from './product-workflow-list.component';

describe('ProductWorkflowListComponent', () => {
  let component: ProductWorkflowListComponent;
  let fixture: ComponentFixture<ProductWorkflowListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductWorkflowListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductWorkflowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
