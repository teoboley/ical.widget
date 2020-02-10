import {IDebuggableEvent} from "./index";

export const transformICalBuddyOutput = (output: string): IDebuggableEvent[] => {
  console.log(output);
  return output
    .split("event: ")
    .filter(line => line !== "")
    .map(eventString => {
      console.log(eventString);
      const eventLines = eventString.split("\n");
      const nameLine = eventLines[0];
      console.log("NAME LINE", nameLine);

      const locationLine = eventLines.find(line => line.includes("location:"));
      const dateLine = eventLines.find(line => line.includes("date:"))!.trim();

      const dateLabel = "date: ";
      const timeSeparator = "|";

      // split date string into two sections: start date and end date
      const startAndEndTimeSeparator = " - ";
      const startAndEndTimeSeparatorIndex = dateLine.indexOf(startAndEndTimeSeparator);
      const startDateTimeSection = dateLine.substring(0, startAndEndTimeSeparatorIndex > -1 ? startAndEndTimeSeparatorIndex : undefined).replace(dateLabel, "");
      const endDateTimeSection = dateLine.substring(startAndEndTimeSeparatorIndex + startAndEndTimeSeparator.length).replace(dateLabel, "");

      const startTimeSeparatorIndex = startDateTimeSection.indexOf(timeSeparator);
      const startDateString = startDateTimeSection.substring(0, startTimeSeparatorIndex);
      console.log("START DATE STRING", startDateString);
      const startTimeString = startDateTimeSection.substring(startTimeSeparatorIndex + timeSeparator.length).replace("at ", "");
      console.log("START TIME STRING", startTimeString);
      const startTime = new Date(`${startDateString} ${startTimeString}`);

      const endDateString = endDateTimeSection.substring(0, endDateTimeSection.indexOf(timeSeparator)) || null;
      const endTimeString = endDateTimeSection.substring(endDateString ? endDateTimeSection.indexOf(timeSeparator) + timeSeparator.length : 0).replace("at ", "");

      const resolvedEndDateString = endDateString ? endDateString : startDateString;
      // end date may or may not have an actual date string prefixing it
      const endTime = new Date(`${resolvedEndDateString} ${endTimeString}`);

      const urlLine = eventLines.find(line => line.includes("url:"));
      const notesLine = eventLines.find(line => line.includes("notes:"));

      const attendeesLine = eventLines.find(line =>
        line.includes("attendees:")
      );

      const calendarStartIndex = nameLine.lastIndexOf("(");
      const calendarEndIndex = nameLine.lastIndexOf(")");

      return {
        name: nameLine.substring(0, calendarStartIndex - 1),
        url: urlLine &&
          urlLine.substring(urlLine.indexOf(": ") + 2),
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
