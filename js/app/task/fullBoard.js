/**
 * @file
 * Full Board Module for the task Creator.
 */
define(['jquery', 'app/helper', 'app/param', 'html2canvas', 'rejs!task/templates/fullboardTurnpoint', 'rejs!task/templates/fullboard'],
  function ($, helper, param, html2canvas, turnpointTemplate, fullTemplate) {

    var link = $("#full-board");
    var link1 = $("#export-task");
    var linkPrint = $("#print");
    var link2 = $("#full-board2");
    var publish = $("#publish-task");


    link.click(function (e) {
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('openTaskFullBoard', false, false, {});
      document.dispatchEvent(e);
    });


    linkPrint.click(function (e) {
      window.print();
    });


    var toggleLink = function (bool) {
      (bool == true) ? link2.removeClass('hide') : link2.addClass('hide');
      (bool == true) ? link.removeClass('hide') : link.addClass('hide');
      (bool == true) ? link1.removeClass('hide') : link1.addClass('hide');
      (bool == true) ? linkPrint.removeClass('hide') : linkPrint.addClass('hide');
      (bool == true) ? publish.removeClass('hide') : publish.addClass('hide');
    }

    var open = function (task) {
      var content = build(task);

    }


    function printElement(elem) {
      var domClone = elem.cloneNode(true);

      var $printSection = document.getElementById("printSection");

      if (!$printSection) {
        var $printSection = document.createElement("div");
        $printSection.id = "printSection";
        document.body.appendChild($printSection);
      }

      $printSection.innerHTML = "";
      $printSection.appendChild(domClone);
      window.print();
      $printSection.innerHTML = '';

    }


    $(document).on('click', '#print-task', function (e) {

      var tc = document.querySelector('#task-config');
      document.body.style.visibility = "hidden";
      printElement(tc);
      document.body.style.visibility = "visible";
      $("#task-config").modal('hide')

    });



    $(document).on('click', '#edit-task', function (e) {
      var form = collectForm();
      var e = document.createEvent("customEvent");
      e.initCustomEvent('editTask', false, false, {
        newTask: form,
      });
      document.dispatchEvent(e);
      $("#task-config").modal('hide')
    });

    $(document).on('click', '#delete-task', function (e) {
      var e = document.createEvent("customEvent");
      e.initCustomEvent('deleteTask', false, false, {});
      document.dispatchEvent(e);
      $("#task-config").modal('hide')
    });

    $(document).on('click', '#export-task', function (e) {
      var e = document.createEvent("customEvent");
      e.initCustomEvent('exportTask', false, false, {});
      document.dispatchEvent(e);
    });

    $(document).on('click', '#save-task', function (e) {
      var e = document.createEvent("customEvent");
      e.initCustomEvent('saveTask', false, false, {});
      document.dispatchEvent(e);
    });

    $(document).on('click', '#publish-task', function (e) {
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('publishTask', false, false, {});
      document.dispatchEvent(e);
    });

    $(document).on('click', '#task-config .turnpoint', function (e) {
      var index = $(this).attr('index');
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('openMapTurnpointConfig', false, false, {
        index: index,
      });
      document.dispatchEvent(e);
      $("#task-config").modal('hide')
    });

    var build = function (task) {

      html2canvas(document.querySelector('#map-canvas'), {
        useCORS: true,
        scale: 1,
        backgroundColor: "#FFFFFF",
      }).then(canvas => {
        var image = canvas.toDataURL('image/png');
        document.getElementById("task_map").src = image;
      });


      // Refresh Fullboard Template.
      $("#task-config").remove();
      var content = fullTemplate({});
      $('body').append(content);

      // Grab some usefull variable. 
      var turnpoints = task.turnpoints;
      var taskInfo = task.taskInfo;
      var taskType = helper.formatOptions(param.task.allowed.type, taskInfo.type);
      var taskNum = helper.formatOptions(param.task.allowed.num, taskInfo.num);
      var turn = (taskInfo.turn == 'right') ? '&#8635' : '&#8634';

      // Populate the fullboard.
      $("#fullboard-type-select").html(taskType);
      $("#fullboard-num-select").html(taskNum);
      $("#fullboard-date span").html(task.taskInfo.date);
      $("#fullboard-arrow").html(turn);
      $("#fullboard-turn-word").html(taskInfo.turn);
      $("#fullboard-distance").html(Math.round(taskInfo.distance) / 1000 + " Km");

      for (var i = 0; i < turnpoints.length; i++) {
        var type = turnpoints[i].type;
        $("#fullboard-" + type + " ol").append(turnpointTemplate({
          turnpoint: turnpoints[i],
          taskInfo: taskInfo
        }));

        var g = "";
        if (taskInfo.ngates > 1) {
          g = " Gates: " + taskInfo.ngates + "  +" + taskInfo.gateint + "m";
        }
        if (type == 'start') {
          $("#fullboard-" + type + "-open").html(turnpoints[i].open + g);
        }

        if (type == 'goal' || type == 'takeoff') {
          $("#fullboard-" + type + "-close").html(turnpoints[i].close);
          $("#fullboard-" + type + "-open").html(turnpoints[i].open);
        }


      }

      // Show it via modal.
      $("#task-config").modal();
    }

    function collectForm() {
      return {
        num: $("#fullboard-num-select").val(),
        type: $("#fullboard-type-select").val(),
      }
    }

    return {
      toggleLink: toggleLink,
      open: open,
    }
  });

