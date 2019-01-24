import { Injectable } from '@angular/core';
import { ProjectService } from './project.service';
import { Project } from './project';
import { Knitpaint } from '../knitpaint';
import { KnitpaintConversionService } from '../api/knitpaint-conversion.service';
import saveAs from 'file-saver';

@Injectable()
export class EditorIoService {

  constructor(private projectService: ProjectService,
              private knitpaintConversionService: KnitpaintConversionService) {}

  /**
   * Starts a download containing the current project
   */
  public saveToFile(): void {
    const project = this.projectService.getProject();
    const file = new Blob([JSON.stringify(project)], {type: 'text/plain;charset=utf-8'});
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
        const projectSerialized = JSON.parse(<string>reader.result);
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
   * Converts the current assembly to dat and starts a download
   */
  public exportToDatFile(): void {
    const assembly = this.projectService.getProject().assembly;
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
        const buffer: ArrayBuffer = <ArrayBuffer>reader.result;
        this.knitpaintConversionService.fromDat(buffer).subscribe((res: Knitpaint) => {
          const project = this.projectService.getProject();
          const newProject = project.setAssembly(res);
          this.projectService.setProject(newProject);
        });
      });
      reader.readAsArrayBuffer(file);
    });
    input.addEventListener('click', () => {
      input.remove();
    });
    input.click();
  }

  /**
   * Converts the current assembly to png and starts a download
   */
  public exportToImageFile(): void {
    const assembly = this.projectService.getProject().assembly;
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = assembly.width;
    imageCanvas.height = assembly.height;
    const imageContext = imageCanvas.getContext('2d');
    imageContext.scale(1, -1);
    imageContext.drawImage(assembly.getImage(), 0, 0, assembly.width , assembly.height * -1);
    imageCanvas.toBlob((blob: Blob) => {
      saveAs(blob, 'deepknit.png');
    });
  }
}
