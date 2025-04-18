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

    return {
        utcOffsets: utcOffsets,
        utcZeroIndex: utcZeroIndex,
        localToUtc: localToUtc,
        utcToLocal: utcToLocal
    }
});