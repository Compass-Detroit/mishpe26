import { useState } from 'react'
import PropTypes from 'prop-types'
import { canExportToCalendar, generateICSFile } from '@/utils/calendarExport'

function MyScheduleExports({ events }) {
  const [exportFailed, setExportFailed] = useState(false)
  const timedEvents = events.filter(
    (event) => event.time && event.time !== 'TBA'
  )
  const exportableEvents = timedEvents.filter(canExportToCalendar)
  const skippedCount = timedEvents.length - exportableEvents.length

  const download = (options) => {
    const wrote = generateICSFile(exportableEvents, options)
    setExportFailed(!wrote)
  }

  if (!exportableEvents.length) {
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        {timedEvents.length
          ? 'Saved items without a known end time cannot be added to a calendar file.'
          : 'Add sessions with scheduled times to export your curated calendar.'}
      </div>
    )
  }

  const buttonClassName =
    'rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10'

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-[140px] text-xs font-semibold uppercase tracking-wider text-gray-300">
          Export My Schedule:
        </span>

        <button
          onClick={() => download()}
          className={buttonClassName}
          type="button"
        >
          iCal (.ics)
        </button>

        <button
          onClick={() =>
            download({
              extension: 'ical',
              filename: 'lhm-innovation-summit-2026-full-schedule.ical',
            })
          }
          className={buttonClassName}
          type="button"
        >
          iCal (.ical)
        </button>
      </div>
      {skippedCount > 0 && (
        <p className="text-xs text-gray-400">
          {skippedCount === 1
            ? '1 saved item has no close time and was left out of the calendar file.'
            : `${skippedCount} saved items have no close time and were left out of the calendar file.`}
        </p>
      )}
      {exportFailed && (
        <p className="text-xs text-amber-200" role="status">
          Calendar export failed. Try again, or remove items without a known end
          time.
        </p>
      )}
    </div>
  )
}

MyScheduleExports.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      time: PropTypes.string,
      timeEnd: PropTypes.string,
      room: PropTypes.string,
      sessionDuration: PropTypes.number,
      location: PropTypes.string,
    })
  ).isRequired,
}

export default MyScheduleExports
