import { Component, EventEmitter, Input, Output, Type } from '@angular/core';
import { KnitpaintTool } from '../../knitpaint-canvas/knitpaint-tool';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  @Input() activeTools: Type<KnitpaintTool>[] = [];
  @Output() activeToolChanged: EventEmitter<Type<KnitpaintTool>[]> = new EventEmitter<Type<KnitpaintTool>[]>();

  emitActiveToolsChanged() {
    this.activeToolChanged.emit(this.activeTools);
  }

}
