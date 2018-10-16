import { AfterViewChecked, Component, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Knitpaint } from './knitpaint';
import { KnitpaintSamplingService } from './knitpaint-sampling.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {
  knitpaint: Knitpaint;
  pixelsPerRow = 57;
  selectedColorNumber = 1;
  designIdeas = new Knitpaint(<ArrayBuffer>(new Uint8Array(51 * 20)).buffer);

  constructor(private httpClient: HttpClient, private ngZone: NgZone, private knitpaintModel: KnitpaintSamplingService) {}

  ngOnInit() {
    // Fetch some knitpaint file
    this.httpClient.get('/assets/sample_test.txt', { responseType: 'blob' }).subscribe((res) => {
      this.knitpaint = new Knitpaint(res);
    });

    this.ngZone.runOutsideAngular(() => {
      this.knitpaintModel.fetchSamples().pipe(debounceTime(10)).subscribe((arrayBuffer) => {
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
}
