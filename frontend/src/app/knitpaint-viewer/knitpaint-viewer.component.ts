import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Color, Knitpaint } from '../knitpaint';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Component({
  selector: 'app-knitpaint-viewer',
  templateUrl: './knitpaint-viewer.component.html',
  styleUrls: ['./knitpaint-viewer.component.scss']
})
export class KnitpaintViewerComponent implements OnInit, OnChanges {

  @Input() knitpaint: Knitpaint;
  @Input() width: number;
  @Input() drawingColorNumber: number;
  private isDown = false;

  public colors: BehaviorSubject<Color[]> = new BehaviorSubject<Color[]>([]);
  public cssColors: Observable<string[]> = this.colors.pipe(
    map((colors: Color[]) =>
      colors.map((color: Color) => 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')')
    )
  );

  constructor() {}

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['knitpaint'] && this.knitpaint) {
      this.knitpaint.getColors().subscribe(colors => {
        this.colors.next(colors);
      });
    }
  }

  overPixelEvent(index) {
    if (this.isDown) {
      this.setColor(index);
    }
  }

  @HostListener('document:mousedown')
  setDown() {
    this.isDown = true;
  }

  @HostListener('document:mouseup')
  setUp() {
    this.isDown = false;
  }

  setColor(index) {
    if (this.drawingColorNumber) {
      this.colors.pipe(first()).subscribe((colors: Color[]) => {
        colors[index] = [255, 255, 0];
        this.colors.next(colors);
        console.log(colors[index]);
      });
    }
  }

}
