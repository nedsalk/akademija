/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { AuthDriver, RegistrationData } from "../drivers/interface";
import type { Expect, User, UserRole, Visitor } from "./types";

export interface AuthDSL {
  given: {
    "a visitor": () => Promise<Visitor>;
    "a registered user": (args?: { role?: UserRole }) => Promise<User>;
    "a logged-out registered user": () => Promise<User>;
    "a logged-in user": () => Promise<User>;
    "multiple registered users": (count?: number) => Promise<User[]>;
  };
  when: {
    "visitor registers": () => Promise<User>;
    "attempting to register with used email": (visitor: Visitor) => Promise<void>;
    "registering with invalid info": (
      data: Partial<RegistrationData>,
      visitor: Visitor,
    ) => Promise<void>;
    "they login with their credentials": (user: User) => Promise<void>;
    "they attempt to login with wrong password": (
      user: User,
      wrongPassword: string,
    ) => Promise<void>;
    "they attempt login with non-existent email": (
      visitor: Visitor,
      email: string,
    ) => Promise<void>;
    "they logout": (user: User) => Promise<void>;
  };
  then: {
    "they are logged in": (user: User) => Promise<void>;
    "registration fails with error": (expectedError: string, visitor: Visitor) => Promise<void>;
    "they are not logged in": (user: User) => Promise<void>;
    "they see login error": (expectedError: string, visitor: Visitor) => Promise<void>;
    "they are on login view": (visitor: Visitor) => Promise<void>;
    "they are assigned role": (user: User, expectedRole: string) => Promise<void>;
    "the registration form preserves values": (
      data: Partial<RegistrationData>,
      visitor: Visitor,
    ) => Promise<void>;
  };
}

export function createAuthDSL(driver: AuthDriver, expect: Expect): AuthDSL {
  return {
    given: {
      "a visitor": async (): Promise<Visitor> => {
        return driver.createVisitor();
      },

      "a registered user": async (args): Promise<User> => {
        const user = await driver.acquireRegisteredUser(args);

        return user;
      },

      "a logged-out registered user": async (): Promise<User> => {
        return driver.acquireRegisteredUser({ authenticated: false });
      },

      "a logged-in user": async (): Promise<User> => {
        return driver.acquireRegisteredUser();
      },
      "multiple registered users": async (count = 3): Promise<User[]> => {
        const users = await Promise.all(
          Array.from({ length: count }, () => driver.acquireRegisteredUser()),
        );

        return users;
      },
    },

    when: {
      "visitor registers": async () => {
        const user = await driver.register();

        return user;
      },

      "attempting to register with used email": async (visitor: Visitor) => {
        const newUser = await driver.acquireRegisteredUser({
          authenticated: false,
        });

        const data: RegistrationData = {
          email: newUser.email,
          password: "ValidPass123!",
          name: "Test User",
          phone: "+38761123456",
        };

        await driver.failRegistration(data, visitor);
      },

      "registering with invalid info": async (
        data: Partial<RegistrationData>,
        visitor: Visitor,
      ) => {
        // Create base valid data
        const baseData: RegistrationData = {
          email: "test@example.com",
          password: "ValidPass123!",
          name: "Test User",
          phone: "+38761123456",
          ...data,
        };

        // Attempt registration with the missing field
        await driver.failRegistration(baseData, visitor);
      },

      "they login with their credentials": async (user: User) => {
        // Logout first to ensure clean state
        await driver.logout(user);

        // Login with the user's credentials
        await driver.login(user);
      },

      "they attempt to login with wrong password": async (user: User, wrongPassword: string) => {
        const userWithWrongPassword: User = {
          ...user,
          password: wrongPassword,
        };

        // Attempt login with the wrong password
        await driver.login(userWithWrongPassword);
      },

      "they attempt login with non-existent email": async (visitor: Visitor, email: string) => {
        // Create a temporary user object for non-existent user
        const nonExistentUser: User = {
          ...visitor,
          id: "",
          name: "",
          email,
          phone: "",
          password: "anyPassword123!",
        };
        // Attempt login with non-existent email
        await driver.login(nonExistentUser);
      },

      "they logout": async (user: User) => {
        // Logout the current user
        await driver.logout(user);
      },
    },

    then: {
      "registration fails with error": async (expectedError: string, visitor: Visitor) => {
        // Check the page for the error message
        const error = await driver.getRegistrationError(visitor);
        expect(error).toContain(expectedError);
      },

      "they are logged in": async (user: User) => {
        // Verify user is authenticated (has valid session cookies)
        const authenticated = await driver.isAuthenticated(user);
        expect(authenticated).toBe(true);
      },

      "they are not logged in": async (user: User) => {
        const authenticated = await driver.isAuthenticated(user);
        expect(authenticated).toBe(false);
      },

      "they see login error": async (expectedError: string, visitor: Visitor) => {
        // Check the page for the login error message
        const error = await driver.getLoginError(visitor);
        expect(error).toContain(expectedError);
      },

      "they are on login view": async (visitor: Visitor) => {
        // Verify the user is on the login page
        const isOnLoginPage = await driver.isOnLoginPage(visitor);
        expect(isOnLoginPage).toBe(true);
      },

      "they are assigned role": async (user: User, expectedRole: string) => {
        // Get the user's role from the driver
        const role = await driver.getUserRole(user);
        expect(role).toBe(expectedRole);
      },
      "the registration form preserves values": async (
        data: Partial<RegistrationData>,
        visitor: Visitor,
      ): Promise<void> => {
        const registrationData = await driver.getRegistrationFormValues(visitor);
        if (data.name !== undefined) {
          expect(registrationData.name).toBe(data.name);
        }
        if (data.email !== undefined) {
          expect(registrationData.email).toBe(data.email);
        }
        if (data.phone !== undefined) {
          expect(registrationData.phone).toBe(data.phone);
        }
      },
    },
  };
}
