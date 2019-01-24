import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';
import { Knitpaint } from './knitpaint';

@Injectable({
  providedIn: 'root'
})
export class KnitpaintConversionService {

  constructor(private http: HttpClient) { }

  public fromDat(dat: ArrayBuffer): Observable<Knitpaint> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json',
        'If-Unmodified-Since': (new Date()).getTime().toString(10)
      }),
      responseType: <any>'json'
    };
    return this.http.post<{ data: number[], width: number}>(environment.backendUrl + 'from-dat', dat, options)
      .pipe(map(res => Knitpaint.fromJSON(res)));
  }

  public toDat(knitpaint: Knitpaint): Observable<ArrayBuffer> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/octet-stream',
        'If-Unmodified-Since': (new Date()).getTime().toString(10)
      }),
      responseType: <any>'arraybuffer'
    };
    return this.http.post(environment.backendUrl + 'to-dat', knitpaint, options);
  }
}
