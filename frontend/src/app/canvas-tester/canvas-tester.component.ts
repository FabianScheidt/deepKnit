import { AfterViewChecked, Component } from '@angular/core';
import { Knitpaint } from '../knitpaint';
import { KnitpaintTool } from '../knitpaint-tools/knitpaint-tool';
import { ColorInfoTool } from '../knitpaint-tools/color-info-tool.service';
import { ColorPickerTool } from '../knitpaint-tools/color-picker-tool.service';
import { MultitouchTransformTool } from '../knitpaint-tools/multitouch-transform-tool.service';
import { KeyboardTransformTool } from '../knitpaint-tools/keyboard-transform-tool.service';

@Component({
  selector: 'app-canvas-tester',
  templateUrl: './canvas-tester.component.html',
  styleUrls: ['./canvas-tester.component.scss']
})
export class CanvasTesterComponent implements AfterViewChecked {

  someKnitpaint: Knitpaint;
  enableGrid = true;
  enableTransform = true;
  tools: KnitpaintTool[] = [];
  activeTool: KnitpaintTool;

  constructor(private multitouchTransformTool: MultitouchTransformTool,
              private keyboardTransformTool: KeyboardTransformTool,
              private colorInfoTool: ColorInfoTool,
              private colorPickerTool: ColorPickerTool) {

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

    // Register tools
    this.tools = [colorInfoTool, colorPickerTool];
    this.activeTool = colorInfoTool;
  }

  getActiveTools() {
    const tools = [this.activeTool];
    if (this.enableTransform) {
      tools.push(this.multitouchTransformTool);
      tools.push(this.keyboardTransformTool);
    }
    return tools;
  }

  ngAfterViewChecked(): void {
    console.log('View checked');
  }

}
