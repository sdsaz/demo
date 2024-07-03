import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityRelationComponent } from './entity-relation.component';

describe('EntityRelationComponent', () => {
  let component: EntityRelationComponent;
  let fixture: ComponentFixture<EntityRelationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityRelationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityRelationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
