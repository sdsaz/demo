import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactWorkflowListComponent } from './contact-workflow-list.component';

describe('ContactWorkflowListComponent', () => {
  let component: ContactWorkflowListComponent;
  let fixture: ComponentFixture<ContactWorkflowListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContactWorkflowListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactWorkflowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
