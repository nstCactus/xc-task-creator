/**
 * @file 
 * IGC parser module for the task creator.
 */
define(['app/geoCalc'], function(geoCalc) {
  
  /**
   * @todo
   * Perform Better check : If there is a line with B and 35 char.
   */
  var check = function(text, filename) {
    if (filename.split('.').pop().toLowerCase() == 'igc') {
      return true;
    }
    return false;
  };

  var parse = function(text, filename) {
    var lines = text.split("\n");
    var points = [];
    var count = 0;
    // for each lines.
    var prev_point = null;
    var inAir = false;
    for (var i = 0; i < lines.length; i++) {
      // Replace all bad formated whitespace at the begining and end of the line..
      lines[i] = lines[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      if (lines[i].split(":").length == 2 && lines[i].split(":")[0] == "HFPLTPILOT" ) {
        filename = lines[i].split(":")[1].toUpperCase();
      }
      // If the first character is a "B" and total # of charaters = 35.
      if (lines[i].length >= 35 && lines[i].charAt(0) == 'B') {
        var point = {
          'time' : lines[i].substring(1, 7),
          'x' : formatLatLng(lines[i].substring(7, 15)),
          'y' : formatLatLng(lines[i].substring(15, 24)),
          'alt' : lines[i].charAt(24), 
          'z' : parseInt(lines[i].substring(25, 30), 10),
          'zGps' : parseInt(lines[i].substring(30, 35), 10),
        }
        if ( prev_point != null ) {
          let vel = velocity(point,prev_point) ;
          if ( !inAir &&  vel > 15 ) {
            count++;
            if ( count > 5 ) {
              inAir = true;
              count = 0;
            }
          }
          if ( inAir &&  vel < 1 ) {
            count++;
          }
          if ( count > 5 ) {
            inAir = false;
            count = 0;
            break;
          }
          if ( inAir ) {
            points.push(point);
          }
        }
        prev_point = point;
      }
    }

    function velocity(point,prev_point) {
      let dist = geoCalc.computeDistanceBetween(point.x,point.y,prev_point.x,prev_point.y)
      let time = igcToSeconds(point.time) - igcToSeconds(prev_point.time);
      return time==0?0:(dist*3600)/(time*1000.0);
    }

    function igcToSeconds(strTime) {
      return Number(strTime.substring(0, 2)) * 3600 + Number(strTime.substring(2, 4)) * 60 + Number(strTime.substring(4)) ;
    }

    return {
      'tracks' : Array({
        'points' : points,
        'filename' : filename,
      }),
    }
  };

  function convertDMSToDD(degrees, minutes, direction) {
    var dd = parseInt(degrees) + parseFloat(minutes)/60;
    if (direction == "S" || direction == "W") {
      dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
  }

  function formatLatLng(coords) {
    var direction = coords.slice(-1);
    if (direction == "E" || direction == "W") {
      var deg = coords.substring(0, 3); 
      var min = coords.substring(3, 5) + '.' + coords.substring(5, 8); 
    }
    else {
      var deg = coords.substring(0, 2); 
      var min = coords.substring(2, 4) + '.' + coords.substring(4, 7); 
    }
    return convertDMSToDD(deg, min, direction);
  }

  return {
    'name' : 'IGC',
    'check' : check,
    'parse' : parse,
  }
});
