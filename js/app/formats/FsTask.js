/**
  @file
  Task importer for the task creator.
  **/
define(['rejs!formats/export/FsTask'], function (exportFsTask) {
  var date = new Date();
  var day = date.getUTCDate();
  Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
  }

  var check = function (text, filename) {
    if (filename.split('.').pop() == 'fstask') {
      return true;
    }
    return false;
  }

  var parse = function (text, filename) {

    var tps = [];
    var wps = [];

    var x2js = new X2JS();
    var jsonObj = x2js.xml_str2json(text);
    var ss = jsonObj.FsTask.FsTaskDefinition._ss;
    var es = jsonObj.FsTask.FsTaskDefinition._es;
    var stop_time = jsonObj.FsTask.FsTaskState._stop_time;

    var FsTurnpoints = jsonObj.FsTask.FsTaskDefinition.FsTurnpoint;
    var FsStartGates = jsonObj.FsTask.FsTaskDefinition.FsStartGate;

    for (let i = 0; i < FsTurnpoints.length; i++) {
      var tp = {};

      tp['index'] = i;
      tp['radius'] = Number(FsTurnpoints[i]._radius);
      tp['open'] = FsTurnpoints[i]._open;
      tp['close'] = FsTurnpoints[i].close;
      tp['goalType'] = "cylinder";
      tp['mode'] = "entry";

      if (i == 0) {
        tp['type'] = 'takeoff';
      }
      else if (i + 1 == ss) {
        tp['type'] = 'start';
      }
      else if (i + 1 == es) {
        tp['type'] = 'end-of-speed-section';
      }
      else if (i + 1 == FsTurnpoints.length) {
        tp['type'] = 'goal';
      }
      else {
        tp['type'] = 'turnpoint';
      }




      var wp = {
        filename: filename,
        id: FsTurnpoints[i]._id,
        name: FsTurnpoints[i]._id,
        type: 1,
        x: FsTurnpoints[i]._lat,
        y: FsTurnpoints[i]._lon,
        z: FsTurnpoints[i]._altitude,
      }
      wps.push(wp);
      tp.wp = wp;
      tps.push(tp);
    }

    // console.log(JSON.stringify(tps, undefined, 2)) 
    // console.log(JSON.stringify(wps, undefined, 2)) 

    return {
      'task': {
        'date': '',
        'type': '',
        'num': 1,
        'ngates': 1,
        'gateint': 15,
        'turnpoints': tps,
      },
      'waypoints': wps,
    }
  }

  var exporter = function (turnpoints, taskInfo) {
    var times = [];
    var starts = [];

    var time = {
      open: turnpoints[0].open,
      close: turnpoints[0].close
    };
    times.push(time);

    var time = {
      open: turnpoints[1].open,
      close: turnpoints[turnpoints.length - 1].close
    };
    times.push(time);

    for (let i = 2; i < turnpoints.length; i++) {
      var time = {
        open: turnpoints[1].open,
        close: turnpoints[turnpoints.length - 1].close
      };
      times.push(time);
    }

    starts.push([turnpoints[1].open]);
    let h = Number(turnpoints[1].open.split(':')[0]);
    let m = Number(turnpoints[1].open.split(':')[1]);
    for (let i = 1; i < taskInfo.ngates; i++) {
      m += Number(taskInfo.gateint);
      if (m >= 60) {
        m -= 60;
        h++;
      }
      starts.push(h.pad(2) + ":" + m.pad(2))
    }

    var theDate = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1).pad(2) + '-' + day.pad(2)

    var data = exportFsTask({
      turnpoints: turnpoints,
      taskInfo: taskInfo,
      thedate: theDate,
      UTCOffset: '+02',
      times: times,
      FsScoreFormula: '',
      starts: starts,
      taskID: '1',
    });
    return new Blob([data], { 'type': "text/xml" });
  }

  return {
    'check': check,
    'exporter': exporter,
    'extension': '.fstask',
    'name': 'FsTask',
    'parse': parse,
  }
});
