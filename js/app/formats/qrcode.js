/**
 @file
 Task importer / exporter for qrcode
 **/
define(['rejs!formats/export/qrcode', 'jquery-qrcode', 'polyline'], function(exportqrcode, jqueryqrcode, polyline) {

    if (!polyline || !polyline.encode) {
        console.error("Errore: polyline non è stato caricato correttamente.");
        return;
    }

    var date = new Date();
    var day = date.getUTCDate();
    Number.prototype.pad = function(size) {
        var s = String(this);
        while (s.length < (size || 2)) { s = "0" + s; }
        return s;
    }
    var converter = {
        "race-to-goal": "RACE",
        "entry": "ENTER",
    }

    // Funzione per convertire una task da formato V1 a V2
    var convertTaskV1toV2 = function(taskV1) {
        // Parsing della stringa V1
        const task = JSON.parse(taskV1);

        // Creazione della struttura V2
        const taskV2 = {
            taskType: task.taskType || "CLASSIC",
            version: 2,
            t: task.turnpoints.map(tp => ({
                d: tp.waypoint.description || tp.waypoint.name,
                n: tp.waypoint.name,
                z: polyline.encode([
                    [tp.waypoint.lat, tp.waypoint.lon], // Codifica latitudine e longitudine
                    [tp.waypoint.altSmoothed, tp.radius] // Codifica altitudine e raggio
                ]),
                t: tp.type === "SSS" ? 2 : tp.type === "ESS" ? 3 : undefined
            })),
            s: task.sss ? {
                d: task.sss.direction === "ENTER" ? 2 : undefined, // OBSOLETO, ma incluso per compatibilità
                g: task.sss.timeGates,
                t: task.sss.type === "RACE" ? 1 : 2
            } : undefined,
            g: task.goal ? {
                d: task.goal.deadline,
                t: task.goal.type === "LINE" ? 1 : 2
            } : undefined,
            tc: (task.takeoff && task.takeoff.timeClose) || null, // Verifica manuale senza optional chaining
            to: (task.takeoff && task.takeoff.timeOpen) || null // Verifica manuale senza optional chaining
        };

        // Rimuovi campi undefined per compattare il JSON
        Object.keys(taskV2).forEach(key => taskV2[key] === undefined && delete taskV2[key]);
        Object.keys(taskV2.s || {}).forEach(key => taskV2.s[key] === undefined && delete taskV2.s[key]);
        Object.keys(taskV2.g || {}).forEach(key => taskV2.g[key] === undefined && delete taskV2.g[key]);

        // Aggiungi il prefisso "XCTSK:" e converti in stringa JSON
        return "XCTSK:" + JSON.stringify(taskV2);
    };


    var check = function(text, filename) {
        if (filename.split('.').pop() == 'xctsk') {
            return true;
        }
        return false;
    }

    var parse = function(text, filename) {
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

    var exporter = function(turnpoints, taskInfo) {
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

        var data = exportqrcode({
            turnpoints: turnpoints,
            taskInfo: taskInfo,
            xcInfo: xcInfo
        });;


        var data1 = convertTaskV1toV2(data);

        var data2 = data1.replace(/(\r\n|\n|\r| )/gm, "");;

        // var data = "XCTSK:" +
        //     exportqrcode({
        //         turnpoints: turnpoints,
        //         taskInfo: taskInfo,
        //         xcInfo: xcInfo
        //     }).replace(/(\r\n|\n|\r| )/gm, "");;

        //alert(data2.length)
        //data = data.substring(0, 200)

        var img = $('#qrcode').qrcode({ width: 512, height: 512, text: data2 });



        setTimeout(() => {
            var canvas = $('#qrcode canvas')[0]; // Seleziona il canvas dentro #qrcode
            if (canvas && canvas.toDataURL) { // Controlla che sia un canvas valido
                var link = document.createElement('a');
                link.href = canvas.toDataURL("image/png"); // Converte in immagine PNG
                link.download = "qrcode.png"; // Nome del file scaricato
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error("QR Code non trovato come canvas. Forse è una tabella.");
            }
        }, 500); // Attendi 500ms per permettere la generazione

        // return new Blob([data], { 'type': "text/plain" });
        return null

    }




    return {
        'check': check,
        'exporter': exporter,
        'extension': '.png',
        'name': 'qrcode',
        'parse': parse,
    }
});