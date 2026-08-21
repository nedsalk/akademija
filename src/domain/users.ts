import type { Result } from "./result";

export type UserRole = "admin" | "teacher" | "student";

export interface RegistrationInput {
  email?: string | null;
  name?: string | null;
  password?: string | null;
  phone?: string | null;
}

export interface RegistrationErrors {
  email?: string;
  name?: string;
  password?: string;
  phone?: string;
}

export interface RegistrationDetails {
  email: string;
  name: string;
  password: string;
  phone: string;
}

export interface ProfileInput {
  name?: string | null;
  phone?: string | null;
}

export interface ProfileErrors {
  name?: string;
  phone?: string;
}

export interface UserProfileUpdate {
  name: string;
  phone: string;
  updatedAt: Date;
}

function trimText(value?: string | null) {
  return value?.trim() ?? "";
}

function requireText(value: string | null | undefined, error: string): Result<string, string> {
  const text = trimText(value);
  if (!text) {
    return { ok: false, error };
  }

  return { ok: true, value: text };
}

const errorMessages: Record<keyof RegistrationInput, string> = {
  email: "Email is required",
  password: "Password is required",
  name: "Full name is required",
  phone: "Phone number is required",
};

export function prepareRegistrationDetails(
  input: RegistrationInput,
): Result<RegistrationDetails, RegistrationErrors> {
  const email = requireText(input.email, errorMessages.email);
  const password = requireText(input.password, errorMessages.password);
  const name = requireText(input.name, errorMessages.name);
  const phone = requireText(input.phone, errorMessages.phone);
  const errors: RegistrationErrors = {};

  if (!email.ok) {
    errors.email = email.error;
  }

  if (!password.ok) {
    errors.password = password.error;
  }

  if (!name.ok) {
    errors.name = name.error;
  }

  if (!phone.ok) {
    errors.phone = phone.error;
  }

  if (!email.ok || !password.ok || !name.ok || !phone.ok) {
    return {
      ok: false,
      error: errors,
    };
  }

  return {
    ok: true,
    value: {
      email: email.value,
      password: password.value,
      name: name.value,
      phone: phone.value,
    },
  };
}

export function updateUserProfile(
  input: ProfileInput,
  now: Date,
): Result<UserProfileUpdate, ProfileErrors> {
  const name = requireText(input.name, "Full name is required");
  const phone = requireText(input.phone, "Phone number is required");
  const errors: ProfileErrors = {};

  if (!name.ok) {
    errors.name = name.error;
  }

  if (!phone.ok) {
    errors.phone = phone.error;
  }

  if (!name.ok || !phone.ok) {
    return {
      ok: false,
      error: errors,
    };
  }

  return {
    ok: true,
    value: {
      name: name.value,
      phone: phone.value,
      updatedAt: now,
    },
  };
}

export function parseUserRole(role: string): Result<UserRole, "Invalid role"> {
  if (role === "admin" || role === "teacher" || role === "student") {
    return {
      ok: true,
      value: role,
    };
  }

  return {
    ok: false,
    error: "Invalid role",
  };
}
