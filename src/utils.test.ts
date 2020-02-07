import { transformICalBuddyOutput } from "./utils";

test("Event is parsed correctly", () => {
  const iCalBuddyOutput = `event: A Test Event (Classes)
    location: Boston, MA
    date: Mon Feb 10 2020| at 18:00:00 GMT-0500 - 21:30:00 GMT-0500
`;

  expect(transformICalBuddyOutput(iCalBuddyOutput)).toEqual([
    {
      allDay: false,
      attendees: undefined,
      calendar: "Classes",
      startTime: new Date("Mon Feb 10 2020 18:00:00 GMT-0500"),
      endTime: new Date("Mon Feb 10 2020 21:30:00 GMT-0500"),
      location: "Boston, MA",
      name: "A Test Event",
      notes: undefined,
      rawLines: [
        "A Test Event (Classes)",
        "    location: Boston, MA",
        "    date: Mon Feb 10 2020| at 18:00:00 GMT-0500 - 21:30:00 GMT-0500",
        ""
      ]
    }
  ]);
});

test("Multiple events are parsed correctly", () => {
  const iCalBuddyOutput = `event: A Test Event (Classes)
    location: Boston, MA
    date: Mon Feb 10 2020| at 18:00:00 GMT-0500 - 21:30:00 GMT-0500
event: Another Event (Classes)
    location: 129 Hurtig Hall
    date: Tue Feb 11 2020| at 08:00:00 GMT-0500 - 09:40:00 GMT-0500
event: Third Event (Same Day) (Classes)
    location: Boston, MA
    date: Tue Feb 11 2020| at 13:35:00 GMT-0500 - 17:05:00 GMT-0500
event: Fourth Event - Same Day (Classes)
    location: 130 Hurtig Hall
    date: Tue Feb 11 2020| at 18:00:00 GMT-0500 - 21:15:00 GMT-0500
`;

  expect(transformICalBuddyOutput(iCalBuddyOutput)).toEqual([
    {
      allDay: false,
      attendees: undefined,
      calendar: "Classes",
      startTime: new Date("Mon Feb 10 2020 18:00:00 GMT-0500"),
      endTime: new Date("Mon Feb 10 2020 21:30:00 GMT-0500"),
      location: "Boston, MA",
      name: "A Test Event",
      notes: undefined,
      rawLines: [
        "A Test Event (Classes)",
        "    location: Boston, MA",
        "    date: Mon Feb 10 2020| at 18:00:00 GMT-0500 - 21:30:00 GMT-0500",
        ""
      ]
    },
    {
      allDay: false,
      attendees: undefined,
      calendar: "Classes",
      startTime: new Date("Tue Feb 11 2020 08:00:00 GMT-0500"),
      endTime: new Date("Tue Feb 11 2020 09:40:00 GMT-0500"),
      location: "129 Hurtig Hall",
      name: "Another Event",
      notes: undefined,
      rawLines: [
        "Another Event (Classes)",
        "    location: 129 Hurtig Hall",
        "    date: Tue Feb 11 2020| at 08:00:00 GMT-0500 - 09:40:00 GMT-0500",
        ""
      ]
    },
    {
      allDay: false,
      attendees: undefined,
      calendar: "Classes",
      startTime: new Date("Tue Feb 11 2020 13:35:00 GMT-0500"),
      endTime: new Date("Tue Feb 11 2020 17:05:00 GMT-0500"),
      location: "Boston, MA",
      name: "Third Event (Same Day)",
      notes: undefined,
      rawLines: [
        "Third Event (Same Day) (Classes)",
        "    location: Boston, MA",
        "    date: Tue Feb 11 2020| at 13:35:00 GMT-0500 - 17:05:00 GMT-0500",
        ""
      ]
    },
    {
      allDay: false,
      attendees: undefined,
      calendar: "Classes",
      startTime: new Date("Tue Feb 11 2020 18:00:00 GMT-0500"),
      endTime: new Date("Tue Feb 11 2020 21:15:00 GMT-0500"),
      location: "130 Hurtig Hall",
      name: "Fourth Event - Same Day",
      notes: undefined,
      rawLines: [
        "Fourth Event - Same Day (Classes)",
        "    location: 130 Hurtig Hall",
        "    date: Tue Feb 11 2020| at 18:00:00 GMT-0500 - 21:15:00 GMT-0500",
        ""
      ]
    }
  ]);
});

test("Multi-day event is parsed correctly", () => {
  const iCalBuddyOutput = `event: [PL][x] Assignment 4 Due (HW Deadline)
      date: Wed Feb 5 2020| at 23:00:00 GMT-0500 - date: Thu Feb 6 2020| at 00:00:00 GMT-0500
  `;

  expect(transformICalBuddyOutput(iCalBuddyOutput)).toEqual([
    {
      allDay: false,
      attendees: undefined,
      calendar: "HW Deadline",
      startTime: new Date("Wed Feb 5 2020 23:00:00 GMT-0500"),
      endTime: new Date("Thu Feb 6 2020 00:00:00 GMT-0500"),
      location: undefined,
      name: "[PL][x] Assignment 4 Due",
      notes: undefined,
      rawLines: [
        "[PL][x] Assignment 4 Due (HW Deadline)",
        "      date: Wed Feb 5 2020| at 23:00:00 GMT-0500 - date: Thu Feb 6 2020| at 00:00:00 GMT-0500",
        "  "
      ]
    }
  ]);
});

test("All day event is parsed correctly", () => {
  const iCalBuddyOutput = `Valentine’s Day (US Holidays)
      date: Fri Feb 14 2020|
  `;

  expect(transformICalBuddyOutput(iCalBuddyOutput)).toEqual([{
    allDay: true,
    attendees: undefined,
    calendar: "US Holidays",
    startTime: new Date("Fri Feb 14 2020"),
    endTime: new Date("Fri Feb 14 2020"),
    location: undefined,
    name: "Valentine’s Day",
    notes: undefined,
    rawLines: [
      "Valentine’s Day (US Holidays)",
      "      date: Fri Feb 14 2020|",
      "  "
    ]
  }])
});
