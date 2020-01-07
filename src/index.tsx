import externalConfig from "./lib/config.jsx";
import * as util from "util";
import { transformICalBuddyOutput, groupBy, deepMerge } from "./lib/utils";

interface IEventOptionalDisplayProperties {
  location?: string;
  notes?: string;
  attendees?: string;
  calendar: string;
}

export interface IEvent extends IEventOptionalDisplayProperties {
  name: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
}

export interface IDebuggableEvent extends IEvent {
  rawLines?: string[];
}

type OriginalComponentRenderer<T> = React.ComponentType<{ children: T }>;
type EventComponentOverride<T> = React.ComponentType<{
  children: T;
  Original: OriginalComponentRenderer<T>;
  event: IDebuggableEvent;
  scopedEvents: IDebuggableEvent[];
  allEvents: IDebuggableEvent[];
}>;
type EventsComponentOverride<T> = React.ComponentType<{
  children: T;
  Original: OriginalComponentRenderer<T>;
  events: IDebuggableEvent[];
}>;

type ExtractEventOverrideType<Type> = Type extends EventComponentOverride<
  infer P
>
  ? P
  : null;

type ExtractEventsOverrideType<Type> = Type extends EventsComponentOverride<
  infer P
>
  ? P
  : null;

interface IConfig {
  debug?: boolean;
  hiddenComponents?: {
    [P in keyof IEventOptionalDisplayProperties]?:
      | boolean
      | {
          calendars?: string[] | RegExp;
          events?: string[] | RegExp;
        }
  };
  hiddenCalendars?: string[] | RegExp;
  colors?: {
    darkmode?: boolean;
    date?: string;
    calendar?: Array<{
      text: string;
      background: string;
    }>;
    name?: string;
    times?: string;
    property?: string;
    location?: string;
    attendees?: string;
    notes?: string;
  };
  componentOverrides?: {
    events?: EventsComponentOverride<IDebuggableEvent[]>; // FIXME: Typing is jank
    date?: EventsComponentOverride<Date>;
    event?: EventComponentOverride<IEvent>;
    name?: EventComponentOverride<string>;
    times?: EventComponentOverride<{
      startTime: Date;
      endTime: Date;
      allDay: boolean;
    }>;
    location?: EventComponentOverride<string>;
    notes?: EventComponentOverride<string>;
    attendees?: EventComponentOverride<string>;
    calendar?: EventComponentOverride<string>;
  };
  className?: React.CSSProperties;
}

const config: IConfig = externalConfig;

const colors = {
  calendar: (config.colors && config.colors.calendar) || [
    {background: "#ef5350", text: "black"},
    {background: "#ec407a", text: "black"},
    {background: "#ab47bc", text: "black"},
    {background: "#7e57c2", text: "black"},
    {background: "#5c6bc0", text: "black"},
    {background: "#42a5f5", text: "black"},
    {background: "#29b6f6", text: "black"},
    {background: "#26c6da", text: "black"},
    {background: "#26a69a", text: "black"},
    {background: "#66bb6a", text: "black"},
    {background: "#9ccc65", text: "black"},
    {background: "#d4e157", text: "black"},
    {background: "#ffee58", text: "black"},
    {background: "#ffca28", text: "black"},
    {background: "#ffa726", text: "black"},
    {background: "#ff7043", text: "black"},
    {background: "#8d6e63", text: "black"}
  ],
  date: (config.colors && config.colors.date) || (!(config.colors && config.colors.darkmode) ? "#AAAAAA" : "#555555"),
  name: (config.colors && config.colors.name) || (!(config.colors && config.colors.darkmode) ? "#E9E9E9" : "#161616"),
  times: (config.colors && config.colors.times) || (!(config.colors && config.colors.darkmode) ? "#BBBBBB" : "#444444"),
  property: (config.colors && config.colors.property) || (!(config.colors && config.colors.darkmode) ? "#909090" : "#6f6f6f"),
  location: (config.colors && config.colors.location),
  attendees: (config.colors && config.colors.attendees),
  notes: (config.colors && config.colors.notes)
};

const notesLineSeparator = "\\r";

export const command =
  'ical.widget/icalBuddy  --noRelativeDates --dateFormat "date: %a %b %e %Y|" --timeFormat "%H:%M:%S GMT%z" --bullet "event: " --notesNewlineReplacement "' +
  notesLineSeparator +
  '" eventsToday+6';

export const refreshFrequency = 60_000 * 5; // ms

function getStringNumber(s: string): number {
  return s.split("").reduce((acc, curr, i) => acc + s.charCodeAt(i), 0);
}

function renderEventsComponent(events: IEvent[]) {
  return function<
    T extends keyof NonNullable<IConfig["componentOverrides"]>,
    Z extends ExtractEventsOverrideType<
      NonNullable<IConfig["componentOverrides"]>[T]
    >
  >(
    key: T,
    value: Z,
    DefaultRender: OriginalComponentRenderer<Z> = ({ children }) => (
      <span>{children}</span>
    )
  ) {
    const MaybeOverride =
      (config.componentOverrides && config.componentOverrides[key]) || null;

    if (MaybeOverride) {
      const Override: any = MaybeOverride;

      return (
        <Override Original={DefaultRender} events={events}>
          {value}
        </Override>
      );
    } else {
      return <DefaultRender>{value}</DefaultRender>;
    }
  };
}

function renderEventComponent(event: IDebuggableEvent, scopedEvents: IDebuggableEvent[], allEvents: IDebuggableEvent[]) {
  return function<
    T extends keyof NonNullable<IConfig["componentOverrides"]>,
    Z extends ExtractEventOverrideType<
      NonNullable<IConfig["componentOverrides"]>[T]
    >
  >(
    key: T,
    value: Z,
    DefaultRender: OriginalComponentRenderer<Z> = ({ children }) => (
      <span>{children}</span>
    )
  ) {
    const MaybeOverride =
      (config.componentOverrides && config.componentOverrides[key]) || null;

    if (MaybeOverride) {
      const Override: any = MaybeOverride;

      return (
        <Override Original={DefaultRender} event={event}>
          {value}
        </Override>
      );
    } else {
      return <DefaultRender>{value}</DefaultRender>;
    }
  };
}

export const render = ({ output }: { output: any }) => {
  const transformedOutput = transformICalBuddyOutput(output);

  return (
    <div>
      {renderEventsComponent(transformedOutput)(
        "events",
        transformedOutput,
        ({ children: allEvents }) => (
          <div>
            {groupBy(
              allEvents as IDebuggableEvent[], // FIXME
              event => event.startTime,
              (v1, v2) => v1.toDateString() === v2.toDateString()
            )
              .slice(0, 3)
              .map(group => {
                const events = group.elements;
                return (
                  <div>
                    {renderEventsComponent(events)(
                      "date",
                      group.group,
                      ({ children }) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const eventsDay = new Date(children);
                        eventsDay.setHours(0, 0, 0, 0);

                        const daysFromToday = Math.floor(
                          ((eventsDay as any) - (today as any)) /
                            (1000 * 60 * 60 * 24)
                        );

                        return (
                          <h5 className={"date"}>
                            {(daysFromToday === 0
                              ? "Today"
                              : daysFromToday === 1
                              ? "Tomorrow"
                              : daysFromToday === 2
                              ? "Day After Tomorrow"
                              : children.toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric"
                                }) + ` (${daysFromToday} days from today)`
                            ).toUpperCase()}
                          </h5>
                        );
                      }
                    )}
                    <div>
                      {events
                        .filter(
                          event =>
                            !(
                              config.hiddenCalendars &&
                              (Array.isArray(config.hiddenCalendars)
                                ? config.hiddenCalendars.includes(
                                    event.calendar
                                  )
                                : event.calendar.match(
                                    config.hiddenCalendars
                                  ) !== null)
                            )
                        )
                        .map(event => {
                          const calendarColor =
                            colors.calendar[
                              getStringNumber(event.calendar) % colors.calendar.length
                            ];

                          const componentIsHidden = (
                            component: keyof IEventOptionalDisplayProperties
                          ) => {
                            let shouldHide = false;

                            if (
                              config.hiddenComponents &&
                              config.hiddenComponents[component] !== undefined
                            ) {
                              const hiddenComponentConfig = config
                                .hiddenComponents[component]!;

                              if (typeof hiddenComponentConfig === "boolean") {
                                shouldHide =
                                  shouldHide || hiddenComponentConfig;
                              } else {
                                if (hiddenComponentConfig.calendars) {
                                  if (
                                    Array.isArray(
                                      hiddenComponentConfig.calendars
                                    )
                                  ) {
                                    shouldHide =
                                      shouldHide ||
                                      hiddenComponentConfig.calendars.includes(
                                        event.calendar
                                      );
                                  } else if (
                                    util.types.isRegExp(
                                      hiddenComponentConfig.calendars
                                    )
                                  ) {
                                    shouldHide =
                                      shouldHide ||
                                      event.calendar.match(
                                        hiddenComponentConfig.calendars
                                      ) !== null;
                                  }
                                }

                                if (hiddenComponentConfig.events) {
                                  if (
                                    Array.isArray(hiddenComponentConfig.events)
                                  ) {
                                    shouldHide =
                                      shouldHide ||
                                      hiddenComponentConfig.events.includes(
                                        event.name
                                      );
                                  } else if (
                                    util.types.isRegExp(
                                      hiddenComponentConfig.events
                                    )
                                  ) {
                                    shouldHide =
                                      shouldHide ||
                                      event.name.match(
                                        hiddenComponentConfig.events
                                      ) !== null;
                                  }
                                }
                              }
                            }

                            return shouldHide;
                          };

                          const renderComponent = renderEventComponent(event, events, allEvents);

                          return renderComponent("event",
                            event,
                            ({ children: currentEvent }) => (
                              <div className="event">
                                {renderComponent(
                                  "calendar",
                                  currentEvent.calendar,
                                  ({ children }) =>
                                    !componentIsHidden("calendar") ? (
                                      <span
                                        className="calendar"
                                        style={{
                                          color: calendarColor.text,
                                          backgroundColor: calendarColor.background
                                        }}
                                      >
                                        {children}
                                      </span>
                                    ) : (
                                      <span
                                        className="calendar minimized"
                                        style={{
                                          color: calendarColor.text,
                                          backgroundColor: calendarColor.background
                                        }}
                                      />
                                    )
                                )}
                                <div className="eventBody">
                                  <div className="data">
                                    {renderComponent(
                                      "name",
                                      currentEvent.name,
                                      ({ children }) => (
                                        <h4 className="name">{children}</h4>
                                      )
                                    )}
                                    {renderComponent(
                                      "times",
                                      {
                                        allDay: currentEvent.allDay,
                                        startTime: currentEvent.startTime,
                                        endTime: currentEvent.endTime
                                      },
                                      ({ children }) => (
                                        <div className="times">
                                          {!children.allDay ? (
                                            <span>
                                              <span className="time start">
                                                {children.startTime.toLocaleTimeString(
                                                  undefined,
                                                  {
                                                    hour12: true,
                                                    hour: "numeric",
                                                    minute: "2-digit"
                                                  }
                                                )}
                                              </span>
                                              {children.endTime && (
                                                <span>
                                                  {" "}
                                                  -{" "}
                                                  <span className="time end">
                                                    {children.endTime.toDateString() !==
                                                    children.startTime.toDateString()
                                                      ? children.endTime.toLocaleString()
                                                      : children.endTime.toLocaleTimeString(
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
                                            </span>
                                          ) : (
                                            <span className={"time allDay"}>
                                              All Day
                                            </span>
                                          )}
                                        </div>
                                      )
                                    )}
                                    {currentEvent.location &&
                                      !componentIsHidden("location") &&
                                      renderComponent(
                                        "location",
                                        currentEvent.location,
                                        ({ children }) => (
                                          <p className="property location">
                                            {children}
                                          </p>
                                        )
                                      )}
                                    {currentEvent.attendees &&
                                      !componentIsHidden("attendees") &&
                                      renderComponent(
                                        "attendees",
                                        currentEvent.attendees,
                                        ({ children }) => (
                                          <p className="property attendees">
                                            with {children}
                                          </p>
                                        )
                                      )}
                                    {currentEvent.notes &&
                                      !componentIsHidden("notes") &&
                                      renderComponent(
                                        "notes",
                                        currentEvent.notes,
                                        ({ children }) => (
                                          <div className="property notes">
                                            {children
                                              .split(notesLineSeparator)
                                              .map(t =>
                                                t === "" ? <br /> : <p>{t}</p>
                                              )}
                                          </div>
                                        )
                                      )}
                                    {currentEvent.rawLines && config.debug && (
                                      <p>
                                        {JSON.stringify(currentEvent.rawLines)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        )
      )}
    </div>
  );
};

const width = 400;
const metadataWidth = 100;

export const className = deepMerge((config.className || {}), {
  left: 25,
  bottom: 20,
  fontFamily: "system, -apple-system",
  width,
  ".date": {
    marginBottom: 10,
    color: colors.date
  },
  ".event": {
    marginBottom: 20,
    textShadow: !(config.colors && config.colors.darkmode) ? "1px 0 5px rgba(0,0,0,0.6)" : "1px 0 5px rgba(255,255,255,0.6)",

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
      color: colors.times
    },
    ".time": {
      ".soon": {},
      ".now": {}
    },

    ".property": {
      marginTop: 2,
      marginBottom: 2,
      fontSize: "0.75em",
      color: colors.property
    },
    ".name": {
      marginTop: 0,
      marginBottom: 2.5,
      marginRight: 10,
      verticalAlign: "top",
      lineHeight: 1.3,
      color: colors.name
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
        overflow: "hidden"
      }
    },
    ".location": {
      color: colors.location
    },
    ".attendees": {
      color: colors.attendees
    },
    ".notes": {
      p: {
        marginTop: 0,
        marginBottom: 0
      },
      color: colors.notes
    }
  }
});
