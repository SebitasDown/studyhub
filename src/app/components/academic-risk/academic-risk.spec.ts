import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicRisk } from './academic-risk';

describe('AcademicRisk', () => {
  let component: AcademicRisk;
  let fixture: ComponentFixture<AcademicRisk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicRisk],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademicRisk);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
