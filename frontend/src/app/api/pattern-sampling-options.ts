export type PatternSamplingMethod = 'greedy' | 'stochastic' | 'beam-search';

export interface PatternSamplingCategoryWeights {
  cable: number;
  stitchMove: number;
  links: number;
  miss: number;
  tuck: number;
}

export type PatternSamplingOptions = {
  method: PatternSamplingMethod;
  categoryWeights?: PatternSamplingCategoryWeights;
  maxGenerate?: number;
} | {
  method: 'greedy';
  categoryWeights?: PatternSamplingCategoryWeights;
  maxGenerate?: number;
} | {
  method: 'stochastic';
  methodOptions?: {
    temperature?: number;
  };
  categoryWeights?: PatternSamplingCategoryWeights;
  maxGenerate?: number;
} | {
  method: 'beam-search';
  methodOptions?: {
    temperature?: number;
    k?: number;
    lengthNormalization?: boolean;
    lengthBonusFactor?: number;
  };
  categoryWeights?: PatternSamplingCategoryWeights;
  maxGenerate?: number;
};
