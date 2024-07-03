import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssignDialogComponent } from './user-assign-dialog.component';

describe('UserAssignDialogComponent', () => {
  let component: UserAssignDialogComponent;
  let fixture: ComponentFixture<UserAssignDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserAssignDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAssignDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
