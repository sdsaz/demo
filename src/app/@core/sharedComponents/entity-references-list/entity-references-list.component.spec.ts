import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityReferencesListComponent } from './entity-references-list.component';

describe('EntityReferencesListComponent', () => {
  let component: EntityReferencesListComponent;
  let fixture: ComponentFixture<EntityReferencesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityReferencesListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityReferencesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
