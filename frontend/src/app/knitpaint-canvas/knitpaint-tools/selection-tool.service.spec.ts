import { TestBed } from '@angular/core/testing';

import { SelectionTool } from './selection-tool.service';

describe('SelectionTool', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SelectionTool = TestBed.get(SelectionTool);
    expect(service).toBeTruthy();
  });
});
