/**
 * Partners for the public site, split into the two areas the section renders:
 * sponsors (ranked into tiers) and the community groups that volunteer their
 * efforts (four to a row, below).
 *
 * Every partner lives in one list and declares its own `area`. To move an
 * organization between the two areas, change that one word — order within the
 * list is the order it renders in.
 *
 * Sponsors additionally declare a `tier` from src/data/sponsorTiers.js, which
 * decides the row. Community groups are not tiered.
 *
 * Sanity is the eventual source — see scripts/fetch-event-data.mjs, which
 * writes partners.generated.json before each build. Until partner documents are
 * published for the event, the list below is what ships. In Sanity the same
 * move is the "Partner group" radio on the partner document.
 */
import partnersGenerated from './partners.generated.json'

import DevsCreate313 from '@/assets/images/sponsors/DevsCreate.webp'
import CompassDetroit from '@/assets/images/sponsors/Compass_Detroit_logo.webp'
import DTE from '@/assets/images/sponsors/spo-dte-logo.webp'
import GDGDetroit from '@/assets/images/sponsors/org-gdg-detroit.webp'
import GDGToledo from '@/assets/images/sponsors/org-gdg-toledo.webp'
import GDGWindsor from '@/assets/images/sponsors/org-gdg-windsor.webp'
import NSBEDetroit from '@/assets/images/organizations/org-nsbe-logo.webp'
import SHPEDetroit from '@/assets/images/organizations/org-shpe-logo.webp'
import Techqueria from '@/assets/images/sponsors/techqueria.jpg'
import Jac3D from '@/assets/images/sponsors/jac3d.png'
import LitteCaesars from '@/assets/images/sponsors/little-caesars.webp'
import WomenTechmakers from '@/assets/images/sponsors/Women_Techmakers.webp'
import IBM from '@/assets/images/sponsors/IBM_logo.webp'

const SPONSOR = 'sponsor'
const COMMUNITY = 'community'

const staticPartners = [
  {
    id: 1,
    area: SPONSOR,
    tier: 'platinum',
    name: 'IBM',
    logo: IBM,
    logoAlt: 'IBM logo',
    desc: 'IBM is a global technology company that provides hardware, software, and services to businesses and organizations.',
    url: 'https://www.ibm.com/us-en',
  },
  {
    id: 2,
    area: SPONSOR,
    tier: 'gold',
    name: 'DTE',
    logo: DTE,
    logoAlt: 'DTE logo',
    desc: 'DTE Energy (NYSE: DTE) is a Detroit-based diversified energy company involved in the development and management of energy-related businesses and services nationwide. Its operating units include an electric company serving 2.3 million customers in Southeast Michigan and a natural gas company serving 1.3 million customers in Michigan. The DTE portfolio also includes non-utility businesses focused on industrial energy services, renewable natural gas, and energy marketing and trading.',
    url: 'https://www.dteenergy.com/',
  },
  {
    id: 3,
    area: SPONSOR,
    tier: 'gold',
    name: 'Little Caesars',
    logo: LitteCaesars,
    logoAlt: 'Little Caesars logo',
    desc: 'Little Caesars, headquartered in Detroit, Michigan, was founded by Mike and Marian Ilitch in 1959 and is now the third largest pizza chain in the world with stores in all 50 U.S. states and 27 countries and territories.',
    url: 'https://littlecaesars.com/en-us/',
  },
  {
    id: 4,
    area: COMMUNITY,
    name: 'Compass Detroit',
    logo: CompassDetroit,
    logoAlt: 'Compass Detroit logo',
    desc: 'The Collective of Minority Professionals and STEAM Societies (formerly COMPES) was formed in 2000 as an initiative between the NSBE, SHPE, and SWE Detroit professional chapters. The mission of this collaborative partnership is to support the local Detroit community in upskilling, career growth, networking, and to provide access to new opportunities.',
    url: 'https://compass-detroit.com/',
  },
  {
    id: 5,
    area: COMMUNITY,
    name: 'DevsCreate313',
    logo: DevsCreate313,
    logoAlt: 'DevsCreate313 logo',
    desc: 'DevsCreate313 is a nonprofit organization dedicated to creating a collaborative tech ecosystem in the Detroit area. We are a community of developers, designers, entrepreneurs, and technologists who are passionate about building the future of technology in Detroit.',
    url: 'https://devscreate313.org/',
  },
  {
    id: 6,
    area: COMMUNITY,
    name: 'NSBE Detroit',
    logo: NSBEDetroit,
    logoAlt: 'NSBE Detroit logo',
    desc: 'Representing Black Engineers in Detroit. NSBE Detroit Professionals strive to increase technical awareness, encourage scholastic achievement, and stimulate enthusiasm in the black engineering community of Detroit. NSBE’s mission is to increase the number of culturally responsible Black engineers who excel academically, succeed professionally and positively impact the community. The NSBE Professionals inspire the next generation of technical professionals, and serve as a catalyst for transformation.',
    url: 'https://nsbedetroitprofessionals.org/',
  },
  {
    id: 7,
    area: COMMUNITY,
    name: 'SHPE Detroit',
    logo: SHPEDetroit,
    logoAlt: 'SHPE Detroit logo',
    desc: 'SHPE Detroit is transforming lives in Detroit by inspiring and motivating young Hispanic students to excel in STEM education through mentorship and community involvement and enhancing career opportunities for Hispanics by building a strong professional network.',
    url: 'https://www.shpedetroit.org/',
  },
  {
    id: 8,
    area: COMMUNITY,
    name: 'Techqueria Detroit',
    logo: Techqueria,
    logoAlt: 'Techqueria Detroit logo',
    desc: 'We’re a vibrant, 25,000-strong community empowering Latiné professionals to thrive in every corner of the tech industry. Techqueria provides mentorship, career development, and advocacy for DEI.',
    url: 'https://techqueria.org',
  },
  {
    id: 9,
    area: COMMUNITY,
    name: 'GDG Detroit',
    logo: GDGDetroit,
    logoAlt: 'GDG Detroit logo',
    desc: 'The Detroit Google Developers Group is an inclusive group that meets monthly online and in downtown Detroit to help educate and provide networking opportunities for software developers in the Detroit area.',
    url: 'https://gdg.community.dev/gdg-detroit/',
  },
  {
    id: 10,
    area: COMMUNITY,
    name: 'GDG Toledo',
    logo: GDGToledo,
    logoAlt: 'GDG Toledo logo',
    desc: 'Google Developer Group Toledo is a community of developers interested in Google technologies.',
    url: 'https://gdg.community.dev/gdg-toledo/',
  },
  {
    id: 11,
    area: COMMUNITY,
    name: 'GDG Windsor',
    logo: GDGWindsor,
    logoAlt: 'GDG Windsor logo',
    desc: 'Google Developer Group Windsor is a community of developers interested in Google technologies.',
    url: 'https://gdg.community.dev/gdg-windsor/',
  },
  {
    id: 12,
    area: COMMUNITY,
    name: 'Women Techmakers',
    logo: WomenTechmakers,
    logoAlt: 'Women Techmakers logo',
    desc: 'Google’s Women Techmakers program provides visibility, community, and resources for women in technology.',
    url: 'https://www.technovation.org/women-techmakers/',
  },
  {
    id: 13,
    area: COMMUNITY,
    name: 'Jac3D G33k',
    logo: Jac3D,
    logoAlt: 'Jac3D G33k logo',
    desc: 'A technology and fitness enthusiast dedicated to digital innovation and community building in the Detroit tech space.',
    url: 'https://www.instagram.com/jac3dg33k',
  },
]

/** Split the single list into the two areas the section renders. */
function inArea(area) {
  return staticPartners.filter((partner) => partner.area === area)
}

/** Sanity wins per area once that area has published documents. */
function preferGenerated(generated, fallback) {
  if (!Array.isArray(generated) || generated.length === 0) return fallback
  return generated
}

export const partnersData = {
  sponsors: preferGenerated(partnersGenerated.sponsors, inArea(SPONSOR)),
  community: preferGenerated(partnersGenerated.community, inArea(COMMUNITY)),
}
