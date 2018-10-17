import { AfterViewChecked, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Knitpaint } from './knitpaint';
import { KnitpaintSamplingOptions, KnitpaintSamplingService } from './knitpaint-sampling.service';
import { debounceTime, map, skip } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { KnitpaintViewerComponent } from './knitpaint-viewer/knitpaint-viewer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {
  @ViewChild('designKnitpaintViewer') designKnitpaintViewer: KnitpaintViewerComponent;
  @ViewChild('ideaKnitpaintViewer') ideaKnitpaintViewer: KnitpaintViewerComponent;
  knitpaint: Knitpaint;
  pixelsPerRow = 57;
  selectedColorNumber = 1;
  designIdeas: Knitpaint;
  temperature: BehaviorSubject<number> = new BehaviorSubject(1.0);

  constructor(private httpClient: HttpClient, private ngZone: NgZone, private knitpaintSamplingService: KnitpaintSamplingService) {}

  ngOnInit() {
    this.initKnitpaintData();

    this.ngZone.runOutsideAngular(() => {

      // Generate the options for the sampling of the design ideas whenever the knitpaint changes
      const options: Observable<KnitpaintSamplingOptions> = combineLatest(this.knitpaint.data, this.temperature).pipe(
        skip(1),
        debounceTime(500),
        map((res: [ArrayBuffer, number]) => {
          const data = res[0];
          const temperature = res[1];
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
            temperature,
            start: <ArrayBuffer>start.buffer
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
    const rows = 70;
    const length = this.pixelsPerRow * rows;
    this.knitpaint = new Knitpaint(<ArrayBuffer>(new Uint8Array(length)).buffer);
    this.designIdeas = new Knitpaint(<ArrayBuffer>(new Uint8Array(length)).buffer);
  }

  public setTemperature(temperature) {
    this.ngZone.runOutsideAngular(() => {
      this.temperature.next(temperature);
    });
  }

  public exportDesignAsImage() {
    this.designKnitpaintViewer.exportAsImage('design.png');
  }

  public exportIdeaAsImage() {
    this.ideaKnitpaintViewer.exportAsImage('idea.png');
  }
}
