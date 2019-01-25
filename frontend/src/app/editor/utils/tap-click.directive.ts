import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * This directive emits click events when even if the default behaviour is prevented
 */
@Directive({
  selector: '[appTapClick]'
})
export class TapClickDirective implements OnInit, OnDestroy {

  private isDestroyed: Subject<boolean> = new Subject<boolean>();
  private lastTouch: Touch;
  private touchEnd: Subject<void> = new Subject<void>();

  constructor(private element: ElementRef<HTMLElement>) { }

  ngOnInit(): void {
    const element = this.element.nativeElement;
    fromEvent(element, 'touchstart').pipe(takeUntil(this.isDestroyed)).subscribe((eStart: TouchEvent) => {
      if (eStart.touches.length === 1) {
        this.lastTouch = eStart.touches[0];

        fromEvent(document, 'touchmove').pipe(takeUntil(this.isDestroyed), takeUntil(this.touchEnd)).subscribe((eMove: TouchEvent) => {
          if (eMove.touches.length === 1) {
            this.lastTouch = eMove.touches[0];
          } else {
            delete this.lastTouch;
            this.touchEnd.next();
          }
        });
        fromEvent(document, 'touchend').pipe(takeUntil(this.isDestroyed), takeUntil(this.touchEnd)).subscribe((eEnd: TouchEvent) => {
          const boundary = element.getBoundingClientRect();
          if (this.lastTouch.pageX >= boundary.left && this.lastTouch.pageX <= boundary.right
            && this.lastTouch.pageY >= boundary.top && this.lastTouch.pageY <= boundary.bottom) {
            (<HTMLElement>eEnd.target).click();
          }
          delete this.lastTouch;
          this.touchEnd.next();
        });
      }
    });
  }

  ngOnDestroy() {
    this.isDestroyed.next(true);
  }

}
