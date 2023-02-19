import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateProblemComponent } from './update-problem.component';

describe('UpdateProblemComponent', () => {
  let component: UpdateProblemComponent;
  let fixture: ComponentFixture<UpdateProblemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateProblemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
