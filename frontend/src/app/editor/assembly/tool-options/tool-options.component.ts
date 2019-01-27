import { Component, Input } from '@angular/core';
import { KnitpaintTool } from '../../../knitpaint-canvas/knitpaint-tool';
import { TextureTool } from '../../../knitpaint-canvas/knitpaint-tools/texture-tool.service';
import { SelectionTool } from '../../../knitpaint-canvas/knitpaint-tools/selection-tool.service';
import { EditorStateService } from '../../editor-state.service';

@Component({
  selector: 'app-tool-options',
  templateUrl: './tool-options.component.html',
  styleUrls: ['./tool-options.component.scss']
})
export class ToolOptionsComponent {

  @Input() activeTools: KnitpaintTool[];

  constructor(private editorStateService: EditorStateService) { }

  public getTextureTool(): TextureTool {
    return <TextureTool>this.activeTools.find(t => t instanceof TextureTool);
  }

  public getSelectionTool(): SelectionTool {
    return <SelectionTool>this.activeTools.find(t => t instanceof SelectionTool);
  }

  public optionsAvailable(): boolean {
    return !!this.getTextureTool() || !!this.getSelectionTool();
  }

  public makePatternFromSelection() {
    const selection = this.getSelectionTool().selection;
    if (selection) {
      const patterns = this.editorStateService.getPatterns().slice();
      patterns.push(selection);
      this.editorStateService.setPatterns(patterns);
    }
  }

}
