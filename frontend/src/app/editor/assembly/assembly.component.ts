import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import { KnitpaintCanvasComponent } from '../../knitpaint-canvas/knitpaint-canvas.component';
import { GridTool } from '../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { MultitouchTransformTool } from '../../knitpaint-canvas/knitpaint-tools/multitouch-transform-tool.service';
import { KeyboardTransformTool } from '../../knitpaint-canvas/knitpaint-tools/keyboard-transform-tool.service';
import { DrawTool } from '../../knitpaint-canvas/knitpaint-tools/draw-tool.service';
import { EditorStateService } from '../editor-state.service';
import { KnitpaintTool } from '../../knitpaint-canvas/knitpaint-tool';

@Component({
  selector: 'app-assembly',
  templateUrl: './assembly.component.html',
  styleUrls: ['./assembly.component.scss']
})
export class AssemblyComponent implements OnInit {

  public knitpaint: Knitpaint;
  @ViewChild('knitpaintCanvas') knitpaintCanvas: KnitpaintCanvasComponent;
  public activeTools: Type<KnitpaintTool>[] = [GridTool, MultitouchTransformTool, KeyboardTransformTool, DrawTool];

  constructor(private editorStateService: EditorStateService) {
    this.knitpaint = editorStateService.getAssembly();

    this.editorStateService.assemblyChanged.subscribe(() => {
      this.knitpaint = editorStateService.getAssembly();
    });
  }

  ngOnInit() {
    this.knitpaintCanvas.getTool(DrawTool).colorNumber = 1;
    this.activateTools(this.activeTools);
  }

  setAssembly(assembly: Knitpaint) {
    this.editorStateService.setAssembly(assembly);
  }

  activateTools(tools: Type<KnitpaintTool>[]) {
    this.activeTools = tools;
    this.knitpaintCanvas.activateTools(tools);
  }

}
