/**
 * @file
 * Track module for the task creator.
 */
define(['app/helper', 'task/task', 'app/geoCalc', 'jquery', 'jgrowl'], function (helper, task, geoCalc, $) {


  class Track {

    constructor(info) {
      this.points = info.points;
      this.filename = info.filename;
      this.graphic = { polyline: null, markes: [] };
      this.color = helper.randomColor(true);
      var color = this.color;
      var coords = [];
      for (let i = 0; i < this.points.length; i++) {
        coords.push(new google.maps.LatLng(this.points[i].x, this.points[i].y));
      }
      this.graphic.polyline = new google.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      if (task.getTurnpoints().length > 0) {
        this.checkTask(task.getTurnpoints(), task.getTaskInfo());
      }
    }

    checkTask(turnpoints, taskInfo) {

      let ip = 0;
      let itp = 0;
      let tollerance = 1;
      let tpStatus = -1; // -1 undefined, 0=in, 1=out;
      while (ip < this.points.length && itp < turnpoints.length) {
        let dist = geoCalc.computeDistanceBetween(turnpoints[itp].y, turnpoints[itp].x, this.points[ip].y, this.points[ip].x);
        if (tpStatus == 0) {
          tollerance = 1 - taskInfo.turnpointTollerance;
        }
        if (tpStatus == 1) {
          tollerance = 1 + taskInfo.turnpointTollerance;
        }
        let newStatus = (dist > turnpoints[itp].radius * tollerance) ? 1 : 0;

        if (turnpoints[itp].type == 'takeoff') {
          if (newStatus == 0) {
            console.log("takeoff " + ip);
            this.addMarker(this.points[ip], itp);
            itp++;
            tpStatus = -1;
            tollerance = 1;
            continue;
          }
        }
        else {
          if (tpStatus != -1 && newStatus != tpStatus) {
            console.log("wpt :" + itp + " pts: " + ip);
            this.addMarker(this.points[ip], itp);
            itp++;
            tpStatus = -1;
            tollerance = 1;
            continue;
          }
        }



        tpStatus = newStatus;
        ip++;
      }

    }

    addMarker(points, itp) {
      var latLng = new google.maps.LatLng(points.x, points.y);
      var marker = new google.maps.Marker({
        position: latLng,
        title: String(itp),
      });
      this.graphic.markes.push(marker);
    }

    drawGraphics(map, google) {
      this.graphic.polyline.setMap(map);
      for (let i=0; i< this.graphic.markes.length;i++) {
        this.graphic.markes[i].setMap(map)
      }
      console.log(this.graphic.markes.length);
    }

  }

  return Track;
});
