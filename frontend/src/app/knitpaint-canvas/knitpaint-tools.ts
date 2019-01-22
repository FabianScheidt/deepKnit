import { ColorInfoTool } from './knitpaint-tools/color-info-tool.service';
import { ColorPickerTool } from './knitpaint-tools/color-picker-tool.service';
import { DrawTool } from './knitpaint-tools/draw-tool.service';
import { GridTool } from './knitpaint-tools/grid-tool.service';
import { KeyboardTransformTool } from './knitpaint-tools/keyboard-transform-tool.service';
import { MultitouchTransformTool } from './knitpaint-tools/multitouch-transform-tool.service';
import { VerticalSelectionTool } from './knitpaint-tools/vertical-selection-tool.service';

export const knitpaintTools = [
  ColorInfoTool,
  ColorPickerTool,
  DrawTool,
  GridTool,
  KeyboardTransformTool,
  MultitouchTransformTool,
  VerticalSelectionTool
];
