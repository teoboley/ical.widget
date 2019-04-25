export const command = "ical.widget/icalBuddy  --noRelativeDates --dateFormat \"date: %a %b %e %Y|\" --timeFormat \"%H:%M:%S GMT%z\" --bullet \"event: \" eventsToday+6"

export const refreshFrequency = 60_000 * 5 // ms

const colors = ["#ef5350", "#ec407a", "#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5", "#29b6f6", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63"];

interface IEvent {
  name: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  attendees?: string;
  calendar: string;

  rawLines?: string[];
}

const transformICalBuddyOutput = (output: string): IEvent[] => {
  return output.split("event: ").filter(line => line !== "").map<IEvent>(eventString => {
    const eventLines = eventString.split("\n");
    const nameLine = eventLines[0];

    const locationLine = eventLines.find(line => line.includes("location:"));
    const dateLine = eventLines.find(line => line.includes("date:"))!;

    const timeSeparatorIndex = dateLine.indexOf("|");
    const date = dateLine.substring(dateLine.indexOf(": ") + 2, timeSeparatorIndex)
    const startTime = dateLine.substring(timeSeparatorIndex + 5, dateLine.lastIndexOf(" - "))
    const endTime = dateLine.substring(dateLine.lastIndexOf(" - ") + 3)

    const attendeesLine = eventLines.find(line => line.includes("attendees:"));

    const calendarStartIndex = nameLine.lastIndexOf("(");
    const calendarEndIndex = nameLine.lastIndexOf(")");

    return {
      name: nameLine.substring(0, calendarStartIndex - 1),
      location: locationLine && locationLine.substring(locationLine.indexOf(": ") + 2),
      startDate: new Date(date + " " + startTime),
      endDate: new Date(date + " " + endTime),
      attendees: attendeesLine && attendeesLine.substring(attendeesLine.indexOf(": ") + 2) || undefined,
      calendar: nameLine.substring(calendarStartIndex + 1, calendarEndIndex),
      // rawLines: [dateLine.substring(dateLine.indexOf(": ") + 2), date, startTime, endTime]
    };
  })
}

function groupBy<T, Z>(xs: T[], getGroupValue: (x: T) => Z, valuesAreEqual: (v1: Z, v2: Z) => boolean = ((v1, v2) => v1 === v2)) {
  return xs.reduce<Array<{ group: Z; elements: T[] }>>((acc, x) => {
    const value = getGroupValue(x);
    const existingIndex = acc.findIndex(el => valuesAreEqual(el.group, value));

    if (existingIndex !== -1) {
      acc[existingIndex].elements.push(x);
    } else {
      acc.push({ group: value, elements: [x] })
    }

    return acc;
  }, []);
};

function getStringNumber(s: string): number {
  return s.split('').reduce((acc, curr, i) => acc + s.charCodeAt(i), 0);
}

export const render = ({ output }: { output: any }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transformedOutput = transformICalBuddyOutput(output);

  return (
    <div>
    {groupBy(transformedOutput, event => event.startDate, (v1, v2) => v1.toDateString() === v2.toDateString()).slice(0, 2).map(group => {
      const events = group.elements;

      const eventsDay = new Date(group.group);
      eventsDay.setHours(0, 0, 0, 0);

      const daysFromToday = Math.floor(((eventsDay as any)-(today as any))/(1000*60*60*24));

      return (
      <div>
        <h5 className={"date"}>{(daysFromToday === 0 ? 'Today' : daysFromToday === 1 ? 'Tomorrow' : daysFromToday === 2 ? 'Day After Tomorrow' : (group.group.toLocaleString() + ` (${daysFromToday} days from today)`)).toUpperCase()}</h5>
        <div>
      {events.map(event => {
        return (
        <div className="event">
        <span className="calendar" style={{ backgroundColor: colors[(getStringNumber(event.calendar))%colors.length] }}>{event.calendar}</span>
      <div className="eventBody">
        
        <div className="data">
          
          <h4 className="name">{event.name}</h4>
          <div className="times">
            <span className="time start">{event.startDate.toLocaleTimeString(undefined, { hour12: true, hour: "numeric", minute: "2-digit" })}</span>{ event.endDate && <span> - <span className="time end">{event.endDate.toDateString() !== event.startDate.toDateString() ? event.endDate.toLocaleString() : event.endDate.toLocaleTimeString(undefined, { hour12: true, hour: "numeric", minute: "2-digit" })}</span></span>}
          </div>
          { event.location && <p className="property location">{event.location}</p>}
          { event.attendees && <p className="property attendees">with {event.attendees}</p>}
          { event.notes && <p className="property notes">{event.notes}</p>}
          { event.rawLines && <p>{JSON.stringify(event.rawLines)}</p> }
        </div>
      </div>
      </div>
      )})}</div>
      </div>)})}</div>
  )
}

const width = 400;
const metadataWidth = 100;

export const className = {
  left: 25,
  bottom: 20,
  fontFamily: "system, -apple-system",
  color: '#E9E9E9',
  width,
  ".date": {
    marginBottom: 10,
    color: "#AAAAAA"
  },
  ".event": {
    marginBottom: 20,
    textShadow: "1px 0 5px rgba(0,0,0,0.6)",
    
    ".eventBody": {
      display: "flex",
    },
    ".metadata": {
      width: metadataWidth,
      marginLeft: 5,
      textAlign: 'right'
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
      ".soon": {

      },
      ".now": {

      }
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
      verticalAlign: 'top',
      lineHeight: 1.3
    },
    ".calendar": {
      backgroundColor: 'white',
      borderRadius: 100,
      marginBottom: 2.5,
      color: 'black',
      padding: "2px 5px",
      fontSize: "0.7em",
      display: "inline-block",
      verticalAlign: 'middle',
      textShadow: 'none'
    },
    ".location": {

    },
  
    ".attendees": {

    },
    ".notes": {

    }
  }
}