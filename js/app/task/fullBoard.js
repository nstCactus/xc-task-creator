/**
 * @file
 * Full Board Module for the task Creator.
 */
define(['jquery', 'app/helper', 'app/param', 'rejs!task/templates/fullboardTurnpoint', 'rejs!task/templates/fullboard'],
function($, helper, param, turnpointTemplate, fullTemplate) {
  var link = $("#full-board");
  var link1 = $("#export-task");
 
  link.click(function(e) {
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('openTaskFullBoard', false, false, {});
    document.dispatchEvent(e);
  });

  var toggleLink = function(bool) {
    (bool == true) ? link.removeClass('hide') : link.addClass('hide');
    (bool == true) ? link1.removeClass('hide') : link1.addClass('hide');

  }

  var open = function(task) {
    var content = build(task);
     
  }
  
  function printElement(elem) {
    var domClone = elem;
    var $printSection = document.getElementById("printSection");
    if (!$printSection) {
      var $printSection = document.createElement("div");
      $printSection.id = "printSection";
      document.body.appendChild($printSection);
    }
    $printSection.innerHTML = "";
    $printSection.appendChild(domClone);
    window.print();
  }

  $(document).on('click', '#print-task', function(e) {


    var mywindow = window.open('', 'PRINT', 'height=500,width=500');

    mywindow.document.write('<html><head><title>' + document.title  + '</title>');
    mywindow.document.write('<script data-main="js/app" src="bower_components/requirejs/require.js"></script>');
    mywindow.document.write('<link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.min.css">');
    mywindow.document.write('<link rel="stylesheet" href="bower_components/font-awesome/css/font-awesome.min.css">');
    mywindow.document.write('<link rel="stylesheet" type="text/css" href="css/style.css">');
    mywindow.document.write('<link rel="stylesheet" type="text/css" href="bower_components/jGrowl/jquery.jgrowl.css">');
    mywindow.document.write('<link rel="stylesheet" type="text/css" href="js/lib/jquery-ui-1.11.0.custom/jquery-ui.css">');
    mywindow.document.write('<link rel="stylesheet" type="text/css" href="js/lib/jquery-ui-1.11.0.custom/jquery-ui.structure.css"></link>');

    mywindow.document.write('</head><body >');

    mywindow.document.write('<div id="task-config" >');


    mywindow.document.write(document.getElementById("task-config").innerHTML);

    mywindow.document.write('</div>');

    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

    //mywindow.print();
    //mywindow.close();

    // printElement(document.getElementById("task-config"));
    $("#task-config").modal('hide')
  });


  $(document).on('click', '#edit-task', function(e) {
    var form = collectForm();
    var e = document.createEvent("customEvent");
    e.initCustomEvent('editTask', false, false, {
      newTask : form,
    });
    document.dispatchEvent(e);
    $("#task-config").modal('hide')
  });
  
  $(document).on('click', '#delete-task', function(e) {
    var e = document.createEvent("customEvent");
    e.initCustomEvent('deleteTask', false, false, {});
    document.dispatchEvent(e);
    $("#task-config").modal('hide')
  });
 
  $(document).on('click', '#export-task', function(e) {
    var e = document.createEvent("customEvent");
    e.initCustomEvent('exportTask', false, false, {});
    document.dispatchEvent(e);
  });
  
  $(document).on('click', '#save-task', function(e) {
    var e = document.createEvent("customEvent");
    e.initCustomEvent('saveTask', false, false, {});
    document.dispatchEvent(e);
  });

  $(document).on('click', '#task-config .turnpoint', function(e) {
    var index = $(this).attr('index');
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('openMapTurnpointConfig', false, false, {
      index: index,
    }); 
    document.dispatchEvent(e);
    $("#task-config").modal('hide')
  });

  var build = function(task) {
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
        turnpoint : turnpoints[i],
        taskInfo : taskInfo
      }));
      if (type == 'end-of-speed-section' || type == 'goal' || type == 'takeoff' || type == 'start' ) {
        $("#fullboard-" + type + "-close").html(turnpoints[i].close);
        $("#fullboard-" + type + "-open").html(turnpoints[i].open);
      } 
    }
    
    // Show it via modal.
    $("#task-config").modal();
  }
  
  function collectForm() {
    return {
      num : $("#fullboard-num-select").val(),
      type : $("#fullboard-type-select").val(),
    }
  }

  return {
    toggleLink : toggleLink,
    open : open,
  }
});

