import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiscTaskListComponent } from './misc-task-list.component';

describe('MiscTaskListComponent', () => {
  let component: MiscTaskListComponent;
  let fixture: ComponentFixture<MiscTaskListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MiscTaskListComponent]
    });
    fixture = TestBed.createComponent(MiscTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
