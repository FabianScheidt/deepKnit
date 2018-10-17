import { AfterViewChecked, Component, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Knitpaint } from './knitpaint';
import { KnitpaintSamplingOptions, KnitpaintSamplingService } from './knitpaint-sampling.service';
import { debounceTime, map, skip } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {
  knitpaint: Knitpaint;
  pixelsPerRow = 57;
  selectedColorNumber = 1;
  designIdeas: Knitpaint;

  constructor(private httpClient: HttpClient, private ngZone: NgZone, private knitpaintSamplingService: KnitpaintSamplingService) {}

  ngOnInit() {
    this.initKnitpaintData();

    this.ngZone.runOutsideAngular(() => {

      // Generate the options for the sampling of the design ideas whenever the knitpaint changes
      const options: Observable<KnitpaintSamplingOptions> = this.knitpaint.data.pipe(
        skip(1),
        debounceTime(500),
        map((data: ArrayBuffer) => {
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
            temperature: 0.8,
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
}
