import { IServerContext } from './server-context';
import { Session } from './session';

export interface IRequest {
  getCommand(): string;
  getParams(): string[];
  getParam(index: number): string;
  getLength(): number;
  isEmpty(): boolean;
  getSession(): Session;
  isExit(): boolean;
  // getOptionalParam(i: number): string;
  getServerContext(): IServerContext;
}
