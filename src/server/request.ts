import { IServerContext } from './server-context';
import { Session } from './session';

export interface IRequest {
  getCommand(): string;
  getParams(): string[];
  getParam(index: number): string;
  getLength(): number;
  getSession(): Session;
  getServerContext(): IServerContext;
}
