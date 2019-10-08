/**
 * @file
 * Tracks module for the task planner
 */
define(['tracks/track', 'tracks/trackList'], function(Track, TrackList) {
  
  var tracks = [];
  var filenames = [];

  var addTrackList = function(name) {
    
  } 

  var addTrack = function(info) {
     var track = new Track(info);
     tracks.push(track);
     TrackList.rebuild(tracks);
     return track;
  }

  var addFilename = function(filename) {
    if (checkFilename(filename)) {
      filenames.push(filename);
      TrackList.rebuild(filenames);
    }
  }

  var onTracknameRemoved = function(e) {
    removeTrack(e.detail.filename);
  }

  var removeTrack = function(track) {
    for (var i = 0 ; i < tracks.length ;i++)  {
      if (  tracks[i].filename ==  track  ) {
        tracks[i].polyline.setMap(null)
        tracks.splice(i, 1);
        TrackList.rebuild(tracks);
      }
    }
  }

  document.addEventListener('tracknameRemoved', onTracknameRemoved);


  return {
    'addTrack' : addTrack,
  }
});
