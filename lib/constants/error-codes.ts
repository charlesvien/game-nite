export const ErrorCodes = {
  FETCH_FAILED: 'FETCH_FAILED',
  DEPLOY_FAILED: 'DEPLOY_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
  RESTART_FAILED: 'RESTART_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
