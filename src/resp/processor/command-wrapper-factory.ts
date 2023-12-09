import {IRespCommand} from "../command/resp-command";
import {CommandWrapper} from "./command-wrapper";

export class CommandWrapperFactory {
    public wrap(command: any): IRespCommand {
        return new CommandWrapper(command);
    }
}
