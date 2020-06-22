/**
 * @file
 * Full Board2 Module for the task Creator.
 */
define(['jquery', 'simplemodal', 'app/helper', 'app/param', 'rejs!task/templates/fullboard2'],
  function ($, simplemodal, helper, param, fullTemplate) {

    Number.prototype.pad = function (size) {
      var s = String(this);
      while (s.length < (size || 2)) { s = "0" + s; }
      return s;
    }

    var link2 = $("#full-board2");


    link2.click(function (e) {
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('openTaskFullBoard2', false, false, {});
      document.dispatchEvent(e);
    });



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


    $(document).on('click', '#print-task2', function (e) {
      var tc = document.querySelector('#task-config2');
      document.body.style.visibility = "hidden";
      printElement(tc);
      document.body.style.visibility = "visible";
      $("#task-config2").modal('hide')
    });

    function replace(doc, key, value) {
      var el = doc.getElementsByName(key);
      if (el.length == 1) {
        doc.getElementsByName(key)[0].innerHTML = value;
      }

    }


    var build = function (task) {
      // Refresh Fullboard2 Template.


      var turnpoints = task.turnpoints;
      var taskInfo = task.taskInfo;

      if (turnpoints.length == 0) {
        return;
      }


      var taskType = helper.formatOptions(param.task.allowed.type, taskInfo.type);
      var taskNum = helper.formatOptions(param.task.allowed.num, taskInfo.num);

      var windows_open = "";
      var windows_close = "";
      var start_open = "";
      var deadline = "";
      for (var i = 0; i < turnpoints.length; i++) {
        if (turnpoints[i].type == "takeoff") {
          windows_open = turnpoints[i].open;
          windows_close = turnpoints[i].close;
        }
        if (turnpoints[i].type == "goal") {
          deadline = turnpoints[i].close;
        }
        if (turnpoints[i].type == "start") {
          start_open = turnpoints[i].open;
        }
      }


      $("#task-config2").remove();
      var content = fullTemplate({});
      var html = new DOMParser().parseFromString(content, "text/html");



      var textbox = "<input style='border:none;width:95%;font-size:18.0pt;font-weight:700;text-align:center;' value='"  +  taskInfo.num + "'></input>";
      replace(html, "RANGE!A2", textbox);

      //replace(html, "RANGE!A2", taskInfo.num);



      replace(html, "RANGE!B2", taskInfo.date);
      replace(html, "RANGE!F1", taskInfo.turn.toUpperCase());

      replace(html, "RANGE!B3", turnpoints[0].name);
      replace(html, "RANGE!D3", windows_open);
      replace(html, "RANGE!D4", windows_close);

      replace(html, "RANGE!B4", turnpoints[0].z);

      replace(html, "RANGE!F4", deadline);

      replace(html, "RANGE!B5", start_open);



      if (taskInfo.ngates > 1) {
        let h = Number(start_open.split(':')[0]);
        let m = Number(start_open.split(':')[1]);
        m += Number(taskInfo.gateint);
        if (m >= 60) {
          m -= 60;
          h++;
        }
        replace(html, "RANGE!C5", h.pad(2) + ":" + m.pad(2));
        if (taskInfo.ngates > 2) {
          m += Number(taskInfo.gateint);
          if (m >= 60) {
            m -= 60;
            h++;
          }
          replace(html, "RANGE!D5", h.pad(2) + ":" + m.pad(2));
          if (taskInfo.ngates > 3) {
            m += Number(taskInfo.gateint);
            if (m >= 60) {
              m -= 60;
              h++;
            }
            replace(html, "RANGE!E5", h.pad(2) + ":" + m.pad(2));
          }
        }
      }

      let start_index = 7;
      let tp = 1;
      for (let i = 0; i < turnpoints.length; i++) {
        let index = start_index;
        if (turnpoints[i].type == "end-of-speed-section") {
          index = 17;
          replace(html, "RANGE!A" + index, "ESS");
        }
        if (turnpoints[i].type == "goal") {
          index = 18;
          replace(html, "RANGE!A" + index, "GOAL");
          replace(html, "RANGE!D" + index, turnpoints[i].goalType.toUpperCase());
        }
        if (turnpoints[i].type == "start") {
          replace(html, "RANGE!A" + index, "START");
          replace(html, "RANGE!D" + index, turnpoints[i].mode.toUpperCase());
          start_index++;
        }
        if (turnpoints[i].type == "takeoff") {
          replace(html, "RANGE!A" + index, "TAKEOFF");

          start_index++;

        }
        if (turnpoints[i].type == "turnpoint") {
          replace(html, "RANGE!A" + index, "TP" + tp);
          tp++;
          start_index++;
        }

        replace(html, "RANGE!B" + index, turnpoints[i].id);
        replace(html, "RANGE!E" + index, turnpoints[i].radius);

        if (i > 0) {
          replace(html, "RANGE!F" + (index), taskInfo.distances[i - 1].toFixed(1));

        }


      }

      replace(html, "RANGE!F19", (Math.round(taskInfo.distance) / 1000).toFixed(1));


      var textbox = "<input style='border:none;width:95%;font-size:18.0pt;font-weight:700;text-align:center;' value=''></input>";
      var textbox30 = "<input style='border:none;width:95%;font-size:18.0pt;font-weight:700;text-align:center;' value='30'></input>";
      replace(html, "RANGE!C2", textbox);
      replace(html, "RANGE!D2", textbox);
      replace(html, "RANGE!F3", textbox30);



      var str = taskInfo.info.replace(/(?:\r\n|\r|\n)/g, '<br>');
      replace(html, "RANGE!B19", str);




      if (true) {
        var win = window.open("");
        win.document.body.innerHTML = html.documentElement.innerHTML;
      }
      else {
        $.modal(html.documentElement.innerHTML)
      }



    }



    return {
      open: open,
    }
  });

