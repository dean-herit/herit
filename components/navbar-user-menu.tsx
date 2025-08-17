"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { useAuth } from "@/hooks/useAuth";

export const NavbarUserMenu = () => {
  const { user, isAuthenticated, logout } = useAuth();

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
        <button className="mt-1 transition-transform">
          {user.profilePhotoUrl ? (
            <Avatar className="h-8 w-8" size="sm" src={user.profilePhotoUrl} />
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
        <DropdownItem key="logout" color="danger" onPress={handleLogout}>
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
