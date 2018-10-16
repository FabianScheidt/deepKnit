import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import fetchStream from 'fetch-readablestream';

@Injectable({
  providedIn: 'root'
})
export class KnitpaintSamplingService {

  constructor() { }

  public fetchSamples(): Observable<ArrayBuffer> {
    return new Observable<ArrayBuffer>((observer: Observer<ArrayBuffer>) => {
      // Create a new array buffer to store the fetched bytes
      const res = new Uint8Array(57 * 70);
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
        'If-Unmodified-Since': (new Date()).getTime()
      };
      const fetchOptions = {
        method: 'get',
        headers
      };
      fetchStream('http://18.85.58.125:5000/stream', fetchOptions)
        .then(responseHandler)
        .catch((err) => observer.error(err));

      // Mark that response stream should be canceled when the subscription is canceled
      return () => {
        cancelStream = true;
      };
    });
  }
}
