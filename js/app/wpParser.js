/**
 * @file
 * Waypoint file parser module for the task creator.
 */
define(['jquery', 'waypoints/waypoints', 'task/task', 'tracks/tracks', 'formats/wpt', 'formats/oziOld', 'formats/ozi', 'formats/cup', 'formats/igc', 'formats/geoJson', 'formats/tsk', 'formats/gpx', 'formats/xctrack', 'formats/FsTask', 'formats/FsDB', 'formats/kml', 'formats/qrcode', 'jgrowl'],
    function($, waypoints, task, tracks, wpt, oziOld, ozi, cup, igc, geoJson, tsk, gpx, xctrack, FsTask, FsDB, kml, qrcode) {

        var formats = [wpt, oziOld, ozi, cup, igc, geoJson, tsk, gpx, xctrack, FsTask, FsDB, kml, qrcode];
        var parse = function(text, filename) {
            var result = formatCheck(text, filename);
            var format = result.format;

            if (!format) {
                $.jGrowl(result.message, {
                    header: result.state,
                    theme: result.state,
                    sticky: false,
                    position: 'top-left',
                });
                return;
            }

            var fileInfo = format.parse(text, filename);
            if (fileInfo == undefined) {
                return;
            }
            var parseInfo = {};

            if (fileInfo.waypoints) {
                var waypointsInfos = fileInfo.waypoints;
                var l = waypointsInfos.length;
                var waypointsArray = Array();
                for (var i = 0; i < l; i++) {
                    if (!waypoints.alreadyHave(waypointsInfos[i])) {
                        var waypoint = waypoints.addWaypoint(waypointsInfos[i]);
                        waypointsArray.push(waypoint);
                    }
                }

                if (l > 0) {
                    waypoints.clearPastFile();
                    waypoints.addFilename(filename);
                    $.jGrowl(l + ' waypoints succesfully imported from file : ' + filename + ' !!', {
                        header: 'success',
                        theme: 'success',
                        sticky: false,
                        position: 'top-left',
                    });
                } else {
                    $.jGrowl('No waypoint were found from file  : ' + filename + ' !!', {
                        header: 'warning',
                        theme: 'warning',
                        sticky: false,
                        position: 'top-left',
                    });
                }
                parseInfo.waypoints = waypointsArray;
            }

            if (fileInfo.tracks) {
                var tracksInfos = fileInfo.tracks;
                var l = tracksInfos.length;
                var tracksArray = Array();
                for (var i = 0; i < l; i++) {
                    var track = tracks.addTrack(tracksInfos[i]);
                    tracksArray.push(track);
                }
                parseInfo.tracks = tracksArray;
            }

            if (fileInfo.task) {
                parseInfo.task = fileInfo.task;
                if (parseInfo.task.turnpoints.length > 0) {
                    for (var i = 0; i < parseInfo.task.turnpoints.length; i++) {
                        var tp = parseInfo.task.turnpoints[i];
                        //var waypoint = waypoints.getWaypointByFileAndId(tp.wp.filename , tp.wp.id);
                        var waypoint = waypoints.getWaypointById(tp.wp.id);
                        //var waypoint = waypoints.getWaypointByIdAndReplaceFileName(tp.wp.filename , tp.wp.id);
                        tp.waypoint = waypoint;
                    }
                }
            }

            if (fileInfo.competition) {
                parseInfo.competition = fileInfo.competition;
            }

            if (fileInfo.KmlLayer) {
                parseInfo.KmlLayer = fileInfo.KmlLayer;
            }
            return parseInfo;
        }

        var formatCheck = function(text, filename) {
            var formatsName = [];
            for (var i = 0; i < formats.length; i++) {
                formatsName.push(formats[i].name);
            }

            var result = {
                format: false,
                state: 'error',
                message: 'Waypoints file format unknown. We only support : ' + formatsName.join(" , ") + ' files',
            }

            if (waypoints.checkFilename(filename) == false) {
                result.message = 'This file : ' + filename + " is alredy used.";
                result.state = 'warning';
                return result;
            }

            for (var i = 0; i < formats.length; i++) {
                if (formats[i].check(text, filename) == true) {
                    result.format = formats[i];
                    return result;
                }
            }
            return result;
        }

        return {
            'parse': parse,
        }
    });