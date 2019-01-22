import { TestBed, inject } from '@angular/core/testing';

import { ColorInfoTool } from './color-info-tool.service';

describe('ColorInfoTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColorInfoTool]
    });
  });

  it('should be created', inject([ColorInfoTool], (service: ColorInfoTool) => {
    expect(service).toBeTruthy();
  }));
});
