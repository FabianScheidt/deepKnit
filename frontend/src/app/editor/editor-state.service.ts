import { Injectable } from '@angular/core';
import { ProjectService } from './project.service';
import { KnitpaintConversionService } from '../api/knitpaint-conversion.service';
import { Project, ProjectStage } from './project';
import { Knitpaint } from '../knitpaint';
import { Observable, Subject } from 'rxjs';
import saveAs from 'file-saver';

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

  constructor(private projectService: ProjectService,
              private knitpaintConversionService: KnitpaintConversionService) {
    // Get the current project
    this.project = projectService.getProject();

    // Register local observables for project changes
    this.registerProjectChanges();

    // Save whenever the project changes
    this.projectService.projectChanged.subscribe(() => this.saveToLocalStorage());

    // Try to load a project from local storage, use a timeout to give other components a chance to register for changes
    setTimeout(() => {
      this.initFromLocalStorage();
    });
  }

  /**
   * Registers the observables for changes on stage, patterns or assembly
   */
  private registerProjectChanges() {
    this.projectService.projectChanged.subscribe(() => {
      const lastProject = this.project;
      this.project = this.projectService.getProject();
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

  /**
   * Initializes an empty project
   */
  public init(): void {
    const project = new Project();
    this.projectService.setProject(project, true);
  }

  /**
   * Starts a download containing the current project
   */
  public saveToFile(): void {
    const file = new Blob([JSON.stringify(this.project)], {type: 'text/plain;charset=utf-8'});
    const now = new Date();
    const datStr = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + '-' + now.getHours() + '-' + now.getMinutes();
    const filename = datStr + '.deepknitproject';
    saveAs(file, filename);
  }

  /**
   * Opens a dialog to load a project from disk
   */
  public initFromFile(): void {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', (e: Event) => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const projectSerialized = JSON.parse(reader.result);
        const project = Project.fromJSON(projectSerialized);
        this.projectService.setProject(project, true);
      });
      reader.readAsText(file);
    });
    input.addEventListener('click', () => {
      input.remove();
    });
    input.click();
  }

  /**
   * Saves the current project to local storage
   */
  private saveToLocalStorage(): void {
    if (localStorage) {
      localStorage.setItem('project', JSON.stringify(this.project));
    }
  }

  /**
   * Loads the project from local storage
   */
  private initFromLocalStorage(): void {
    if (localStorage) {
      const projectJSON = localStorage.getItem('project');
      if (projectJSON) {
        const projectSerialized = JSON.parse(projectJSON);
        const project = Project.fromJSON(projectSerialized);
        this.projectService.setProject(project, true);
      }
    }
  }

  /**
   * Converts the current assembly to dat and starts a download
   */
  public exportToDatFile(): void {
    const assembly = this.getAssembly();
    this.knitpaintConversionService.toDat(assembly).subscribe((dat: ArrayBuffer) => {
      const blob = new Blob([new Uint8Array(dat)]);
      saveAs(blob, 'deepknit.dat');
    });
  }

  /**
   * Opens a dialog to select a dat file, converts it and makes it the current assembly
   */
  public importFromDatFile(): void {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', (e: Event) => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const buffer: ArrayBuffer = reader.result;
        this.knitpaintConversionService.fromDat(buffer).subscribe((res: Knitpaint) => {
          this.setAssembly(res);
        });
      });
      reader.readAsArrayBuffer(file);
    });
    input.addEventListener('click', () => {
      input.remove();
    });
    input.click();
  }

  public getStage(): ProjectStage {
    return this.project.stage;
  }

  public setStage(stage: ProjectStage) {
    const project = this.project.setStage(stage);
    this.projectService.setProject(project);
  }

  public getPatterns(): Knitpaint[] {
    return this.project.patterns;
  }

  public setPatterns(patters: Knitpaint[]) {
    const project = this.project.setPatterns(patters);
    this.projectService.setProject(project);
  }

  public getAssembly(): Knitpaint {
    return this.project.assembly;
  }

  public setAssembly(assembly: Knitpaint) {
    const project = this.project.setAssembly(assembly);
    this.projectService.setProject(project);
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
