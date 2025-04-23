/**
 @file
 Task importer / exporter for XCTrack
 **/
define(['rejs!formats/export/xctrack', 'utils/timeUtils'], function(exportXCTrack, timeUtils) {
    var date = new Date();

    Number.prototype.pad = function(size) {
        var s = String(this);
        while (s.length < (size || 2)) { s = "0" + s; }
        return s;
    }
    var converter = {
        "race-to-goal": "RACE",
        "entry": "ENTER",
    }

    var check = function(text, filename) {
        if (filename.split('.').pop() == 'xctsk') {
            return true;
        }
        return false;
    }

    var parse = function(text, filename) {
        var lookupType = {
            "TAKEOFF": "takeoff",
            "SSS": "start",
            "ESS": "end-of-speed-section"
        }

        var utcOffset = timeUtils.getLocalOffset();

        var obj = JSON.parse(text);
        var wpts = obj.turnpoints;

        var tps = [];
        var wps = [];

        var ngates = 1;
        var gateint = 15;

        for (var i = 0; i < wpts.length; i++) {
            var tp = {};

            var wp = {
                filename: filename,
                id: wpts[i].waypoint.name,
                name: wpts[i].waypoint.description,
                type: 1,
                x: wpts[i].waypoint.lat,
                y: wpts[i].waypoint.lon,
                z: wpts[i].waypoint.altSmoothed,
            }

            tp['close'] = '00:00:00';
            tp['goalType'] = 'cylinder';
            tp['index'] = i;
            tp['mode'] = 'entry';
            tp['open'] = '00:00:00';
            tp['radius'] = wpts[i].radius;

            if (wpts[i].hasOwnProperty('type')) {
                tp.type = lookupType[wpts[i].type];
            } else {
                if (i == wpts.length - 1) {
                    tp.type = "goal";
                } else {
                    tp.type = "turnpoint";
                }
            }
            if (tp.type == "takeoff") {
                tp.open = timeUtils.utcToLocal(String(obj.takeoff.timeOpen).replace('"', '').replace(':00Z', ''), utcOffset);
                tp.close = timeUtils.utcToLocal(String(obj.takeoff.timeClose).replace('"', '').replace(':00Z', ''), utcOffset);
            }
            if (tp.type == "start") {
                var gates = obj.sss.timeGates;
                if (gates.length == 1) {
                    tp.open = timeUtils.utcToLocal(String(gates).replace('"', '').replace(':00Z', ''), utcOffset);
                } else {
                    tp.open = timeUtils.utcToLocal(String(gates[0]).replace('"', '').replace(':00Z', ''), utcOffset);
                    ngates = gates.length;
                    gateint = timeUtils.getTimeDifference(String(gates[0]).replace('"', '').replace(':00Z', ''), String(gates[1]).replace('"', '').replace(':00Z', ''));
                }
                tp.mode = String(obj.sss.direction).toLowerCase();
            }
            if (tp.type == "goal") {
                tp.close = timeUtils.utcToLocal(String(obj.goal.deadline).replace('"', '').replace(':00Z', ''), utcOffset);
            }

            wps.push(wp);;
            tp.wp = wp;
            tps.push(tp);
        }

        // console.log(JSON.stringify(tps, undefined, 2)) 
        // console.log(JSON.stringify(wps, undefined, 2)) 

        return {
            'task': {
                'date': date.getUTCDate().pad(2) + '-' + (date.getUTCMonth() + 1).pad(2) + '-' + date.getUTCFullYear(),
                'type': 'race-to-goal',
                'num': 1,
                'ngates': ngates,
                'gateint': gateint,
                'turnpoints': tps,
            },
            'waypoints': wps,
        }
    }

    var exporter = function(turnpoints, taskInfo) {
        var xcInfo = {};
        for (var i = 0; i < turnpoints.length; i++) {
            if (turnpoints[i].type == "start") {
                xcInfo.timeGates = [];
                const ngates = parseInt(turnpoints[i].ngates, 10) || 1;
                const gateint = parseInt(turnpoints[i].gateint, 10) || 15;
                let openTime = timeUtils.localToUtc(turnpoints[i].open, taskInfo.utcOffset);
                for (let j = 0; j < ngates; j++) {
                    xcInfo.timeGates.push(openTime + ':00Z');
                    openTime = timeUtils.addMinutes(openTime, gateint);
                }
                xcInfo.type = converter[taskInfo.type] ? converter[taskInfo.type] : taskInfo.type;;
                xcInfo.direction = converter[turnpoints[i].mode] ? converter[turnpoints[i].mode] : turnpoints[i].mode;
            }

            if (turnpoints[i].type == "goal") {
                xcInfo.deadline = timeUtils.localToUtc(turnpoints[i].close, taskInfo.utcOffset) + ':00Z';
                xcInfo.goalType = converter[turnpoints[i].goalType] ? converter[turnpoints[i].goalType] : turnpoints[i].goalType;
            }
        }
        var data = exportXCTrack({
            turnpoints: turnpoints,
            taskInfo: taskInfo,
            xcInfo: xcInfo,
            timeUtils: timeUtils,
        });
        return new Blob([data], { 'type': "text/plain" });
    }

    return {
        'check': check,
        'exporter': exporter,
        'extension': '.xctsk',
        'name': 'XCTrack',
        'parse': parse,
    }
});