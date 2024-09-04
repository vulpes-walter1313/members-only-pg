export default class HttpError extends Error {
  status: number;
  constructor(msg: string, code: number) {
    super(msg);
    this.status = code;
  }
}
