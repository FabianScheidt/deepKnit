import { TestBed, inject } from '@angular/core/testing';

import { DrawTool } from './draw-tool.service';

describe('DrawTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DrawTool]
    });
  });

  it('should be created', inject([DrawTool], (service: DrawTool) => {
    expect(service).toBeTruthy();
  }));
});
