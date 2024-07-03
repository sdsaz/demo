import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentValueDefaultComponent } from './current-value-default.component';

describe('CurrentValueDefaultComponent', () => {
  let component: CurrentValueDefaultComponent;
  let fixture: ComponentFixture<CurrentValueDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentValueDefaultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentValueDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});