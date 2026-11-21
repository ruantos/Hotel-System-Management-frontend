// Contratos transcritos do README. Reconciliar com a API na etapa 2.

export type UserRole = 'CLIENT' | 'RECEPTIONIST';
export type ForgotPasswordRequest = { email: string };
export type ForgotPasswordResponse = { message: string };
export type ResetPasswordRequest = { token: string; newPassword: string };
export type ReservationStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';
export type LocalDate = string;     // YYYY-MM-DD
export type LocalDateTime = string; // ISO sem offset/fuso

export type CustomerProfileResponse = {
  id: number;
  phone: string | null;
  document: string | null;
};
export type UserResponse = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  customerProfile: CustomerProfileResponse | null;
};
export type CsrfResponse = { headerName: string; token: string };
export type RegisterCustomerRequest = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  document?: string | null;
};
export type RegisterReceptionistRequest = {
  name: string; email: string; password: string;
};
export type UpdateAccountRequest = {
  name: string; email: string;
  phone?: string | null; document?: string | null;
};
export type ChangePasswordRequest = {
  currentPassword: string; newPassword: string;
};

export type RoomTypeResponse = { id: number; name: string; description: string | null };
export type AmenityResponse = { id: number; name: string; description: string | null };
export type RoomTypeRequest = { name: string; description?: string | null };
export type AmenityRequest = { name: string; description?: string | null };
export type RoomRequest = {
  name?: string | null;
  number: number;
  typeId: number;
  description?: string | null;
  capacity: number;
  pricePerNight: number;
  active: boolean;
  amenityIds?: number[] | null;
};
export type RoomResponse = {
  id: number;
  name: string | null;
  number: number;
  type: RoomTypeResponse;
  description: string | null;
  capacity: number;
  pricePerNight: number;
  active: boolean;
  createdAt: LocalDateTime;
  amenities: AmenityResponse[];
};
export type CreateReservationRequest = {
  roomId: number;
  checkInDate: LocalDate;
  checkOutDate: LocalDate;
  guestCount: number;
};
export type RescheduleReservationRequest = {
  checkInDate: LocalDate; checkOutDate: LocalDate;
};
export type ReservationResponse = {
  id: number;
  customerProfileId: number;
  roomId: number;
  checkInDate: LocalDate;
  checkOutDate: LocalDate;
  guestCount: number;
  status: ReservationStatus;
  createdAt: LocalDateTime;
};
export type RoomAvailabilityResponse = {
  roomId: number;
  checkInDate: LocalDate;
  checkOutDate: LocalDate;
  available: boolean;
};
export type ApiProblem = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string>;
};
