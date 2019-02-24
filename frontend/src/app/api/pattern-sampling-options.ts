export type PatternSamplingMethod = 'greedy' | 'temperature' | 'beam-search';

export interface PatternSamplingOptions {
  method?: PatternSamplingMethod;
  temperature?: number;
  cable?: number;
  stitchMove?: number;
  links?: number;
  miss?: number;
  tuck?: number;
}
