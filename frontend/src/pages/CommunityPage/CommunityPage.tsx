/**
 * CommunityPage — landing page composed of focused section components.
 *
 * AUD-W-403: extracted hero / activity feed / testimonials / guidelines /
 * FAQ / CTA into `./sections/*` to keep this orchestrator readable.
 */
import type { ReactElement } from "react";

import { SEOHead } from "@components";
import { useAuth } from "@features/auth";
import { useCommunityStats, useNearbyCount } from "@features/discovery";
import { useUserCity } from "@hooks";
import { PATHS, routeMetadata } from "@routes/config/paths";

import { CommunityActivityFeed } from "./sections/CommunityActivityFeed";
import { CommunityCta } from "./sections/CommunityCta";
import { CommunityFaq } from "./sections/CommunityFaq";
import { CommunityGuidelines } from "./sections/CommunityGuidelines";
import { CommunityHero } from "./sections/CommunityHero";
import { CommunityTestimonials } from "./sections/CommunityTestimonials";

const DEFAULT_RADIUS = 10_000;

export default function CommunityPage(): ReactElement {
  const { isAuthenticated } = useAuth();
  const { city, lat, lng } = useUserCity();
  const { data: nearbyData } = useNearbyCount(lat, lng, DEFAULT_RADIUS);
  const { data: communityData } = useCommunityStats(lat, lng, DEFAULT_RADIUS);

  return (
    <div className="min-h-screen bg-[#152018] text-[#8C9C92]">
      <SEOHead
        title={routeMetadata[PATHS.COMMUNITY].title}
        description={routeMetadata[PATHS.COMMUNITY].description}
        path={PATHS.COMMUNITY}
      />

      <CommunityHero
        city={city}
        bookCount={nearbyData?.count}
        userCount={nearbyData?.user_count}
        swapsThisWeek={communityData?.swaps_this_week}
      />

      <CommunityActivityFeed items={communityData?.activity_feed ?? []} />

      <CommunityTestimonials />

      <CommunityGuidelines />

      <CommunityFaq />

      <CommunityCta isAuthenticated={isAuthenticated} />
    </div>
  );
}
