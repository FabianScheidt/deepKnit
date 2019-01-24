import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { KnitpaintSamplingOptions, KnitpaintSamplingService } from '../../api/knitpaint-sampling.service';
import { debounceTime, map, skip } from 'rxjs/operators';
import { KnitpaintConversionService } from '../../api/knitpaint-conversion.service';
import saveAs from 'file-saver';
import { KnitpaintCanvasComponent } from '../../knitpaint-canvas/knitpaint-canvas.component';
import { DrawTool } from '../../knitpaint-canvas/knitpaint-tools/draw-tool.service';
import { GridTool } from '../../knitpaint-canvas/knitpaint-tools/grid-tool.service';
import { ColorInfoTool } from '../../knitpaint-canvas/knitpaint-tools/color-info-tool.service';
import { VerticalSelectionTool } from '../../knitpaint-canvas/knitpaint-tools/vertical-selection-tool.service';

@Component({
  selector: 'app-design-ideas',
  templateUrl: './design-ideas.component.html',
  styleUrls: ['./design-ideas.component.scss']
})
export class DesignIdeasComponent implements OnInit, AfterViewChecked {

  designKnitpaint: BehaviorSubject<Knitpaint> = new BehaviorSubject<Knitpaint>(null);
  ideaKnitpaint: BehaviorSubject<Knitpaint> = new BehaviorSubject<Knitpaint>(null);
  knitpaintWidth = 57;
  knitpaintHeight = 70;

  @ViewChild('designCanvas') designCanvas: KnitpaintCanvasComponent;
  @ViewChild('ideaCanvas') ideaCanvas: KnitpaintCanvasComponent;

  _selectedColorNumber = 1;
  public get selectedColorNumber(): number {
    return this._selectedColorNumber;
  }
  public set selectedColorNumber(selectedColorNumber: number) {
    this._selectedColorNumber = selectedColorNumber;
    this.designCanvas.getTool(DrawTool).colorNumber = selectedColorNumber;
  }

  selection_: [number, number] = null;
  selection: BehaviorSubject<[number, number]>;

  model: BehaviorSubject<string> = new BehaviorSubject<string>('lstm');
  temperature: BehaviorSubject<number> = new BehaviorSubject(1.0);

  isiOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

  constructor(private knitpaintSamplingService: KnitpaintSamplingService,
              private knitpaintConversionService: KnitpaintConversionService) {}

  ngOnInit() {
    // Init data
    this.initKnitpaintData();

    // Register tools
    this.designCanvas.activateTools(
      [this.designCanvas.getTool(GridTool), this.designCanvas.getTool(ColorInfoTool), this.designCanvas.getTool(DrawTool)]);
    this.ideaCanvas.activateTools([
      this.ideaCanvas.getTool(GridTool), this.ideaCanvas.getTool(ColorInfoTool), this.ideaCanvas.getTool(VerticalSelectionTool)
    ]);
    this.designCanvas.getTool(DrawTool).colorNumber = this.selectedColorNumber;
    this.selection = this.ideaCanvas.getTool(VerticalSelectionTool).selection;
    this.selection.subscribe((selection) => this.selection_ = selection);

    // Generate the options for the sampling of the design ideas whenever the knitpaint or the temperature changes
    const options: Observable<KnitpaintSamplingOptions> = combineLatest(this.designKnitpaint, this.model, this.temperature).pipe(
      skip(1),
      debounceTime(500),
      map((res: [Knitpaint, string, number]) => {
        const data = res[0].data;
        const model = res[1];
        const temperature = res[2];
        const dataUint8Array = new Uint8Array(data);

        // Find the last non-black index
        let lastNonBlackIndex = 0;
        dataUint8Array.forEach((value, index) => {
          if (value !== 0) {
            lastNonBlackIndex = index;
          }
        });
        const start = dataUint8Array.slice(0, lastNonBlackIndex + 1);
        return {
          model,
          temperature,
          start: <ArrayBuffer>start.buffer,
          numGenerate: this.knitpaintWidth * this.knitpaintHeight
        };
      })
    );

    this.knitpaintSamplingService.getContinuousSampleStream(options).subscribe((arrayBuffer) => {
      this.ideaKnitpaint.next(new Knitpaint(arrayBuffer, this.knitpaintWidth));
    }, (err) => {
      console.error('Error', err);
    }, () => {
      console.log('Complete');
    });

  }

  ngAfterViewChecked() {
    console.log('View Checked');
  }

  private initKnitpaintData() {
    const length = this.knitpaintWidth * this.knitpaintHeight;
    const designKnitpaint = new Knitpaint(<ArrayBuffer>(new Uint8Array(length)).buffer, this.knitpaintWidth);
    const ideaKnitpaint = new Knitpaint(<ArrayBuffer>(new Uint8Array(length)).buffer, this.knitpaintWidth);
    this.designKnitpaint.next(designKnitpaint);
    this.ideaKnitpaint.next(ideaKnitpaint);
  }

  public setModel(model: string) {
    this.model.next(model);
  }

  public setTemperature(temperature) {
    this.temperature.next(temperature);
  }

  /**
   * Opens a dialog to import from a dat file
   */
  public importDesign() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', (e: Event) => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const buffer: ArrayBuffer = reader.result;
        this.knitpaintConversionService.fromDat(buffer).subscribe((res: Knitpaint) => {
          if (res.width !== this.knitpaintWidth) {
            console.error('Width of imported dat does not match size of knitpaint viewer. Expected ' +
              this.knitpaintWidth + ' but got ' + res.width + '.');
          } else {
            this.designKnitpaint.next(res);
          }
        });
      });
      reader.readAsArrayBuffer(file);
    });
    input.addEventListener('click', () => {
      input.remove();
    });
    input.click();
  }

  public exportDesignAsDat() {
    this.exportAsDat(this.designKnitpaint.getValue(), 'design.dat');
  }

  public exportIdeaAsDat() {
    this.exportAsDat(this.ideaKnitpaint.getValue(), 'idea.dat');
  }

  /**
   * Exports knitpaint as dat file and immediately starts the download
   * @param knitpaint
   * @param filename
   */
  exportAsDat(knitpaint: Knitpaint, filename?: string) {
    this.knitpaintConversionService.toDat(knitpaint).subscribe((dat: ArrayBuffer) => {
      const blob = new Blob([new Uint8Array(dat)]);
      saveAs(blob, filename);
    });
  }

  public copySelection() {
    const selection = this.selection.getValue();
    const designKnitpaunt = this.designKnitpaint.getValue();
    const ideaKnitpaint = this.ideaKnitpaint.getValue();
    if (selection) {
      // Extract the selection content
      const ideaUint8Array = new Uint8Array(ideaKnitpaint.data);
      const copyContent = ideaUint8Array.slice(selection[0], selection[1] + 1);

      // Find out where to paste it
      const knitpaintUint8Array = new Uint8Array(designKnitpaunt.data);
      let lastNonBlackIndex = 0;
      knitpaintUint8Array.forEach((value, index) => {
        if (value !== 0) {
          lastNonBlackIndex = index;
        }
      });
      const startIndex = Math.ceil((lastNonBlackIndex + 1) / this.knitpaintWidth) * this.knitpaintWidth;

      // Perform the copy and update the knitpaint
      knitpaintUint8Array.set(copyContent, startIndex);
      this.designKnitpaint.next(new Knitpaint(<ArrayBuffer>knitpaintUint8Array.buffer, this.knitpaintWidth));

      // Clear the selection after copy
      this.selection.next(null);
    }
  }

  public clear() {
    const length = this.knitpaintWidth * this.knitpaintHeight;
    const clear = new Uint8Array(length);
    this.designKnitpaint.next(new Knitpaint(<ArrayBuffer>clear.buffer, this.knitpaintWidth));
  }
}
