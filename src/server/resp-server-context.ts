import * as net from 'net';
import { Dictionary } from '../dictionary';
import { Logger } from '../logger';
import { IRespCommand } from '../resp/command/resp-command';
import { Database } from '../resp/data/database';
import { CommandSuite } from '../resp/processor/command-suite';
import { IServerContext } from './server-context';
import { Session } from './session';

export class RespServerContext implements IServerContext {
  private logger: Logger = new Logger(module.id);
  private clients: Dictionary<string, net.Socket> = new Dictionary<string, net.Socket>();
  private state: Dictionary<string, string> = new Dictionary<string, string>();
  private databases: Dictionary<string, Database> = new Dictionary<string, Database>();
  /**
   * Instantiate the server contect.
   * Database ZERO is instantiated by default.  Others will be dynamically added.
   * @param host The host or IP that we're listening to
   * @param port The port we're listening to
   * @param commands An empty command suite
   */
  constructor(private host: string, private port: number, private commands: CommandSuite) {
    this.databases.put('_0', new Database());
  }

  public getHost(): string {
    return this.host;
  }
  public getPort(): number {
    return this.port;
  }
  public getClients(): Dictionary<string, Session> {
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
  public removeClient(clientId: string): void {
    this.clients.remove(clientId);
  }
  /**
   * The limit of 16 databases is enforced in the {@link SelectCommand}
   * @param id ordinal db number
   */
  public getDatabase(id: number): Database {
    let db = this.databases.get(`_${id}`);
    if (!db) {
      db = this.databases.put(`_${id}`, new Database());
    }
    this.logger.debug(`getDatabase _${id} is ${this.databases.get(`_${id}`)}`);
    return this.databases.get(`_${id}`);
  }
}
