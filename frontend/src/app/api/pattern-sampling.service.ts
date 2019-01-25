import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import { Knitpaint } from '../knitpaint';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, takeUntil } from 'rxjs/operators';

@Injectable()
export class PatternSamplingService {

  constructor(private httpClient: HttpClient) { }

  public samplePatterns(): Observable<Knitpaint> {
    return new Observable<Knitpaint>((observer: Observer<Knitpaint>) => {
      const closedSubject: Subject<void> = new Subject<void>();
      const sampleMore = () => {
        this.samplePattern().pipe(takeUntil(closedSubject)).subscribe((res) => {
          observer.next(res);
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

  public samplePattern(): Observable<Knitpaint> {
    const url = environment.backendUrl + 'pattern';
    return this.httpClient.get(url).pipe(map(k => Knitpaint.fromJSON(k)));
  }
}
