import { Injectable } from '@angular/core';
import { Project } from '../editor/project';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class ProjectLoggingService {

  constructor(private httpClient: HttpClient) { }

  public logProject(project: Project) {
    const url = environment.backendUrl + 'log-project';
    const clientUuid = localStorage ? localStorage.getItem('client-uuid') : '';
    const body = { project, clientUuid };
    this.httpClient.post(url, body).subscribe();
  }
}
