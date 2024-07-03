import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderWorkFlowListComponent } from './order-work-flow-list.component';

describe('OrderWorkFlowListComponent', () => {
  let component: OrderWorkFlowListComponent;
  let fixture: ComponentFixture<OrderWorkFlowListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderWorkFlowListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderWorkFlowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
