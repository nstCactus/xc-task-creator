/**
 * @file
 * Main module for the task creator.
 */
define(['app/map', 'app/uploader', 'jquery'], function(map, uploader, $) {
  // Grab param from url...

  let params = getJsonFromUrl(location.href);

  
  //load_params(params.airspaceUrl,params.waypointsUrl);

  if (params.waypointsUrl) {
    var filename = params.waypointsUrl.split("/").pop();
    $.get(params.waypointsUrl, function(data) {
      uploader.setFilename(filename);
      uploader.parse(data);
    } , "text");
  }


  if (params.airspaceUrl) {
    //var filename = params.airspaceUrl.split("/").pop();
    $.get(params.airspaceUrl, function(data) {
      uploader.setFilename("Airspace.kml");
      uploader.parse(data);
    } , "text");
  }

  if (params.taskUrl) {
    var filename = taskUrl.split("/").pop();
    $.get(params.taskUrl, function(data) {
      uploader.setFilename(filename);
      if (typeof(data) !== "string") {
        data = new XMLSerializer().serializeToString(data);
      }
      uploader.parse(data);
    });
  }

  if (params.taskId) { 
    var id = params.taskId.split("/").pop();
    $.get("https://pole.ffvl.fr/tasks/" + id, function(data) {
     var geo = data[0].data;
     uploader.setFilename( id + '.geojson');
     uploader.parse(JSON.stringify(geo));
    });
  }
  


  // async function load_params(airspaceUrl,waypointsUrl) {


  //   if (waypointsUrl) {
  //     var filename = params.waypointsUrl.split("/").pop();
  //     $.get(waypointsUrl, function(data) {
  //       uploader.setFilename(filename);
  //       uploader.parse(data);
  //     } , "text");
  //   }
  
  //   await sleep(2000);

  //   if (airspaceUrl) {
  //     //var filename = params.airspaceUrl.split("/").pop();
  //     $.get(airspaceUrl, function(data) {
  //       uploader.setFilename("Airspace.kml");
  //       uploader.parse(data);
  //     } , "text");
  //   }

  // }

  // function sleep(ms) {
  //   return new Promise(resolve => setTimeout(resolve, ms));
  // }
  
  function getJsonFromUrl(url) {
    if(!url) url = location.href;
    var question = url.indexOf("?");
    var hash = url.indexOf("#");
    if(hash==-1 && question==-1) return {};
    if(hash==-1) hash = url.length;
    var query = question==-1 || hash==question+1 ? url.substring(hash) : 
    url.substring(question+1,hash);
    var result = {};
    query.split("&").forEach(function(part) {
      if(!part) return;
      part = part.split("+").join(" "); // replace every + with space, regexp-free version
      var eq = part.indexOf("=");
      var key = eq>-1 ? part.substr(0,eq) : part;
      var val = eq>-1 ? decodeURIComponent(part.substr(eq+1)) : "";
      var from = key.indexOf("[");
      if(from==-1) result[decodeURIComponent(key)] = val;
      else {
        var to = key.indexOf("]",from);
        var index = decodeURIComponent(key.substring(from+1,to));
        key = decodeURIComponent(key.substring(0,from));
        if(!result[key]) result[key] = [];
        if(!index) result[key].push(val);
        else result[key][index] = val;
      }
    });
    return result;
  }

});
