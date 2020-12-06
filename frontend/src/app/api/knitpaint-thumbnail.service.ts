import { Injectable } from '@angular/core';
import { Knitpaint } from '../knitpaint';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { flatMap } from 'rxjs/operators';
import { fromEvent, Observable, Observer } from 'rxjs';

@Injectable()
export class KnitpaintThumbnailService {

  constructor(private httpClient: HttpClient) { }

  /**
   * Generates a thumbnail for the provided knitpaint and emits a file url once the thumbnail is generated and fetched
   *
   * @param knitpaint
   * @param format
   * @param resolution
   * @param quality
   * @param color
   * @param returnBlob
   */
  public generateThumbnail(knitpaint: Knitpaint,
                           format?: 'png' | 'jpg' | 'bmp', resolution?: number,
                           quality?: 1 | 2 | 3, color?: [number, number, number],
                           returnBlob?: false): Observable<string>;
  public generateThumbnail(knitpaint: Knitpaint,
                           format?: 'png' | 'jpg' | 'bmp', resolution?: number,
                           quality?: 1 | 2 | 3, color?: [number, number, number],
                           returnBlob?: true): Observable<Blob>;
  public generateThumbnail(knitpaint: Knitpaint,
                           format?: 'png' | 'jpg' | 'bmp', resolution?: number,
                           quality?: 1 | 2 | 3, color?: [number, number, number],
                           returnBlob?: boolean): Observable<string | Blob> {
    const body = knitpaint.toJSON();
    body.format = format;
    body.resolution = resolution;
    body.quality = quality;
    body.color = color;

    return this.httpClient
      .post(environment.backendUrl + 'thumbnail', body, {responseType: 'blob'})
      .pipe(flatMap((imageBlob: Blob) => {
        return Observable.create((observer: Observer<string | Blob>) => {
          if (returnBlob) {
            observer.next(imageBlob);
            observer.complete();
          } else {
            const reader = new FileReader();
            fromEvent(reader, 'load').subscribe(() => {
              observer.next(<string>reader.result);
              observer.complete();
            });
            fromEvent(reader, 'error').subscribe((err) => {
              observer.error(err);
              observer.complete();
            });
            reader.readAsDataURL(imageBlob);
          }
        });
      }));
  }
}
