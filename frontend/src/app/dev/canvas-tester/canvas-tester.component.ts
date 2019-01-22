import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import { KnitpaintTool } from '../../knitpaint-canvas/knitpaint-tool';
import { ColorInfoTool } from '../../knitpaint-canvas/knitpaint-tools/color-info-tool.service';
import { ColorPickerTool } from '../../knitpaint-canvas/knitpaint-tools/color-picker-tool.service';
import { MultitouchTransformTool } from '../../knitpaint-canvas/knitpaint-tools/multitouch-transform-tool.service';
import { KeyboardTransformTool } from '../../knitpaint-canvas/knitpaint-tools/keyboard-transform-tool.service';
import { GridTool } from '../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { DrawTool } from '../../knitpaint-canvas/knitpaint-tools/draw-tool.service';
import { VerticalSelectionTool } from '../../knitpaint-canvas/knitpaint-tools/vertical-selection-tool.service';
import { KnitpaintCanvasComponent } from '../../knitpaint-canvas/knitpaint-canvas.component';

@Component({
  selector: 'app-canvas-tester',
  templateUrl: './canvas-tester.component.html',
  styleUrls: ['./canvas-tester.component.scss']
})
export class CanvasTesterComponent implements OnInit, AfterViewChecked {

  someKnitpaint: Knitpaint;
  enableGrid = true;
  enableTransform = true;
  tools: KnitpaintTool[] = [];
  activeTool: KnitpaintTool;
  pickedColor = 0;

  @ViewChild('knitpaintCanvas') knitpaintCanvas: KnitpaintCanvasComponent;

  constructor() {
    // Build some knitpaint to test with
    const someWidth = 50;
    const someHeight = 100;
    const someArray = (<any>[
      Array(Math.floor(someWidth / 2)).fill(1), Array(Math.ceil(someWidth / 2)).fill(2),
      [Array(Math.floor(someHeight / 2 - 1)).fill([
        [0, 0, 0, 13], Array(someWidth - 8).fill(1), [13, 0, 0, 0],
        [0, 0, 0, 13], Array(someWidth - 8).fill(2), [13, 0, 0, 0]])
      ],
      Array(Math.floor(someWidth / 2)).fill(3), Array(Math.ceil(someWidth / 2)).fill(4)
    ]).flat(4);
    const someArrayBuffer = (new Uint8Array(someArray)).buffer;
    this.someKnitpaint = new Knitpaint(someArrayBuffer, someWidth);
  }

  ngOnInit(): void {
    // Register tools
    const colorInfoTool = this.knitpaintCanvas.getTool(ColorInfoTool);
    const colorPickerTool = this.knitpaintCanvas.getTool(ColorPickerTool);
    const drawTool = this.knitpaintCanvas.getTool(DrawTool);
    const verticalSelectionTool = this.knitpaintCanvas.getTool(VerticalSelectionTool);
    this.tools = [colorInfoTool, colorPickerTool, drawTool, verticalSelectionTool];

    this.setActiveTool(verticalSelectionTool);

    colorPickerTool.colorPicked.subscribe((colorNumber: number) => {
      this.pickedColor = colorNumber;
      drawTool.colorNumber = colorNumber;
    });
  }

  setEnableGrid(enableGrid: boolean) {
    this.enableGrid = enableGrid;
    this.activateTools();
  }

  setEnableTransform(enableTransform: boolean) {
    this.enableTransform = enableTransform;
    this.activateTools();
  }

  setActiveTool(tool: KnitpaintTool) {
    this.activeTool = tool;
    this.activateTools();
  }

  activateTools() {
    const tools = [];
    if (this.enableGrid) {
      tools.push(this.knitpaintCanvas.getTool(GridTool));
    }
    if (this.enableTransform) {
      tools.push(this.knitpaintCanvas.getTool(MultitouchTransformTool));
      tools.push(this.knitpaintCanvas.getTool(KeyboardTransformTool));
    }
    tools.push(this.activeTool);
    this.knitpaintCanvas.activateTools(tools);
  }

  ngAfterViewChecked(): void {
    console.log('View checked');
  }

}
