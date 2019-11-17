/**
 * @file
 * Track module for the task creator.
 */
define(['app/helper', 'task/task', 'jquery', 'jgrowl'], function (helper, task, $) {

  // var helpColor = true;

  class Track {

    constructor(info) {
      this.turnpoints = task.getTurnpoints();
      this.taskInfo = task.getTaskInfo();
      this.points = info.points;
      this.filename = info.filename;
      this.polyline;
      this.color = helper.randomColor(true);
      var color = this.color;
      //var filename = this.filename;
      var coords = [];
      for (let i = 0; i < this.points.length; i++) {
        coords.push(new google.maps.LatLng(this.points[i].x, this.points[i].y));
      }
      this.polyline = new google.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      if (this.turnpoints.length > 0) {
        checkTask();
      }

    }

    checkTask() {
      
    }

    drawPolyline(map, google) {
      this.polyline.setMap(map);
    }
    
  }

  return Track;
});
