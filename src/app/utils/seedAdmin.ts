import bcrypt from "bcryptjs";
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";

export const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: Role.ADMIN });

    if (adminExists) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.create({
      name: "Super Admin",
      email: "admin@farinfusion.com",
      password: hashedPassword,
      role: Role.ADMIN,
      phone: "01700000000",
      address: "System Generated",
      isVerified: true,
    });

    console.log("🔥 Default admin created:", admin.email);
  } catch (error) {
    console.error("❌ Failed to seed admin:", error);
  }
};