import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignIdeasComponent } from './design-ideas.component';

describe('DesignIdeasComponent', () => {
  let component: DesignIdeasComponent;
  let fixture: ComponentFixture<DesignIdeasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignIdeasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignIdeasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
