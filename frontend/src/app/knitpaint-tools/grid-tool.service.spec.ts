import { TestBed, inject } from '@angular/core/testing';

import { GridTool } from './grid-tool.service';

describe('GridTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GridTool]
    });
  });

  it('should be created', inject([GridTool], (service: GridTool) => {
    expect(service).toBeTruthy();
  }));
});
