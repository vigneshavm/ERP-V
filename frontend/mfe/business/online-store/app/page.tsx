"use client";
import Storefront from "../src/ui/Storefront";
import { ReduxProviders } from "../src/redux/Providers";

export default function Page() {
  return (
    <ReduxProviders>
      <Storefront />
    </ReduxProviders>
  );
}
