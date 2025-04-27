import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client } from '@nestjs/microservices';
import { userGrpcClientOptions } from '../../user-grpc.options';
import { Observable } from 'rxjs';

interface UserServiceGrpc {
  CreateUser(data: any): Observable<any>;
  GetUser(data: { id: string }): Observable<any>;
  UpdateUser(data: any): Observable<any>;
}

@Injectable()
export class UserGrpcClientService implements OnModuleInit {
  @Client(userGrpcClientOptions) private readonly client!: ClientGrpc;
  private userService!: UserServiceGrpc;

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  createUser(data: any) {
    return this.userService.CreateUser(data).toPromise();
  }

  getUser(id: string) {
    return this.userService.GetUser({ id }).toPromise();
  }

  updateUser(data: any) {
    return this.userService.UpdateUser(data).toPromise();
  }
}
