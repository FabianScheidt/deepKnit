import { TestBed, inject } from '@angular/core/testing';

import { EditorStateService } from './editor-state.service';

describe('EditorStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EditorStateService]
    });
  });

  it('should be created', inject([EditorStateService], (service: EditorStateService) => {
    expect(service).toBeTruthy();
  }));
});
