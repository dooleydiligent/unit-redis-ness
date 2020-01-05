import { Dictionary } from '../dictionary';
import { Database } from '../resp/data/database';
import { CommandSuite } from '../resp/processor/command-suite';
import { IRespCommand } from '../resp/processor/command/resp-command';
import { IServerContext } from './server-context';
import { Session } from './session';

export class RespServerContext implements IServerContext {
  private clients: Dictionary<string> = new Dictionary<string>();
  private state: Dictionary<string> = new Dictionary<string>();
  private db: Database = new Database();
  constructor(private host: string, private port: number, private commands: CommandSuite) {
    this.state.put('db', this.db);
  }

  public getHost(): string {
    return this.host;
  }
  public getPort(): number {
    return this.port;
  }
  public getClients(): Dictionary<Session> {
    return this.clients;
  }
  public getClientCount(): number {
    return Object.keys(this.clients).length;
  }
  public getCommand(name: string): IRespCommand {
    return this.commands.getCommand(name);
  }
  public getValue(key: string): any {
    return this.state.get(key);
  }
  public putValue(key: string, value: any): void {
    this.state.put(key, value);
  }
  public removeValue(key: string) {
    this.state.remove(key);
  }
  public addClient(clientId: string, client: Session): void {
    this.clients.put(clientId, client);
  }
}
