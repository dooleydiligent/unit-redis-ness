import { EventEmitter } from 'events';
import * as net from 'net';
import * as util from 'util';
import { Logger } from '../logger';
import { IRespCommand } from '../resp/command/resp-command';
import { CommandSuite } from '../resp/processor/command-suite';
import { ArrayRedisToken } from '../resp/protocol/array-redis-token';
import { RedisToken } from '../resp/protocol/redis-token';
import { RedisTokenType } from '../resp/protocol/redis-token-type';
import { UnknownRedisToken } from '../resp/protocol/unknown-redis-token';
import { DefaultRequest } from './default-request';
import { DefaultSession } from './default-session';
import { IRequest } from './request';
import { RespServerContext } from './resp-server-context';
import { IServerContext } from './server-context';
import { Session } from './session';
export { sendCommand } from '../client';

/* tslint:disable-next-line */
const Parser = require('redis-parser');

/**
 * The redis server.
 * Manages client request/response cycle.
 *
 * Listens, by default, to env.DEFAULT_HOST (localhost) on port env.DEFAULT_PORT (6379)
 */
export class RespServer extends EventEmitter {
  private static BUFFER_SIZE = 1024 * 1024;
  private static MAX_FRAME_SIZE = RespServer.BUFFER_SIZE * 100;
  private static DEFAULT_HOST = process.env.REDIS_HOST || 'localhost';
  private static DEFAULT_PORT = process.env.REDIS_PORT ||  6379;

  private logger: Logger = new Logger(module.id);
  private server: net.Server = net.createServer();
  private serverContext: IServerContext;
  constructor() {
    super();
    const host = RespServer.DEFAULT_HOST;
    const port = Number(RespServer.DEFAULT_PORT);
    const commandSuite = new CommandSuite();
    this.serverContext = new RespServerContext(host, port, commandSuite);
  }
  /**
   * Receive the client request, convert it to RESP format,
   * dispatch the request then respond to the client.
   *
   * Probably too busy.  Should be refactored.
   *
   * @param session The client session (including socket)
   * @param message The client request
   */
  public receive(session: Session, message: any): void {
    // convert message to RedisToken
    const parser = new Parser({
      returnBuffers: false,
      returnError: (err: any) => {
        this.logger.warn(`returnError: "%j"`, err);
      },
      returnReply: async (command: any) => {
        this.logger.debug(`returnReply: command is ${command}`);
        session.setLastCommand(command);
        const request: IRequest = this.parseMessage(new ArrayRedisToken(command), session);
        // look up the command in commandsuite
        const execcommand: IRespCommand = this.serverContext.getCommand(request.getCommand());
        this.logger.debug(`Executing command "${request.getCommand()}"`);
        const resultToken = await execcommand.execSync(request);
        this.logger.debug(`Response from "${request.getCommand()}, ${request.getParams()}" is %s`, resultToken);
        // send the result back to the client
        session.publish(resultToken);
      },
      stringNumbers: true
    });
    parser.execute(message);
  }
  /**
   * start the redis server
   */
  public start(): void {
    this.server.on('listening', (listener: any) => {
      this.server.on('connection', (socket: net.Socket) => {
        this.logger.debug(`\n\nCONNECTION\n\n`);
        this.registerConnection(socket);
      });

      this.emit('ready');
      this.logger.info(`redis-server: Listening on ${this.serverContext.getHost()}:${this.serverContext.getPort()}`);
    });
    this.server.listen(this.serverContext.getPort(), this.serverContext.getHost());
  }
  /**
   * stop the redis server
   */
  public async stop() {
    this.logger.info(`redis-server: Shutting down`);
    await this.server.close();
    this.emit('closed');
  }
  /**
   * Register a client socket connection
   * @param socket client socket
   */
  private registerConnection(socket: net.Socket | any) {
    // Generate the socketId
    const key = `${socket.remoteAddress}:${socket.remotePort}`;
    let newSession: Session;
    if (!!socket.id) {
      this.logger.debug(`FOUND SESSION: ${socket.id}`);
      newSession = this.serverContext.getClients().get(socket.id);
    } else {
      (socket as net.Socket).setKeepAlive(true);
      newSession = new DefaultSession(key, socket);
      this.logger.info(`registering connection ${newSession.getId()}`);
      newSession.putValue('ID', newSession.getId());
      socket.id = newSession.getId();
      this.serverContext.addClient(newSession.getId(), newSession);
    }
    socket.on('close', (hadError: boolean) => {
      this.logger.debug(`Closing socket ${socket.id}`);
      this.serverContext.removeClient(socket.id);
      this.logger.debug(`SOCKET CLOSE: ERROR ${hadError}`);
    });
    socket.on('data', (chunk: any) => {
      this.logger.debug(`Receive message from ${socket.id}`);
      this.receive(newSession, chunk);
    });
    socket.on('connect', () => {
      this.logger.debug(`THE SOCKET IS CONNECTED`);
    });
    socket.on('drain', () => {
      this.logger.debug(`SOCKET DRAIN`);
    });
    socket.on(`end`, () => {
      this.logger.debug(`SOCKET END`);
    });
    socket.on(`error`, () => {
      this.logger.debug(`SOCKET ERROR`);
    });
    socket.on(`ready`, () => {
      this.logger.debug(`SOCKET READY`);
    });
    socket.on(`timeout`, () => {
      this.logger.debug(`SOCKET TIMEOUT`);
    });
  }

  private parseMessage(message: ArrayRedisToken, session: Session): IRequest {
    this.logger.debug(`${session.getId()}: parseMessage `, util.inspect(message));
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
