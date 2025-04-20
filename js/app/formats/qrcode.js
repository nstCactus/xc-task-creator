/**
 @file
 Task importer / exporter for qrcode
 **/
define(['jquery-qrcode', 'polyline', 'formats/xctrack'], function(jqueryqrcode, polyline, xctrack) {

    if (!polyline || !polyline.encode) {
        console.error("Errore: polyline non è stato caricato correttamente.");
        return;
    }

    class PolyLine {
        static encodeNum(builder, num) {
            let pnum = num << 1;
            if (num < 0)
                pnum = ~pnum;
    
            if (pnum === 0) {
                builder.push(String.fromCharCode(63)); // Usa push invece di append
            } else {
                while (pnum > 0x1f) {
                    let c = String.fromCharCode(((pnum & 0x1f) | 0x20) + 63);
                    builder.push(c); // Usa push invece di append
                    pnum = pnum >>> 5;
                }
                builder.push(String.fromCharCode(63 + pnum)); // Usa push invece di append
            }
        }
    
        static decodeNums(str) {
            let result = [];
            let current = 0;
            let pos = 0;
            for (let c of str) {
                c = c.charCodeAt(0) - 63;
                current |= (c & 0x1f) << pos;
                pos += 5;
                if (c <= 0x1f) {
                    let tmpres = current >>> 1;
                    if ((current & 0x1) === 1)
                        tmpres = ~tmpres;
                    result.push(tmpres);
                    current = 0;
                    pos = 0;
                }
            }
            return result;
        }
    
        static encodeCompetitionTurnpoint(lon, lat, alt, radius) {
            let builder = []; // builder è un array
            this.encodeNum(builder, Math.round(lon * 1e5));
            this.encodeNum(builder, Math.round(lat * 1e5));
            this.encodeNum(builder, alt);
            this.encodeNum(builder, radius);
            return builder.join(''); // Unisce l'array in una stringa
        }
    }

    var date = new Date();
    var day = date.getUTCDate();
    Number.prototype.pad = function(size) {
        var s = String(this);
        while (s.length < (size || 2)) { s = "0" + s; }
        return s;
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
                z: PolyLine.encodeCompetitionTurnpoint(tp.waypoint.lon, tp.waypoint.lat, tp.waypoint.altSmoothed, tp.radius),

                // z: polyline.encode([
                //     [tp.waypoint.lat, tp.waypoint.lon], // Codifica latitudine e longitudine
                //     [tp.waypoint.altSmoothed, tp.radius] // Codifica altitudine e raggio
                // ]),

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
        return JSON.stringify(taskV2);
    };

    var exporter = function(turnpoints, taskInfo) {
        var data = xctrack.exporter(turnpoints, taskInfo);
        var reader = new FileReader();

        reader.onload = function(event) {
            var jsonString = event.target.result;
            var data1 = convertTaskV1toV2(jsonString);
            var data2 = data1.replace(/(\r\n|\n|\r| )/gm, "");;

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
        };
    
        reader.readAsText(data); // Read the Blob as text
        return null
    }

    return {
        'exporter': exporter,
        'extension': '.png',
        'name': 'qrcode',
    }
});