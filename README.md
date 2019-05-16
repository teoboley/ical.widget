# iCal Widget

An [Übersicht](http://tracesof.net/uebersicht/) widget that displays events from iCal onto your desktop.

Utilizing [icalBuddy](http://hasseg.org/icalBuddy/).

There are currently unresolved issues with icalBuddy, so this widget may not work well for everyone.

## Requirements

This widgets requires [Python 2.7](https://www.python.org/downloads/)

## Configuration

Configuration resides in a `config.jsx` file in the `ical.widget/lib` directory. All of the properties are optional, but the `config.jsx` file must be present in this folder for `iCal Widget` to run.

```typescript
interface IConfig {
    // flag to show the individual event raw `iCalBuddy` output lines
    debug?: boolean;
    
    // individual event components that should be hidden
    hiddenComponents?: {
        location?: boolean | {
          calendars?: string[] | RegExp;
          events?: string[] | RegExp;
        };
        notes?: boolean | {
          calendars?: string[] | RegExp;
          events?: string[] | RegExp;
        };
        attendees?: boolean | {
          calendars?: string[] | RegExp;
          events?: string[] | RegExp;
        };
        calendar: boolean | {
          calendars?: string[] | RegExp;
          events?: string[] | RegExp;
        };
    };
  
    // calendar names that should be hidden from the widget
    hiddenCalendars?: string[] | RegExp;
    
    // text color for components
    colors?: {
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
    
    // individual complete component overhauls
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
}
```

```typescript
// types of component overrides (React component definitions)

interface IDebuggableEvent {
    name: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    location?: string;
    notes?: string;
    attendees?: string;
    calendar: string;
    rawLines?: string[];
}

// original versions of components accept a value of type T as children
type OriginalComponentRenderer<T> = React.ComponentType<{ children: T }>;

// this override type is used for components that correspond to a single event (name, location, notes, etc.)
type EventComponentOverride<T> = React.ComponentType<{
  children: T;
  Original: OriginalComponentRenderer<T>;
  event: IDebuggableEvent;
  scopedEvents: IDebuggableEvent[];
  allEvents: IDebuggableEvent[];
}>;

// this override type is used for components that correspond to multiple events (date)
type EventsComponentOverride<T> = React.ComponentType<{
  children: T;
  Original: OriginalComponentRenderer<T>;
  events: IDebuggableEvent[];
}>;
```