import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolidGaugeChartComponent } from './solid-gauge-chart.component';

describe('SolidGaugeChartComponent', () => {
  let component: SolidGaugeChartComponent;
  let fixture: ComponentFixture<SolidGaugeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SolidGaugeChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolidGaugeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
