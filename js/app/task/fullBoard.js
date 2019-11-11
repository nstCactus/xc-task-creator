/**
 * @file
 * Full Board Module for the task Creator.
 */
define(['jquery', 'app/helper', 'app/param', 'rejs!task/templates/fullboardTurnpoint', 'rejs!task/templates/fullboard'],
  function ($, helper, param, turnpointTemplate, fullTemplate) {

    var link = $("#full-board");
    var link1 = $("#export-task");
    var linkPrint = $("#print-task");

    link.click(function (e) {
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('openTaskFullBoard', false, false, {});
      document.dispatchEvent(e);
    });


    linkPrint.click(function (e) {
      console.log("print");
      // html2canvas(document.body).then(function (canvas) {
      //   document.body.appendChild(canvas);
      // });  task-config



    });


    var toggleLink = function (bool) {
      (bool == true) ? link.removeClass('hide') : link.addClass('hide');
      (bool == true) ? link1.removeClass('hide') : link1.addClass('hide');
      (bool == true) ? linkPrint.removeClass('hide') : linkPrint.addClass('hide');
    }

    var open = function (task) {
      var content = build(task);

    }


    $(document).on('click', '#print-task', function (e) {

      const filename = 'task.pdf';
      var tc = document.querySelector('#task-config');
      // tc.style.left = "0px"; 
      $('#task-config').css({
        position: 'fixed',
        left: 0,
        top: 0,
      });
      html2canvas(tc, {
        // scale: 3,
        width: 2481,
        height: 3507,
        backgroundColor: "#FFFFFF",
        // x: 630,
        // y: 20,
      }

      ).then(canvas => {
        //document.body.appendChild(canvas);
        var image = canvas.toDataURL('image/png');
        window.open(image);
        let pdf = new jsPDF('p', 'mm', 'a4');
        // pdf.addImage(image, 'PNG', 0, 0, 297, 210);
        // pdf.save(filename);
      });
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
        if (type == 'end-of-speed-section' || type == 'goal' || type == 'takeoff' || type == 'start') {
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

