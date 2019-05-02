import externalConfig from "./config.json";

interface IConfig {
  debug?: boolean;
  hiddenComponents?: { [P in keyof IEventOptionalDisplayProperties]?: boolean; };
  hiddenCalendars?: string[];
  colors?: string[];
}

const config: IConfig = externalConfig;

const defaultColors = [
  "#ef5350",
  "#ec407a",
  "#ab47bc",
  "#7e57c2",
  "#5c6bc0",
  "#42a5f5",
  "#29b6f6",
  "#26c6da",
  "#26a69a",
  "#66bb6a",
  "#9ccc65",
  "#d4e157",
  "#ffee58",
  "#ffca28",
  "#ffa726",
  "#ff7043",
  "#8d6e63"
];

export const command =
  'ical.widget/icalBuddy  --noRelativeDates --dateFormat "date: %a %b %e %Y|" --timeFormat "%H:%M:%S GMT%z" --bullet "event: " eventsToday+6';

export const refreshFrequency = 60_000 * 5; // ms

interface IEventOptionalDisplayProperties {
  location?: string;
  notes?: string;
  attendees?: string;
  calendar: string;
}

interface IEvent extends IEventOptionalDisplayProperties {
  name: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
}

interface IDebuggableEvent extends IEvent {
  rawLines?: string[];
}

const transformICalBuddyOutput = (output: string): IDebuggableEvent[] => {
  return output
    .split("event: ")
    .filter(line => line !== "")
    .map<IEvent>(eventString => {
      const eventLines = eventString.split("\n");
      const nameLine = eventLines[0];

      const locationLine = eventLines.find(line => line.includes("location:"));
      const dateLine = eventLines.find(line => line.includes("date:"))!;

      const dateAndTimeSeparatorIndex = dateLine.indexOf("|");
      const date = dateLine.substring(
        dateLine.indexOf(": ") + 2,
        dateAndTimeSeparatorIndex
      );

      const timeSeparatorIndex = dateLine.lastIndexOf(" - ");

      const startTimeString =
        (timeSeparatorIndex !== -1 &&
          dateLine.substring(
            dateAndTimeSeparatorIndex + 5,
            timeSeparatorIndex
          )) ||
        null;
      const endTimeString =
        (timeSeparatorIndex !== -1 &&
          dateLine.substring(timeSeparatorIndex + 3)) ||
        null;

      const startTime = new Date(
        date + ((startTimeString && " " + startTimeString) || "")
      );
      const endTime = new Date(
        date + ((endTimeString && " " + endTimeString) || "")
      );

      const attendeesLine = eventLines.find(line =>
        line.includes("attendees:")
      );

      const calendarStartIndex = nameLine.lastIndexOf("(");
      const calendarEndIndex = nameLine.lastIndexOf(")");

      return {
        name: nameLine.substring(0, calendarStartIndex - 1),
        location:
          locationLine &&
          locationLine.substring(locationLine.indexOf(": ") + 2),
        startTime,
        endTime,
        allDay:
          startTime.getHours() === 0 &&
          startTime.getMinutes() === 0 &&
          startTime.getTime() === endTime.getTime(),
        attendees:
          (attendeesLine &&
            attendeesLine.substring(attendeesLine.indexOf(": ") + 2)) ||
          undefined,
        calendar: nameLine.substring(calendarStartIndex + 1, calendarEndIndex),
        rawLines: eventLines
      };
    });
};

function groupBy<T, Z>(
  xs: T[],
  getGroupValue: (x: T) => Z,
  valuesAreEqual: (v1: Z, v2: Z) => boolean = (v1, v2) => v1 === v2
) {
  return xs.reduce<Array<{ group: Z; elements: T[] }>>((acc, x) => {
    const value = getGroupValue(x);
    const existingIndex = acc.findIndex(el => valuesAreEqual(el.group, value));

    if (existingIndex !== -1) {
      acc[existingIndex].elements.push(x);
    } else {
      acc.push({ group: value, elements: [x] });
    }

    return acc;
  }, []);
}

function getStringNumber(s: string): number {
  return s.split("").reduce((acc, curr, i) => acc + s.charCodeAt(i), 0);
}

export const render = ({ output }: { output: any }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transformedOutput = transformICalBuddyOutput(output);

  const colors = config.colors || defaultColors;

  return (
    <div>
      {groupBy(
        transformedOutput,
        event => event.startTime,
        (v1, v2) => v1.toDateString() === v2.toDateString()
      )
        .slice(0, 3)
        .map(group => {
          const events = group.elements;

          const eventsDay = new Date(group.group);
          eventsDay.setHours(0, 0, 0, 0);

          const daysFromToday = Math.floor(
            ((eventsDay as any) - (today as any)) / (1000 * 60 * 60 * 24)
          );

          return (
            <div>
              <h5 className={"date"}>
                {(daysFromToday === 0
                  ? "Today"
                  : daysFromToday === 1
                  ? "Tomorrow"
                  : daysFromToday === 2
                  ? "Day After Tomorrow"
                  : group.group.toLocaleDateString("en-US", {
                      weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric'
                        }) +
                    ` (${daysFromToday} days from today)`
                ).toUpperCase()}
              </h5>
              <div>
                {events.filter(event => !(config.hiddenCalendars && config.hiddenCalendars.includes(event.calendar))).map(event => {
                  const calendarColor = colors[
                  getStringNumber(event.calendar) % colors.length
                    ];

                  return (
                    <div className="event">
                      { !(config.hiddenComponents && config.hiddenComponents.calendar) ?
                      <span
                        className="calendar"
                        style={{
                          backgroundColor: calendarColor
                        }}
                      >
                        {event.calendar}
                      </span> : <span
                          className="calendar minimized"
                          style={{
                            backgroundColor: calendarColor
                          }}
                        />}
                      <div className="eventBody">
                        <div className="data">
                          <h4 className="name">{event.name}</h4>
                          <div className="times">
                            { !event.allDay ? <span>
                            <span className="time start">
                              {event.startTime.toLocaleTimeString(undefined, {
                                hour12: true,
                                hour: "numeric",
                                minute: "2-digit"
                              })}
                            </span>
                            {event.endTime && (
                              <span>
                                {" "}
                                -{" "}
                                <span className="time end">
                                  {event.endTime.toDateString() !==
                                  event.startTime.toDateString()
                                    ? event.endTime.toLocaleString()
                                    : event.endTime.toLocaleTimeString(
                                        undefined,
                                        {
                                          hour12: true,
                                          hour: "numeric",
                                          minute: "2-digit"
                                        }
                                      )}
                                </span>
                              </span>
                            )}
                            </span> :
                              <span className={"time allDay"}>All Day</span> }
                          </div>
                          {event.location && !(config.hiddenComponents && config.hiddenComponents.location) && (
                            <p className="property location">
                              {event.location}
                            </p>
                          )}
                          {event.attendees && !(config.hiddenComponents && config.hiddenComponents.attendees) && (
                            <p className="property attendees">
                              with {event.attendees}
                            </p>
                          )}
                          {event.notes && !(config.hiddenComponents && config.hiddenComponents.notes) && (
                            <p className="property notes">{event.notes}</p>
                          )}
                          {event.rawLines && config.debug && (
                            <p>{JSON.stringify(event.rawLines)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const width = 400;
const metadataWidth = 100;

export const className = {
  left: 25,
  bottom: 20,
  fontFamily: "system, -apple-system",
  color: "#E9E9E9",
  width,
  ".date": {
    marginBottom: 10,
    color: "#AAAAAA"
  },
  ".event": {
    marginBottom: 20,
    textShadow: "1px 0 5px rgba(0,0,0,0.6)",

    ".eventBody": {
      display: "flex"
    },
    ".metadata": {
      width: metadataWidth,
      marginLeft: 5,
      textAlign: "right"
    },
    ".data": {
      width: width - metadataWidth
    },
    ".times": {
      marginTop: 2,
      marginBottom: 2,
      fontSize: "0.85em",
      color: "#BBBBBB"
    },
    ".time": {
      ".soon": {},
      ".now": {}
    },

    ".property": {
      marginTop: 2,
      marginBottom: 2,
      fontSize: "0.75em",
      color: "#909090"
    },
    ".name": {
      marginTop: 0,
      marginBottom: 2.5,
      marginRight: 10,
      verticalAlign: "top",
      lineHeight: 1.3
    },
    ".calendar": {
      backgroundColor: "white",
      borderRadius: 100,
      marginBottom: 3,
      color: "black",
      padding: "2px 5px",
      fontSize: "0.6em",
      display: "inline-block",
      verticalAlign: "middle",
      textShadow: "none",
      "&.minimized": {
        padding: 0,
        width: 20,
        height: 5,
        marginBottom: 2.5,
        overflow: 'hidden'
      },
    },
    ".location": {},
    ".attendees": {},
    ".notes": {}
  }
};
