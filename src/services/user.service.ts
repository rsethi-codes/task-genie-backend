import { UserModel } from "../models/user.model";

class UserService {
  async createUser(data: any): Promise<void> {
    console.log("✅ Inside signup service!");
    console.log("🚀 ~ UserService ~ createUser ~ data:", data);
    // Logic to create a user
    await UserModel.create(data);
  }
}

export const userService = new UserService();
