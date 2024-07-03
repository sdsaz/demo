import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicCommonFilterComponent } from './dynamic-common-filter.component';

describe('DynamicCommonFilterComponent', () => {
  let component: DynamicCommonFilterComponent;
  let fixture: ComponentFixture<DynamicCommonFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DynamicCommonFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicCommonFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
