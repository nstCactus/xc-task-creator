/**
 * @file
 * Track module for the task creator.
 */
define(['app/helper', 'task/task', 'app/geoCalc', 'app/map', 'jquery', 'jgrowl'], function (helper, task, geoCalc, map, $) {

  var markerImage = {
    url: "https://maps.google.com/mapfiles/kml/paddle/ylw-circle-lv.png", // url
    scaledSize: new google.maps.Size(32, 32), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(16, 16) // anchor
  };

  class Track {

    constructor(info) {
      this.lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      };
      this.allCrossings = [];
      this.validCrossings = [];
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
        strokeWeight: 2,
        icons: [{
          icon: this.lineSymbol,
          offset: '0',
          repeat: '200px'
        }],
      });
      if (task.getTurnpoints().length > 0) {
        this.checkTask(task.getTurnpoints(), task.getTaskInfo());
      }
    }

    igcToSeconds(strTime, taskInfo) {
      return Number(strTime.substring(0, 2)) * 3600 + Number(strTime.substring(2, 4)) * 60 + Number(strTime.substring(4)) + taskInfo.utcOffset * 3600;
    }

    taskTimeToSeconds(strTime) {
      return Number(strTime.substring(0, 2)) * 3600 + Number(strTime.substring(3, 5)) * 60;
    }

    secondsToTime(sec_num) {
      var hours = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
      var seconds = sec_num - (hours * 3600) - (minutes * 60);
      if (hours < 10) { hours = "0" + hours; }
      if (minutes < 10) { minutes = "0" + minutes; }
      if (seconds < 10) { seconds = "0" + seconds; }
      return hours + ":" + minutes + ":" + seconds
    }



    checkTask(turnpoints, taskInfo) {

      let start_ip = 0;

      for (let itp = 0; itp < turnpoints.length; itp++) {

        let validCrossing = null;

        for (let ip = start_ip; ip < this.points.length - 1; ip++) {

          const d1 = geoCalc.computeDistanceBetween(turnpoints[itp].x, turnpoints[itp].y, this.points[ip].x, this.points[ip].y);
          const d2 = geoCalc.computeDistanceBetween(turnpoints[itp].x, turnpoints[itp].y, this.points[ip + 1].x, this.points[ip + 1].y);
          const RL = turnpoints[itp].radius - Math.max(turnpoints[itp].radius * taskInfo.turnpointTollerance, 5);
          const RG = turnpoints[itp].radius + Math.max(turnpoints[itp].radius * taskInfo.turnpointTollerance, 5);

          if ((RL <= d1 && d1 <= RG) || (RL <= d2 && d2 <= RG) || (d1 < RL && d2 > RG) || (d2 < RL && d1 > RG)) {
            const seconds = this.igcToSeconds(this.points[ip].time, taskInfo);
            const time = this.secondsToTime(seconds);
            const mode = (d1 < d2) ? "exit" : "entry";
            const newCrossing = {
              tpNum: itp,
              tpId: turnpoints[itp].id,
              time: time,
              seconds: seconds,
              igcTime: this.points[ip].time,
              point1: this.points[ip],
              point2: this.points[ip + 1],
              mode: mode,
            };
            this.allCrossings.push(newCrossing);

            if (['takeoff', 'turnpoint', 'end-of-speed-section', 'goal'].includes(turnpoints[itp].type)) {
              if (validCrossing == null) {
                validCrossing = {
                  tpNum: itp,
                  tpId: turnpoints[itp].id,
                  time: time,
                  seconds: seconds,
                  igcTime: this.points[ip].time,
                  point1: this.points[ip],
                  point2: this.points[ip + 1],
                  mode: mode,
                };
                this.validCrossings.push(validCrossing);
                start_ip = ip;
                this.addMarker(this.points[ip], turnpoints[itp].shortName.toUpperCase(), time, validCrossing);
                //console.log("Crossing " + " tp : " + turnpoints[itp].id + " point: " + String(ip) + " Time: " + time);
                break;
              }
            }

            if (['start'].includes(turnpoints[itp].type)) {
              if (validCrossing == null) {
                if (turnpoints[itp].mode == mode) {
                  const start_seconds = this.taskTimeToSeconds(turnpoints[itp].open);
                  if (start_seconds <= seconds) {
                    validCrossing = {
                      tpNum: itp,
                      tpId: turnpoints[itp].id,
                      time: time,
                      seconds: seconds,
                      igcTime: this.points[ip].time,
                      point1: this.points[ip],
                      point2: this.points[ip + 1],
                      mode: mode,
                    };
                    this.validCrossings.push(validCrossing);
                    start_ip = ip;
                    this.addMarker(this.points[ip], turnpoints[itp].shortName.toUpperCase(), time, validCrossing);
                    //console.log("Crossing " + " tp : " + turnpoints[itp].id + " point: " + String(ip) + " Time: " + time);
                    break;
                  }

                }
              }
            }


            //console.log("Crossing " + " tp : " + turnpoints[itp].id + " point: " + String(ip) + " Time: " + time);

          }

          start_ip = ip;

        }

        //console.log(JSON.stringify(this.validCrossings));
      }


    }

    addMarker(point, itp, label, infoContent) {
      let latLng = new google.maps.LatLng(point.x, point.y);



      let marker = new google.maps.Marker({
        position: latLng,
        title: String(label),
        label: String(itp),
        // icon: {
        //   path: google.maps.SymbolPath.CIRCLE,
        //   scale: 5
        // },    
        icon:markerImage,
      });
      let container = '<div >';
      container += '<div class="item"> TP: ' + infoContent.tpNum + '</div>';
      container += '<div class="item"> ID: ' + infoContent.tpId + '</div>';
      container += '<div class="item"> Time: ' + infoContent.time + '</div>';
      container += '<div class="item"> Mode: ' + infoContent.mode + '</div>';
      container += '</div>';
      let infowindow = new google.maps.InfoWindow({
        content: container
      });
      marker.addListener('click', function () {
        infowindow.open(map, marker);
      });
      this.graphic.markes.push(marker);
    }


    drawGraphics(map, google) {
      this.graphic.polyline.setMap(map);
      for (let i = 0; i < this.graphic.markes.length; i++) {
        this.graphic.markes[i].setMap(map)
      }
      console.log(this.graphic.markes.length);
    }

  }

  return Track;
});
