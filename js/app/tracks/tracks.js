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
        tracks[i].graphic.polyline.setMap(null)
        for (let j=0; j< tracks[i].graphic.markes.length;j++) {
          tracks[i].graphic.markes[j].setMap(null)
        }
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
        tracks[i].graphic.polyline.setOptions({
          strokeColor: color,
        });
      }
    }
    TrackList.rebuild(tracks);
  }

  var onTrackNameclicked = function (e) {
    var filename = e.detail.filename;
    for (let  i = 0; i < tracks.length; i++) {
      if (tracks[i].filename == filename) {
        html = '<div><h3>' + tracks[i].filename + '</h3><div>';
        html += '<div>Distance: ' + tracks[i].distance + ' km ' + tracks[i].goal + '</div>';
        html += '<div>Valid Crossing:</div>';
        for ( let vc=0; vc< tracks[i].validCrossings.length;vc++) {
          html += '<div>' +  tracks[i].validCrossings[vc].tpShortName.toUpperCase() + ' :'+ tracks[i].validCrossings[vc].tpNum + ' ' + tracks[i].validCrossings[vc].tpId + 
          ' Point: ' + String(tracks[i].validCrossings[vc].pointN.toLocaleString('en-US', {minimumIntegerDigits: 5, useGrouping:false})) +
          ' Time: ' + tracks[i].validCrossings[vc].time  + '</div>';
        }
        html += '<div></div>';
        html += '<div></div>';
        html += '<div></div>';
        html += '<div></div>';

        $.modal(html)
      }
    }
  }

  



  document.addEventListener('tracknameRemoved', onTracknameRemoved);
  document.addEventListener('trackColorChanged', onTrackColorChanged);
  document.addEventListener('trackChangeColor', onTrackChangeColor);
  document.addEventListener('trackNameclicked', onTrackNameclicked);

  

  return {
    'addTrack': addTrack,
    'tracks' : tracks,
  }
});
