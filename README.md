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
    location?: boolean;
    notes?: boolean;
    attendees?: boolean;
    calendar: boolean;
  };
  
  // calendar names that should be hidden from the widget
  hiddenCalendars?: string[];
  
  // the colors used for the `calendar` tag
  colors?: string[];
}
```