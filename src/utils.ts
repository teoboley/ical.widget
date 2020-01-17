import {IDebuggableEvent} from "./index";

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

// merge

function isMergeableObject(val: any): boolean {
  var nonNullObject = val && typeof val === 'object'

  return nonNullObject
    && Object.prototype.toString.call(val) !== '[object RegExp]'
    && Object.prototype.toString.call(val) !== '[object Date]'
}

function emptyTarget(val: any): [] | {} {
  return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary<T>(value: T, optionsArgument?: { clone?: boolean }): T {
  const clone = optionsArgument && optionsArgument.clone === true;
  return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
}

function defaultArrayMerge(target: any[], source: any[], optionsArgument?: { clone?: boolean }): any[] {
  var destination: any[] = target.slice()
  source.forEach(function(e, i) {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNecessary(e, optionsArgument)
    } else if (isMergeableObject(e)) {
      destination[i] = deepmerge(target[i], e, optionsArgument)
    } else if (target.indexOf(e) === -1) {
      destination.push(cloneIfNecessary(e, optionsArgument))
    }
  })
  return destination
}

function mergeObject(target: any, source: any, optionsArgument?: { clone?: boolean }): any {
  var destination: any = {}
  if (isMergeableObject(target)) {
    Object.keys(target).forEach(function (key) {
      destination[key] = cloneIfNecessary(target[key], optionsArgument)
    })
  }
  Object.keys(source).forEach(function (key) {
    if (!isMergeableObject(source[key]) || !target[key]) {
      destination[key] = cloneIfNecessary(source[key], optionsArgument)
    } else {
      destination[key] = deepmerge(target[key], source[key], optionsArgument)
    }
  })
  return destination
}

function deepmerge(target: any, source: any, optionsArgument?: { clone?: boolean; arrayMerge?: typeof defaultArrayMerge }) {
  var array = Array.isArray(source);
  var options = optionsArgument || { arrayMerge: defaultArrayMerge }
  var arrayMerge = options.arrayMerge || defaultArrayMerge

  if (array) {
    return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
  } else {
    return mergeObject(target, source, optionsArgument)
  }
}

export const deepMerge = deepmerge;
