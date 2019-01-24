import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EditorStateService } from './editor-state.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {

  private onDestroy: Subject<void> = new Subject<void>();

  constructor(private editorStateService: EditorStateService) { }

  ngOnInit() {
    this.preventGestures();
    this.registerShortcuts();
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
  }

  /**
   * Prevents standard behaviour of gestures
   */
  private preventGestures() {
    fromEvent(document, 'gesturestart').pipe(takeUntil(this.onDestroy)).subscribe((e) => {
      e.preventDefault();
    });
  }

  /**
   * Registers shortcuts for undo and redo
   */
  private registerShortcuts() {
    fromEvent(window, 'keydown').pipe(takeUntil(this.onDestroy)).subscribe((e: KeyboardEvent) => {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        this.editorStateService.undo();
        e.preventDefault();
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        this.editorStateService.redo();
        e.preventDefault();
      }
    });
  }

  /**
   * Returns if the current browser supports touch events
   */
  public isTouchDevice() {
    return 'ontouchstart' in window;
  }

}
