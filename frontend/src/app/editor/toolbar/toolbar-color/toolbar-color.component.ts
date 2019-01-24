import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Knitpaint } from '../../../knitpaint';

@Component({
  selector: 'app-toolbar-color',
  templateUrl: './toolbar-color.component.html',
  styleUrls: ['./toolbar-color.component.scss']
})
export class ToolbarColorComponent {

  @Input() activeColorNumber = 0;
  @Output() activeColorNumberChange: EventEmitter<number> = new EventEmitter<number>();

  constructor() {}

  public getColorString(): string {
    return Knitpaint.getColorString(this.activeColorNumber);
  }

  public getContrastColorString(): string {
    return Knitpaint.getContrastColorString(this.activeColorNumber);
  }

}
