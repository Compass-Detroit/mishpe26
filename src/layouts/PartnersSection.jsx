import PropTypes from 'prop-types'
import { FaEnvelope } from 'react-icons/fa6'
import CTAButton from '@/components/ui/CTAButton'
import SectionSkipLink from '@/components/ui/SectionSkipLink'
import { SPONSOR_TIERS, groupSponsorsByTier } from '@/data/sponsorTiers'

const DESC_MAX_LENGTH = 100

function truncateDescription(text, maxLength = DESC_MAX_LENGTH) {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

/**
 * Sponsors are ranked into tiers (see src/data/sponsorTiers.js); community
 * groups render as one flat grid, four to a row. Card scale follows the tier
 * shape: `card` for the wide paid rows, `square` for the smaller in-kind ones.
 */
const SPONSOR_CARD = {
  height: 'h-64 sm:h-72',
  logo: 'max-h-48 max-w-[80%]',
}

const SPONSOR_SQUARE_CARD = {
  height: 'h-48 sm:h-56',
  logo: 'max-h-32 max-w-[70%]',
}

const COMMUNITY_CARD = {
  height: 'h-48 sm:h-56',
  logo: 'max-h-36 max-w-[85%]',
}

const CARD_SIZE_BY_SHAPE = {
  card: SPONSOR_CARD,
  square: SPONSOR_SQUARE_CARD,
}

/**
 * Tailwind scans source for whole class strings, so the per-tier column counts
 * are spelled out rather than built from `slots`.
 */
const TIER_GRID_CLASS = {
  diamond: 'grid-cols-1 mx-auto max-w-xl',
  platinum: 'grid-cols-1 sm:grid-cols-2 mx-auto max-w-4xl',
  gold: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  media: 'grid-cols-2 lg:grid-cols-4',
  fuel: 'grid-cols-2 lg:grid-cols-4',
}

/**
 * Sanity's `url` type only validates in the Studio, so an API or import write can
 * persist a javascript:/data: value. Anchors get an http(s) URL or nothing.
 */
function safeExternalUrl(url) {
  if (typeof url !== 'string' || !url) return ''
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? url : ''
  } catch {
    return ''
  }
}

const CARD_CLASS =
  'group block w-full rounded-[2rem] border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-iwd-black-950'

const PartnerCard = ({ partner, cardSize }) => {
  const url = safeExternalUrl(partner.url)
  // Only promise a description when the card back actually has one.
  const descHint = partner.desc ? ' (hover or focus for description)' : ''

  const cardInner = (
    <div
      className={`relative w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)] ${cardSize.height}`}
    >
      {/* ── Front: Large logo ── */}
      <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] border border-stone-300/70 bg-gradient-to-br from-stone-300/90 via-stone-100 to-gray-300/80 p-10 shadow-sm shadow-black/20 [backface-visibility:hidden] light:border-stone-300 light:from-stone-200 light:via-stone-100 light:to-stone-300/90">
        {partner.logo ? (
          <img
            src={partner.logo}
            alt={partner.logoAlt ?? ''}
            className={`logo-halo object-contain transition-transform duration-700 group-hover:scale-110 ${cardSize.logo}`}
            loading="lazy"
          />
        ) : (
          <p className="text-center text-3xl font-bold tracking-tight text-gray-900">
            {partner.name}
          </p>
        )}
      </div>
      {/* ── Back: Org info ── */}
      <div className="from-iwd-dark-900 to-iwd-dark-950 absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-iwd-gold-400/20 bg-gradient-to-br p-6 backdrop-blur-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <h4 className="mb-4 text-2xl font-black tracking-tight text-white">
          {partner.name}
        </h4>
        {partner.desc && (
          <p
            className="line-clamp-4 text-center text-base leading-relaxed text-gray-900 dark:text-white/70"
            title={
              partner.desc.length > DESC_MAX_LENGTH ? partner.desc : undefined
            }
          >
            {truncateDescription(partner.desc)}
          </p>
        )}
        {url && (
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-iwd-gold-400">
            Visit Site
            <svg
              className="size-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
          </span>
        )}
      </div>
    </div>
  )

  const cardStyle = { perspective: '1000px' }

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={CARD_CLASS}
      style={cardStyle}
      aria-label={`${partner.name} — visit website${descHint}`}
    >
      {cardInner}
    </a>
  ) : (
    <button
      type="button"
      className={`${CARD_CLASS} cursor-default`}
      style={cardStyle}
      aria-label={`${partner.name}${descHint}`}
    >
      {cardInner}
    </button>
  )
}

PartnerCard.propTypes = {
  partner: PropTypes.shape({
    name: PropTypes.string.isRequired,
    logo: PropTypes.string,
    logoAlt: PropTypes.string,
    desc: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  cardSize: PropTypes.shape({
    height: PropTypes.string.isRequired,
    logo: PropTypes.string.isRequired,
  }).isRequired,
}

/**
 * An unsold slot. Purely an inventory signal, so it is hidden from assistive
 * tech — SponsorTierRow states the filled/open count once per row instead of
 * making a screen reader walk a line of identical "empty slot" boxes.
 */
const EmptySlot = ({ cardSize }) => (
  <div
    className={`flex w-full items-center justify-center rounded-[2rem] border-2 border-dashed border-white/15 bg-white/[0.02] ${cardSize.height}`}
    aria-hidden="true"
  >
    <span className="text-4xl font-light leading-none text-white/25">+</span>
  </div>
)

EmptySlot.propTypes = {
  cardSize: PropTypes.shape({
    height: PropTypes.string.isRequired,
  }).isRequired,
}

/** One tier: heading, then its logos followed by any open slots. */
const SponsorTierRow = ({ tier, sponsors }) => {
  const cardSize = CARD_SIZE_BY_SHAPE[tier.shape] ?? SPONSOR_CARD
  const openSlots = Math.max(0, tier.slots - sponsors.length)

  return (
    <div className="mb-14 last:mb-0">
      <div className="mb-6 text-center">
        <h4 className="font-heading text-lg font-bold uppercase tracking-[0.2em] text-iwd-gold-400 sm:text-xl">
          {tier.title}
        </h4>
        <p className="mx-auto mt-2 max-w-xl text-balance font-body text-lg leading-relaxed text-gray-400">
          {tier.blurb}
        </p>
        <p className="sr-only">
          {`${tier.title} tier: ${sponsors.length} of ${tier.slots} ${
            tier.slots === 1 ? 'slot' : 'slots'
          } filled, ${openSlots} still open.`}
        </p>
      </div>
      <div className={`grid gap-6 sm:gap-8 ${TIER_GRID_CLASS[tier.key] ?? ''}`}>
        {sponsors.map((sponsor) => (
          <PartnerCard
            key={sponsor.id ?? sponsor.name}
            partner={sponsor}
            cardSize={cardSize}
          />
        ))}
        {Array.from({ length: openSlots }, (_, index) => (
          <EmptySlot key={`${tier.key}-open-${index}`} cardSize={cardSize} />
        ))}
      </div>
    </div>
  )
}

SponsorTierRow.propTypes = {
  tier: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    slots: PropTypes.number.isRequired,
    shape: PropTypes.string.isRequired,
    blurb: PropTypes.string.isRequired,
  }).isRequired,
  sponsors: PropTypes.array.isRequired,
}

const AreaHeading = ({ eyebrow, title, blurb }) => (
  <div className="mb-10 text-center">
    <p className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-iwd-gold-400 sm:text-xs">
      {eyebrow}
    </p>
    <h3 className="font-heading text-2xl font-bold text-white sm:text-3xl">
      {title}
    </h3>
    <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-iwd-gold-400/50 to-transparent sm:w-24" />
    <p className="mx-auto mt-4 max-w-2xl text-balance font-body text-base leading-relaxed text-gray-400">
      {blurb}
    </p>
  </div>
)

AreaHeading.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  blurb: PropTypes.string.isRequired,
}

const PartnersSection = ({ partnersData = {}, year }) => {
  const isCurrentYear = year === new Date().getFullYear()

  const sponsors = [
    ...(partnersData.sponsors || []),
    // Legacy shapes: these used to be separate top-level lists folded into the
    // community grid. Now that the ladder exists they are real sponsor tiers,
    // so stamp the tier the key already implied.
    ...(partnersData.diamond || []).map((p) => ({ ...p, tier: 'diamond' })),
    ...(partnersData.platinum || []).map((p) => ({ ...p, tier: 'platinum' })),
    ...(partnersData.gold || []).map((p) => ({ ...p, tier: 'gold' })),
  ].filter(Boolean)

  const community = [
    ...(partnersData.community || []),
    // Legacy untiered lists still read as community groups.
    ...(partnersData.organizations || []),
    ...(partnersData.partners || []),
  ].filter(Boolean)

  const sponsorsByTier = groupSponsorsByTier(sponsors)
  const hasPartners = sponsors.length > 0 || community.length > 0

  return (
    <section
      id="partners"
      className="bg-iwd-surface-raised relative flex flex-col justify-center px-8 py-24 sm:px-10 md:px-14 lg:px-16 dark:bg-iwd-black-950"
    >
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 50%, rgb(var(--iwd-accent-900) / 0.06) 0%, transparent 60%)`,
        }}
        aria-hidden="true"
      />
      <SectionSkipLink href="#team">Skip partners section</SectionSkipLink>

      <div className="relative w-full pt-0">
        <p className="mb-4 text-center font-body text-xs font-medium uppercase tracking-[0.3em] text-iwd-gold-400">
          Our Supporters
        </p>
        <h2 className="mb-5 w-full text-center font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          {year ? `${year} ` : ''}
          <span className="bg-gradient-to-r from-iwd-gold-300 via-iwd-gold-400 to-iwd-gold-300 bg-clip-text text-transparent">
            Partners
          </span>
        </h2>
        <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-iwd-gold-400/50 to-transparent sm:w-32" />
      </div>

      <div className="mx-auto mt-2 max-w-4xl text-center">
        <p className="text-balance font-body text-lg leading-relaxed text-gray-400">
          Compass Detroit wouldn&apos;t be possible without the support of our
          amazing partners. Thank you for helping us create an unforgettable
          experience for the tech community.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-7xl overflow-hidden transition-all duration-500 ease-in-out sm:mt-10 md:mt-14 lg:mt-16">
        {hasPartners ? (
          <>
            {/* ── Sponsors: one row per tier, open slots shown as placeholders ── */}
            <div className="mb-20">
              <AreaHeading
                eyebrow="Underwriting the Summit"
                title="Sponsors"
                blurb="Organizations funding the venue, the meals, and the seats that make the day free to attend."
              />
              {SPONSOR_TIERS.map((tier) => (
                <SponsorTierRow
                  key={tier.key}
                  tier={tier}
                  sponsors={sponsorsByTier[tier.key]}
                />
              ))}
            </div>

            {/* ── Community groups: even grid, four to a row ── */}
            {community.length > 0 && (
              <div>
                <AreaHeading
                  eyebrow="Volunteering Their Efforts"
                  title="Community Groups"
                  blurb="The collectives and chapters who bring their people, their programming, and their time to the Summit."
                />
                <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {community.map((group) => (
                    <PartnerCard
                      key={group.id ?? group.name}
                      partner={group}
                      cardSize={COMMUNITY_CARD}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CTA stays the same */}
            <div className="my-8 mt-16 flex flex-col items-center justify-center space-y-6 text-center text-lg leading-relaxed">
              <p className="text-gray-400">
                We are currently looking for partners for this event.
              </p>
              {year && isCurrentYear && (
                <CTAButton
                  href="mailto:whatupdoe@compass-detroit.com"
                  label="Become a Partner"
                  ariaLabel="Join us as a partner"
                  className="text-xl font-semibold text-white"
                  variant="secondary"
                  icon={<FaEnvelope />}
                  iconPosition="left"
                />
              )}
            </div>
          </>
        ) : (
          <div className="my-8 flex flex-col items-center justify-center space-y-6 text-center text-lg leading-relaxed">
            <p className="text-gray-400">
              {year && !isCurrentYear
                ? `No partner information available for ${year}.`
                : 'We are currently looking for partners for this event.'}
            </p>
            {year && isCurrentYear && (
              <CTAButton
                href="mailto:sponsors@compassdetroit.org"
                label="Become a Partner"
                target="_self"
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

const partnerListShape = PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string.isRequired,
    logo: PropTypes.string,
    logoAlt: PropTypes.string,
    desc: PropTypes.string,
    url: PropTypes.string,
    tier: PropTypes.string,
  })
)

PartnersSection.propTypes = {
  partnersData: PropTypes.shape({
    sponsors: partnerListShape,
    community: partnerListShape,
    // legacy tier lists, folded into the matching sponsor tier
    diamond: partnerListShape,
    platinum: partnerListShape,
    gold: partnerListShape,
    // legacy untiered lists, folded into the community grid
    organizations: partnerListShape,
    partners: partnerListShape,
  }),
  year: PropTypes.number.isRequired,
}

export default PartnersSection
