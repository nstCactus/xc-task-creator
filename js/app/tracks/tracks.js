/**
 * @file
 * Tracks module for the task planner
 */
define(['tracks/track', 'tracks/trackList', 'app/helper'], function (Track, TrackList, helper) {

  var tracks = [];
  var filenames = [];

  var addTrackList = function (name) {

  }

  var addTrack = function (info) {
    var track = new Track(info);
    tracks.push(track);
    TrackList.rebuild(tracks);



    return track;
  }

  var addFilename = function (filename) {
    if (checkFilename(filename)) {
      filenames.push(filename);
      TrackList.rebuild(filenames);
    }
  }

  var onTracknameRemoved = function (e) {
    removeTrack(e.detail.filename);
  }

  var onTrackcolorChange = function (e) {
    removeTrack(e.detail.filename);
  }


  var removeTrack = function (track) {
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].filename == track) {
        tracks[i].polyline.setMap(null)
        tracks.splice(i, 1);
        TrackList.rebuild(tracks);
      }
    }
  }

  var onTrackColorChanged = function (e) {
    var color = e.detail.color;
    var filename = e.detail.filename;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].filename == filename) {
        tracks[i].color = color
      }
    }
    TrackList.rebuild(tracks);
  }

  var onTrackChangeColor = function (e) {
    var color = helper.randomColor(true);
    var filename = e.detail.filename;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].filename == filename) {
        tracks[i].color = color
        tracks[i].polyline.setOptions({
          strokeColor: color,
        });
      }
    }
    TrackList.rebuild(tracks);

  }





  document.addEventListener('tracknameRemoved', onTracknameRemoved);
  document.addEventListener('trackColorChanged', onTrackColorChanged);
  document.addEventListener('trackChangeColor', onTrackChangeColor);



  return {
    'addTrack': addTrack,
  }
});
