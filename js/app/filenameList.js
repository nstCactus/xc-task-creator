/**
 * @file
 * filename list module for the task creator.
 */
define(['jquery'], function($) {
  
  var container = $("#file-handler ul");
  $(document).on('click', '#trash', function(e) { 
    var name = $(this).attr('name');
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('filenameRemoved', false, false, {
      filename : name, 
    });
    document.dispatchEvent(e);
  });


  // $(document).on('click', '#filenameList', function(e) { 
  //   var name = $(this).attr('class');
  //   alert(name);
  // });

  $(document).on('click', '#export-waypoints', function(e) {
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('exportWaypoints', false, false, { 
    });
    document.dispatchEvent(e);
  });


  $(document).on('click', '#clear-task', function(e) {
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('deleteTask', false, false, {});
    document.dispatchEvent(e);
    $("#task-config").modal('hide')
  });

  var rebuild = function(filenames) {
    if (filenames.length > 0) {
      var html ='';
      for (var i = 0; i < filenames.length; i++) {
        html += '<li id="filenameList" class="' + filenames[i] + '"><i id="trash" class="fa fa-trash" name="' + filenames[i] + '"></i> ' + filenames[i] + '</li>';
      }
      container.html(html);
      container.addClass('populated');
      $("#export-waypoints").removeClass('hide');
      $("#clear-task").removeClass('hide');

    } else {
      container.removeClass('populated');
      container.html('');
      $("#export-waypoints").addClass('hide');
      $("#clear-task").addClass('hide');

    }
  }

  return {
    rebuild : rebuild,
  }
});
