import { Component, EventEmitter, Input, OnInit, Output, Type } from '@angular/core';
import { KnitpaintTool } from '../../../knitpaint-canvas/knitpaint-tool';
import { GridTool } from '../../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { KeyboardTransformTool } from '../../../knitpaint-canvas/knitpaint-tools/keyboard-transform-tool.service';

@Component({
  selector: 'app-toolbar-view',
  templateUrl: './toolbar-view.component.html',
  styleUrls: ['./toolbar-view.component.scss']
})
export class ToolbarViewComponent implements OnInit {

  @Input() activeTools: Type<KnitpaintTool>[] = [];
  @Output() activeToolChanged: EventEmitter<Type<KnitpaintTool>[]> = new EventEmitter<Type<KnitpaintTool>[]>();

  constructor() { }

  ngOnInit() {
  }

  /**
   * Returns if the GridTool is currently active
   */
  public isGridActive(): boolean {
    return this.activeTools.indexOf(GridTool) > -1;
  }

  /**
   * Toggles the GridTool
   */
  public toggleGrid() {
    const gridIndex = this.activeTools.indexOf(GridTool);
    if (gridIndex > -1) {
      this.activeTools.splice(gridIndex, 1);
    } else {
      this.activeTools.push(GridTool);
    }
    this.activeToolChanged.emit(this.activeTools);
  }

  /**
   * Zooms by emulating a keydown event. This triggers an action in the KeyboardTransformTool and therefore requires the tools to be active.
   *
   * @param inwards
   */
  public zoom(inwards: boolean): void {
    if (this.activeTools.indexOf(KeyboardTransformTool) > -1) {
      const key = inwards ? '+' : '-';
      const e = new KeyboardEvent('keydown', {key, ctrlKey: true});
      window.dispatchEvent(e);
    }
  }

}
