import { TestBed, inject } from '@angular/core/testing';

import { VerticalSelectionTool } from './vertical-selection-tool.service';

describe('VerticalSelectionTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VerticalSelectionTool]
    });
  });

  it('should be created', inject([VerticalSelectionTool], (service: VerticalSelectionTool) => {
    expect(service).toBeTruthy();
  }));
});
