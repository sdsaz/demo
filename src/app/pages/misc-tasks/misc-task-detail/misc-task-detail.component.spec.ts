import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiscTaskDetailComponent } from './misc-task-detail.component';

describe('MiscTaskDetailComponent', () => {
  let component: MiscTaskDetailComponent;
  let fixture: ComponentFixture<MiscTaskDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MiscTaskDetailComponent]
    });
    fixture = TestBed.createComponent(MiscTaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
