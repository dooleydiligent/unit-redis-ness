import {Dictionary} from "../../dictionary";
import {NullCommand} from "../../resp/command/null-command";
import {IRespCommand} from "../../resp/command/resp-command";
import {CommandWrapperFactory} from "../../resp/processor/command-wrapper-factory";

export interface ICommandSuite {
  metadata: Dictionary<string, string>;
  commands: Dictionary<string, IRespCommand>;
  nullCommand: NullCommand;
  factory: CommandWrapperFactory;
  getCommand(name: string): IRespCommand;
  addCommand(name: string, command: IRespCommand): void;
}
