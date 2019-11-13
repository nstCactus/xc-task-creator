/**
 * @file
 * Task Module for the task creator.
 */
define(['task/taskBoard', 'task/turnpoint', 'task/fullBoard', 'task/fullBoard2', 'app/param', 'task/taskOptimiser', 'task/taskAdvisor', 'task/taskExporter'],
  function (taskBoard, Turnpoint, fullBoard, fullBoard2 , param, optimizer, taskAdvisor, taskExporter) {
    var turnpoints = [];
    var taskInfo = param.task.default;
    taskInfo.id = 0;

    //localStorage.clear()


    var taskInformation = localStorage.getItem('taskInformation');
    if (taskInformation != null) {
      param.task.default.info = taskInformation;
    }

 

    var addTurnpoint = function (waypoint, turnpointInfo) {
      var turnpoint = new Turnpoint(waypoint);
      turnpointInfo.index = turnpoints.length;
      turnpoint.setTurnpoint(turnpointInfo);
      turnpoints.push(turnpoint);
      taskAdvisor.turnpointCheck(turnpoint, turnpoints);
      if (turnpointInfo.type == 'start' && turnpointInfo.ngates != undefined) {
        taskInfo.ngates = turnpointInfo.ngates;
        taskInfo.gateint = turnpointInfo.gateint;
      }
      taskChange();
    }

    var editTurnpoint = function (info) {
      turnpoints[info.index].setTurnpoint(info);
      taskAdvisor.turnpointCheck(turnpoints[info.index], turnpoints);
      if (info.type == 'start') {
        taskInfo.ngates = info.ngates;
        taskInfo.gateint = info.gateint;
      }
      taskChange();
    }

    var removeTurnpoint = function (index) {
      turnpoints.splice(index, 1);
      reorderTurnpoints();
      taskChange();
    }

    var getTurnpoints = function () {
      return turnpoints;
    }

    var getTaskInfo = function () {
      return taskInfo;
    }

    function taskChange() {
      for (let i = 0; i < turnpoints.length; i++) {
        taskAdvisor.turnpointCheck(turnpoints[i], turnpoints);
      }

      (turnpoints.length > 0) ? fullBoard.toggleLink(true) : fullBoard.toggleLink(false);
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('taskChange', false, false, {
        turnpoints: turnpoints,
        taskInfo: taskInfo,
      });
      document.dispatchEvent(e);
    }

    var onClearWaypointFile = function (e) {
      var filename = e.detail.filename;
      var nb = 0;
      for (var i = 0; i < turnpoints.length; i++) {
        if (turnpoints[i].filename == filename) {
          turnpoints.splice(i, 1);
          i--;
          nb++;
        }
      }
      if (nb > 0) {
        taskChange();
      }
    }

    var onAddTurnpoint = function (e) {
      var waypoint = e.detail.waypoint;
      var turnpointInfo = e.detail.turnpointInfo;
      addTurnpoint(waypoint, turnpointInfo);
    }

    var onRemoveTurnpoint = function (e) {
      var index = e.detail.index;
      removeTurnpoint(index);
    }

    var onEditTurnpoint = function (e) {
      var info = e.detail.info;
      editTurnpoint(info);
    }

    var reorderTurnpoints = function () {
      for (var i = 0; i < turnpoints.length; i++) {
        var turnpoint = turnpoints[i];
        turnpoint.index = i;
      }
    }

    var onReorderTurnpoint = function (e) {
      var oldIndex = e.detail.oldIndex;
      var index = e.detail.index;
      var turnpoint = turnpoints[oldIndex];
      turnpoints.splice(oldIndex, 1);
      turnpoints.splice(index, 0, turnpoint);
      reorderTurnpoints();
      taskChange();
    }

    var onOpenTaskFullBoard = function (e) {
      fullBoard.open({
        turnpoints: turnpoints,
        taskInfo: taskInfo,
      });
    }


    var onOpenTaskFullBoard2= function (e) {
      fullBoard2.open({
        turnpoints: turnpoints,
        taskInfo: taskInfo,
      });
    }

    var onchangeTaskNumber = function (e) {
      var forward = e.detail.forward;
      if (forward) {
        taskInfo.num++;
      }
      else {
        taskInfo.num--;
      }
      taskInfo.turn = (taskInfo.num % 2 == 0) ? 'right' : 'left';

      taskChange();
    }


    var onchangeTaskTurn = function (e) {
      if (taskInfo.turn == "left") {
        taskInfo.turn = "right";
      }
      else {
        taskInfo.turn = "left";
      }
      taskChange();
    }

    var onchangeTaskDate = function (e) {
      var date = e.detail.date;
      taskInfo.date = date;
      taskChange();
    }

    var onchangeTaskInfo = function (e) {
      var info = e.detail.info;
      taskInfo.info = info;
      localStorage.setItem('taskInformation', info);
      //taskChange();
    }

    var onTaskChanged= function (e) {
      taskChange();
    }

    var onTaskEdit = function (e) {
      var newTask = e.detail.newTask;
      taskInfo.num = newTask.num;
      taskInfo.type = newTask.type
    }

    var onTaskDelete = function (e) {
      turnpoints = [];
      taskInfo = param.task.default;
      taskChange();
    }

    var drawCourse = function (google, map) {
      var opti = optimizer.optimize(google, map, turnpoints);
      for (var e in opti) {
        taskInfo[e] = opti[e];
      }
      taskBoard.rebuildTask(turnpoints, taskInfo);
    }

    var onTaskExport = function (e) {
      $('#task-config').modal('hide');
      taskExporter.build(turnpoints, taskInfo);
    }

    var onTaskSave = function (geocoder, google) {
      $('#task-config').modal('hide');
      taskExporter.save(turnpoints, taskInfo);
    }

    var onNewTask = function (e) {
      var waypoints = e.detail.waypoints;
      var tps = e.detail.task.turnpoints;
      taskInfo = e.detail.task;
      taskInfo.info = param.task.default.info;
      taskInfo.turn = taskInfo.date.substr(0, 2) % 2 == 0 ? "Right" : "Left";
      if (tps) {
        for (var i = 0; i < tps.length; i++) {
          addTurnpoint(tps[i].waypoint, tps[i]);
        }
      }
    }

    var onFinalExportTask = function (e) {
      taskExporter.exporter(turnpoints, taskInfo, e.detail.format);
    }

    var setBbox = function (bbox) {
      taskInfo.bbox = bbox;
    }

    //document.addEventListener('filenameRemoved', onTaskDelete);
    document.addEventListener('addTurnpoint', onAddTurnpoint);
    document.addEventListener('editTurnpoint', onEditTurnpoint);
    document.addEventListener('removeTurnpoint', onRemoveTurnpoint);
    document.addEventListener('clearWaypointFile', onClearWaypointFile);
    document.addEventListener('reorderTurnpoint', onReorderTurnpoint);
    document.addEventListener('openTaskFullBoard', onOpenTaskFullBoard);
    document.addEventListener('editTask', onTaskEdit);
    document.addEventListener('deleteTask', onTaskDelete);
    document.addEventListener('exportTask', onTaskExport);
    document.addEventListener('finalExportTask', onFinalExportTask);
    document.addEventListener('newTask', onNewTask);
    document.addEventListener('saveTask', onTaskSave);
    document.addEventListener('changeTaskNumber', onchangeTaskNumber);
    document.addEventListener('changeTaskTurn', onchangeTaskTurn);
    document.addEventListener('changeTaskDate', onchangeTaskDate);
    document.addEventListener('changeTaskInfo', onchangeTaskInfo);
    document.addEventListener('taskChanged', onTaskChanged);
    document.addEventListener('openTaskFullBoard2', onOpenTaskFullBoard2);


    
    return {
      'addTurnpoint': addTurnpoint,
      'editTurnpooint': editTurnpoint,
      'removeTurnpoint': removeTurnpoint,
      'getTurnpoints': getTurnpoints,
      'delete': onTaskDelete,
      'drawCourse': drawCourse,
      'setBbox': setBbox,
      'getTaskInfo': getTaskInfo,
    }
  });
