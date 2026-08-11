import { NextResponse } from "next/server";

export interface ApiResponseOptions<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  meta?: Record<string, any>;
  status?: number;
}

/**
 * Standardized API Response Helper for ARVENTA Backend Route Handlers
 */
export class ApiResponse {
  /**
   * Return a standardized success response (200 OK, 201 Created, etc.)
   */
  static success<T>({
    message = "Success",
    data,
    meta,
    status = 200,
  }: Omit<ApiResponseOptions<T>, "success">) {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
        ...(meta && { meta }),
      },
      { status }
    );
  }

  /**
   * Return a standardized error response (400, 401, 403, 404, 500, etc.)
   */
  static error({
    message = "Internal Server Error",
    error,
    status = 500,
  }: Omit<ApiResponseOptions, "success">) {
    return NextResponse.json(
      {
        success: false,
        message,
        ...(error !== undefined && { error: error instanceof Error ? error.message : error }),
      },
      { status }
    );
  }

  static badRequest(message = "Bad Request", error?: any) {
    return this.error({ message, error, status: 400 });
  }

  static unauthorized(message = "Unauthorized", error?: any) {
    return this.error({ message, error, status: 401 });
  }

  static forbidden(message = "Forbidden", error?: any) {
    return this.error({ message, error, status: 403 });
  }

  static notFound(message = "Resource Not Found", error?: any) {
    return this.error({ message, error, status: 404 });
  }
}
