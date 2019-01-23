import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import { KnitpaintCanvasComponent } from '../../knitpaint-canvas/knitpaint-canvas.component';
import { GridTool } from '../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { MultitouchTransformTool } from '../../knitpaint-canvas/knitpaint-tools/multitouch-transform-tool.service';
import { KeyboardTransformTool } from '../../knitpaint-canvas/knitpaint-tools/keyboard-transform-tool.service';

@Component({
  selector: 'app-assembly',
  templateUrl: './assembly.component.html',
  styleUrls: ['./assembly.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssemblyComponent implements OnInit {

  public knitpaint: Knitpaint;
  @ViewChild('knitpaintCanvas') knitpaintCanvas: KnitpaintCanvasComponent;

  constructor() {
    const width = 100;
    const height = 100;
    const array = new Uint8Array(width * height);
    this.knitpaint = new Knitpaint(array.buffer, width);
  }

  ngOnInit() {
    const activeTools = [
      this.knitpaintCanvas.getTool(GridTool),
      this.knitpaintCanvas.getTool(MultitouchTransformTool),
      this.knitpaintCanvas.getTool(KeyboardTransformTool)
    ];
    this.knitpaintCanvas.activateTools(activeTools);
  }

}
