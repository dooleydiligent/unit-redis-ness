import { EventEmitter } from 'events';
import * as net from 'net';
import { Logger } from '../logger';
import { CommandSuite } from '../resp/processor/command-suite';
import { IRespCommand } from '../resp/processor/command/resp-command';
import { ArrayRedisToken } from '../resp/protocol/array-redis-token';
import { RedisToken } from '../resp/protocol/redis-token';
import { RedisTokenType } from '../resp/protocol/redis-token-type';
import { UnknownRedisToken } from '../resp/protocol/unknown-redis-token';
import { DefaultRequest } from './default-request';
import { DefaultSession } from './default-session';
import { IRequest } from './request';
import { RespServerContext } from './resp-server-context';
import { Session } from './session';
// tslint:disable-next-line
const safeId = require('generate-safe-id');
/* tslint:disable-next-line */
const Parser = require('redis-parser');

export class RespServer extends EventEmitter {
  private static BUFFER_SIZE = 1024 * 1024;
  private static MAX_FRAME_SIZE = RespServer.BUFFER_SIZE * 100;
  private static DEFAULT_HOST = process.env.REDIS_HOST || 'localhost';
  private static DEFAULT_PORT = Number(process.env.REDIS_PORT || 6379);

  private logger: Logger = new Logger(module.id);
  private server: net.Server = net.createServer();
  private serverContext: RespServerContext;
  constructor() {
    super();
    const host = RespServer.DEFAULT_HOST;
    const port = RespServer.DEFAULT_PORT;
    const commandSuite = new CommandSuite();
    this.serverContext = new RespServerContext(host, port, commandSuite);
  }
  public receive(client: net.Socket | any, message: any): void {
    const session: Session = this.getSession(client.id);
    // convert message to RedisToken
    const parser = new Parser({
      response: message,
      returnBuffers: false,
      returnError: (err: any) => {
        this.logger.warn(`returnError: `, err);
      },
      returnReply: (command: any) => {
        this.logger.debug(`returnReply: command is ${command}`);
        parser.response = new ArrayRedisToken(command);
      },
      stringNumbers: true
    });
    parser.execute(message);
    this.logger.debug(`Parsed response is : ${parser.response}`);
    const result = this.parseMessage(parser.response, session);
    this.logger.debug(`Result is ${result}`);
    // look up the command in commandsuite
    const execcommand: IRespCommand = this.serverContext.getCommand(result.getCommand());
    this.logger.debug(`Command is ${result.getCommand()}: ${JSON.stringify(execcommand)}`);
    const resultToken: RedisToken = execcommand.execute(result);
    this.logger.debug(`resultToken is ${resultToken}`);
    // send the result back to the client
    session.publish(resultToken);
  }
  public start(): void {
    this.server.on('connection', (socket: net.Socket) => {
      this.registerConnection(socket);
    });

    this.server.listen(this.serverContext.getPort(), this.serverContext.getHost());
    this.emit('ready');
    this.logger.info(`redis-server: Listening on ${this.serverContext.getHost()}:${this.serverContext.getPort()}`);
  }
  public async stop() {
    this.logger.info(`redis-server: Shutting down`);
    await this.server.close();
    this.emit('closed');
  }
  private registerConnection(socket: net.Socket | any) {
    // Generate the socketId
    const newSocket: Session = new DefaultSession(safeId(), socket);
    this.logger.info(`registering connection ${newSocket.getId()}`);
    socket.id = newSocket.getId();
    this.serverContext.putValue(newSocket.getId(), newSocket);
    socket.on('data', (chunk: any) => {
      this.logger.debug(`Receive message from ${socket.id}`);
      this.receive(socket, chunk);
    });
  }
  private getSession(id: string): Session {
    return this.serverContext.getValue(id);
  }
  private parseMessage(message: ArrayRedisToken, session: Session): IRequest {
    this.logger.debug(`${session.getId()}: parseMessage `, JSON.stringify(message));
    switch (message.getType()) {
      case RedisTokenType.ARRAY:
        return this.parseArray(message, session);
      case RedisTokenType.UNKNOWN:
        return this.parseLine(message as any as UnknownRedisToken, session);
      default:
        this.logger.warn(`Found RedisTokenType: ${message.getType()}`);
        return new DefaultRequest(this.serverContext, session, message.toString(), []);
    }
  }
  private parseArray(message: ArrayRedisToken, session: Session): DefaultRequest {
    this.logger.debug(`parseArray(${message}, ${session.getId()})`);
    const params: string[] = this.toParams(message);
    const command: string = params.shift() || '';
    return new DefaultRequest(this.serverContext, session, command, params);
  }
  private parseLine(message: UnknownRedisToken, session: Session): DefaultRequest {
    const command: string = message.getValue();
    const params: string[] = [];
    for (const str of command.toString().split(' ')) {
      params.push(str);
    }
    return new DefaultRequest(this.serverContext, session, params[0].toString(), params);
  }
  private toParams(message: ArrayRedisToken): string[] {
    return message.getValue();
  }
}
