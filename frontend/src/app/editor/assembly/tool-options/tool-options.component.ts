import { Component, Input } from '@angular/core';
import { KnitpaintTool } from '../../../knitpaint-canvas/knitpaint-tool';
import { TextureTool } from '../../../knitpaint-canvas/knitpaint-tools/texture-tool.service';

@Component({
  selector: 'app-tool-options',
  templateUrl: './tool-options.component.html',
  styleUrls: ['./tool-options.component.scss']
})
export class ToolOptionsComponent {

  @Input() activeTools: KnitpaintTool[];

  constructor() { }

  public getTextureTool(): TextureTool {
    return <TextureTool>this.activeTools.find(t => t instanceof TextureTool);
  }

  public optionsAvailable(): boolean {
    return !!this.getTextureTool();
  }

}
