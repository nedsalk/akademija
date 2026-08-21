import { describe, expect, it } from "vitest";
import {
  parseUserRole,
  prepareRegistrationDetails,
  updateUserProfile,
} from "../../src/domain/users";

describe("student registration", () => {
  it("accepts complete registration details and trims stored values", () => {
    expect(
      prepareRegistrationDetails({
        email: " student@example.com ",
        password: " secret ",
        name: " Jane Doe ",
        phone: " +38762123456 ",
      }),
    ).toEqual({
      ok: true,
      value: {
        email: "student@example.com",
        password: "secret",
        name: "Jane Doe",
        phone: "+38762123456",
      },
    });
  });

  it("returns field errors when required registration details are missing", () => {
    expect(
      prepareRegistrationDetails({
        email: "",
        password: "",
        name: "",
        phone: "",
      }),
    ).toEqual({
      ok: false,
      error: {
        email: "Email is required",
        password: "Password is required",
        name: "Full name is required",
        phone: "Phone number is required",
      },
    });
  });
});

describe("user profile updates", () => {
  it("accepts a complete profile update", () => {
    const now = new Date("2026-05-10T00:00:00.000Z");

    expect(
      updateUserProfile(
        {
          name: " Jane Doe ",
          phone: " +38762123456 ",
        },
        now,
      ),
    ).toEqual({
      ok: true,
      value: {
        name: "Jane Doe",
        phone: "+38762123456",
        updatedAt: now,
      },
    });
  });

  it("requires a full name and phone number when saving a profile", () => {
    expect(
      updateUserProfile(
        {
          name: " ",
          phone: " ",
        },
        new Date(),
      ),
    ).toEqual({
      ok: false,
      error: {
        name: "Full name is required",
        phone: "Phone number is required",
      },
    });
  });
});

describe("user roles", () => {
  it("accepts known roles and rejects unknown ones", () => {
    expect(parseUserRole("teacher")).toEqual({
      ok: true,
      value: "teacher",
    });

    expect(parseUserRole("moderator")).toEqual({
      ok: false,
      error: "Invalid role",
    });
  });
});
