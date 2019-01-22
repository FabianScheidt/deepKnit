import { TestBed, inject } from '@angular/core/testing';

import { ColorPickerTool } from './color-picker-tool.service';

describe('ColorPickerTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColorPickerTool]
    });
  });

  it('should be created', inject([ColorPickerTool], (service: ColorPickerTool) => {
    expect(service).toBeTruthy();
  }));
});
