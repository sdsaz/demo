import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountWorkFlowListComponent } from './account-work-flow-list.component';

describe('AccountWorkFlowListComponent', () => {
  let component: AccountWorkFlowListComponent;
  let fixture: ComponentFixture<AccountWorkFlowListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountWorkFlowListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountWorkFlowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
