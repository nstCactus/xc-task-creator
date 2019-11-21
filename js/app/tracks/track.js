/**
 * @file
 * Track module for the task creator.
 */
define(['app/helper', 'app/param', 'task/task', 'app/geoCalc', 'app/map', 'jquery', 'jgrowl'], function (helper, param, task, geoCalc, map, $) {



  class Track {


    constructor(info) {

      this.markerImage = {
        url: "images/green-x-md.png", // url
        scaledSize: new google.maps.Size(16, 16), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(8, 8) // anchor
      };


      this.lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      };
      this.allCrossings = [];
      this.validCrossings = [];
      this.distance = 0;
      this.ss = "";
      this.es = "";
      this.ts = "";
      this.maxh = 0;
      this.goal = "";
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
        map: map,
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

    calcTrackStatistics(turnpoints, taskInfo) {

      let tss=0;
      let tes= 0;

      for (let i=0;i< this.validCrossings.length;i++) {

        
        if (  turnpoints[this.validCrossings[i].tpNum].type =='start') {
          tss = this.validCrossings[i].seconds;
          this.ss = this.secondsToTime(tss);
        }
        if (  turnpoints[this.validCrossings[i].tpNum].type =='end-of-speed-section') {
          tes = this.validCrossings[i].seconds;
          this.es = this.secondsToTime(tes);
        }
      }
      if ( tss != 0 && tes != 0) {
        this.ts = this.secondsToTime(tes-tss);
      }


      // distance 
      let d = 0;

      if (param.showCumulativeDistances) {
        d = taskInfo.distances[this.validCrossings.length - 2]
      }
      else {
        for (let i = 0; i < this.validCrossings.length - 1; i++) {
          d += taskInfo.distances[i];
        }
        // ....
      }

      if (this.validCrossings.length == turnpoints.length) {
        this.goal = "(GOAL)";
      }
      else {
        this.goal = "";
        let lastLeg = taskInfo.distances[this.validCrossings.length - 1];
        if (param.showCumulativeDistances) {
          lastLeg -= d;
        }
        let mindist = lastLeg;
        for (let i = this.points.length - 1; i >= 0; i--) {
          if (this.igcToSeconds(this.points[i].time, taskInfo) < this.validCrossings[this.validCrossings.length - 1].seconds) {
            break;
          }
          const d = geoCalc.computeDistanceBetween(
            taskInfo.fastWaypoints[this.validCrossings.length ].lat(),
            taskInfo.fastWaypoints[this.validCrossings.length ].lng(),
            this.points[i].x, this.points[i].y) / 1000.;
          if (d < mindist) {
            mindist = d;
          }
        }
        d = d + lastLeg - mindist;
      }
      this.distance = d;

    }

    checkTask(turnpoints, taskInfo) {

      this.allCrossings = [];
      for (let i = 0; i < turnpoints.length; i++) {
        this.allCrossings[i] = [];
      }

      this.validCrossings = [];

      for (let i = 0; i < this.graphic.markes.length; i++) {
        this.graphic.markes[i].setMap(null)
      }
      this.graphic.markes = [];


      for (let itp = 0; itp < turnpoints.length; itp++) {

        for (let ip = 0; ip < this.points.length - 1; ip++) {

          const d1 = geoCalc.computeDistanceBetween(turnpoints[itp].x, turnpoints[itp].y, this.points[ip].x, this.points[ip].y);
          const d2 = geoCalc.computeDistanceBetween(turnpoints[itp].x, turnpoints[itp].y, this.points[ip + 1].x, this.points[ip + 1].y);
          const RL = turnpoints[itp].radius - Math.max(turnpoints[itp].radius * taskInfo.turnpointTollerance, 5);
          const RG = turnpoints[itp].radius + Math.max(turnpoints[itp].radius * taskInfo.turnpointTollerance, 5);

          if ((RL <= d1 && d1 <= RG) || (RL <= d2 && d2 <= RG) || (d1 < RL && d2 > RG) || (d2 < RL && d1 > RG)) {
            const seconds = this.igcToSeconds(this.points[ip].time, taskInfo);
            const time = this.secondsToTime(seconds);
            const mode = (d1 < d2) ? "exit" : "entry";
            const newCrossing = {
              tpID:turnpoints[itp].id,
              pointN: ip,
              tpNum: itp,
              tpShortName: turnpoints[itp].shortName,
              time: time,
              seconds: seconds,
              igcTime: this.points[ip].time,
              point1: this.points[ip],
              point2: this.points[ip + 1],
              mode: mode,
            };
            this.allCrossings[itp].push(newCrossing)
            //this.allCrossings.push(newCrossing);
            //console.log("All Crossing " + " tp : " + turnpoints[itp].id + " point: " + String(ip) + " Time: " + time);
            //this.addMarker(this.points[ip], turnpoints[itp].shortName.toUpperCase(), time, newCrossing);
          }
        }
      }

      // now find valid crossings. Start from everyting before start

      let current_time = this.igcToSeconds(this.points[this.points.length - 1].time, taskInfo);
      let itp = 0;
      for (itp = 0; itp < turnpoints.length; itp++) {

        if (['start'].includes(turnpoints[itp].type)) {
          break;
        }

        if (['takeoff'].includes(turnpoints[itp].type)) {
          const open_seconds = this.taskTimeToSeconds(turnpoints[itp].open);
          const close_seconds = this.taskTimeToSeconds(turnpoints[itp].close);
          for (let c = 0; c < this.allCrossings[itp].length; c++) {
            if (this.allCrossings[itp][c].seconds >= open_seconds && this.allCrossings[itp][c].seconds <= close_seconds) {
              let validCrossing = {
                tpID:this.allCrossings[itp][c].tpID,
                pointN: this.allCrossings[itp][c].pointN,
                tpNum: this.allCrossings[itp][c].tpNum,
                tpShortName: this.allCrossings[itp][c].tpShortName,
                time: this.allCrossings[itp][c].time,
                seconds: this.allCrossings[itp][c].seconds,
                igcTime: this.allCrossings[itp][c].igcTime,
                point1: this.allCrossings[itp][c].point1,
                point2: this.allCrossings[itp][c].point2,
                mode: this.allCrossings[itp][c].mode,
                map: this.allCrossings[itp][c].map,
              };
              this.validCrossings.push(validCrossing);
              this.addMarker(validCrossing.point1, validCrossing.tpNum, validCrossing.time, validCrossing);
              current_time = validCrossing.seconds;
              break;
            }
          }
        }

        if (['turnpoint'].includes(turnpoints[itp].type)) {
          for (let c = 0; c < this.allCrossings[itp].length; c++) {
            if (this.allCrossings[itp][c].seconds >= current_time) {
              let validCrossing = {
                tpID: this.allCrossings[itp][c].tpID,
                pointN: this.allCrossings[itp][c].pointN,
                tpNum: this.allCrossings[itp][c].tpNum,
                tpShortName: this.allCrossings[itp][c].tpShortName,
                time: this.allCrossings[itp][c].time,
                seconds: this.allCrossings[itp][c].seconds,
                igcTime: this.allCrossings[itp][c].igcTime,
                point1: this.allCrossings[itp][c].point1,
                point2: this.allCrossings[itp][c].point2,
                mode: this.allCrossings[itp][c].mode,
                map: this.allCrossings[itp][c].map,
              };
              this.validCrossings.push(validCrossing);
              this.addMarker(validCrossing.point1, validCrossing.tpNum.toUpperCase(), validCrossing.time, validCrossing);
              current_time = validCrossing.seconds;
              break;
            }
          }
        }
      }

      if (itp < turnpoints.length && ['start'].includes(turnpoints[itp].type)) {
        const start_seconds = this.taskTimeToSeconds(turnpoints[itp].open);
        let maxGoodTP = 0;
        let maxGoodIndex = -1;
        for (let s = this.allCrossings[itp].length - 1; s >= 0; s--) {
          let nGoodTP = 0;
          let theTime = this.allCrossings[itp][s].seconds;
          if (start_seconds - taskInfo.jumpTheGun <= theTime && turnpoints[itp].mode == this.allCrossings[itp][s].mode) {
            for (let ntp = itp + 1; ntp < turnpoints.length; ntp++) {
              for (let j = 0; j < this.allCrossings[ntp].length; j++) {
                if (this.allCrossings[ntp][j].seconds > theTime) {
                  theTime = this.allCrossings[ntp][j].seconds;
                  nGoodTP++;
                  break;
                }
              }
            }
          }
          if (nGoodTP > maxGoodTP) {
            maxGoodTP = nGoodTP;
            maxGoodIndex = s;
          }
          //console.log('s: ' + s + ' nGoodTP: ' + nGoodTP);
        }
        //console.log('maxGoodIndex: ' + maxGoodIndex );
        if (maxGoodIndex != -1) {
          let validCrossing = {
            tpID:this.allCrossings[itp][maxGoodIndex].tpID,
            pointN: this.allCrossings[itp][maxGoodIndex].pointN,
            tpNum: this.allCrossings[itp][maxGoodIndex].tpNum,
            tpShortName: this.allCrossings[itp][maxGoodIndex].tpShortName,
            time: this.allCrossings[itp][maxGoodIndex].time,
            seconds: this.allCrossings[itp][maxGoodIndex].seconds,
            igcTime: this.allCrossings[itp][maxGoodIndex].igcTime,
            point1: this.allCrossings[itp][maxGoodIndex].point1,
            point2: this.allCrossings[itp][maxGoodIndex].point2,
            mode: this.allCrossings[itp][maxGoodIndex].mode,
            map: this.allCrossings[itp][maxGoodIndex].map,
          };
          this.validCrossings.push(validCrossing);
          this.addMarker(validCrossing.point1, validCrossing.tpNum, validCrossing.time, validCrossing);
          current_time = validCrossing.seconds;
        }
      }

      let found = true;
      for (itp = itp + 1; itp < turnpoints.length; itp++) {
        if (!found) {
          break;
        }
        if (['turnpoint', 'end-of-speed-section'].includes(turnpoints[itp].type)) {
          found = false;
          for (let c = 0; c < this.allCrossings[itp].length; c++) {
            if (this.allCrossings[itp][c].seconds >= current_time) {
              let validCrossing = {
                tpID: this.allCrossings[itp][c].tpID,
                pointN: this.allCrossings[itp][c].pointN,
                tpNum: this.allCrossings[itp][c].tpNum,
                tpShortName: this.allCrossings[itp][c].tpShortName,
                time: this.allCrossings[itp][c].time,
                seconds: this.allCrossings[itp][c].seconds,
                igcTime: this.allCrossings[itp][c].igcTime,
                point1: this.allCrossings[itp][c].point1,
                point2: this.allCrossings[itp][c].point2,
                mode: this.allCrossings[itp][c].mode,
                map: this.allCrossings[itp][c].map,
              };
              this.validCrossings.push(validCrossing);
              this.addMarker(validCrossing.point1, validCrossing.tpNum, validCrossing.time, validCrossing);
              current_time = validCrossing.seconds;
              found = true;
              break;
            }
          }
        }

        if (['goal',].includes(turnpoints[itp].type)) {
          const close_seconds = this.taskTimeToSeconds(turnpoints[itp].close);

          for (let c = 0; c < this.allCrossings[itp].length; c++) {
            if (this.allCrossings[itp][c].seconds >= current_time && this.allCrossings[itp][c].seconds < close_seconds) {
              let validCrossing = {
                tpID: this.allCrossings[itp][c].tpID,
                pointN: this.allCrossings[itp][c].pointN,
                tpNum: this.allCrossings[itp][c].tpNum,
                tpShortName: this.allCrossings[itp][c].tpShortName,
                time: this.allCrossings[itp][c].time,
                seconds: this.allCrossings[itp][c].seconds,
                igcTime: this.allCrossings[itp][c].igcTime,
                point1: this.allCrossings[itp][c].point1,
                point2: this.allCrossings[itp][c].point2,
                mode: this.allCrossings[itp][c].mode,
                map: this.allCrossings[itp][c].map,
              };
              this.validCrossings.push(validCrossing);
              this.addMarker(validCrossing.point1, validCrossing.tpNum, validCrossing.time, validCrossing);
              current_time = validCrossing.seconds;
              found = true;
              break;
            }
          }
        }
      }


      this.calcTrackStatistics(turnpoints, taskInfo);
    }


    addMarker(point, itp, label, infoContent) {

      let latLng = new google.maps.LatLng(point.x, point.y);

      let marker = new google.maps.Marker({
        position: latLng,
        title: String(label),
        //label: String(itp),
        // icon: {
        //   path: google.maps.SymbolPath.CIRCLE,
        //   scale: 5
        // },    
        icon: this.markerImage,
      });
      let container = '<div >';
      container += '<div class="item"> TP: ' + infoContent.tpNum + '</div>';
      container += '<div class="item"> ' + infoContent.tpShortName.toUpperCase() + ': ' + infoContent.tpID + '</div>';
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
      //console.log(this.graphic.markes.length);
    }


    
  }

  return Track;
});
