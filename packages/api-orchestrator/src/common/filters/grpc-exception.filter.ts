import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {RpcException} from '@nestjs/microservices';
import {status as GrpcStatus} from '@grpc/grpc-js';
import {Response} from 'express';

@Catch(RpcException)
export class GrpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const error = exception.getError() as { code: number; message: string }; // Type assertion

    let httpStatus: HttpStatus;
    let message: string;

    // Check if the error object has the expected structure
    if (
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && 'message' in error
    ) {
      message = error.message; // Use the detailed message from the microservice

      // Map gRPC status codes to HTTP status codes
      switch (error.code) {
        case GrpcStatus.ALREADY_EXISTS:
          httpStatus = HttpStatus.CONFLICT; // 409
          break;
        case GrpcStatus.NOT_FOUND:
          httpStatus = HttpStatus.NOT_FOUND; // 404
          break;
        case GrpcStatus.INVALID_ARGUMENT:
          httpStatus = HttpStatus.BAD_REQUEST; // 400
          break;
        case GrpcStatus.UNAUTHENTICATED:
          httpStatus = HttpStatus.UNAUTHORIZED; // 401
          break;
        case GrpcStatus.PERMISSION_DENIED:
          httpStatus = HttpStatus.FORBIDDEN; // 403
          break;
        // Add more mappings as needed
        default:
          httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; // 500
          break;
      }
      this.logger.error(`GRPC Error: Code=${error.code}, Message=${message}. Mapped to HTTP Status ${httpStatus}`);
    } else {
      // Handle cases where the error format is unexpected
      this.logger.error(`Unexpected RpcException format: ${JSON.stringify(exception.getError())}`);
      message = 'An unexpected error occurred communicating with the service.';
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(httpStatus).json({
      statusCode: httpStatus,
      message: message,
      timestamp: new Date().toISOString(),
      // You might add the path from the request if needed: ctx.getRequest().url
    });
  }
}
