import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import { Knitpaint } from '../knitpaint';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, takeUntil } from 'rxjs/operators';
import { PatternSamplingOptions } from './pattern-sampling-options';

@Injectable()
export class PatternSamplingService {

  constructor(private httpClient: HttpClient) { }

  public samplePatterns(options?: PatternSamplingOptions): Observable<Knitpaint> {
    return new Observable<Knitpaint>((observer: Observer<Knitpaint>) => {
      const closedSubject: Subject<void> = new Subject<void>();
      const sampleMore = () => {
        this.samplePattern(options).pipe(takeUntil(closedSubject)).subscribe((res) => {
          if (res.width > 0) {
            observer.next(res);
          }
          if (!observer.closed) {
            sampleMore();
          }
        }, (err) => observer.error(err));
      };
      sampleMore();

      return () => {
        closedSubject.next();
      };
    });
  }

  public samplePattern(options?: PatternSamplingOptions): Observable<Knitpaint> {
    const url = environment.backendUrl + 'pattern';
    return this.httpClient.post(url, options).pipe(map(k => Knitpaint.fromJSON(k)));
  }
}
