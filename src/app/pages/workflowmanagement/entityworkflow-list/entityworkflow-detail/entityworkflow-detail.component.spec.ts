import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityworkflowDetailComponent } from './entityworkflow-detail.component';

describe('EntityworkflowDetailComponent', () => {
  let component: EntityworkflowDetailComponent;
  let fixture: ComponentFixture<EntityworkflowDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityworkflowDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityworkflowDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
