import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';

export interface KnitpaintConversionInterface {
  data: ArrayBufferLike;
  width: number;
}

@Injectable({
  providedIn: 'root'
})
export class KnitpaintConversionService {

  constructor(private http: HttpClient) { }

  public fromDat(dat: ArrayBuffer): Observable<KnitpaintConversionInterface> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json',
        'If-Unmodified-Since': (new Date()).getTime().toString(10)
      }),
      responseType: <any>'json'
    };
    return this.http.post<{ data: number[], width: number}>(environment.backendUrl + 'from-dat', dat, options)
      .pipe(map(res => {
        const uint8 = new Uint8Array(res.data);
        return {
          data: uint8.buffer,
          width: res.width
        };
    }));
  }

  public toDat(knitpaint: KnitpaintConversionInterface): Observable<ArrayBuffer> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/octet-stream',
        'If-Unmodified-Since': (new Date()).getTime().toString(10)
      }),
      responseType: <any>'arraybuffer'
    };
    const body = {
      data: Array.from(new Uint8Array(knitpaint.data)),
      width: knitpaint.width
    };
    return this.http.post(environment.backendUrl + 'to-dat', body, options);
  }
}
