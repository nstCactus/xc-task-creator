/**
 * @file
 * Track listing for the task creator.
 */
define(['jquery'], function ($) {

  var container = $("#track-handler ul");
  $(document).on('click', '#tracknameList', function (e) {
    var name = $(this).attr('class');
    var e = document.createEvent("CustomEvent");
    e.initCustomEvent('tracknameRemoved', false, false, {
      filename: name,
    });
    document.dispatchEvent(e);
  });

  var rebuild = function (tracks) {
    if (tracks.length > 0) {
      var html = '';
      for (var i = 0; i < tracks.length; i++) {
        let color = tracks[i].color; 

        html += '<li id="tracknameList" style="color:' +  color  +  ';" class="' + tracks[i].filename + '"><i class="fa fa-trash"></i> ' + tracks[i].filename + '</li>';
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
