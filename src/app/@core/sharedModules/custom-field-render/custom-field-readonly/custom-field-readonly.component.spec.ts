import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFieldReadOnlyComponent } from './custom-field-readonly.component';

describe('CustomFieldReadOnlyComponent', () => {
  let component: CustomFieldReadOnlyComponent;
  let fixture: ComponentFixture<CustomFieldReadOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomFieldReadOnlyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldReadOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
