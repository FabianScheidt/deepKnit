import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TooltipService } from '../tooltip.service';
import { fromEvent, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tooltip-outlet',
  templateUrl: './tooltip-outlet.component.html',
  styleUrls: ['./tooltip-outlet.component.scss']
})
export class TooltipOutletComponent implements OnInit, OnDestroy {
  @ViewChild('tooltip') tooltip: ElementRef<HTMLDivElement>;
  private isDestroyed: Subject<boolean> = new Subject<boolean>();

  constructor(private ngZone: NgZone, private tooltipService: TooltipService) { }

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(document, 'mousemove').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        this.tooltip.nativeElement.style.left = (event.pageX + 5) + 'px';
        this.tooltip.nativeElement.style.top = (event.pageY + 10) + 'px';
      });

      this.tooltipService.visible.pipe(distinctUntilChanged()).subscribe((visible: boolean) => {
        this.tooltip.nativeElement.style.display = visible ? 'block' : 'none';
      });

      this.tooltipService.text.subscribe((text: string) => {
        this.tooltip.nativeElement.innerText = text;
      });
    });
  }

  ngOnDestroy() {
    this.isDestroyed.next(true);
  }

}
