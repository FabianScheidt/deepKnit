import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import { KnitpaintCanvasComponent } from '../../knitpaint-canvas/knitpaint-canvas.component';
import { GridTool } from '../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { MultitouchTransformTool } from '../../knitpaint-canvas/knitpaint-tools/multitouch-transform-tool.service';
import { KeyboardTransformTool } from '../../knitpaint-canvas/knitpaint-tools/keyboard-transform-tool.service';
import { DrawTool } from '../../knitpaint-canvas/knitpaint-tools/draw-tool.service';
import { EditorStateService } from '../editor-state.service';
import { KnitpaintTool } from '../../knitpaint-canvas/knitpaint-tool';
import { ColorPickerTool } from '../../knitpaint-canvas/knitpaint-tools/color-picker-tool.service';
import { MouseTransformTool } from '../../knitpaint-canvas/knitpaint-tools/mouse-transform-tool.service';

@Component({
  selector: 'app-assembly',
  templateUrl: './assembly.component.html',
  styleUrls: ['./assembly.component.scss']
})
export class AssemblyComponent implements OnInit {

  public knitpaint: Knitpaint;
  @ViewChild('knitpaintCanvas') knitpaintCanvas: KnitpaintCanvasComponent;
  public activeTools: Type<KnitpaintTool>[] = [GridTool, MultitouchTransformTool, KeyboardTransformTool, MouseTransformTool, DrawTool];

  constructor(private editorStateService: EditorStateService) {}

  ngOnInit() {
    // Update the knitpaint whenever it changes
    this.knitpaint = this.editorStateService.getAssembly();
    this.editorStateService.assemblyChanged.subscribe(() => {
      this.knitpaint = this.editorStateService.getAssembly();
    });

    // Activate the default tools
    this.activateTools(this.activeTools);

    // The router might mess with the initial transform of the canvas so better set it again
    setTimeout(() => this.knitpaintCanvas.resetTransform());

    // The picker tool should be able to update the color number
    this.knitpaintCanvas.getTool(ColorPickerTool).colorPicked.subscribe((colorNumber: number) => {
      this.colorNumber = colorNumber;
    });
  }

  /**
   * Sets new knitpaint data for the assembly
   *
   * @param assembly
   */
  setAssembly(assembly: Knitpaint) {
    this.editorStateService.setAssembly(assembly);
  }

  /**
   * Activates a list of tools
   *
   * @param tools
   */
  activateTools(tools: Type<KnitpaintTool>[]) {
    this.activeTools = tools;
    this.knitpaintCanvas.activateTools(tools);
  }

  /**
   * Returns the color number currently used by the draw tool
   */
  public get colorNumber(): number {
    return this.knitpaintCanvas.getTool(DrawTool).colorNumber;
  }

  /**
   * Sets the color number currently used by the draw tool
   * @param colorNumber
   */
  public set colorNumber(colorNumber: number) {
    this.knitpaintCanvas.getTool(DrawTool).colorNumber = colorNumber;
  }

}
