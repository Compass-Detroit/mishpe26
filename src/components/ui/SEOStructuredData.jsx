import { memo } from 'react'
import PropTypes from 'prop-types'
import { conferenceActivities } from '@/data/2026/conferenceActivities'

/**
 * SEOStructuredData injects JSON-LD into the page for AI agents and search engines.
 * It provides structured details about the Event, Speakers, and Organizer.
 */
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function latestKnownActivityEnd(activities) {
  const ends = activities
    .map((activity) => activity.timeEnd)
    .filter((time) => typeof time === 'string' && CLOCK_TIME.test(time))
    .sort()
  return ends[ends.length - 1] ?? '17:00'
}

const SEOStructuredData = memo(({ speakersData = [] }) => {
  const endTime = latestKnownActivityEnd(conferenceActivities)
  const eventData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': 'Latin Heritage Month Innovation Summit 2026',
    'description':
      'Celebrating innovation, empowerment, and community at the Latin Heritage Month Innovation Summit 2026 in Detroit.',
    'image': 'https://hhmsummit.com/social-card.jpg',
    'startDate': '2026-09-19T08:00:00-04:00',
    'endDate': `2026-09-19T${endTime}:00-04:00`,
    'eventStatus': 'https://schema.org/EventScheduled',
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
    'location': {
      '@type': 'Place',
      'name': 'WSU James and Patricia Anderson College of Engineering Building',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '5050 Anthony Wayne Drive',
        'addressLocality': 'Detroit',
        'addressRegion': 'MI',
        'postalCode': '48202',
        'addressCountry': 'US',
      },
    },
    'organizer': {
      '@type': 'Organization',
      'name': 'Compass Detroit / GDG Detroit',
      'url': 'https://hhmsummit.com/',
    },
    'performer': speakersData.map((speaker) => ({
      '@type': 'Person',
      'name': speaker.name,
      'jobTitle': speaker.position,
      'affiliation': {
        '@type': 'Organization',
        'name': speaker.organization,
      },
      'image': speaker.avatar,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventData) }}
    />
  )
})

SEOStructuredData.displayName = 'SEOStructuredData'
SEOStructuredData.propTypes = {
  speakersData: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      position: PropTypes.string,
      organization: PropTypes.string,
      avatar: PropTypes.string,
    })
  ),
}

export default SEOStructuredData
