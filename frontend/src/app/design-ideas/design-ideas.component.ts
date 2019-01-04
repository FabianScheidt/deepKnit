import { AfterViewChecked, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { KnitpaintViewerComponent } from '../knitpaint-viewer/knitpaint-viewer.component';
import { Knitpaint } from '../knitpaint';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { KnitpaintSamplingOptions, KnitpaintSamplingService } from '../knitpaint-sampling.service';
import { debounceTime, map, skip } from 'rxjs/operators';

@Component({
  selector: 'app-design-ideas',
  templateUrl: './design-ideas.component.html',
  styleUrls: ['./design-ideas.component.scss']
})
export class DesignIdeasComponent implements OnInit, AfterViewChecked {
  @ViewChild('designKnitpaintViewer') designKnitpaintViewer: KnitpaintViewerComponent;
  @ViewChild('ideaKnitpaintViewer') ideaKnitpaintViewer: KnitpaintViewerComponent;
  knitpaint: Knitpaint;
  pixelsPerRow = 57;
  rows = 70;
  selectedColorNumber = 1;
  designIdeas: Knitpaint;
  model: BehaviorSubject<string> = new BehaviorSubject<string>('lstm');
  temperature: BehaviorSubject<number> = new BehaviorSubject(1.0);
  selection: [number, number] = null;
  isiOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

  constructor(private httpClient: HttpClient, private ngZone: NgZone, private knitpaintSamplingService: KnitpaintSamplingService) {}

  ngOnInit() {
    this.initKnitpaintData();

    this.ngZone.runOutsideAngular(() => {

      // Generate the options for the sampling of the design ideas whenever the knitpaint or the temperature changes
      const options: Observable<KnitpaintSamplingOptions> = combineLatest(this.knitpaint.data, this.model, this.temperature).pipe(
        skip(1),
        debounceTime(500),
        map((res: [ArrayBuffer, string, number]) => {
          const data = res[0];
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
            numGenerate: this.pixelsPerRow * this.rows
          };
        })
      );

      this.knitpaintSamplingService.getContinuousSampleStream(options).subscribe((arrayBuffer) => {
        this.designIdeas.setData(arrayBuffer);
      }, (err) => {
        console.error('Error', err);
      }, () => {
        console.log('Complete');
      });
    });
  }

  ngAfterViewChecked() {
    console.log('View Checked');
  }

  private initKnitpaintData() {
    const length = this.pixelsPerRow * this.rows;
    this.knitpaint = new Knitpaint(<ArrayBuffer>(new Uint8Array(length)).buffer);
    this.designIdeas = new Knitpaint(<ArrayBuffer>(new Uint8Array(length)).buffer);
  }

  public setModel(model: string) {
    this.ngZone.runOutsideAngular(() => {
      this.model.next(model);
    });
  }

  public setTemperature(temperature) {
    this.ngZone.runOutsideAngular(() => {
      this.temperature.next(temperature);
    });
  }

  public importDesign() {
    this.designKnitpaintViewer.import();
  }

  public exportDesignAsImage() {
    this.designKnitpaintViewer.exportAsImage('design.png');
  }

  public exportDesignAsDat() {
    this.designKnitpaintViewer.exportAsDat('design.dat');
  }

  public exportIdeaAsImage() {
    this.ideaKnitpaintViewer.exportAsImage('idea.png');
  }

  public exportIdeaAsDat() {
    this.ideaKnitpaintViewer.exportAsDat('idea.dat');
  }

  public copySelection() {
    if (this.selection) {
      this.ngZone.runOutsideAngular(() => {
        // Extract the selection content
        const ideaUint8Array = new Uint8Array(this.designIdeas.data.getValue());
        const copyContent = ideaUint8Array.slice(this.selection[0], this.selection[1] + 1);

        // Find out where to paste it
        const knitpaintUint8Array = new Uint8Array(this.knitpaint.data.getValue());
        let lastNonBlackIndex = 0;
        knitpaintUint8Array.forEach((value, index) => {
          if (value !== 0) {
            lastNonBlackIndex = index;
          }
        });
        const startIndex = Math.ceil((lastNonBlackIndex + 1) / this.pixelsPerRow) * this.pixelsPerRow;

        // Perform the copy and update the knitpaint
        knitpaintUint8Array.set(copyContent, startIndex);
        this.knitpaint.setData(<ArrayBuffer>knitpaintUint8Array.buffer);
      });

      // Clear the selection after copy
      this.selection = null;
    }
  }

  public clear() {
    const rows = 70;
    const length = this.pixelsPerRow * rows;
    const clear = new Uint8Array(length);
    this.knitpaint.setData(<ArrayBuffer>clear.buffer);
  }
}
