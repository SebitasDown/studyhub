import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyGroups } from './study-groups';

describe('StudyGroups', () => {
  let component: StudyGroups;
  let fixture: ComponentFixture<StudyGroups>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudyGroups],
    }).compileComponents();

    fixture = TestBed.createComponent(StudyGroups);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
