import { Injectable } from '@angular/core';
import { Project } from './project';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ProjectService {

  // Defines the maximum number of undoable steps
  static readonly MAX_UNDO = 20;

  // Store the project and provide a way to notify about project changes
  private project: Project = new Project();
  private projectChangedSubject: Subject<void> = new Subject<void>();
  public projectChanged: Observable<void> = this.projectChangedSubject.asObservable();

  // Create stacks for undo
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];

  constructor() {}

  /**
   * Returns the current version of the project
   */
  public getProject(): Project {
    return this.project;
  }

  /**
   * Creates a new version of the project.
   *
   * @param project
   * New project version
   *
   * @param clearHistory
   * Set to true to remove all previous undo steps
   */
  public setProject(project: Project, clearHistory?: boolean): void {
    this.addUndoStep(this.project);
    if (clearHistory) {
      this.undoStack = [];
    }
    this.project = project;
    this.projectChangedSubject.next();
    this.redoStack = [];
  }

  /**
   * Creates an undo step for a project and makes sure that the maximum number of steps does not exceed
   *
   * @param project
   */
  private addUndoStep(project: Project) {
    this.undoStack.push(project);
    if (this.undoStack.length > ProjectService.MAX_UNDO) {
      this.undoStack = this.undoStack.slice(this.undoStack.length - ProjectService.MAX_UNDO, ProjectService.MAX_UNDO);
    }
  }

  /**
   * Returns if the undo action can be performed
   */
  public undoAvailable(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Returns if the redo action can be performed
   */
  public redoAvailable(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Restores the last undo step und updates the redo list
   */
  public undo(): void {
    if (this.undoAvailable()) {
      this.addUndoStep(this.project);
      const latest = this.undoStack.pop();
      this.redoStack.push(latest);
      this.project = this.undoStack.pop();
      this.projectChangedSubject.next();
    }
  }

  /**
   * Restored the last redo step and updates the undo list
   */
  public redo(): void {
    if (this.redoAvailable()) {
      this.undoStack.push(this.project);
      this.project = this.redoStack.pop();
      this.projectChangedSubject.next();
    }
  }
}
