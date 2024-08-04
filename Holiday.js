//Holiday.js
//This file contains the code that Holiday Board uses to handle date computation as well as
//color & color pattern assignments respective to specific holidays; contains necessary algorithms
//for holidays that have dynamically assigned dates (holidays that are 'contingent') such as Easter,
//the date of which is determined each year by the lunar cycle, or holidays which are determined by
//a numbered occurrence of a day of week (second Sunday of May, third Sunday of June, etc.)

/*
See https://www.timeanddate.com for information regarding holidays and related data/facts,
and also https://tidesandcurrents.noaa.gov/astronomical.html for information regarding moon phases
*/

const HolidayType = {
    FixedHoliday: Symbol(0),
    ContingentOnDayOfWeekHoliday: Symbol(1),
    ContingentOnDateByOffsetHoliday: Symbol(2),
    ContingentOnDateHoliday: Symbol(3),
    Easter: Symbol(4)
}

//Base class for holiday objects; requires a name and number of days both in advance and following a light pattern will be activated and deactivated for a holiday; contains several static methods for date/time computations & modifications needed by certain holidays
class Holiday {
    constructor(name, pattern, leadInDays, leadOutDays) {
        //Set the lead-in/lead-out days to zero and/or name to 'Unnamed' if not provided
        this.name = name ?? "Unnamed";
        //this.type = type;
        //Note: The pattern shall be 'undefined' if no pattern is assigned to the holiday in question
        this.pattern = pattern;
        this.leadInDays = leadInDays ?? 0;
        this.leadOutDays = leadOutDays ?? 0;
    }

    static isJSONObjectValid(jsonHoliday) {
        return (typeof jsonHoliday.name == "string") &&
        (typeof jsonHoliday.type == "number") &&
        (typeof jsonHoliday.pattern == "number") &&
        (typeof jsonHoliday.leadInDays == "number") &&
        (typeof jsonHoliday.leadOutDays == "number");
    }

    //Returns the number of days in a month for a numbered month, using the same numbering scheme as the JavaScript Date.getMonth or Date.setMonth
    //methods; return -1 if out of range or there is a type mismatch; numbered year is required in order to determine proper number of days in Feburary
    static daysInMonth(month, year) {
        //TODO: Add validation of 'month' and 'year' values here
        switch (month) {
            //Thirty-one days in January, March, May, July, August, October, and December
            case 0:
            case 2:
            case 4:
            case 6:
            case 7:
            case 9:
            case 11:
                return 31;
                break;
            //Thirty days in April, June, September, and November
            case 3:
            case 5:
            case 8:
            case 10:
                return 30;
                break;
            //Twenty-eight days in February; twenty-nine if it is a leap year
            case 1:
                return Holiday.isLeapYear(year) ? 29 : 28;
                break;
            default:
                return -1;
                break;
        }
    }

    //Determines the amount of days until the next occurrence of a specified day of the week; used in conjunction with 'getDateRelativeToDate' and 'getDateRelativeToMonth'
    static daysToNextDayOfWeek(dayOfWeek, nextDayOfWeek) { return nextDayOfWeek + (nextDayOfWeek <= dayOfWeek ? 7 : 0) - dayOfWeek; }

    //Determines the amount of days from the previous occurrence of a specified day of the week; used in conjunction with 'getDateRelativeToDate' and 'getDateRelativeToMonth'
    static daysToPreviousDayOfWeek(dayOfWeek, previousDayOfWeek) { return dayOfWeek + (previousDayOfWeek <= dayOfWeek ? 7 : 0) - previousDayOfWeek; }

    //Intentionally left blank; abstract method meant to be overridden and used by subclasses only
    getDate(year) {}

    //Algorithm that follows can be found here: https://aa.usno.navy.mil/faq/easter#compute
    static getEaster(year) {
        //Note: Per mandate of the algorithm, every statement below that uses division must have it's arithmetic remainder, if one exists,
        //removed from the quotient, and so the Math.floor method is called to round down each quotient to a whole number accordingly.
        var c = Math.floor(year / 100);
        var n = year - 19 * Math.floor(year / 19);
        var k = Math.floor((c - 17) / 25);
        var i = Math.floor(c - c / 4 - (c - k) / 3 + 19 * n + 15);
        i -= 30 * Math.floor(i / 30);
        i -= Math.floor(i / 28) * (1 - Math.floor(i / 28) * Math.floor(29 / (i + 1)) * Math.floor((21 - n) / 11));
        var j = Math.floor(year + year / 4 + i + 2 - c + c / 4);
        j -= 7 * Math.floor(j / 7);
        var l = i - j;
        var m = Math.floor(3 + (l + 40) / 44);
        var d = l + 28 - 31 * Math.floor(m / 4);
        //Subtract one from the month here because JavaScript utilizes zero-based indexing of calendar months (January through December are zero through eleven instead of one through twelve)
        return new Date(year, m - 1, d);
    }

    static getEaster2(year) {
        //Start by getting the dominical letter for the year
        var n = 7 - ((year + (year / 4) - (year / 100) + (year / 400) - 1) % 7);

        //Next get the golden number of the year, or the number of the year in the 19-year Metonic cycle
        var g = 1 + (year % 19);

        //Next get the epact of the year or the age, in days, of the ecclesiatstical moon on the first day of the year (January 1st)
        var e = (11 * g - 10) % 30;

        //The epact must then be modified by the solar and lunar equations
        var h = year / 100;
        var sol = h - (h / 4) - 12;
        var lun = (h - 15 - (h - 17) / 25) / 3;
        var v = (e / 24) - (e * 25) + (g / 12) * ((e / 25) - (e / 26));
        e = (((11 * g) - 10) % 30) + ((sol - lun) % 30) + v;

        var r = ((e < 24) ? 45 : 75) - e;
        var c = 1 + ((r + 2) % 7);
        var s = r + ((7 + n - c) % 7);

        //TODO: Insert creation of the final date object here
    }

    //Gets date of a specified day of week (by numbered occurrence) before or after provided date, including or excluding the provided date
    static getDateRelativeToDate(date, dayOfWeek, occurrence, includeDateInQuestion) {
        //TODO: Add validation of 'date,' 'day,' and 'occurrence' values

        if (occurrence > 0) {
            //Increment the counter by one if the date specified is not to be included
            if (!includeDateInQuestion) { date.setDate(date.getDate() + 1); }

            /*Count up to the first occurrence of the specified day of the week, then add additional seven-day increments as needed if an occurrence of that day of the week
            *beyond the first one for the month in question is required; subtract one day from the final number so the difference in days can be applied accordingly*/
            var dayDelta = ((this.daysToNextDayOfWeek(date.getDay(), dayOfWeek) % 7) + ((occurrence - 1) * 7));

            //Set the modified date
            date.setDate(date.getDate() + dayDelta);
        }
        else if (occurrence < 0) {
            //Decrement the counter by one if the date specified is not to be included
            if (!includeDateInQuestion) { date.setDate(date.getDate() - 1); }

            /*Count back to the first occurrence of the specified day of the week, then subtract additional seven-day increments as needed if an occurrence of that day of the week
            *beyond the first one for the month in question is required; subtract one day from the final number so the difference in days can be applied accordingly*/
            var dayDelta = ((this.daysToPreviousDayOfWeek(date.getDay(), dayOfWeek) % 7) + ((occurrence + 1) * 7));

            //Set the modified date
            date.setDate(date.getDate() - dayDelta);
        }

        return date;
    }

    //Returns a holiday from a specified JSON object
    static getHolidayFromJSON(jsonHoliday, referenceHoliday) {
        switch (jsonHoliday.type) {
            case 0:
            default:
                return new FixedHoliday(jsonHoliday.name, jsonHoliday.pattern, jsonHoliday.month, jsonHoliday.date, jsonHoliday.leadInDays, jsonHoliday.leadOutDays);
                break;
            case 1:
                return new ContingentOnDayOfWeekHoliday(jsonHoliday.name, jsonHoliday.pattern, jsonHoliday.month, jsonHoliday.dayOfWeek, jsonHoliday.occurrence, jsonHoliday.leadInDays, jsonHoliday.leadOutDays);
                break;
            case 2:
                return new ContingentOnDateByOffsetHoliday(jsonHoliday.name, jsonHoliday.pattern, referenceHoliday, jsonHoliday.offset, jsonHoliday.leadInDays, jsonHoliday.leadOutDays);
                break;
            case 3:
                return new ContingentOnDateHoliday(jsonHoliday.name, jsonHoliday.pattern, jsonHoliday.month, jsonHoliday.date, jsonHoliday.dayOfWeek, jsonHoliday.occurrence, jsonHoliday.includeDateInQuestion, jsonHoliday.leadInDays, jsonHoliday.leadOutDays);
                break;
            case 4:
                return new Easter(jsonHoliday.pattern, jsonHoliday.leadInDays, jsonHoliday.leadOutDays);
                break;
        }
    }

    //Gets date of a specified day of week within a month by numbered occurrence (first Sunday in September, last Monday of May, et cetera)
    static getDateRelativeToMonth(year, month, dayOfWeek, occurrence) {
        //TODO: Add validation of 'year,' 'month,' 'day,' and 'occurrence' values here

        /*The conditional operator is used in creating the new Date object below to begin the count at the end of the month rather than the beginning in case
        the 'occurrence' value is below zero, meaning one of the last days of a month are to be calculated rather than one of the first.*/
        return this.getDateRelativeToDate(new Date(year, month, (occurrence < 0 ? Holiday.daysInMonth(month, year) : 1), 0, 0, 0), dayOfWeek, occurrence, true);
    }

    //Returns a date & time a light pattern and/or image will activate for a holiday, based on the actual date of the holiday and the number of lead-in days subtracted from it
    getLeadInDate(year) {
        var returnDate = this.getDate(year);
        returnDate.setDate(returnDate.getDate() - this.leadInDays);
        return returnDate;
    }

    //Returns the final date & time a light pattern and/or image will be active for a holiday, based on the actual date of the holiday and the number of lead-out days added to it; the light pattern and/or image will immediately deactivate on midnight leading into the next day
    getLeadOutDate(year) {
        var returnDate = this.getDate(year);
        returnDate.setDate(returnDate.getDate() + this.leadOutDays);
        return returnDate;
    }

    //Determines if a specified numbered year is a leap year
    //TODO: Add validation of 'year' value
    static isLeapYear(year) { return (year % 400 == 0) || ((year % 4 == 0) && !(year % 100 == 0)); }
}

/*Represents a holiday that occurs on a specified day of the week in relation to a specified date, such as Victoria Day in Canada which occurs on the
Monday before May 25th*/
class ContingentOnDateHoliday extends Holiday {
    constructor(name, pattern, month, dayOfMonth, dayOfWeek, occurrence, includeDateInQuestion, leadInDays, leadOutDays) {
        super(name, pattern, leadInDays, leadOutDays);
        //Note: The next two parameters replaced a JavaScript Date object (referenceDate) so that the class does not locally cache a year, which is to be supplied on an ad hoc basis when the getDate method is called
        this.month = month;
        this.dayOfMonth = dayOfMonth;
        this.dayOfWeek = dayOfWeek;
        this.occurrence = occurrence;
        this.includeDateInQuestion = includeDateInQuestion;
    }

    //Method from Holiday class overriden; uses algorithm unique to subclass to compute date
    getDate(year) { return Holiday.getDateRelativeToDate(new Date(year, this.month, this.dayOfMonth, 12), this.dayOfWeek, this.occurrence, this.includeDateInQuestion); }

    static isJSONObjectValid(jsonHoliday) {
        return (typeof jsonHoliday.includeDateInQuestion == "boolean") &&
        (typeof jsonHoliday.month == "number") &&
        (typeof jsonHoliday.date == "number");
    }
}

/*Represents a holiday that occurs on a set number of days from another holiday, such as Mardi Gras (Shrove Tuesday)
which occurs exactly forty-seven days before Easter or Christmas Eve which occurs exactly one day before Christmas*/
class ContingentOnDateByOffsetHoliday extends Holiday {
    //TODO: Override getLeadInDate and getLeadOutDate methods
    constructor(name, pattern, referenceHoliday, offset, leadInDays, leadOutDays) {
        super(name, pattern, leadInDays, leadOutDays);
        this.referenceHoliday = referenceHoliday;
        this.offset = offset;
    }

    //Method from Holiday class overriden; uses algorithm unique to subclass to compute date
    getDate(year) {
        var returnDate = new Date(this.referenceHoliday.getDate(year));
        returnDate.setDate(returnDate.getDate() + this.offset);
        return returnDate;
    }

    static isJSONObjectValid(jsonHoliday) { return (typeof jsonHoliday.referenceHoliday == "string") && (typeof jsonHoliday.offset == "number"); }
}

/*Represents a holiday that occurs on a specified day of the week in a given month based on the numbered occurrence of that day of the week within the month,
such as Mother's Day which occurs on the second Sunday of May, Father's Day which occurs on the third Sunday of June, and Thanksgiving which occurs the
fourth Thursday of November (this is the date of the American Thanksgiving; the Canadian Thanksgiving is on the second Monday of October)*/
class ContingentOnDayOfWeekHoliday extends Holiday {
    constructor(name, pattern, month, dayOfWeek, occurrence, leadInDays, leadOutDays) {
        super(name, pattern, leadInDays, leadOutDays);
        this.month = month;
        this.dayOfWeek = dayOfWeek;
        this.occurrence = occurrence;
    }

    //Method from Holiday class overriden; uses algorithm unique to subclass to compute date
    getDate(year) { return Holiday.getDateRelativeToMonth(year, this.month, this.dayOfWeek, this.occurrence); }

    static isJSONObjectValid(jsonHoliday) {
        return (typeof jsonHoliday.month == "number") &&
        (typeof jsonHoliday.dayOfWeek == "number") &&
        (typeof jsonHoliday.occurrence == "number");
    }
}

/*Represents Easter, the date of which is based on the lunar cycle and requires a special algorithm to calculate. Easter falls on
the first Sunday occurring on or after the first full moon that occurs after the ecclesiastical equinox, which is on March 21st.*/
class Easter extends Holiday {
    constructor(pattern, leadInDays, leadOutDays) {
        super("Easter", pattern, leadInDays, leadOutDays);
        this.leadInDays = leadInDays;
        this.leadOutDays = leadOutDays;
    }

    getDate(year) { return Holiday.getEaster(year); }

    //Note: The Easter class does not have any additional parameters to those in the Holiday superclass, so no overrriding JSON validation method (isJSONObjectValid) is required here
}

//Represents a holiday that has a specific date within a given month that does not change, such as Valentine's Day which occurs on February 14th and Saint Patrick's Day which occurs on March 17th
class FixedHoliday extends Holiday {
    constructor(name, pattern, month, dayOfMonth, leadInDays, leadOutDays) {
        super(name, pattern, leadInDays, leadOutDays);
        this.month = month;
        this.dayOfMonth = dayOfMonth;
    }

    getDate(year) { return new Date(year, this.month, this.dayOfMonth); }

    static isJSONObjectValid(jsonHoliday) { return (typeof jsonHoliday.month == "number") && (typeof jsonHoliday.date == "number"); }
}

//Represents a collection of defined holidays and their respective light patterns, mapped to one another
class HolidayCollection {
    constructor(logWriter) {
        //A LogWriter instance is required here because this class reads external JSON data and errors need to be posted for invalid data accordingly (e.g. a holiday missing a name, missing color patterns, etc.)
        this.logWriter = logWriter;
        this.holiday = [];
        this.pattern = [];
    }

    generateFromJSON(jsonObject) {
        //Load the color patterns first so the holiday objects can reference them later in the method
        //TODO: If color subtypes are created, add logic here for mapping to correct subclass accordingly 
        this.pattern = jsonObject.pattern.map(pt => {
            pt.map(ptC => {
                //TODO: Add validation of RGB value here and post error entries for invalid values, replacing with white color (#FFFFFF) accordingly
                return Color.fromHex(ptC);
            });
        });
    }

    //Takes a holiday object from the HolidayList JSON file and creates a proper corresponding Holiday JavaScript object based on the parameters contained therein
    createHolidayObject(holiday, pattern) {
        //First check that the supplied JSON holiday object has a name, number of lead-in days, and number of lead-out days
        if ('name' in holiday && 'leadInDays' in holiday && 'leadOutDays' in holiday) {
            
            //Set the holiday as a 'contingent on date' holiday if a month, date (day of month), day of week, numbered occurrence, and 'include date in question' flag
            //are provided; although less common, this type of holiday needs to be checked for first because it contains the most parameters
            if ('month' in holiday && 'date' in holiday && 'dayOfWeek' in holiday && 'occurrence' in holiday && 'includeDateInQuestion') { return new ContingentOnDateHoliday(holiday.name, pattern, holiday.month, holiday.date, holiday.dayOfWeek, holiday.occurrence, holiday.includeDateInQuestion, holiday.leadInDays, holiday.leadOutDays); }
            //Set the holiday as a fixed holiday if a month and date are supplied
            else if ('month' in holiday && 'date' in holiday) { return new FixedHoliday(holiday.name, pattern, holiday.month, holiday.date, holiday.leadInDays, holiday.leadOutDays); }
            //Set the holiday as a 'contingent on day of week' holiday if a month, day of week, and numbered occurrence of said day of week are supplied
            else if ('month' in holiday && 'dayOfWeek' in holiday && 'occurrence' in holiday) { return new ContingentOnDayOfWeekHoliday(holiday.name, pattern, holiday.month, holiday.dayOfWeek, holiday.occurrence, holiday.leadInDays, holiday.leadOutDays); }
            //Set the holiday as Easter if the 'getEaster' flag is set
            else if ('getEaster' in holiday && 'getEaster') { return new Easter(pattern, holiday.leadInDays, holiday.leadOutDays); }
            
            //TODO: Add logic to compute contingent holidays based on date & offset here
        }
        else {}
    }
}

//Represents an RGB-based color value that gets transmitted to a capable DMX512/RDM/Art-Net light device
//TODO: Review adding subclasses, component classes, or optional parameters that account for values in addition to RGB that may be needed, such as white, lime, or color temperature values that are used in Iluminarc devices
class Color {
    static fromHex(hexString) {
        const RE_HEX_COLOR_VALUES = /[0-9a-fA-F]{2}/g;
        //TODO: Evaluate use of regular expression /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i instead of existing one to see if more viable
        //See https://codingbeautydev.com/blog/javascript-convert-hex-to-decimal/ for more info

        //First get the hexadecimal red, green, and blue color values from provided string, then convert each one from hexadecimal to decimal
        var colorArray = hexString.match(RE_HEX_COLOR_VALUES).map(ca => (parseInt(ca, 16)));
        return Color.fromRGB(colorArray[0], colorArray[1], colorArray[2]);
    }
    static fromRGB(red, green, blue) {
        color = new Color();
        color.red = red ?? 0;
        color.green = green ?? 0;
        color.blue = blue ?? 0;
        return color;
    }

    //Used in conjunction with isOverCharacterLimit to validate incoming color string stored in JSON; uses a regular expression to check for a usable CSS-style hexadecimal RGB value (#RRGGBB)
    static hasValidRRGGBBString(rgbString) {
        //Regular expression that makes sure that a provided string has a single, complete, six-digit hexadecimal string, complete with a pound sign at the beginning, but not necessarily enforcing upper-case letters
        //NOTE: The global flag is not set here because this method only tests for one valid '#RRGGBB' string; Use in conjunction with method 'isOverCharacterLimit' to determine if excessive, unnecessary characters are present
        const RE_VALID_POUNDRRGGBB_STRING = /#[0-9A-F]{6}/i;
        return RE_VALID_POUNDRRGGBB_STRING.test(rgbString);
    }

    //Used in conjunction with isOverCharacterLimit to validate incoming color string stored in JSON; checks for excess data in the #RRGGBB color string in order to post a warning in the application log
    static isOverCharacterLimit(rgbString) { return rgbString.length > 7; }

    //Returns a string of the red, green, and blue color values in hexadecimal, in CSS RGB notation (#rrggbb)
    toHex() { return `#${this.red.toString(16).padStart(2, "0")}${this.green.toString(16).padStart(2, "0")}${this.blue.toString(16).padStart(2, "0")}`; }
}

//Represents an array of one or more Color objects used for creating distinct color patterns in a string of lights; uses modulo-arithmetic to repeat color pattern to indefinite length based on number of lights in string
class Pattern {
    constructor(colorArray) { this.colorArray = colorArray; }
    //TODO: Test that Color objects are created properly from absorbed JSON data
    static fromHexArray(hexArray) { return new Pattern(hexArray.map(Color.fromHex)); }
    //Creates a new Pattern array based on a pattern array provided in JSON form
    //TODO: Add JSON validation code here along with statements writing errors and warnings to the LogWriter instance
    static generateCollectionFromJSON(jsonPatternArray) {
        return jsonPatternArray.map(pattern => {
            return Pattern.fromHexArray(pattern);
        });
    }
    getColorAtPosition(position) { return this.colorArray[position % this.colorArray.length]; }
    getLength() { return this.colorArray.length; }
}

module.exports = {
    Easter: Easter,
    Holiday: Holiday,
    HolidayCollection: HolidayCollection,
    ContingentOnDateHoliday: ContingentOnDateHoliday,
    ContingentOnDateByOffsetHoliday: ContingentOnDateByOffsetHoliday,
    ContingentOnDayOfWeekHoliday: ContingentOnDayOfWeekHoliday,
    FixedHoliday: FixedHoliday
}