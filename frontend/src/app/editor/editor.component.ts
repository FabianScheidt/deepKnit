import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {

  private destroySubject: Subject<void> = new Subject<void>();

  constructor() { }

  ngOnInit() {
    this.preventGestures();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
  }

  /**
   * Prevents standard behaviour of gestures
   */
  private preventGestures() {
    fromEvent(document, 'gesturestart').pipe(takeUntil(this.destroySubject)).subscribe((e) => {
      e.preventDefault();
    });
  }

  public isTouchDevice() {
    return 'ontouchstart' in window;
  }

}
