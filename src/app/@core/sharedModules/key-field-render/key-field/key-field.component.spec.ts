import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyFieldComponent } from './key-field.component';

describe('KeyFieldComponent', () => {
  let component: KeyFieldComponent;
  let fixture: ComponentFixture<KeyFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KeyFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
