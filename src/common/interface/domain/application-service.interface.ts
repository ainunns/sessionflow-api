export interface IApplicationService<I, O> {
  execute(input: I): Promise<O>;
}
