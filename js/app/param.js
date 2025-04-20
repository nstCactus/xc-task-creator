/**
 * @file
 * Param module for the task creator.
 */
define(['utils/timeUtils'], function (timeUtils) {

  Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
  }

  var date = new Date();
  var day = date.getUTCDate();
  //var turn = (day % 2 == 0) ? 'right' : 'left';
  var turn = 'left';

  return {
    showCumulativeDistances: false,
    allowCumulativeFiles: true,
    apiKey: 'AIzaSyDNrTc1a1WM07PlACypa2WbEAthHXIk-_A',
    map: {
      startX: 43.357700,
      startY: 12.749417,
    },
    waypoints: {
      normalColor: '#FE7569',
      landableColor: '#03fc94',
    },
    task: {
      allowed: {
        num: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        type: ['race-to-goal', 'elapsed-time'],
        turn: ['left', 'right'],
      },
      courseColor: {
        fast: '#204d74',
      },
      default: {
        date: day.pad(2) + '-' + (date.getUTCMonth() + 1).pad(2) + '-' + date.getUTCFullYear(),
        num: 1,
        type: 'race',
        turn: turn,
        distance: 0,
        bbox: false,
        ngates: 1,
        gateint: 15,
        info: "",
        compInfo: "",
        utcOffset: timeUtils.getLocalOffset(),
        jumpTheGun: 0,
        turnpointTolerance: 0,
      }
    },
    turnpoint: {
      allowed: {
        type: ['takeoff', 'start', 'turnpoint', 'end-of-speed-section', 'goal'],
        goalType: ['cylinder', 'line'],
        mode: ['entry', 'exit'],
      },
      default: {
        close: 0,
        goalType: 'cylinder',
        mode: 'entry',
        open: 0,
        radius: 400,
        takeoff_radius: 400,
        start_radius: 6000,
        turnpoint_radius: 1000,
        ess_radius: 1000,
        goal_radius: 400,
        type: 'takeoff',
      },
      icon: {
        takeoff: 'plane',
        start: 'play',
        turnpoint: 'forward',
        ess: 'stop',
        goal: 'thumbs-up',
      },
      shortName: {
        takeoff: 'to',
        start: 'ss',
        turnpoint: 'tp',
        'end-of-speed-section': 'es',
        goal: 'go',
      },
      xctrackName: {
        takeoff: 'TAKEOFF',
        start: 'SSS',
        turnpoint: '',
        'end-of-speed-section': 'ESS',
        goal: '',
      },
      dependencies: {
        show: {
          takeoff: ['close', 'open', 'radius'],
          start: ['open', 'radius', 'ngates', 'gateint'],
          turnpoint: ['radius'],
          'end-of-speed-section': ['radius'],
          goal: ['close', 'goal-type', 'radius'],
          line: ['close', 'radius'],
          cylinder: ['close', 'radius'],
        },
        hide: {
          takeoff: ['goal-type', 'mode', 'ngates', 'gateint'],
          start: ['close', 'goal-type', 'mode'],
          turnpoint: ['close', 'goal-type', 'open', 'mode', 'ngates', 'gateint'],
          'end-of-speed-section': ['close', 'mode', 'open', 'goal-type', 'ngates', 'gateint'],
          goal: ['mode', 'open', 'ngates', 'gateint'],
          line: ['mode', 'open'],
          cylinder: ['mode', 'open'],
        }
      },
      strokeColor: {
        takeoff: '#204d74',
        start: '#ac2925',
        turnpoint: '#269abc',
        'end-of-speed-section': '#ac2925',
        goal: '#398439',
      },
      fillColor: {
        takeoff: '#204d74',
        start: '#ac2925',
        turnpoint: '#269abc',
        'end-of-speed-section': '#ac2925',
        goal: '#398439',
      },
    },
    option: {
      circle_number_of_points: 360,
    },
  };
});
