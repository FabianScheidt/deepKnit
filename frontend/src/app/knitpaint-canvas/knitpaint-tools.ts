import { Type } from '@angular/core';
import { ColorInfoTool } from './knitpaint-tools/color-info-tool.service';
import { ColorPickerTool } from './knitpaint-tools/color-picker-tool.service';
import { DrawTool } from './knitpaint-tools/draw-tool.service';
import { GridTool } from './knitpaint-tools/grid-tool.service';
import { KeyboardTransformTool } from './knitpaint-tools/keyboard-transform-tool.service';
import { MultitouchTransformTool } from './knitpaint-tools/multitouch-transform-tool.service';
import { VerticalSelectionTool } from './knitpaint-tools/vertical-selection-tool.service';
import { KnitpaintTool } from './knitpaint-tool';
import { MouseTransformTool } from './knitpaint-tools/mouse-transform-tool.service';
import { RectangleTool } from './knitpaint-tools/rectangle-tool.service';
import { TextureTool } from './knitpaint-tools/texture-tool.service';
import { SelectionTool } from './knitpaint-tools/selection-tool.service';

export const knitpaintTools: Type<KnitpaintTool>[] = [
  ColorInfoTool,
  ColorPickerTool,
  DrawTool,
  GridTool,
  KeyboardTransformTool,
  MultitouchTransformTool,
  MouseTransformTool,
  VerticalSelectionTool,
  RectangleTool,
  TextureTool,
  SelectionTool
];
