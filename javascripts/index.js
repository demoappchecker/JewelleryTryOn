const queryString = new URLSearchParams(window.location.search);

var data = queryString.get('imageurl');
if(data == null){
    data = "images/jewellery/earring01.png";
}
const JEWELLERY_IMAGE_URL = data;

var data = queryString.get('imagetype');
if(data == null){
    data = "EARRING";
}
const IMAGE_TYPE = data;

var data = queryString.get('EDT');
if(data == null){
    data = 0.28;
}
const THRESHOLD_FOR_EARING_DETECTION = Number(data);

var data = queryString.get('EPT');
if(data == null){
    data = 5;
}
const THRESHOLD_FOR_EARING_PLACEMENT = Number(data);

var data = queryString.get('FTT');
if(data == null){
    data = 0.25;
}
const THRESHOLD_FOR_FACE_TILT = Number(data);

var data = queryString.get('JScale');
if(data == null){
    data = 0.5;
}
const JEWELLERY_SIZE = Number(data);

var data = queryString.get('verbose');
if(data == null){
    data = false;
}
else if(data=="true"){
    data = true;
}
else{
    data = false;
}
const VERBOSE = data;

var data = queryString.get('fullscreen');
if(data == null){
    data = true;
}
else if(data=="false"){
    data = false;
}
else{
    data = true;
}
const FULLSCREEN = data;

if (FULLSCREEN == true) {
    document.getElementById("_canvas_container").innerHTML = '<canvas id="_imageData"></canvas>';
} else {
    document.getElementById("_canvas_container").innerHTML = '<h2>JEWELLERY TRY ON</h2><div style="border-bottom: 1px solid #f0f0f0;">&nbsp;</div><br/>&nbsp;<br/><canvas id="_imageData"></canvas>';
}

const _webcam = document.getElementById('_webcam')
const _imageData = document.getElementById('_imageData');
const BRFv5ModelPath = "./models/";
document.getElementById("JewelleryToTry").src = JEWELLERY_IMAGE_URL;


function cameraFailedCallback(err) {
    console.error('Camera failed: ', err);
}

function modelLoadingFailedCallback(err) {
    console.error('BRFv5 failed: ', err);
}

function modelLoadingProgress(progress) {
    console.log("PROGRESS: " + progress);
}

function modelLoadingCompleted() {
    console.log("Model Loading Completed!....");
}

function processLandmarksCallback(ctx, array, color, radius) {
    const nose_point = array[30];
    const left_ear_point = array[2];
    const right_ear_point = array[14];
    const point_above_nose_point = array[29];

    // Initializing the Drawing Colors
    ctx.strokeStyle = null;
    ctx.fillStyle = getColor(color, 1.0);
    let _radius = radius || 2.0;

    if (VERBOSE == true) {
        // Plotting the Nose Point
        ctx.fillStyle = "rgb(255,0,0)";
        ctx.beginPath();
        ctx.arc(nose_point.x, nose_point.y, _radius, 0, 2 * Math.PI);
        ctx.fill();

        // Plotting the Point Above Nose Point
        ctx.fillStyle = "rgb(255,0,255)";
        ctx.beginPath();
        ctx.arc(point_above_nose_point.x, point_above_nose_point.y, _radius, 0, 2 * Math.PI);
        ctx.fill();

        // Plotting the Left Ear Point
        ctx.fillStyle = "rgb(0,0,255)";
        ctx.beginPath();
        ctx.arc(left_ear_point.x, left_ear_point.y, _radius, 0, 2 * Math.PI);
        ctx.fill();

        // Plotting the Right Ear Point
        ctx.fillStyle = "rgb(0,0,255)";
        ctx.beginPath();
        ctx.arc(right_ear_point.x, right_ear_point.y, _radius, 0, 2 * Math.PI);
        ctx.fill();

        // Plotting the Line Connecting the Left and Right Ear Points
        ctx.strokeStyle = "rgb(0,255,0)";
        ctx.beginPath();
        ctx.moveTo(left_ear_point.x, left_ear_point.y);
        ctx.lineTo(right_ear_point.x, right_ear_point.y);
        ctx.stroke();
    }

    // Transforming the Plane Coordinates to that of Geometric Plane
    var left_ear_point_transformed = {
        "x": left_ear_point.x - nose_point.x,
        "y": nose_point.y - left_ear_point.y
    };
    var right_ear_point_transformed = {
        "x": right_ear_point.x - nose_point.x,
        "y": nose_point.y - right_ear_point.y
    };

    var point_of_intersection = {
        "x": 0,
        "y": 0
    };
    var slope = 0;

    // Calculating the Slope of the Line
    if (left_ear_point_transformed.x == right_ear_point_transformed.x) {
        point_of_intersection.x = left_ear_point_transformed.x;
    } else if (left_ear_point_transformed.y == right_ear_point_transformed.y) {
        point_of_intersection.y = left_ear_point_transformed.y;
    } else {
        slope = (right_ear_point_transformed.y - left_ear_point_transformed.y) / (right_ear_point_transformed.x -
            left_ear_point_transformed.x);
        point_of_intersection.x = (slope * slope * left_ear_point_transformed.x - slope * left_ear_point_transformed
            .y) / (1 + slope * slope);
        point_of_intersection.y = left_ear_point_transformed.y + slope * point_of_intersection.x - slope *
            left_ear_point_transformed.x;
    }
    point_of_intersection.x = point_of_intersection.x + nose_point.x;
    point_of_intersection.y = nose_point.y - point_of_intersection.y;

    if (VERBOSE == true) {
        // Drawing the Normal Line
        ctx.strokeStyle = "rgb(255,0,0)";
        ctx.beginPath();
        ctx.moveTo(nose_point.x, nose_point.y);
        ctx.lineTo(point_of_intersection.x, point_of_intersection.y);
        ctx.stroke();
    }

    // Exit if Tilt is Large
    if (Math.abs(slope) > THRESHOLD_FOR_FACE_TILT) {
        ctx.fillStyle = "red";
        ctx.fillText("PLEASE KEEP YOUR FACE STRAIGHT!...", 5, 20);
        return;
    }

    // Exit if Not Vertically Center
    if (Math.abs((_height / 2) - nose_point.y) / (_height / 2) > 0.1) {
        ctx.fillStyle = "red";
        ctx.fillText("Not Vertically Center!...", 5, 20);
        ctx.fillText("PLEASE KEEP YOUR FACE IN THE CENTER OF SCREEN!...", 5, 35);
        return;
    }

    // Exit if Not Horizontally Center
    var twv = _width - right_ear_point.x + left_ear_point.x;
    if (Math.abs((twv / 2) - left_ear_point.x) / (twv / 2) > 0.4) {
        ctx.fillStyle = "red";
        ctx.fillText("Not Horizondally Center!...", 5, 20);
        ctx.fillText("PLEASE KEEP YOUR FACE IN THE CENTER OF SCREEN!...", 5, 35);
        return;
    }

    if (VERBOSE == true) {
        ctx.fillStyle = "yellow";
        ctx.fillText("Slope: " + slope.toFixed(2), 5, 65);
        ctx.fillStyle = "green";
        ctx.fillText("Almost Vertically Center!...", 5, 80);
        ctx.fillStyle = "green";
        ctx.fillText("Almost Horizontally Center!...", 5, 95);
    }

    // Calculating the Face Angle For determing which all Earrings to Show
    var distanceBetweenEars = Math.sqrt(Math.pow(left_ear_point.y - right_ear_point.y, 2) + Math.pow(left_ear_point
        .x - right_ear_point.x, 2));
    var distanceBetweenLEarAndIntersectionPoint = Math.sqrt(Math.pow(point_of_intersection.y - left_ear_point.y, 2) +
        Math.pow(point_of_intersection.x - left_ear_point.x, 2));
    var distanceBetweenREarAndIntersectionPoint = Math.sqrt(Math.pow(point_of_intersection.y - right_ear_point.y, 2) +
        Math.pow(point_of_intersection.x - right_ear_point.x, 2));
    var SepartionDistance = distanceBetweenLEarAndIntersectionPoint - distanceBetweenREarAndIntersectionPoint;
    var DifferencePercentage = "ERROR!...";
    if (distanceBetweenEars > 0) {
        DifferencePercentage = SepartionDistance * 100 / distanceBetweenEars;
        DifferencePercentage = DifferencePercentage.toFixed(2);
    }

    if (VERBOSE == true) {
        // Displaying the Face Angle 
        ctx.font = "15px Arial";
        ctx.fillStyle = "yellow";
        ctx.fillText("T-Ear : " + THRESHOLD_FOR_EARING_DETECTION + "%,\t\t\t\tC-Value: " + DifferencePercentage + "%",
            5, 20);
        ctx.fillText("Width : " + _width, 5, 35);
        ctx.fillText("ED:TW : " + ((distanceBetweenEars / _width) * 100).toFixed(2), 5, 50);
    }

    var JewelleryToTry = document.getElementById("JewelleryToTry");
    if (IMAGE_TYPE == "EARRING") {
        OffsetToPlotEar = {
            "x": 0,
            "y": 0
        };
        var angle = Math.atan(slope);
        if (left_ear_point.y == right_ear_point.y) {
            OffsetToPlotEar.x = THRESHOLD_FOR_EARING_PLACEMENT;
        } else if (left_ear_point.x == right_ear_point.x) {
            OffsetToPlotEar.y = THRESHOLD_FOR_EARING_PLACEMENT;
        } else {
            OffsetToPlotEar.y = Math.sin(angle) * THRESHOLD_FOR_EARING_PLACEMENT;
            OffsetToPlotEar.x = Math.cos(angle) * THRESHOLD_FOR_EARING_PLACEMENT;
        }
        if (DifferencePercentage != "ERROR!..." && Math.abs(DifferencePercentage) > THRESHOLD_FOR_EARING_DETECTION *
            100) {
            if (DifferencePercentage > THRESHOLD_FOR_EARING_DETECTION * 100) {
                if (VERBOSE == true) {
                    ctx.fillText("Only Left Earring Visible!...", 5, 110);
                }
                //Code To Draw Image Here
                if (slope >= 0) {
                    ctx.drawImage(JewelleryToTry, left_ear_point.x - (JEWELLERY_SIZE * 100 / 2) - OffsetToPlotEar.x,
                        left_ear_point.y + OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
                } else {
                    ctx.drawImage(JewelleryToTry, left_ear_point.x - (JEWELLERY_SIZE * 100 / 2) - OffsetToPlotEar.x,
                        left_ear_point.y - OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
                }
            } else {
                if (VERBOSE == true) {
                    ctx.fillText("Only Right Earring Visible!...", 5, 110);
                }
                //Code To Draw Image Here
                if (slope >= 0) {
                    ctx.drawImage(JewelleryToTry, right_ear_point.x - (JEWELLERY_SIZE * 100 / 2) + OffsetToPlotEar.x,
                        right_ear_point.y - OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
                } else {
                    ctx.drawImage(JewelleryToTry, right_ear_point.x - (JEWELLERY_SIZE * 100 / 2) + OffsetToPlotEar.x,
                        right_ear_point.y + OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
                }
            }
        } else if (DifferencePercentage != "ERROR!...") {
            if (VERBOSE == true) {
                ctx.fillText("Both Earring Visible!...", 5, 110);
            }
            //Code To Draw Image Here
            if (slope >= 0) {
                ctx.drawImage(JewelleryToTry, left_ear_point.x - (JEWELLERY_SIZE * 100 / 2) - OffsetToPlotEar.x,
                    left_ear_point.y + OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
                ctx.drawImage(JewelleryToTry, right_ear_point.x - (JEWELLERY_SIZE * 100 / 2) + OffsetToPlotEar.x,
                    right_ear_point.y - OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
            } else {
                ctx.drawImage(JewelleryToTry, left_ear_point.x - (JEWELLERY_SIZE * 100 / 2) - OffsetToPlotEar.x,
                    left_ear_point.y - OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
                ctx.drawImage(JewelleryToTry, right_ear_point.x - (JEWELLERY_SIZE * 100 / 2) + OffsetToPlotEar.x,
                    right_ear_point.y + OffsetToPlotEar.y, JEWELLERY_SIZE * 100, JEWELLERY_SIZE * 100);
            }
        } else if (DifferencePercentage == "ERROR!...") {
            console.log("Error Calculating Values!....");
        } else {
            console.log("Unexpected Error!....");
        }
    } else {
        if (VERBOSE == true) {
            ctx.fillStyle = "red";
            ctx.fillText("INVALID IMAGE TYPE", 5, 110);
        }
    }
}