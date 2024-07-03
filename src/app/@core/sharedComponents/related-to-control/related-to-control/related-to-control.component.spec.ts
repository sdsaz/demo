import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedToControlComponent } from './related-to-control.component';

describe('RelatedToControlComponent', () => {
  let component: RelatedToControlComponent;
  let fixture: ComponentFixture<RelatedToControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelatedToControlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelatedToControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
