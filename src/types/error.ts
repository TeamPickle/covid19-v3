export interface CustomError extends Error {
  type?: string;
  status?: number;
  data?: any;
}
