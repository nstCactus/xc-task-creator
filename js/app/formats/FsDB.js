/**
  @file
  Task importer for the task creator.
  **/
define(['rejs!formats/export/FsTask', 'app/helper', 'jgrowl', 'xml-formatter'], function (exportFsTask, helper, jgrowl, xml_formatter) {

  Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
  }

  var x2js = new X2JS();

  var jsonDB = null;

  var date = new Date();
  var day = date.getUTCDate();
  Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
  }

  var check = function (text, filename) {
    if (filename.split('.').pop() == 'fsdb') {
      return true;
    }
    return false;
  }



  var parse = function (text, filename) {

    var tps = [];
    var wps = [];
    var gateint = 15;
    var ngates = 1;

    jsonDB = x2js.xml_str2json(text);

    $.jGrowl(' Competirion DB  succesfully imported from file : ' + filename + ' !!', {
      header: 'success',
      theme: 'success',
      sticky: false,
      position: 'top-left',
    });

    var tasks = jsonDB.Fs.FsCompetition.FsTasks.FsTask;

    var utc_offset = Number(jsonDB.Fs.FsCompetition._utc_offset);

    var taskN = 0;
    let nt = 1;

    if (tasks != undefined) {
      if ( tasks.length != undefined) {
        nt = tasks.length;
      }
      taskN = window.prompt("Tasks in file : " + nt + "\nSelect task number or cancel not to load a task and just load the competition DB", "1");
    }


    if (isNaN(taskN) || taskN <= 0 || taskN > nt) {
      return;
    }

    let jsonObj ;
    if ( nt ==1 ) {
      jsonObj = tasks;
    }
    else {
      jsonObj = tasks[taskN - 1];
    }
    
    

    var jumpTheGun = Number(jsonObj.FsScoreFormula._jump_the_gun_max);
    var turnpointTollerance = Number(jsonObj.FsScoreFormula._turnpoint_radius_tolerance);

    var ss = jsonObj.FsTaskDefinition._ss;
    var es = jsonObj.FsTaskDefinition._es;
    var stop_time = jsonObj.FsTaskState._stop_time;
    var thedate = stop_time.substring(8, 10) + "-" + stop_time.substring(5, 7) + "-" + stop_time.substring(0, 4);
    var FsTurnpoints = jsonObj.FsTaskDefinition.FsTurnpoint;
    var FsStartGates = jsonObj.FsTaskDefinition.FsStartGate;

    if (Array.isArray(FsStartGates)) {
      ngates = FsStartGates.length;
    }

    if (ngates > 1 && FsStartGates.length > 1) {
      var g1 = FsStartGates[1]._open.substring(11, 13) * 60 + FsStartGates[1]._open.substring(14, 16)
      var g2 = FsStartGates[0]._open.substring(11, 13) * 60 + FsStartGates[0]._open.substring(14, 16)
      gateint = g1 - g2;
    }

    for (let i = 0; i < FsTurnpoints.length; i++) {
      var tp = {};

      tp['index'] = i;
      tp['radius'] = Number(FsTurnpoints[i]._radius);
      tp['open'] = FsTurnpoints[i]._open.substring(11, 16);
      tp['close'] = FsTurnpoints[i]._close.substring(11, 16);
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
        'date': thedate,
        'type': 'race',
        'num': taskN,
        'ngates': ngates,
        'gateint': gateint,
        'turnpoints': tps,
        'utcOffset': utc_offset,
        'jumpTheGun': jumpTheGun,
        'turnpointTollerance': turnpointTollerance,
      },
      'waypoints': wps,
    }
  }


  var exporter = function (turnpoints, taskInfo) {

    if (jsonDB == null) {
      alert("No FsDB database loaded. Before exporting please open one (without loading a task)\nThe task will be added to that database")
      return;
    }

    var UTCOffset = Number(jsonDB.Fs.FsCompetition._utc_offset)
    if (UTCOffset > 0) {
      UTCOffset = "+" + UTCOffset.pad(2);
    }
    else {
      UTCOffset = "+" + UTCOffset.pad(2);
    }
    var FsScoreFormula = x2js.json2xml_str({ FsScoreFormula: jsonDB.Fs.FsCompetition.FsScoreFormula });


    var tasks = jsonDB.Fs.FsCompetition.FsTasks.FsTask;
    var taskN = 0;
    if (tasks != undefined) {
      if ( tasks.length == undefined ) {
        taskN = 1;
      }
      else {
        taskN = tasks.length;
      }
    }

    var taskID = taskN + 1;

    var times = [];
    var starts = [];

    // turnpoints[0] is assumend as Takeoff
    var time = {
      open: turnpoints[0].open,
      close: turnpoints[0].close
    };
    times.push(time);

    // turnpoints[0] is assumend as Start
    var time = {
      open: turnpoints[1].open,
      close: turnpoints[turnpoints.length - 1].close
    };
    times.push(time);

    var es = turnpoints.length;

    for (let i = 2; i < turnpoints.length; i++) {
      if (turnpoints[i].type == 'end-of-speed-section') {
        es = i + 1;
      }
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

    //var theDate = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1).pad(2) + '-' + day.pad(2)
    var theDate = taskInfo.date.substring(6,10) + '-' +  taskInfo.date.substring(3,5) + '-' + taskInfo.date.substring(0,2)

    var data = exportFsTask({
      turnpoints: turnpoints,
      taskInfo: taskInfo,
      thedate: theDate,
      UTCOffset: UTCOffset,
      times: times,
      FsScoreFormula: FsScoreFormula,
      starts: starts,
      taskID: taskID,
      ss: 2,
      es: es,
    });

    var jsonTask = x2js.xml_str2json(data);


    if (jsonDB.Fs.FsCompetition.FsTasks.FsTask == undefined) {
      var empty = { FsTask: new Array };
      jsonDB.Fs.FsCompetition.FsTasks = empty;
    }

    if (jsonDB.Fs.FsCompetition.FsTasks.FsTask.length == undefined ) {
      let t1 = jsonDB.Fs.FsCompetition.FsTasks.FsTask;
      let ar1 = new Array();
      ar1.push(t1);
      jsonDB.Fs.FsCompetition.FsTasks.FsTask = ar1;

    }

    jsonDB.Fs.FsCompetition.FsTasks.FsTask.push(jsonTask.FsTask);


    var xmlAsStr = '<?xml version="1.0" encoding="utf-8"?>' + (x2js.json2xml_str(jsonDB));


    var format = require('xml-formatter');
    var options = { indentation: '  ' };
    var formattedXml = format(xmlAsStr, options).replace(/\n/g, "\r\n");;

    return new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), formattedXml], { 'type': "text/xml" });
  }

  return {
    'check': check,
    'exporter': exporter,
    'extension': '.fsdb',
    'name': 'FsDB',
    'parse': parse,
  }
});
