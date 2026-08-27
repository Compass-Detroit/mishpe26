import PropTypes from 'prop-types'
import { FaEnvelope } from 'react-icons/fa6'
import CTAButton from '@/components/ui/CTAButton'
import SectionSkipLink from '@/components/ui/SectionSkipLink'

const DESC_MAX_LENGTH = 100

function truncateDescription(text, maxLength = DESC_MAX_LENGTH) {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

/**
 * Both areas render an even grid — sponsors three to a row on larger cards,
 * community groups four to a row on smaller ones. Position no longer confers
 * prominence, so the only difference between the two is card scale.
 */
const SPONSOR_RANK = {
  height: 'h-64 sm:h-72',
  logo: 'max-h-48 max-w-[80%]',
}

const COMMUNITY_RANK = {
  height: 'h-48 sm:h-56',
  logo: 'max-h-36 max-w-[85%]',
}

const CARD_CLASS =
  'group block w-full rounded-[2rem] border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-iwd-black-950'

const PartnerCard = ({ partner, rank }) => {
  const cardInner = (
    <div
      className={`relative w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)] ${rank.height}`}
    >
      {/* ── Front: Large logo ── */}
      <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] border border-stone-300/70 bg-gradient-to-br from-stone-300/90 via-stone-100 to-gray-300/80 p-10 shadow-sm shadow-black/20 [backface-visibility:hidden] light:border-stone-300 light:from-stone-200 light:via-stone-100 light:to-stone-300/90">
        {partner.logo ? (
          <img
            src={partner.logo}
            alt=""
            className={`logo-halo object-contain transition-transform duration-700 group-hover:scale-110 ${rank.logo}`}
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
            className="line-clamp-4 text-center text-base leading-relaxed text-white/70"
            title={
              partner.desc.length > DESC_MAX_LENGTH ? partner.desc : undefined
            }
          >
            {truncateDescription(partner.desc)}
          </p>
        )}
        {partner.url && (
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
  // Only promise a description when the card back actually has one.
  const descHint = partner.desc ? ' (hover or focus for description)' : ''

  return partner.url ? (
    <a
      href={partner.url}
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
    desc: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  rank: PropTypes.shape({
    height: PropTypes.string.isRequired,
    logo: PropTypes.string.isRequired,
  }).isRequired,
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

  const sponsors = (partnersData.sponsors || []).filter(Boolean)
  const community = [
    ...(partnersData.community || []),
    // Legacy shapes: flat/tiered lists all read as community groups.
    ...(partnersData.partners || []),
    ...(partnersData.organizations || []),
  ].filter(Boolean)

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
            {/* ── Sponsors: even grid, three to a row ── */}
            {sponsors.length > 0 && (
              <div className="mb-20">
                <AreaHeading
                  eyebrow="Underwriting the Summit"
                  title="Sponsors"
                  blurb="Organizations funding the venue, the meals, and the seats that make the day free to attend."
                />
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
                  {sponsors.map((sponsor) => (
                    <PartnerCard
                      key={sponsor.id ?? sponsor.name}
                      partner={sponsor}
                      rank={SPONSOR_RANK}
                    />
                  ))}
                </div>
              </div>
            )}

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
                      rank={COMMUNITY_RANK}
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
    desc: PropTypes.string,
    url: PropTypes.string,
  })
)

PartnersSection.propTypes = {
  partnersData: PropTypes.shape({
    sponsors: partnerListShape,
    community: partnerListShape,
    // legacy shapes, folded into the community grid
    partners: partnerListShape,
    organizations: partnerListShape,
  }),
  year: PropTypes.number.isRequired,
}

export default PartnersSection
