define(function () {
    const utcOffsets = [
        "-12:00",
        "-11:00",
        "-10:00",
        "-09:30",
        "-09:00",
        "-08:00",
        "-07:00",
        "-06:00",
        "-05:00",
        "-04:30",
        "-04:00",
        "-03:30",
        "-03:00",
        "-02:30",
        "-02:00",
        "-01:00",
        "+00:00",
        "+01:00",
        "+02:00",
        "+03:00",
        "+03:30",
        "+04:00",
        "+04:30",
        "+05:00",
        "+05:30",
        "+05:45",
        "+06:00",
        "+06:30",
        "+07:00",
        "+08:00",
        "+08:45",
        "+09:00",
        "+09:30",
        "+10:00",
        "+10:30",
        "+11:00",
        "+12:00",
        "+12:45",
        "+13:00",
        "+13:45",
        "+14:00"
    ];
    
    const utcZeroIndex = utcOffsets.indexOf("+00:00");

    var parseTime = function (time) {
        // Parses a time string, with optional leading '+' or '-' (e.g., "+02:00" or "12:30") into total minutes
        sign = 1;
        index = 0;
        if (time.startsWith('+') || time.startsWith('-')) {
            sign = time[0] === '-' ? -1 : 1;
            index = 1;
        }

        const [hour, minute] = time.slice(index).split(':').map(Number);
        return sign * (hour * 60 + minute);
    }

    var localToUtc = function (localTime, utcOffset) {
        // localTime: "14:09"
        // utcOffset: "+02:00" or "-05:30"
        const localTotalMinutes = parseTime(localTime);
        const offsetTotalMinutes = parseTime(utcOffset);
        let utcTotalMinutes = localTotalMinutes - offsetTotalMinutes;
        utcTotalMinutes = (utcTotalMinutes + 24 * 60) % (24 * 60);
        const utcHour = Math.floor(utcTotalMinutes / 60);
        const utcMinute = utcTotalMinutes % 60;
        return `${utcHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')}`;        
    }

    var utcToLocal = function (utcTime, utcOffset) {
        // utcTime: "14:09"
        // utcOffset: "+02:00" or "-05:30"
        const utcTotalMinutes = parseTime(utcTime);
        const offsetTotalMinutes = parseTime(utcOffset);
        // Add the offset to the UTC time to get local time
        let localTotalMinutes = utcTotalMinutes + offsetTotalMinutes;
        localTotalMinutes = (localTotalMinutes + 24 * 60) % (24 * 60);
        const localHour = Math.floor(localTotalMinutes / 60);
        const localMinute = localTotalMinutes % 60;
        return `${localHour.toString().padStart(2, '0')}:${localMinute.toString().padStart(2, '0')}`;
    }

    var addMinutes = function (time, minutes) {
        // time: "14:09"
        // minutes: 30
        const [hour, minute] = time.split(':').map(Number);
        let totalMinutes = hour * 60 + minute + minutes;
        totalMinutes = (totalMinutes + 24 * 60) % (24 * 60); // Wrap around if it exceeds 24 hours
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;
        return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    }

    var convertUtcOffset = function(offset) {
        // Parse the offset as a float
        const offsetFloat = parseFloat(offset);
    
        // Determine the sign and absolute value
        const sign = offsetFloat >= 0 ? "+" : "-";
        const absoluteOffset = Math.abs(offsetFloat);
    
        // Extract hours and minutes
        const hours = Math.floor(absoluteOffset);
        const minutes = Math.round((absoluteOffset - hours) * 60);
    
        // Format the result as HH:MM with the sign
        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    var getLocalOffset = function () {
        // Get the local timezone offset in minutes
        const localOffset = new Date().getTimezoneOffset();
        // Convert to hours and minutes
        const hours = Math.floor(Math.abs(localOffset) / 60);
        const minutes = Math.abs(localOffset) % 60;
        // Format as "+HH:MM" or "-HH:MM"
        return (localOffset < 0 ? "+" : "-") + String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0');
    }

    var getTimeDifference = function (time1, time2) {
        // time1, time2: "HH:MM"
        const [hour1, minute1] = time1.split(':').map(Number);
        const [hour2, minute2] = time2.split(':').map(Number);
        const totalMinutes1 = hour1 * 60 + minute1;
        const totalMinutes2 = hour2 * 60 + minute2;
        return Math.abs(totalMinutes1 - totalMinutes2);
    }

    return {
        utcOffsets: utcOffsets,
        utcZeroIndex: utcZeroIndex,
        localToUtc: localToUtc,
        utcToLocal: utcToLocal,
        addMinutes: addMinutes,
        convertUtcOffset: convertUtcOffset,
        getLocalOffset: getLocalOffset,
        getTimeDifference: getTimeDifference,
    }
});