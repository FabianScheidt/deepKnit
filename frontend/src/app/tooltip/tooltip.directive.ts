import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { TooltipService } from './tooltip.service';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements OnInit, OnDestroy {

  @Input() appTooltip = '';
  private isDestroyed: Subject<boolean> = new Subject<boolean>();

  constructor(private element: ElementRef<HTMLElement>, private ngZone: NgZone, private tooltipService: TooltipService) { }

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      const el = this.element.nativeElement;
      fromEvent(el, 'mouseenter').pipe(takeUntil(this.isDestroyed)).subscribe((e) => {
        this.tooltipService.visible.next(true);
        this.tooltipService.text.next(this.appTooltip);
      });
      fromEvent(el, 'mouseout').pipe(takeUntil(this.isDestroyed)).subscribe(() => {
        this.tooltipService.visible.next(false);
      });
    });
  }

  ngOnDestroy() {
    this.isDestroyed.next(true);
  }

}
