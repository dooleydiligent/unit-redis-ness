import * as os from "os";
import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { IServerContext } from "../../../server/server-context";
import { Database } from "../../data/database";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

export class InfoCommand extends IRespCommand {
    public maxParams = 1

    public minParams = 0

    public name = "info"

    private static SHARP = "# ";

    private static SEPARATOR = ":";

    private static DELIMITER = "\r\n";

    private static SECTION_KEYSPACE = "keyspace";

    private static SECTION_COMMANDSTATS = "commandstats";

    private static SECTION_CPU = "cpu";

    private static SECTION_STATS = "stats";

    private static SECTION_PERSISTENCE = "persistence";

    private static SECTION_MEMORY = "memory";

    private static SECTION_CLIENTS = "clients";

    private static SECTION_REPLICATION = "replication";

    private static SECTION_SERVER = "server";

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(`executeDBRequest(${request}, ${db})`);
        const sections: any = {};
        this.logger.debug(
            `request is ${request.constructor.name}`,
            `${request}`
        );
        if (request.getParams().length > 0) {
            const section = request.getParam(0).toString();
            if (this.allSections().indexOf(section.toLowerCase()) > -1) {
                sections[section] = this.section(
                    section,
                    request.getServerContext()
                );
            } else {
                return RedisToken.string(" ");
            }
        } else {
            for (const section of this.allSections()) {
                sections[section] = this.section(
                    section,
                    request.getServerContext()
                );
            }
        }
        return RedisToken.string(this.makeString(sections));
    }

    private allSections(): string[] {
        return [
            InfoCommand.SECTION_SERVER,
            InfoCommand.SECTION_REPLICATION,
            InfoCommand.SECTION_CLIENTS,
            InfoCommand.SECTION_MEMORY,
            InfoCommand.SECTION_PERSISTENCE,
            InfoCommand.SECTION_STATS,
            InfoCommand.SECTION_CPU,
            InfoCommand.SECTION_COMMANDSTATS,
            InfoCommand.SECTION_KEYSPACE
        ];
    }

    private section(section: string, ctx: IServerContext): any {
        switch (section.toLowerCase()) {
        case InfoCommand.SECTION_SERVER:
            return this.server(ctx);
        case InfoCommand.SECTION_CLIENTS:
            return this.clients(ctx);
        case InfoCommand.SECTION_MEMORY:
            return this.memory(ctx);
        case InfoCommand.SECTION_STATS:
        case InfoCommand.SECTION_CPU:
        case InfoCommand.SECTION_COMMANDSTATS:
        case InfoCommand.SECTION_KEYSPACE:
        case InfoCommand.SECTION_REPLICATION:
        case InfoCommand.SECTION_PERSISTENCE:
        default:
            return { "section": "Not Implemented" };
        }
    }

    private server(ctx: IServerContext): any {
        return {
            "server": {
                "redis_version": "1.0.1",
                // Tslint:disable-next-line
                "node_version": process.version,
                "os": `${os.platform()} ${os.release()} ${os.arch()}`,
                "tcp_port": ctx.getPort()
            }
        };
    }

    private clients(ctx: IServerContext): any {
        return { "connected_clients": `${ctx.getClients()}` };
    }

    private memory(ctx: IServerContext): any {
        return { "memory_use": process.memoryUsage() };
    }

    private makeString(sections: any): string {
        let result = "";
        for (const section of Object.keys(sections)) {
            result += `${InfoCommand.SHARP}${section}${InfoCommand.DELIMITER}`;
            for (const subkey of Object.keys(sections[section])) {
                if (sections[section][subkey].constructor.name === "String") {
                    result += `${subkey}${InfoCommand.SEPARATOR}${sections[section][subkey]}${InfoCommand.DELIMITER}`;
                } else {
                    //          Result += `${subkey}${InfoCommand.SEPARATOR}`;
                    for (const sskey of Object.keys(sections[section][subkey])) {
                        result += `${sskey}${InfoCommand.SEPARATOR}\t${sections[section][subkey][sskey]}${InfoCommand.DELIMITER}`;
                    }
                    result += `${InfoCommand.DELIMITER}`;
                }
            }
            result += InfoCommand.DELIMITER;
        }
        result += InfoCommand.DELIMITER;
        return result;
    }
}
