import "./globals.css";
import {
  RegisterLink,
  LoginLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import { AuthProvider } from "./AuthProvider";

export const metadata = {
  title: "Herit",
  description: "Manage your Will and Estate with Herit!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <AuthProvider>
      <html lang="en">
        <body>
          <header>
            <nav className="nav container">
              <h1 className="text-display-3">Herit</h1>
              <div>
                {!(await isAuthenticated()) ? (
                  <>
                    <LoginLink className="btn btn-ghost sign-in-btn">
                      Sign in
                    </LoginLink>
                    <RegisterLink className="btn btn-dark">
                      Sign up
                    </RegisterLink>
                  </>
                ) : (
                  <div className="profile-blob">
                    {user?.picture ? (
                      <img
                        className="avatar"
                        src={user?.picture}
                        alt="user profile avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="avatar">
                        {user?.given_name?.[0]}
                        {user?.family_name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-heading-2">
                        {user?.given_name} {user?.family_name}
                      </p>

                      <LogoutLink className="text-subtle">Log out</LogoutLink>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="footer">
            <div className="container">
              <strong className="text-heading-2">KindeAuth</strong>
              <p className="footer-tagline text-body-3">
                Visit our{" "}
                <Link className="link" href="https://kinde.com/docs">
                  help center
                </Link>
              </p>

              <small className="text-subtle">
                © 2025 Herit Software Limited. All rights reserved
              </small>
            </div>
          </footer>
        </body>
      </html>
    </AuthProvider>
  );
}
