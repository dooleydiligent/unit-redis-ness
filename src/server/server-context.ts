import { IRespCommand } from '../resp/processor/command/resp-command';

export interface IServerContext {
  getHost(): string;
  getPort(): number;
  getClients(): number;
  getCommand(name: string): IRespCommand;
  getValue(key: string): any;
  putValue(key: string, value: any): void;
  removeValue(key: string): any;
}
