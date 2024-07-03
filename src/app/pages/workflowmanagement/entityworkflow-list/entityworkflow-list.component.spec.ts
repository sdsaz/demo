import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityworkflowListComponent } from './entityworkflow-list.component';

describe('EntityworkflowListComponent', () => {
  let component: EntityworkflowListComponent;
  let fixture: ComponentFixture<EntityworkflowListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityworkflowListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityworkflowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
