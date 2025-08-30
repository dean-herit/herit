"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Link,
} from "@heroui/react";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { NavbarUserMenu } from "@/components/navbar-user-menu";
import { useAuth } from "@/hooks/useAuth";
import { HeritLogo } from "@/components/HeritLogo";

export const Navbar = () => {
  const { user, isSessionLoading } = useAuth();
  const isOnboardingComplete = user?.onboarding_completed;

  return (
    <HeroUINavbar className="pt-4" maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full justify-start items-center">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center" href="/">
            <div className="mt-4">
              <HeritLogo size={144} />
            </div>
          </NextLink>
        </NavbarBrand>
        {isOnboardingComplete && (
          <ul className="hidden lg:flex gap-4 justify-start ml-2 mt-4">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    "text-foreground hover:text-primary transition-colors",
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        )}
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full mt-4"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <NavbarUserMenu />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {isOnboardingComplete &&
            siteConfig.navMenuItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  as={NextLink}
                  color={
                    index === 2
                      ? "primary"
                      : index === siteConfig.navMenuItems.length - 1
                        ? "danger"
                        : "foreground"
                  }
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
