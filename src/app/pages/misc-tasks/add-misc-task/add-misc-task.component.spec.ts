import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMiscTaskComponent } from './add-misc-task.component';

describe('AddMiscTaskComponent', () => {
  let component: AddMiscTaskComponent;
  let fixture: ComponentFixture<AddMiscTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddMiscTaskComponent]
    });
    fixture = TestBed.createComponent(AddMiscTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
