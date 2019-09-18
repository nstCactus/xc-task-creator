/**
 @file
 Task importer / exporter for XCTrack
 **/
define(['rejs!formats/export/xctrack'], function (exportXCTrack) {
  var converter = {
    "race-to-goal": "RACE",
    "entry": "ENTER",
  }

  var check = function (text, filename) {
    if (filename.split('.').pop() == 'xctsk') {
      return true;
    }
    return false;
  }

  var parse = function (text, filename) {
    var lookupType = { "TAKEOFF":"takeoff",
                        "SSS":"start",
                        "ESS":"end-of-speed-section"
    }

    // type : ['takeoff', 'start', 'turnpoint', 'end-of-speed-section', 'goal'],

    var obj = JSON.parse(text);
    var wpts = obj.turnpoints;
    var tps = [];
    var wps = [];

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




      tp.wp = wp;

      tp['close']  = '00:00:00';
      tp['goalType']  = 'cylinder';
      tp['index']  = i;
      tp['mode']  = 'entry';
      tp['open']  = '00:00:00';
      tp['radius']  = wpts[i].radius;


      if ( wpts[i].hasOwnProperty('type') ) {
        tp.type = lookupType[ wpts[i].type];
      }
      else {
        if ( i==wpts.length-1 ) {
          tp.type = "goal";
        }
        else {
          tp.type = "turnpoint";
        }
      }

      wps.push(wp);
      tp.wp = wp;
      tps.push(tp);

    }


    return {
      'task': {
        'date': '',
        'type': 'race-to-goal',
        'num': 1,
        'turnpoints': tps,
      },
      'waypoints': wps,
    }

  }

  var exporter = function (turnpoints, taskInfo) {
    var xcInfo = {};
    for (var i = 0; i < turnpoints.length; i++) {
      if (turnpoints[i].type == "start") {
        xcInfo.timeGates = turnpoints[i].open;
        xcInfo.type = converter[taskInfo.type] ? converter[taskInfo.type] : taskInfo.type;;
        xcInfo.direction = converter[turnpoints[i].mode] ? converter[turnpoints[i].mode] : turnpoints[i].mode;
      }
    }
    for (var i = 0; i < turnpoints.length; i++) {
      if (turnpoints[i].type == "goal") {
        xcInfo.deadline = turnpoints[i].close;
        xcInfo.goalType = converter[turnpoints[i].goalType] ? converter[turnpoints[i].goalType] : turnpoints[i].goalType;
      }
    }
    var data = exportXCTrack({
      turnpoints: turnpoints,
      taskInfo: taskInfo,
      xcInfo: xcInfo
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
