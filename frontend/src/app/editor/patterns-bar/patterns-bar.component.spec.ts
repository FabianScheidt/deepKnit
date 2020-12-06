import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternsBarComponent } from './patterns-bar.component';

describe('PatternsBarComponent', () => {
  let component: PatternsBarComponent;
  let fixture: ComponentFixture<PatternsBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatternsBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
