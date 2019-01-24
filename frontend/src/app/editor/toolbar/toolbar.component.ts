import { Component, EventEmitter, Input, Output, Type } from '@angular/core';
import { KnitpaintTool } from '../../knitpaint-canvas/knitpaint-tool';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  @Input() activeTools: Type<KnitpaintTool>[] = [];
  @Output() activeToolChange: EventEmitter<Type<KnitpaintTool>[]> = new EventEmitter<Type<KnitpaintTool>[]>();

  @Input() activeColorNumber = 0;
  @Output() activeColorNumberChange: EventEmitter<number> = new EventEmitter<number>();

  emitActiveToolsChanged(activeTools) {
    this.activeTools = activeTools;
    this.activeToolChange.emit(this.activeTools);
  }

  emitActiveColorNumberChanged(colorNumber) {
    this.activeColorNumber = colorNumber;
    this.activeColorNumberChange.emit(this.activeColorNumber);
  }

}
