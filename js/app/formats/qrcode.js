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

    var exporter = async function(turnpoints, taskInfo) {
        // Get the .xctsk file contents from xctrack.exporter
        var data = xctrack.exporter(turnpoints, taskInfo);

        // Convert the Blob to a string
        const fileContent = await data.text();

        try {
            // Send a POST request to the xcontest API
            const response = await fetch('https://tools.xcontest.org/api/xctsk/qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: fileContent, // Send the .xctsk file content as JSON
            });

            if (!response.ok) {
                throw new Error(`Failed to generate QR code: ${response.statusText}`);
            }

            // Get the SVG QR code from the response
            const qrCodeSvg = await response.text();

            // Convert the SVG to a PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Convert the canvas to a PNG data URL
                const pngDataUrl = canvas.toDataURL('image/png');

                // Create a download link for the PNG
                const link = document.createElement('a');
                link.href = pngDataUrl;
                link.download = 'qrcode.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            img.onerror = function() {
                console.error('Failed to load the SVG as an image.');
            };

            // Set the SVG as the source of the image
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrCodeSvg);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    return {
        'exporter': exporter,
        'extension': '.png',
        'name': 'qrcode',
    }
});