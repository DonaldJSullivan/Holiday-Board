const hb = require('./Holiday');

const holidayJSON = require('./HolidayList.json');
var holidayCollection = holidayJSON.holiday.map(hol => { return hb.Holiday.getHolidayFromJSON(hol); });

var year = 2024;

console.log("\nHoliday, Lead-In Date, Date, Lead-Out Date\n");
holidayCollection.forEach(hd => { console.log(`${hd.name.padEnd(20, " ")}${hd.getLeadInDate(year).toDateString()} | ${hd.getDate(year).toDateString()} | ${hd.getLeadOutDate(year).toDateString()}`); });