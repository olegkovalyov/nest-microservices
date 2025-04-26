export interface UserInterface {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: string;
}

export interface CreateUserInterface {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  name?: string;
}

export interface UpdateUserInterface {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}
