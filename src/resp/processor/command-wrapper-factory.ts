import { CommandWrapper } from './command-wrapper';
import { IRespCommand } from './command/resp-command';

export class CommandWrapperFactory {
  public wrap(command: any): IRespCommand {
    return new CommandWrapper(command);
  }
}
