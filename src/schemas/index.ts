import { z } from "zod";

export const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["PASSENGER", "DRIVER", "MANAGER"]),
  companyId: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["PASSENGER", "DRIVER", "MANAGER"]),
  companyId: z.string().optional(),
});

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(32, "Username must be at most 32 characters")
      .regex(/^[a-zA-Z0-9._-]+$/, "Username can only use letters, numbers, dots, underscores, and hyphens")
      .optional()
  ),
  email: z.string().email("Invalid email address"),
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(10, "Valid phone number required").max(20, "Phone number is too long").optional()
  ),
  currentPassword: optionalText,
  newPassword: optionalText,
  confirmPassword: optionalText,
  removeImage: z.enum(["true", "false"]).optional(),
}).superRefine((data, ctx) => {
  const wantsPasswordChange = Boolean(data.newPassword || data.confirmPassword || data.currentPassword);
  if (!wantsPasswordChange) return;

  if (!data.currentPassword || data.currentPassword.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    });
  }
  if (!data.newPassword || data.newPassword.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password must be at least 8 characters",
      path: ["newPassword"],
    });
  }
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }
});

export const tripDepartureSchema = z.object({
  scheduleId: z.string().min(1, "Schedule is required"),
  tripDate: z.string().min(1, "Departure date is required"),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const busSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  busType: z.enum(["STANDARD", "DELUXE", "AC", "NON_AC"]),
  capacity: z.coerce.number().min(10).max(60),
  isAC: z.boolean().default(false),
  driverId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "IN_MAINTENANCE", "AVAILABLE", "RUNNING"]).default("AVAILABLE"),
});

export const routeSchema = z.object({
  name: z.string().min(2, "Route name is required"),
  source: z.string().min(2, "Source is required"),
  destination: z.string().min(2, "Destination is required"),
  sourceDistrictId: z.string().optional(),
  destinationDistrictId: z.string().optional(),
  distance: z.coerce.number().min(1, "Distance must be positive"),
  estimatedDuration: z.coerce.number().min(1, "Duration must be positive"),
  isActive: z.coerce.boolean().default(true),
});

export const scheduleSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  busId: z.string().min(1, "Bus is required"),
  driverId: z.string().min(1, "Driver is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  fare: z.coerce.number().min(0, "Fare must be positive"),
  daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
  isActive: z.coerce.boolean().default(true),
});

export const driverSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  licenseNumber: z.string().min(5, "License number is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email"),
  experience: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const passengerSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email"),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const multiBookingSchema = z.object({
  tripId: z.string().min(1, "Trip is required"),
  seatIds: z.array(z.string().min(1)).min(1, "Select at least one seat"),
  paymentMethod: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ", "CARD"]),
  phone: z.string().min(10, "Phone number is required").max(20).optional(),
});

export const bookingSchema = z.object({
  tripId: z.string().min(1, "Trip is required"),
  seatId: z.string().min(1, "Seat is required"),
  paymentMethod: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ", "CARD"]),
  phone: z.string().min(10, "Phone number is required").max(20).optional(),
});

export const maintenanceSchema = z.object({
  busId: z.string().min(1, "Bus is required"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  cost: z.coerce.number().min(0).default(0),
  scheduledAt: z.string().min(1, "Schedule date is required"),
});

export const companyApplicationSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyEmail: z.string().email("Valid company email required"),
  companyPhone: z.string().min(10, "Valid phone required"),
  companyAddress: z.string().min(5, "Address is required"),
  districtId: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  fleetSize: z.coerce.number().min(1).max(500),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  code: z.string().min(2, "Company code is required").max(20),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  districtId: z.string().optional(),
  fleetSize: z.coerce.number().min(0).default(0),
  contactName: z.string().optional(),
  managerEmail: z.string().email().optional().or(z.literal("")),
  managerPassword: z.string().min(8).optional().or(z.literal("")),
});

export const rejectCompanySchema = z.object({
  companyId: z.string().min(1),
  reason: z.string().min(5, "Please provide a rejection reason"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AdminInput = z.infer<typeof adminSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type TripDepartureInput = z.infer<typeof tripDepartureSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type BusInput = z.infer<typeof busSchema>;
export type RouteInput = z.infer<typeof routeSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type DriverInput = z.infer<typeof driverSchema>;
export type PassengerInput = z.infer<typeof passengerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type CompanyApplicationInput = z.infer<typeof companyApplicationSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
