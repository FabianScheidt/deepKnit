import { Component, OnDestroy, OnInit } from '@angular/core';
import { PatternSamplingService } from '../../api/pattern-sampling.service';
import { Knitpaint } from '../../knitpaint';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { EditorStateService } from '../editor-state.service';
import { Subject } from 'rxjs';
import { PatternSamplingOptions } from '../../api/pattern-sampling-options';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss']
})
export class PatternsComponent implements OnInit, OnDestroy {

  private numLoad = 28;
  samplingOptions: PatternSamplingOptions = {
    method: 'stochastic',
    temperature: 0.7,
    cable: 0,
    stitchMove: 0.8,
    links: 0.2,
    miss: 0,
    tuck: 0
  };
  patternIndices = [];
  sampledPatterns: Knitpaint[] = [];
  private isDestroyed: Subject<void> = new Subject<void>();
  private samplingOptionsChanged: Subject<void> = new Subject<void>();

  constructor(private editorStateService: EditorStateService,
              private patternSamplingService: PatternSamplingService) { }

  ngOnInit() {
    this.loadMorePatterns();
    this.samplingOptionsChanged.pipe(debounceTime(100)).subscribe(() => {
      this.patternIndices = [];
      this.sampledPatterns = [];
      this.loadMorePatterns();
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed.next();
  }

  /**
   * Loads numLoad more patterns
   */
  public loadMorePatterns() {
    this.patternIndices = this.patternIndices.concat(_.range(this.patternIndices.length, this.patternIndices.length + this.numLoad));
    this.patternSamplingService.samplePatterns(this.samplingOptions)
      .pipe(take(this.numLoad), takeUntil(this.isDestroyed), takeUntil(this.samplingOptionsChanged))
      .subscribe((pattern: Knitpaint) => {
        this.sampledPatterns.push(pattern);
        console.log('Received pattern', pattern);
      });
  }

  /**
   * Returns the pattern for an index
   *
   * @param index
   */
  public getPattern(index) {
    if (this.sampledPatterns.length >= index + 1) {
      return this.sampledPatterns[index];
    }
    return null;
  }

  /**
   * Returns if the button for more patterns should be shown
   */
  public isMoreAvailable() {
    return this.sampledPatterns.length === this.patternIndices.length;
  }

  /**
   * Saves a pattern, if it is not yet saved and removes it, if it is
   *
   * @param pattern
   */
  public toggleSavePattern(pattern: Knitpaint): void {
    const patterns = this.editorStateService.getPatterns().slice();
    const index = patterns.indexOf(pattern);
    if (index > -1) {
      patterns.splice(index, 1);
    } else {
      patterns.push(pattern);
    }
    this.editorStateService.setPatterns(patterns);
  }

  /**
   * Returns if the pattern is saved
   *
   * @param pattern
   */
  public isPatternSaved(pattern: Knitpaint): boolean {
    return this.editorStateService.getPatterns().indexOf(pattern) > -1;
  }

  /**
   * Sets a sampling options and makes sure that all other options sum up correctly
   *
   * @param which
   * @param value
   */
  public setSamplingOptions(which: string, value: number) {
    this.samplingOptions[which] = value;
    if (which !== 'method' && which !== 'temperature') {
      let othersSum = 0;
      let othersCount = 0;
      for (const key of Object.keys(this.samplingOptions)) {
        if (key !== 'method' && key !== 'temperature' && key !== which) {
          othersSum += this.samplingOptions[key];
          othersCount++;
        }
      }
      const excess = 1 - othersSum - value;

      for (const key of Object.keys(this.samplingOptions)) {
        if (key !== 'method' && key !== 'temperature' && key !== which) {
          const fraction = othersSum === 0 ? 1 / othersCount : this.samplingOptions[key] / othersSum;
          this.samplingOptions[key] = Math.round((this.samplingOptions[key] + excess * fraction) * 1000) / 1000;
        }
      }
    }
    this.samplingOptions[which] = value;
    this.samplingOptionsChanged.next();
  }

}
