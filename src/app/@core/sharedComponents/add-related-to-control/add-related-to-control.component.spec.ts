import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRelatedToControlComponent } from './add-related-to-control.component';

describe('AddRelatedToControlComponent', () => {
  let component: AddRelatedToControlComponent;
  let fixture: ComponentFixture<AddRelatedToControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRelatedToControlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRelatedToControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
