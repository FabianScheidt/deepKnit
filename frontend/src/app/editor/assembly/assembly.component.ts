import { Component, OnInit, ViewChild } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import { KnitpaintCanvasComponent } from '../../knitpaint-canvas/knitpaint-canvas.component';
import { GridTool } from '../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { MultitouchTransformTool } from '../../knitpaint-canvas/knitpaint-tools/multitouch-transform-tool.service';
import { KeyboardTransformTool } from '../../knitpaint-canvas/knitpaint-tools/keyboard-transform-tool.service';
import { DrawTool } from '../../knitpaint-canvas/knitpaint-tools/draw-tool.service';
import { EditorStateService } from '../editor-state.service';

@Component({
  selector: 'app-assembly',
  templateUrl: './assembly.component.html',
  styleUrls: ['./assembly.component.scss']
})
export class AssemblyComponent implements OnInit {

  public knitpaint: Knitpaint;
  @ViewChild('knitpaintCanvas') knitpaintCanvas: KnitpaintCanvasComponent;

  constructor(private editorStateService: EditorStateService) {
    this.knitpaint = editorStateService.getAssembly();

    this.editorStateService.assemblyChanged.subscribe(() => {
      this.knitpaint = editorStateService.getAssembly();
    });
  }

  ngOnInit() {
    const activeTools = [
      this.knitpaintCanvas.getTool(GridTool),
      this.knitpaintCanvas.getTool(MultitouchTransformTool),
      this.knitpaintCanvas.getTool(KeyboardTransformTool),
      this.knitpaintCanvas.getTool(DrawTool)
    ];
    this.knitpaintCanvas.activateTools(activeTools);
    this.knitpaintCanvas.getTool(DrawTool).colorNumber = 1;
  }

  setAssembly(assembly: Knitpaint) {
    this.editorStateService.setAssembly(assembly);
  }

}
