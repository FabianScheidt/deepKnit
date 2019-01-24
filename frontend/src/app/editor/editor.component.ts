import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EditorStateService } from './editor-state.service';
import { EditorIoService } from './editor-io.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {

  private onDestroy: Subject<void> = new Subject<void>();

  constructor(private editorStateService: EditorStateService,
              private editorIoService: EditorIoService) { }

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
    fromEvent(document, 'touchend').pipe(takeUntil(this.onDestroy)).subscribe((e: TouchEvent) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
      }
    });
  }

  /**
   * Registers shortcuts for new project, save project, open project, undo and redo.
   * Some browsers might block these shortcuts as they heavily override the default behaviour.
   */
  private registerShortcuts() {
    fromEvent(window, 'keydown').pipe(takeUntil(this.onDestroy)).subscribe((e: KeyboardEvent) => {
      // New project
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        this.editorStateService.init();
        e.preventDefault();
      }

      // Open project
      if (e.key === 'o' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        this.editorIoService.initFromFile();
        e.preventDefault();
      }

      // Save project
      if (e.key === 's' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        this.editorIoService.saveToFile();
        e.preventDefault();
      }

      // Undo
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        this.editorStateService.undo();
        e.preventDefault();
      }

      // Redo
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        this.editorStateService.redo();
        e.preventDefault();
      }
    });
  }

}
