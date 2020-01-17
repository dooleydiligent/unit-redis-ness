import * as util from 'util';
import { MaxParams, MinParams, Name } from '../../decorators';
import { Dictionary } from '../../dictionary';
import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { Session } from '../../server/session';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './resp-command';
/**
 * ### Available since 2.6.9.
 * ### Client supports the following parameters:
 * - GETNAME
 *
 * CLIENT GETNAME returns the name of the current connection as set by CLIENT SETNAME.
 * Since every new connection starts without an associated name, if no name was assigned
 * a null bulk reply is returned.
 *
 * ### Return value:
 * Bulk string reply: The connection name, or a null bulk reply if no name is set.
 *
 * - ID
 * ### Available since 5.0.0.
 *
 * NOTE THAT THIS IMPLEMENTATION IS NOT AS ROBUST AS IS EXPLAINED BELOW (YET).
 * Intead this implementation will return the ID assigned by the server.
 *
 * The command just returns the ID of the current connection. Every connection ID has
 * certain guarantees:
 *
 * It is never repeated, so if CLIENT ID returns the same number, the caller can be sure
 * that the underlying client did not disconnect and reconnect the connection, but it is
 * still the same connection.
 *
 * The ID is monotonically incremental. If the ID of a connection is greater than the ID
 * of another connection, it is guaranteed that the second connection was established with
 * the server at a later time.
 *
 * This command is especially useful together with CLIENT UNBLOCK which was introduced also
 * in Redis 5 together with CLIENT ID. Check the CLIENT UNBLOCK command page for a pattern
 * involving the two commands.
 *
 * - KILL
 * - LIST
 * ### CLIENT LIST [TYPE normal|master|replica|pubsub]
 *
 * ### Available since 2.4.0.
 *
 * ONLY PARTIALLY IMPLEMENTED
 *
 * The CLIENT LIST command returns information and statistics about the client connections server
 * in a mostly human readable format.
 *
 * As of v5.0, the optional TYPE type subcommand can be used to filter the list by clients' type,
 * where type is one of normal, master, replica and pubsub. Note that clients blocked into the
 * MONITOR command are considered to belong to the normal class.
 *
 * ### Return value:
 * Bulk string reply: a unique string, formatted as follows:
 *
 * One client connection per line (separated by LF)
 * Each line is composed of a succession of property=value fields separated by a space character.
 * Here is the meaning of the fields:
 *
 * id: an unique 64-bit client ID (introduced in Redis 2.8.12).
 * name: the name set by the client with CLIENT SETNAME
 * addr: address/port of the client
 * fd: file descriptor corresponding to the socket
 * age: total duration of the connection in seconds
 * idle: idle time of the connection in seconds
 * flags: client flags (see below)
 * db: current database ID
 * sub: number of channel subscriptions
 * psub: number of pattern matching subscriptions
 * multi: number of commands in a MULTI/EXEC context
 * qbuf: query buffer length (0 means no query pending)
 * qbuf-free: free space of the query buffer (0 means the buffer is full)
 * obl: output buffer length
 * oll: output list length (replies are queued in this list when the buffer is full)
 * omem: output buffer memory usage
 * events: file descriptor events (see below)
 * cmd: last command played
 *
 * The client flags can be a combination of:
 *
 * A: connection to be closed ASAP
 * b: the client is waiting in a blocking operation
 * c: connection to be closed after writing entire reply
 * d: a watched keys has been modified - EXEC will fail
 * i: the client is waiting for a VM I/O (deprecated)
 * M: the client is a master
 * N: no specific flag set
 * O: the client is a client in MONITOR mode
 * P: the client is a Pub/Sub subscriber
 * r: the client is in readonly mode against a cluster node
 * S: the client is a replica node connection to this instance
 * u: the client is unblocked
 * U: the client is connected via a Unix domain socket
 * x: the client is in a MULTI/EXEC context
 *
 * - PAUSE
 * - REPLY
 * - SETNAME
 *
 * ### Available since 2.6.9.
 * ### CLIENT SETNAME command assigns a name to the current connection.
 *
 * The assigned name is displayed in the output of CLIENT LIST so that it is possible
 * to identify the client that performed a given connection.
 *
 * For instance when Redis is used in order to implement a queue, producers and consumers
 * of messages may want to set the name of the connection according to their role.
 *
 * There is no limit to the length of the name that can be assigned if not the usual limits
 * of the Redis string type (512 MB). However it is not possible to use spaces in the
 * connection name as this would violate the format of the CLIENT LIST reply.
 *
 * It is possible to entirely remove the connection name setting it to the empty string,
 * that is not a valid connection name since it serves to this specific purpose.
 *
 * The connection name can be inspected using CLIENT GETNAME.
 *
 * Every new connection starts without an assigned name.
 *
 * ### Return value:
 * Simple string reply: OK if the connection name was successfully set.
 */
@MaxParams(4)
@MinParams(1)
@Name('client')
export class ClientCommand extends IRespCommand {
  public static DEFAULT_ERROR = `ERR Unknown subcommand or wrong number of arguments for '%s'. Try CLIENT HELP`;
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    switch (request.getParam(0).toLowerCase()) {
      case 'getname':
        return (this.getName(request));
        break;
      case 'setname':
        return (this.setName(request));
        break;
      case 'id':
        return (this.getId(request));
        break;
      case 'list':
        return (this.getList(request));
        break;
      default:
        return (RedisToken.error(util.format(ClientCommand.DEFAULT_ERROR, request.getParam(0))));
    }
  }
  private getName(request: IRequest): RedisToken {
    if (request.getParams().length === 1) {
      const name = request.getSession().getName();
      if (!name) {
        return RedisToken.nullString();
      } else {
        return RedisToken.string(name);
      }
    } else {
      return RedisToken.error(util.format(ClientCommand.DEFAULT_ERROR, request.getParam(0)));
    }
  }
  private setName(request: IRequest): RedisToken {
    if (request.getParams().length !== 2) {
      return RedisToken.error(util.format(ClientCommand.DEFAULT_ERROR, request.getParam(0)));
    }
    this.logger.debug(`Testing [${request.getParam(1)}] for whitespace`);
    const hasWhiteSpace = /\s/gm.test(request.getParam(1));
    if (hasWhiteSpace) {
      return RedisToken.error(`ERR Client names cannot contain spaces, newlines or special characters.`);
    }
    request.getSession().setName(request.getParam(1));
    return RedisToken.responseOk();
  }
  private getId(request: IRequest): RedisToken {
    if (request.getParams().length === 1) {
      const name = 7;
      // TODO: Get the index of the server-assigned client id from servercontext
      // .getValue('ID');
      return RedisToken.integer(name);
    } else {
      return RedisToken.error(util.format(ClientCommand.DEFAULT_ERROR, request.getParam(0)));
    }
  }
  private getList(request: IRequest): RedisToken {
    this.logger.debug(`getList(${request})`);
    if (request.getParams().length === 1) {
      const clientList: string[] = [];
      const clients: Dictionary<Session, Session> = request.getServerContext().getClients();
      this.logger.debug(`clients is ${clients}`);
      for (const client of clients) {
        this.logger.debug(`client is:`, client);
        this.logger.debug(`Got client: ${client}`, client);
        clientList.push(
          util.format(`id=%s name=%s addr=%s fd=%s age=%d idle=%d flags=%s ` +
            `db=%d sub=%d psub=%d multi=%d qbuf=%d qbuf-free=%d obl=%d oll=` +
            `%d omem=%d events=%s cmd=%s`,
            client.getId(),
            client.getName(),
            client.getAddress(),
            client.getValue('FD'),
            client.getValue('AGE'),
            client.getValue('IDLE'),
            client.getValue('FLAGS'),
            client.getCurrentDb(),
            client.getValue('SUB'),
            client.getValue('PSUB'),
            client.getValue('MULTI'),
            client.getValue('QBUF'),
            client.getValue('QBUF-FREE'),
            client.getValue('OBL'),
            client.getValue('OLL'),
            client.getValue('OMEM'),
            client.getValue('EVENTS'),
            client.getLastCommand()
          )
        );
      }
      return RedisToken.string(clientList.join('\n') + '\n');
    } else {
      return RedisToken.error('ERR syntax error');
    }
  }
}
