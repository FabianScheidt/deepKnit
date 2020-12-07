import { Component, EventEmitter, Input, Output, Type } from '@angular/core';
import { KnitpaintTool } from '../../../knitpaint-canvas/knitpaint-tool';
import { DrawTool } from '../../../knitpaint-canvas/knitpaint-tools/draw-tool.service';
import { ColorPickerTool } from '../../../knitpaint-canvas/knitpaint-tools/color-picker-tool.service';
import { ColorInfoTool } from '../../../knitpaint-canvas/knitpaint-tools/color-info-tool.service';
import { TextureTool } from '../../../knitpaint-canvas/knitpaint-tools/texture-tool.service';
import * as _ from 'lodash';
import { RectangleTool } from '../../../knitpaint-canvas/knitpaint-tools/rectangle-tool.service';
import { SelectionTool } from '../../../knitpaint-canvas/knitpaint-tools/selection-tool.service';

@Component({
  selector: 'app-toolbar-tools',
  templateUrl: './toolbar-tools.component.html',
  styleUrls: ['./toolbar-tools.component.scss']
})
export class ToolbarToolsComponent {

  @Input() activeTools: Type<KnitpaintTool>[] = [];
  @Output() activeToolChanged: EventEmitter<Type<KnitpaintTool>[]> = new EventEmitter<Type<KnitpaintTool>[]>();

  constructor() { }

  /**
   * Returns the currently active tool
   */
  private getTool(): Type<KnitpaintTool> {
    if (this.activeTools.indexOf(DrawTool) > -1) {
      return DrawTool;
    }
    if (this.activeTools.indexOf(RectangleTool) > -1) {
      return RectangleTool;
    }
    if (this.activeTools.indexOf(ColorPickerTool) > -1) {
      return ColorPickerTool;
    }
    if (this.activeTools.indexOf(SelectionTool) > -1) {
      return SelectionTool;
    }
    if (this.activeTools.indexOf(TextureTool) > -1) {
      return TextureTool;
    }
    return null;
  }

  /**
   * Updates the list of active tools
   *
   * @param tool
   */
  private setTool(tool: Type<KnitpaintTool>) {
    // Deactivate previous tools
    if (this.getTool() === ColorPickerTool) {
      _.pull(this.activeTools, ColorInfoTool);
    }
    _.pull(this.activeTools, this.getTool());

    // Activate new tools
    this.activeTools.push(tool);
    if (tool === ColorPickerTool) {
      this.activeTools.push(ColorInfoTool);
    }

    // Emit change event
    this.activeToolChanged.emit(this.activeTools);
  }

  public isDrawTool = () => this.getTool() === DrawTool;
  public setDrawTool = () => this.setTool(DrawTool);
  public isRectangleTool = () => this.getTool() === RectangleTool;
  public setRectangleTool = () => this.setTool(RectangleTool);
  public isColorPickerTool = () => this.getTool() === ColorPickerTool;
  public setColorPickerTool = () => this.setTool(ColorPickerTool);
  public isSelectionTool = () => this.getTool() === SelectionTool;
  public setSelectionTool = () => this.setTool(SelectionTool);
  public isTextureTool = () => this.getTool() === TextureTool;
  public setTextureTool = () => this.setTool(TextureTool);

}
