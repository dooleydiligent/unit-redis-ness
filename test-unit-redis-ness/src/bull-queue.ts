import Bull from "bull";
import {EventEmitter} from "events";
import {Logger} from "../../redis/src/logger";

export enum JobOp {
  ADD = "add",
  DIVIDE = "divide",
  MULTIPLY = "multiply",
  SUBTRACT = "subtract"
}

export interface IJob {
  factor1: number,
  factor2: number,
  operation: JobOp,
  result?: number
}

export class BullTest extends EventEmitter {
  private queue: Bull.Queue = new Bull("test")

  private logger: Logger = new Logger(module.id);

  constructor() {
      super();
      this.queue.on(
          "failed",
          async(job: Bull.Job, reason: any) => this.failed
      );
      this.queue.on(
          "completed",
          async(job: any, status: any) => this.completed
      );
  }

  private completed = async(job: Bull.Job, status: any) => {
      this.logger.info(
          `Job ${job.id} completed with status %j`,
          status
      );
  }

  private failed = async(job: Bull.Job, reason: any) => {
      this.logger.warn(
          `Job ${job.id} failed for reason "%j"`,
          reason
      );
  }

  public work = (): void => {
      this.logger.debug("work");
      this.queue.process(
          "*",
          async(job: any) => {
              this.logger.debug("process");
              this.emit(
                  "jobstart",
                  job.data
              );
              return new Promise(async(resolve, reject) => {
                  this.logger.info(
                      `Processing job ${job.name}: %s`,
                      job
                  );
                  const work: IJob = job.data as IJob;
                  let result: any;
                  switch (work.operation) {
                  case JobOp.ADD:
                      result = work.factor1 + work.factor2;
                      break;
                  case JobOp.DIVIDE:
                      result = work.factor1 / work.factor2;
                      break;
                  case JobOp.MULTIPLY:
                      result = work.factor1 * work.factor2;
                      break;
                  case JobOp.SUBTRACT:
                      result = work.factor1 - work.factor2;
                      break;
                  default:
                      reject(`Invalid operation: ${job.operation}`);
                      return;
                  }
                  if (result) {
                      if (isNaN(result)) {
                          reject(`${work.factor1} ${work.operation} ${work.factor2} is NaN`);
                      } else {
                          job.data.result = result;
                          resolve(result);
                      }
                  } else {
                      reject(`work.result is ${result}`);
                  }
                  this.logger.debug("Promise resolved or rejected");
              });
          }
      );
  }

  public queueJob = async(job: IJob): Promise<any> => {
      this.logger.debug(
          `Adding job: ${job.operation} %j`,
          job
      );
      return this.queue.add(
          job.operation,
          job
      );
  }
}
