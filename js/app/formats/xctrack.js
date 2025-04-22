/**
 @file
 Task importer / exporter for XCTrack
 **/
define(['rejs!formats/export/xctrack', 'rejs!formats/templates/publishResultModal'],
    function (exportXCTrack, publishResultModalTemplate) {
        $('body').append(publishResultModalTemplate({}));

        var date = new Date();
        var day = date.getUTCDate();
        Number.prototype.pad = function (size) {
            var s = String(this);
            while (s.length < (size || 2)) { s = "0" + s; }
            return s;
        }
        var converter = {
            "race-to-goal": "RACE",
            "entry": "ENTER",
        }

        var check = function (text, filename) {
            if (filename.split('.').pop() == 'xctsk') {
                return true;
            }
            return false;
        }

        var parse = function (text, filename) {
            var lookupType = {
                "TAKEOFF": "takeoff",
                "SSS": "start",
                "ESS": "end-of-speed-section"
            }

            var obj = JSON.parse(text);
            var wpts = obj.turnpoints;

            var tps = [];
            var wps = [];

            for (var i = 0; i < wpts.length; i++) {
                var tp = {};

                var wp = {
                    filename: filename,
                    id: wpts[i].waypoint.name,
                    name: wpts[i].waypoint.description,
                    type: 1,
                    x: wpts[i].waypoint.lat,
                    y: wpts[i].waypoint.lon,
                    z: wpts[i].waypoint.altSmoothed,
                }

                tp['close'] = '00:00:00';
                tp['goalType'] = 'cylinder';
                tp['index'] = i;
                tp['mode'] = 'entry';
                tp['open'] = '00:00:00';
                tp['radius'] = wpts[i].radius;

                if (wpts[i].hasOwnProperty('type')) {
                    tp.type = lookupType[wpts[i].type];
                } else {
                    if (i == wpts.length - 1) {
                        tp.type = "goal";
                    } else {
                        tp.type = "turnpoint";
                    }
                }
                if (tp.type == "start") {
                    tp.open = String(obj.sss.timeGates).replace('"', '').replace('Z', '');
                    tp.mode = String(obj.sss.direction).toLowerCase();
                }

                wps.push(wp);;
                tp.wp = wp;
                tps.push(tp);

            }

            // console.log(JSON.stringify(tps, undefined, 2)) 
            // console.log(JSON.stringify(wps, undefined, 2)) 
            return {
                'task': {
                    'date': day.pad(2) + '-' + date.getUTCMonth().pad(2) + '-' + date.getUTCFullYear(),
                    'type': 'race-to-goal',
                    'num': 1,
                    'ngates': 1,
                    'gateint': 15,
                    'turnpoints': tps,
                },
                'waypoints': wps,
            }
        }

        var exporter = function (turnpoints, taskInfo) {
            var xcInfo = {};
            for (var i = 0; i < turnpoints.length; i++) {
                if (turnpoints[i].type == "start") {
                    xcInfo.timeGates = turnpoints[i].open;
                    xcInfo.type = converter[taskInfo.type] ? converter[taskInfo.type] : taskInfo.type;;
                    xcInfo.direction = converter[turnpoints[i].mode] ? converter[turnpoints[i].mode] : turnpoints[i].mode;
                }
            }
            for (var i = 0; i < turnpoints.length; i++) {
                if (turnpoints[i].type == "goal") {
                    xcInfo.deadline = turnpoints[i].close;
                    xcInfo.goalType = converter[turnpoints[i].goalType] ? converter[turnpoints[i].goalType] : turnpoints[i].goalType;
                }
            }
            var data = exportXCTrack({
                turnpoints: turnpoints,
                taskInfo: taskInfo,
                xcInfo: xcInfo
            });
            return new Blob([data], { 'type': "text/plain" });
        }

        var publish = async function (turnpoints, taskInfo) {
            // Generate the .xctsk file
            const data = exporter(turnpoints, taskInfo);
            const fileContent = await data.text();

            try {
                // Send the POST request to publish the task
                const response = await fetch('https://tools.xcontest.org/api/xctsk/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: fileContent,
                });

                if (!response.ok) {
                    throw new Error(`Failed to publish task: ${response.statusText}`);
                }

                // Parse the response as JSON
                const responseData = await response.json();
                const taskCode = responseData.taskCode; // Extract the taskCode field
                const taskUrl = `https://tools.xcontest.org/xctsk/load?taskCode=${taskCode}`; // Construct the task URL

                // Close the publish modal
                $('#publish-modal').modal('hide');

                // Show the success modal
                $('#task-code').text(taskCode); // Display only the task code
                $('#task-url').text(taskUrl).attr('href', taskUrl); // Set the task URL
                $('#publish-success-modal').modal('show');

                // Handle the copy-to-clipboard button for the task code
                $('#copy-task-code').off('click').on('click', function () {
                    navigator.clipboard.writeText(taskCode);
                });

                // Handle the copy-to-clipboard button for the task URL
                $('#copy-task-url').off('click').on('click', function () {
                    navigator.clipboard.writeText(taskUrl);
                });
            } catch (error) {
                console.error('Error publishing task:', error);
                alert('Failed to publish the task. Please try again.');
            }
        };

        return {
            'check': check,
            'exporter': exporter,
            'publish': publish,
            'extension': '.xctsk',
            'name': 'XCTrack',
            'parse': parse,
        }
    });