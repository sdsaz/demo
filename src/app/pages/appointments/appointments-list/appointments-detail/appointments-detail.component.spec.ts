import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsDetailComponent } from './appointments-detail.component';

describe('AppointmentsDetailComponent', () => {
  let component: AppointmentsDetailComponent;
  let fixture: ComponentFixture<AppointmentsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentsDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
