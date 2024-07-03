import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityStagesDialogComponent } from './entity-stages-dialog.component';

describe('EntityStagesDialogComponent', () => {
  let component: EntityStagesDialogComponent;
  let fixture: ComponentFixture<EntityStagesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityStagesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityStagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
