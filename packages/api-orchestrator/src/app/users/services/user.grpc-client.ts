import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client } from '@nestjs/microservices';
import { userGrpcClientOptions } from '../../user-grpc.options';
import { Observable, firstValueFrom } from 'rxjs';
import { CreateUserRequest, GetUserRequest, UpdateUserRequest, UserResponse } from '@app/common/grpc/user/user-service';

interface UserServiceGrpc {
  CreateUser(data: CreateUserRequest): Observable<UserResponse>;
  GetUser(data: GetUserRequest): Observable<UserResponse>;
  UpdateUser(data: UpdateUserRequest): Observable<UserResponse>;
}

@Injectable()
export class UserGrpcClientService implements OnModuleInit {
  @Client(userGrpcClientOptions) private readonly client!: ClientGrpc;
  private userService!: UserServiceGrpc;

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.userService.CreateUser(data));
  }

  async getUser(id: string): Promise<UserResponse> {
    const request: GetUserRequest = { id };
    return firstValueFrom(this.userService.GetUser(request));
  }

  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.userService.UpdateUser(data));
  }
}
