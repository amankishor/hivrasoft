"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import LoginModal from "./LoginModal";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

type AccountProps = {
  mobile?: boolean;
  onBeforeOpen?: () => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function Account({
  mobile = false,
  onBeforeOpen,
}: AccountProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loginOpen, setLoginOpen] =
    useState(false);

  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const wrapperRef =
    useRef<HTMLDivElement | null>(null);

  /* =========================================================
     LOAD CURRENT USER
  ========================================================= */

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = (await response.json()) as {
        success?: boolean;
        user?: AuthUser;
      };

      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  /* =========================================================
     LOGIN SUCCESS EVENT
  ========================================================= */

  useEffect(() => {
    const handleAuthChanged = (
      event: Event
    ) => {
      const authEvent =
        event as CustomEvent<AuthUser>;

      if (authEvent.detail) {
        setUser(authEvent.detail);
      } else {
        void loadCurrentUser();
      }

      setDropdownOpen(false);
      setAuthLoading(false);
    };

    const handleAuthLogout = () => {
      setUser(null);
      setDropdownOpen(false);
    };

    window.addEventListener(
      "hivrasoft-auth-changed",
      handleAuthChanged
    );

    window.addEventListener(
      "hivrasoft-auth-logout",
      handleAuthLogout
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-auth-changed",
        handleAuthChanged
      );

      window.removeEventListener(
        "hivrasoft-auth-logout",
        handleAuthLogout
      );
    };
  }, []);

  /* =========================================================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [dropdownOpen]);

  /* =========================================================
     ACCOUNT CLICK
  ========================================================= */

  const handleAccountClick = () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      onBeforeOpen?.();

      setDropdownOpen(false);
      setLoginOpen(true);

      return;
    }

    setDropdownOpen(
      (value) => !value
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      const response = await fetch(
        `${API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to logout."
        );
      }

      setUser(null);
      setDropdownOpen(false);

      window.dispatchEvent(
        new Event(
          "hivrasoft-auth-logout"
        )
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  /* =========================================================
     FIRST LETTER
  ========================================================= */

  const userInitial =
    user?.name
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    user?.email
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    "U";

  return (
    <>
      <div
        ref={wrapperRef}
        data-account-menu
        className={`
          relative
          ${mobile ? "flex w-full justify-center" : ""}
        `}
      >
        {/* =====================================================
            ACCOUNT BUTTON
        ===================================================== */}

        <button
          type="button"
          onClick={handleAccountClick}
          disabled={authLoading}
          aria-label={
            user
              ? "Profile"
              : "Login / Account"
          }
          title={
            user
              ? "Profile"
              : "Login / Account"
          }
          className={`
            flex
            shrink-0
            items-center
            justify-center
            transition-all
            duration-300

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#8C1839]
            focus-visible:ring-offset-2

            ${
              mobile
                ? "h-12 w-12 rounded-full"
                : "h-11 w-11 rounded-full"
            }

            ${
              user
                ? `
                  bg-[#8C1839]
                  text-white
                  shadow-sm
                  hover:bg-[#211A18]
                `
                : `
                  text-[#211A18]
                  hover:bg-[#EFE6DC]
                  hover:text-[#8C1839]
                `
            }

            disabled:cursor-default
          `}
        >
          {authLoading ? (
            <span
              className="
                h-4
                w-4
                animate-spin
                rounded-full
                border-2
                border-[#211A18]/20
                border-t-[#8C1839]
              "
            />
          ) : user ? (
            <span
              className="
                text-[14px]
                font-semibold
                uppercase
              "
            >
              {userInitial}
            </span>
          ) : (
            <UserIcon />
          )}
        </button>

        {/* =====================================================
            PROFILE DROPDOWN
        ===================================================== */}

        {user &&
          dropdownOpen && (
            <div
              className={`
                absolute
                top-[calc(100%+12px)]
                z-[999]
                w-[270px]
                overflow-hidden
                rounded-[18px]
                border
                border-[#211A18]/10
                bg-[#F7F3EF]
                shadow-[0_24px_60px_rgba(33,26,24,0.18)]

                ${
                  mobile
                    ? "left-1/2 -translate-x-1/2"
                    : "right-0"
                }
              `}
            >
              {/* USER INFO */}

              <div
                className="
                  px-5
                  py-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#8C1839]
                      text-[14px]
                      font-semibold
                      uppercase
                      text-white
                    "
                  >
                    {userInitial}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        truncate
                        text-[14px]
                        font-semibold
                        text-[#211A18]
                      "
                    >
                      {user.name}
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-[11px]
                        text-[#211A18]/55
                      "
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* SIGN OUT */}

              <div
                className="
                  border-t
                  border-[#211A18]/10
                  p-3
                "
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    rounded-[11px]
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.13em]
                    text-[#8C1839]
                    transition

                    hover:bg-[#8C1839]
                    hover:text-white

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isLoggingOut
                    ? "Signing out..."
                    : "Sign out"}
                </button>
              </div>
            </div>
          )}
      </div>

      {/* =====================================================
          LOGIN / REGISTER MODAL
      ===================================================== */}

      <LoginModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
        }}
      />
    </>
  );
}

/* =========================================================
   USER ICON
========================================================= */

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
    </svg>
  );
}