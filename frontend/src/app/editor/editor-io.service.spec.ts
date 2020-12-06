import { TestBed, inject } from '@angular/core/testing';

import { EditorIoService } from './editor-io.service';

describe('EditorIoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EditorIoService]
    });
  });

  it('should be created', inject([EditorIoService], (service: EditorIoService) => {
    expect(service).toBeTruthy();
  }));
});
