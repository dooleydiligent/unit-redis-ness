import { Dictionary } from '../dictionary';
import { IRespCommand } from '../resp/command/resp-command';
import { Database } from '../resp/data/database';
import { Session } from './session';

export interface IServerContext {
  addClient(clientId: string, clientSession: Session): void;
  removeClient(clientId: string): void;
  getDatabase(id: number): Database;
  getHost(): string;
  getPort(): number;
  getClients(): Dictionary<string, Session>;
  getClientCount(): number;
  getCommand(name: string): IRespCommand;
  getValue(key: string): any;
  putValue(key: string, value: any): void;
  removeValue(key: string): any;
  scriptExists(sha1: string): boolean;
  getScript(sha1: string): string;
  setScript(code: string): string;
}
