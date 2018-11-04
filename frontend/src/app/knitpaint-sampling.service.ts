import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import fetchStream from 'fetch-readablestream';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface KnitpaintSamplingOptions {
  start?: ArrayBuffer;
  model?: string;
  temperature?: number;
  numGenerate?: number;
}

@Injectable({
  providedIn: 'root'
})
export class KnitpaintSamplingService {

  constructor() { }

  /**
   * Fetches new samples whenever the options change
   *
   * @param options
   */
  public getContinuousSampleStream(options: Observable<KnitpaintSamplingOptions>): Observable<ArrayBuffer> {
    const subject: Subject<ArrayBuffer> = new Subject<ArrayBuffer>();
    options.subscribe((currentOptions?: KnitpaintSamplingOptions) => {
      this.fetchSamples(currentOptions)
        .pipe(takeUntil(options))
        .subscribe((val) => subject.next(val), (err) => subject.error(err));
    });
    return subject.asObservable();
  }

  /**
   * Fetches a stream of samples for the provided options
   *
   * @param options
   */
  public fetchSamples(options?: KnitpaintSamplingOptions): Observable<ArrayBuffer> {
    const start = options && options.start ? options.start : new ArrayBuffer(1);
    const model = options && options.model ? options.model : 'lstm';
    const temperature = options && options.temperature ? options.temperature : 1.0;
    const numGenerate = options && options.numGenerate ? options.numGenerate : 57 * 70;

    return new Observable<ArrayBuffer>((observer: Observer<ArrayBuffer>) => {
      // Create a new array buffer to store the fetched bytes
      const res = new Uint8Array(numGenerate);
      observer.next(<ArrayBuffer>res.buffer);
      let bytesReceived = 0;
      let cancelStream = false;

      // Set up the method that handles the backend response
      const responseHandler = (response: Response) => {
        if (!response) {
          console.warn('WARN: No Response');
          return;
        }
        const readableStream: ReadableStream = response.body;
        const reader: ReadableStreamReader = readableStream.getReader();
        const readStream = () => {
          reader.read().then(({value, done}) => {
            // Complete observable if done
            if (done) {
              observer.complete();
              return;
            }
            // Cancel the stream if necessary
            if (cancelStream) {
              reader.cancel();
              return;
            }

            // Store the received bytes in the array buffer
            res.set(value, bytesReceived);
            bytesReceived += value.length;
            observer.next(<ArrayBuffer>res.buffer);

            // Read more
            readStream();
          }).catch((err) => console.error(err));
        };
        readStream();
      };

      // Perform the request
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/octet-stream',
        'If-Unmodified-Since': (new Date()).getTime()
      };
      const body = JSON.stringify({
        start: Array.from(new Uint8Array(start)),
        model,
        temperature,
        num_generate: numGenerate
      });
      const fetchOptions = {
        method: 'post',
        headers,
        body
      };
      console.log('Fetch');
      fetchStream(environment.backendUrl + 'stream', fetchOptions)
        .then(responseHandler)
        .catch((err) => observer.error(err));

      // Mark that response stream should be canceled when the subscription is canceled
      return () => {
        console.log('Cancel');
        cancelStream = true;
      };
    });
  }
}
