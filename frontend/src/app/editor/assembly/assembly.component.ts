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
import { TextureTool } from '../../knitpaint-canvas/knitpaint-tools/texture-tool.service';
import { RectangleTool } from '../../knitpaint-canvas/knitpaint-tools/rectangle-tool.service';

@Component({
  selector: 'app-assembly',
  templateUrl: './assembly.component.html',
  styleUrls: ['./assembly.component.scss']
})
export class AssemblyComponent implements OnInit {

  public knitpaint: Knitpaint;
  @ViewChild('knitpaintCanvas') knitpaintCanvas: KnitpaintCanvasComponent;
  public activeToolClasses: Type<KnitpaintTool>[] =
    [GridTool, MultitouchTransformTool, KeyboardTransformTool, MouseTransformTool, DrawTool];

  constructor(private editorStateService: EditorStateService) {}

  ngOnInit() {
    // Update the knitpaint whenever it changes
    this.knitpaint = this.editorStateService.getAssembly();
    this.editorStateService.assemblyChanged.subscribe(() => {
      this.knitpaint = this.editorStateService.getAssembly();
    });

    // Activate the default tools
    this.activateToolClasses(this.activeToolClasses);

    // The router might mess with the initial transform of the canvas so better set it again
    setTimeout(() => this.knitpaintCanvas.resetTransform());

    // The picker tool should be able to update the color number
    this.knitpaintCanvas.getTool(ColorPickerTool).colorPicked.subscribe((colorNumber: number) => {
      this.colorNumber = colorNumber;
    });

    // The texture tool should have a default texture selected (if available)
    setTimeout(() => {
      if (!this.selectedPattern && this.editorStateService.getPatterns().length > 0) {
        this.selectedPattern = this.editorStateService.getPatterns()[0];
      }
    });
  }

  /**
   * Sets new knitpaint data for the assembly
   *
   * @param assembly
   */
  public setAssembly(assembly: Knitpaint) {
    this.editorStateService.setAssembly(assembly);
  }

  /**
   * Activates a list of tools
   *
   * @param tools
   */
  public activateToolClasses(tools: Type<KnitpaintTool>[]) {
    this.activeToolClasses = tools;
    this.knitpaintCanvas.activateTools(tools);
  }

  /**
   * Returns the list of active tools
   */
  public getActiveTools(): KnitpaintTool[] {
    return this.knitpaintCanvas.getActiveTools();
  }

  /**
   * Returns the color number currently used by the draw tool
   */
  public get colorNumber(): number {
    return this.knitpaintCanvas.getTool(DrawTool).colorNumber;
  }

  /**
   * Sets the color number currently used by the draw and rectangle tool
   * @param colorNumber
   */
  public set colorNumber(colorNumber: number) {
    this.knitpaintCanvas.getTool(DrawTool).colorNumber = colorNumber;
    this.knitpaintCanvas.getTool(RectangleTool).colorNumber = colorNumber;
  }

  /**
   * Returns the patterns currently used by the texture tool
   */
  public get selectedPattern(): Knitpaint {
    return this.knitpaintCanvas.getTool(TextureTool).texture;
  }

  /**
   * Sets the pattern currently used by the texture tool
   * @param selectedPattern
   */
  public set selectedPattern(selectedPattern: Knitpaint) {
    this.knitpaintCanvas.getTool(TextureTool).texture = selectedPattern;
  }

}
