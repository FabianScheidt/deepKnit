import { Knitpaint } from '../knitpaint';
import * as uuidv4 from 'uuid/v4';

export enum ProjectStage {
  Setup = 0,
  Patterns = 1,
  Assembly = 2
}

/**
 * A project represents the current state of the editor. The class is designed to be immuatble. Therefore mutating methods return new
 * instances of Project.
 */
export class Project {
  public readonly stage: ProjectStage = ProjectStage.Setup;
  public readonly patterns: Knitpaint[] = [];
  public readonly assembly: Knitpaint;
  public readonly uuid: string;

  public static fromJSON(json: any): Project {
    const stage = json.stage;
    const patterns = json.patterns.map((pattern) => Knitpaint.fromJSON(pattern));
    const assembly = Knitpaint.fromJSON(json.assembly);
    const uuid = json.uuid;
    return new Project(stage, patterns, assembly, uuid);
  }

  constructor(stage?: ProjectStage, patterns?: Knitpaint[], assembly?: Knitpaint, uuid?: string) {
    if (stage) {
      this.stage = stage;
    }
    if (patterns) {
      this.patterns = patterns;
    }
    if (assembly) {
      this.assembly = assembly;
    } else {
      const width = 100;
      const height = 100;
      const data = new Uint8Array(width * height);
      this.assembly = new Knitpaint(data.buffer, width);
    }
    this.uuid = uuid || uuidv4();
  }

  setStage(stage: ProjectStage) {
    return new Project(stage, this.patterns, this.assembly, this.uuid);
  }

  setPatterns(patterns: Knitpaint[]) {
    return new Project(this.stage, patterns, this.assembly, this.uuid);
  }

  setAssembly(assembly: Knitpaint) {
    return new Project(this.stage, this.patterns, assembly, this.uuid);
  }
}
