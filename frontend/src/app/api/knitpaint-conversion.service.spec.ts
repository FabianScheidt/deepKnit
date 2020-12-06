import { TestBed, inject } from '@angular/core/testing';

import { KnitpaintConversionService } from './knitpaint-conversion.service';

describe('KnitpaintConversionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KnitpaintConversionService]
    });
  });

  it('should be created', inject([KnitpaintConversionService], (service: KnitpaintConversionService) => {
    expect(service).toBeTruthy();
  }));
});
