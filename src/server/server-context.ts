import { Dictionary } from '../dictionary';
import { IRespCommand } from '../resp/processor/command/resp-command';
import { Session } from './session';

export interface IServerContext {
  addClient(clientId: string, clientSession: Session): void;
  getHost(): string;
  getPort(): number;
  getClients(): Dictionary<Session>;
  getClientCount(): number;
  getCommand(name: string): IRespCommand;
  getValue(key: string): any;
  putValue(key: string, value: any): void;
  removeValue(key: string): any;
}
