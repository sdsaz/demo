import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonUserProfileComponent } from './common-user-profile.component';

describe('CommonUserProfileComponent', () => {
  let component: CommonUserProfileComponent;
  let fixture: ComponentFixture<CommonUserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonUserProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
