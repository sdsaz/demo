import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormrendererComponent } from './formrenderer.component';

describe('FormrendererComponent', () => {
  let component: FormrendererComponent;
  let fixture: ComponentFixture<FormrendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormrendererComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormrendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
