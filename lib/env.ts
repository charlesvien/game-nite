export const RAILWAY_API_TOKEN: string = process.env.RAILWAY_API_TOKEN || '';

export const RAILWAY_PROJECT_ID: string =
  process.env.RAILWAY_PROJECT_ID || 'a5801439-cd88-43eb-8d86-3dc38f7dca75';

export const RAILWAY_ENVIRONMENT_ID: string =
  process.env.RAILWAY_ENVIRONMENT_ID || 'ae07c071-34e1-4836-9121-c49f9916306e';

export const IS_SANDBOX: boolean = process.env.NODE_ENV === 'development';

export const NODE_ENV: string = process.env.NODE_ENV || 'development';
