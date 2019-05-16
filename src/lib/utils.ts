import {IDebuggableEvent} from "../index";

export const transformICalBuddyOutput = (output: string): IDebuggableEvent[] => {
  return output
    .split("event: ")
    .filter(line => line !== "")
    .map(eventString => {
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

      const notesLine = eventLines.find(line => line.includes("notes:"));

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
        notes: notesLine && notesLine.substring(notesLine.indexOf(": ") + 2),
        calendar: nameLine.substring(calendarStartIndex + 1, calendarEndIndex),
        rawLines: eventLines
      };
    });
};

export function groupBy<T, Z>(
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