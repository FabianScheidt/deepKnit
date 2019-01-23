import { Injectable } from '@angular/core';
import { ProjectService } from './project.service';
import { Project, ProjectStage } from './project';
import { Knitpaint } from '../knitpaint';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorStateService {

  // Keep a reference of the current project
  private project: Project;

  // Provide observables for the properties of the project
  private stageChangedSubject: Subject<void> = new Subject<void>();
  public stageChanged: Observable<void> = this.stageChangedSubject.asObservable();
  private patternsChangedSubject: Subject<void> = new Subject<void>();
  public patternsChanged: Observable<void> = this.patternsChangedSubject.asObservable();
  private assemblyChangedSubject: Subject<void> = new Subject<void>();
  public assemblyChanged: Observable<void> = this.assemblyChangedSubject.asObservable();

  constructor(private projectService: ProjectService) {
    // Configure observables for project properties
    this.project = projectService.getProject();
    projectService.projectChanged.subscribe(() => {
      const lastProject = this.project;
      this.project = projectService.getProject();
      if (this.project.stage !== lastProject.stage) {
        this.stageChangedSubject.next();
      }
      if (this.project.patterns !== lastProject.patterns) {
        this.patternsChangedSubject.next();
      }
      if (this.project.assembly !== lastProject.assembly) {
        this.assemblyChangedSubject.next();
      }
    });
  }

  public getStage(): ProjectStage {
    return this.project.stage;
  }

  public setStage(stage: ProjectStage) {
    const project = this.project.setStage(stage);
    this.projectService.setProject(project, true);
  }

  public getPatterns(): Knitpaint[] {
    return this.project.patterns;
  }

  public setPatterns(patters: Knitpaint[]) {
    const project = this.project.setPatterns(patters);
    this.projectService.setProject(project, true);
  }

  public getAssembly(): Knitpaint {
    return this.project.assembly;
  }

  public setAssembly(assembly: Knitpaint, restorable?: boolean) {
    const project = this.project.setAssembly(assembly);
    this.projectService.setProject(project, restorable);
  }

  public undoAvailable(): boolean {
    return this.projectService.undoAvailable();
  }

  public redoAvailable(): boolean {
    return this.projectService.redoAvailable();
  }

  public undo(): void {
    this.projectService.undo();
  }

  public redo(): void {
    this.projectService.redo();
  }
}
