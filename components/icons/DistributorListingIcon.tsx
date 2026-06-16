"use client";

import { ListingRequest } from "@/components/customeIcons/icons";

/**
 * OEM “Listing Request” sidebar icon. The canonical implementation is
 * {@link ListingRequest} in `customeIcons/icons`.
 *
 * This file exists so any stale import path (`components/icons/DistributorListingIcon`)
 * or Docker/Webpack cache that still references it cannot fail the build.
 */
export const DistributorListingIcon = ListingRequest;
export default ListingRequest;
