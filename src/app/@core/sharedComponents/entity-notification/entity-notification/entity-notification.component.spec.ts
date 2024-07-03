import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityNotificationComponent } from './entity-notification.component';

describe('EntityNotificationComponent', () => {
  let component: EntityNotificationComponent;
  let fixture: ComponentFixture<EntityNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityNotificationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
