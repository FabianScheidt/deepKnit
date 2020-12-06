import { Component, OnDestroy, OnInit } from '@angular/core';
import { PatternSamplingService } from '../../api/pattern-sampling.service';
import { Knitpaint } from '../../knitpaint';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { EditorStateService } from '../editor-state.service';
import { Subject } from 'rxjs';
import { PatternSamplingCategoryWeights, PatternSamplingMethod, PatternSamplingOptions } from '../../api/pattern-sampling-options';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss']
})
export class PatternsComponent implements OnInit, OnDestroy {

  private numLoad = 28;

  samplingMethod: PatternSamplingMethod = 'stochastic';
  categoryWeights: PatternSamplingCategoryWeights = {
    cable: 0,
    stitchMove: 0.8,
    links: 0.2,
    miss: 0,
    tuck: 0
  };
  stochasticOptions = {
    temperature: 0.7
  };
  beamSearchOptions = {
    temperature: 1.0,
    k: 5,
    lengthNormalization: true,
    lengthBonusFactor: 0
  };

  patternIndices = [];
  sampledPatterns: Knitpaint[] = [];

  showThumbnails = false;
  hideProblematic = false;

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
    // Build options object
    let samplingOptions: PatternSamplingOptions;
    if (this.samplingMethod === 'stochastic') {
      samplingOptions = {
        method: 'stochastic',
        methodOptions: this.stochasticOptions
      };
    } else if (this.samplingMethod === 'beam-search') {
      samplingOptions = {
        method: 'beam-search',
        methodOptions: this.beamSearchOptions
      };
    } else {
      samplingOptions = {
        method: this.samplingMethod
      };
    }
    samplingOptions.categoryWeights = this.categoryWeights;

    // Sample
    this.patternIndices = this.patternIndices.concat(_.range(this.patternIndices.length, this.patternIndices.length + this.numLoad));
    this.patternSamplingService.samplePatterns(samplingOptions)
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
   * @param key
   * @param value
   */
  public setSamplingOptions(which, key: string, value: any) {
    if (which === this.samplingMethod) {
      this.samplingMethod = value;
    } else if (which === this.categoryWeights) {
      this.categoryWeights[key] = value;
      let othersSum = 0;
      let othersCount = 0;
      for (const categoryKey of Object.keys(this.categoryWeights)) {
        if (categoryKey !== key) {
          othersSum += this.categoryWeights[categoryKey];
          othersCount++;
        }
      }
      const excess = 1 - othersSum - value;

      for (const categoryKey of Object.keys(this.categoryWeights)) {
        if (categoryKey !== key) {
          const fraction = othersSum === 0 ? 1 / othersCount : this.categoryWeights[categoryKey] / othersSum;
          this.categoryWeights[categoryKey] = Math.round((this.categoryWeights[categoryKey] + excess * fraction) * 1000) / 1000;
        }
      }
    } else if (which === this.stochasticOptions) {
      this.stochasticOptions[key] = value;
    } else if (which === this.beamSearchOptions) {
      this.beamSearchOptions[key] = value;
    }
    this.samplingOptionsChanged.next();
  }

}
