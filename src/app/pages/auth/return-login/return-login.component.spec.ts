import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReturnLoginComponent } from './return-login.component';

describe('ReturnLoginComponent', () => {
  let component: ReturnLoginComponent;
  let fixture: ComponentFixture<ReturnLoginComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnLoginComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
