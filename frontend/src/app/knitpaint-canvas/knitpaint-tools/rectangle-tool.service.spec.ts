import { TestBed } from '@angular/core/testing';

import { RectangleTool } from './rectangle-tool.service';

describe('RectangleTool', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RectangleTool = TestBed.get(RectangleTool);
    expect(service).toBeTruthy();
  });
});
