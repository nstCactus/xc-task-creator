/**
 * @file
 * Track listing for the task creator.
 */
define(['jquery'], function ($) {


  function lightOrDark(color) {
    var r, g, b, hsp;
    if (color.match(/^rgb/)) {
      color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
      r = color[1];
      g = color[2];
      b = color[3];
    }
    else {
      color = +("0x" + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&'));
      r = color >> 16;
      g = color >> 8 & 255;
      b = color & 255;
    }
    hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );
    if (hsp > 127.5) {
      return '#000000';
    }
    else {
      return '#FFFFFF';
    }
  }


  var container = $("#track-handler ul");
  $(document).on('click', '#tracknameList', function (e) {
    var name = $(this).attr('name');
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('tracknameRemoved', false, false, {
      filename: name,
    });
    document.dispatchEvent(e);
  });

  $(document).on('click', '#trackcolor', function (e) {
    var name = $(this).attr('name');
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('trackChangeColor', false, false, {
      filename: name,
    });
    document.dispatchEvent(e);
  });

  var rebuild = function (tracks) {
    if (tracks.length > 0) {
      var html = '';
      for (var i = 0; i < tracks.length; i++) {
        let bgColor = tracks[i].color;
        let color = lightOrDark(bgColor);

        html +=  '<div class="row">';
        html += '<div style="color:' + color + ';background-color:' + bgColor + ';" id="trackcolor" class="col-4 colorbox" name="' + tracks[i].filename + '" ></div>';
                html += '<div id="tracknameList" class="fa fa-trash" name="' + tracks[i].filename + '" ></div>  ';

        html +=  '<div class="col-6">' + tracks[i].filename + '</div>';
        html += '</div>';

      }
      container.html(html);
      container.addClass('populated');
    } else {
      container.removeClass('populated');
      container.html('');
    }
  }

  return {
    rebuild: rebuild,
  }
});
