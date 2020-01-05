import { Dictionary } from '../../dictionary';
import { CommandWrapperFactory } from '../../resp/processor/command-wrapper-factory';
import { NullCommand } from '../../resp/processor/command/null-command';
import { IRespCommand } from '../../resp/processor/command/resp-command';

export interface ICommandSuite {
  metadata: Dictionary<string, string>;
  commands: Dictionary<string, IRespCommand>;
  nullCommand: NullCommand;
  factory: CommandWrapperFactory;
  getCommand(name: string): IRespCommand;
  addCommand(name: string, command: IRespCommand): void;
}
