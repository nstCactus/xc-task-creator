/**
 * @file
 * CUP format for the task creator.
 */
define(['rejs!formats/export/wpt'], function(exportWpt) {

  var check = function(text, filename) {
    var lines = text.split("\n");
    if ( lines[0].startsWith("$FormatGEO") ) {
        return true;
    } else {
      return false;
    } 
  }

  var parse = function(text, filename) {
    var lines = text.split("\n");
    var words = [];
    // Replace all bad formated whitespace at the begining and end of the line..
    for (var i = 1; i < lines.length; i++) {
      lines[i] = lines[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      lines[i] = lines[i].replace(/  +/g, ' ');
      var word = lines[i].split(" ");
      if (word.length > 11  ) {
        words.push(word); 
      }
    }

    // Storing the turnpoints.
    var tps = [];
    for (var i = 0; i < words.length; i++) {
      var tp =  {
        filename : filename,
        id : words[i][0],
        x : formatLatLng(words[i][1],words[i][2],words[i][3],words[i][4]),
        y : formatLatLng(words[i][5],words[i][6],words[i][7],words[i][8]),
        z : elevation(words[i][9]),
        name : words[i][0],
      };
      // tp.name =  words[i][10];
      // for (var j=11;j<words[i].length;j++) { 
      //   tp.name += " " +  words[i][j];
      // }
      tps.push(tp);
    }
    
    return {
      'waypoints' : tps,
    };
  }

  var exporter = function(wps) {
    for (var i = 0; i < wps.length; i++) {
      wps[i].dms = convertDDtoDMS(wps[i].x, wps[i].y);
    }

    var data = exportCup({waypoints : wps});
    return new Blob([data], {'type': "text/plain"});
  }

  function convertDDtoDMS(lat, lng) {
    var convertLat = Math.abs(lat);
    var LatDeg = Math.floor(convertLat);
    var LatSec = (Math.round((convertLat - LatDeg) * 60 * 1000) / 1000);
    var LatCardinal = ((lat > 0) ? "N" : "S");
    var convertLng = Math.abs(lng);
    var LngDeg = Math.floor(convertLng);
    var LngSec = (Math.round((convertLng - LngDeg) * 60 * 1000) / 1000);
    var LngCardinal = ((lng > 0) ? "E" : "W");
                                                                              
    return pad(LatDeg, 2) + pad(LatSec, 2) + LatCardinal + "," + pad(LngDeg, 3) + pad(LngSec, 2) + LngCardinal;
  }

  function pad(n, width, z) {
    z = z || '0';
    num = Math.floor(n) + '';
    return num.length > width ? n : new Array(width - num.length + 1).join(z) + n;
  }

  function elevation(data) {
    return Number(data);
  }

  function convertDMSToDD(degrees, minutes, direction) {
    var dd = parseInt(degrees) + parseFloat(minutes)/60;
    if (direction == "S" || direction == "W") {
      dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
  }

  function formatLatLng(direction,degree,minutes,seconds) {
    var retDD;
    retDD = Number(degree)+Number(minutes)/60.0+Number(seconds)/3600.0;
    if (direction == "W" || direction == "S") {
      retDD = - retDD; 
    }
    return retDD;
  }

  return {
    'check' : check,
    'exporter' : exporter,
    'extension' : '.wpt',
    'name' : 'WPT',
    'parse' : parse,
  }
});

