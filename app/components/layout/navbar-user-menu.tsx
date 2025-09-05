"use client";

import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
} from "@heroui/react";
import NextLink from "next/link";

import { useAuth } from "@/app/hooks/useAuth";

export const NavbarUserMenu = () => {
  const { user, isAuthenticated, logout, isSessionLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  // Show loading state during hydration and session loading
  if (!hasMounted || isSessionLoading) {
    return (
      <Button
        disabled
        className="text-sm font-normal text-default-600 bg-default-100"
        variant="flat"
      >
        Loading...
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        as={NextLink}
        className="text-sm font-normal text-default-600 bg-default-100"
        href="/login"
        variant="flat"
      >
        Sign In
      </Button>
    );
  }

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <button className="mt-1 transition-transform" data-testid="button">
          {user.profile_photo_url ? (
            <Avatar
              className="h-8 w-8"
              size="sm"
              src={user.profile_photo_url}
            />
          ) : (
            <Avatar
              showFallback
              className="h-8 w-8"
              name={getUserInitials(user)}
              size="sm"
            />
          )}
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile Actions" variant="flat">
        <DropdownItem key="profile" className="h-14 gap-2">
          <p className="font-semibold">Signed in as</p>
          <p className="font-semibold">{user.email}</p>
        </DropdownItem>
        <DropdownItem key="dashboard" as={NextLink} href="/dashboard">
          Dashboard
        </DropdownItem>
        <DropdownItem key="settings">Settings</DropdownItem>
        <DropdownItem
          key="logout"
          color="danger"
          data-testid="dropdown-item"
          onPress={handleLogout}
        >
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
