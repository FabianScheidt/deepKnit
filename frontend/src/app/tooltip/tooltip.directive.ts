import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { TooltipService } from './tooltip.service';

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
      fromEvent(el, 'mouseenter').subscribe(() => {
        this.tooltipService.visible.next(true);
        this.tooltipService.text.next(this.appTooltip);
      });
      fromEvent(el, 'mouseout').subscribe(() => {
        this.tooltipService.visible.next(false);
      });
    });
  }

  ngOnDestroy() {
    this.isDestroyed.next(true);
  }

}
