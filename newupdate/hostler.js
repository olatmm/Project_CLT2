// ==UserScript==
// @name         HostlerDashboard
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Displays hostler information
// @author       sffinn
// @match        https://trans-logistics.amazon.com/hostlerdash
// @grant        none
// ==/UserScript==

function parseDate(a) {
    var dateTime = a.split(" ");
    var date = dateTime[0].split("/");
    var time = dateTime[1].split(":");
    var stuff = new Date(date[2] + '-' + date[0] + '-' + date[1] + 'T' + dateTime[1]+':00Z');
    return (stuff.getTime() + 5*60*60*1000);
}
function fNum(a) {
    return ("0" + a).slice(-2)
}
function dateString(a) {
    return (fNum((a.getMonth()+1)) + '/' + fNum(a.getDate()) + '/' + a.getFullYear() + ' '+ fNum(a.getHours()) + ':' + fNum(a.getMinutes()));
}

function pushCell(row,content) {
    var newCell = row.insertCell(row.cells.length);
    newCell.innerHTML = content;
    return newCell
}
var user = [];
var yard = {
    eventReport : 0,
    Assets: [],
    Locations : [],
    Logins : [],
    Users : {},
    Events : [],
    Movements : [],
    GetYard : function() {
        var method = "listLocationsWithYardAssetsV2";
        var payload = "{\"method\":\"com.amazon.yms.coral.privateapi.YMSServiceInternal." + method + "\"";
        payload += ",\"context\":{\"securityToken\":\"" + yard.token + "\"}}";
        yard.Assets = [];
        yard.Locations = [];
        ymsPost(yard.ParseYard, method, payload);
        yard.GetMoves();
    },
    GetMoves : function() {
        var method = "listHostlerMoves";
        var payload = "{\"method\":\"com.amazon.yms.coral.privateapi.YMSServiceInternal." + method + "\"";
        payload += ",\"context\":{\"securityToken\":\"" + yard.token + "\"}}";
        ymsPost(yard.ParseMoves, method, payload);
    },
    GetEvents : async function(a, start, rows) {
        let payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getEventReport";
        payload.firstRow = start;
        payload.rowCount = rows;
        payload.yard = yard.code;
        payload.eventType = a;
        payload.location = "";
        payload.vehicleType = "";
        payload.vehicleOwner = "";
        payload.vehicleNumber = "";
        payload.loadIdentifierType = "";
        payload.loadIdentifier = "";
        payload.seal = "";
        payload.userId = "";
        payload.fromDate = yard.startTime/1000;
        payload.toDate = yard.endTime/1000;
        payload.visitReason = "";
        payload.yardAssetId = null;
        payload.annotation = "";
        payload.context = {};
        payload.context.securityToken = yard.token;
        //let result = await makeRequest(payload);
        // code below here will only execute when await makeRequest() finished loading

        let response = await ymsFetch(payload);
        if(response.events.length==rows) {
            yard.GetEvents(a,start+rows,rows);
        } else {
            yard.eventReport += 1;
        }
        yard.ParseEvent(response,yard.eventReport);
    },
    ForceMove : function(AssetID, SourceID, DestinationID) {
        var method = "createMovement";
        var payload = "{\"method\":\"com.amazon.yms.coral.privateapi.YMSServiceInternal." + method + "\"";

        payload = "{\"method\": \"com.amazon.yms.coral.privateapi.YMSServiceInternal." + method + "\",\"yardAssetIdsAndSeals\": [{"
        payload += "\"yardAssetId\": " + AssetID + ", \"sealNumbers\": []}],\"sourceLocationId\": " + SourceID
        payload += ",\"targetLocationId\": " + DestinationID + ",\"force\": true,\"context\": { \"securityToken~: \"" + yard.token + "\"}}"

        ymsPost(empty, method, payload);
    },
    ParseEvent : function(a,count){
        //var obj = JSON.parse(a);
        let obj = a;
        //yard.Users = [];
        obj.events.forEach(function(evnt){
            yard.Events.push(evnt);
            evnt.sortString = evnt.locationCode + evnt.timestampUtc;
            if(evnt.userId.search('@amazon.com')>0){return;};
            if(yard.Users[evnt.userId]) {
                yard.Users[evnt.userId].events.push(evnt);
            } else {
                yard.Users[evnt.userId] = {};
                yard.Users[evnt.userId].events = [];
                yard.Users[evnt.userId].login = evnt.userId;
                yard.Logins.push(evnt.userId);
                yard.Users[evnt.userId].events.push(evnt);
            }
        });
        if(count < 2) {
        } else {
            calcTimes();
        }
    },
};

function httpget(url, callback) {
    var xmlhttp=new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4) {
            callback(xmlhttp.responseText);
        }
    };

    try {
        xmlhttp.open("GET",url,true);
        xmlhttp.send();
    }
    catch(e) {
        alert("invalid");
    }
}

async function ymsFetch(payload) {
    let url = "https://yms-na.amazon.com/YMSServiceInternal/"
    let response = await fetch(url, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(payload), // data can be `string` or {object}!
        headers:{
            "Content-Type": "application/json",
            "Content-Encoding": "amz-1.0",
            "X-Amz-Target": payload.method
        }
    });
    response = await response.json();
    return response;
}

function ymsPost(callback, payload) {
    var url = "https:///yms-na.amazon.com/YMSServiceInternal/"
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4) {
            callback(xmlhttp.responseText);
        }
    };
    try {
        xmlhttp.open("POST",url,true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.setRequestHeader("Content-Encoding", "amz-1.0");
        xmlhttp.setRequestHeader("X-Amz-Target", payload.method);
        xmlhttp.send(JSON.stringify(payload));
    }
    catch(e) {
        alert("invalid post request " + payload.method);
    }
}

function getToken() {
    httpget("https://trans-logistics.amazon.com/yms/shipclerk/", parseToken);
}

function createHeader(row) {
    var cell;
    cell = row.insertCell(row.cells.length);
    //cell.style.fontSize = "14px";
    cell.innerHTML = "Login";
    //2
    cell = row.insertCell(row.cells.length);
    cell.innerHTML = "Count";
    cell = row.insertCell(row.cells.length);
    cell.innerHTML = "Complete Time";
    cell = row.insertCell(row.cells.length);
    cell.innerHTML = "Time Inbetween";
}

function showElement(a) {
    var row;
    var e = document.getElementById(a);
    var table = document.getElementById("tEvent");
    var obj = yard.Users[a];
    table.innerHTML = "";
    setModal("eventWindow");
    toggleModal();
    obj.events.forEach(function(event) {
        row = table.insertRow(table.rows.length)
        var dateTime = new Date(event.timestampUtc*1000)
        row.classList.add('history-body');
        pushCell(row, event.locationCode);
        pushCell(row, event.type.value);
        pushCell(row, dateTime.toLocaleString());
    });
}

function makeLink(id, cell) {
    var a = document.createElement('a');
    a.innerHTML = id;
    a.onclick = function(){showElement(id); return false;};
    a.href = "";
    cell.appendChild(a);
}

function drawScreen() {
    yard.output.innerHTML = "";
    var cell; var rowNum;
    var row = yard.output.insertRow(yard.output.rows.length);
    createHeader(row);
    for(var login in yard.Users) {
        var obj = yard.Users[login];
        if(obj.moveCount == 0) {
            continue;
        }
        rowNum = yard.output.rows.length;
        row = yard.output.insertRow(yard.output.rows.length);
        cell = row.insertCell(row.cells.length);
        //cell.style.fontSize = "14px";

        //history link
        makeLink(obj.login, cell);
        //
        //cell.innerHTML = obj.login;
        cell = row.insertCell(row.cells.length);
        cell.innerHTML = obj.cTimes.length;
        cell = row.insertCell(row.cells.length);
        cell.innerHTML = obj.avgComplete.toFixed(2);
        cell = row.insertCell(row.cells.length);
        cell.innerHTML = obj.avgBetween.toFixed(2);
        cell = row.insertCell(row.cells.length);
        //document.body.appendChild(button);
        //history.style = "display:none; background:#F0F0F0;";
        //pushEvents(history, obj);
        //row.onClick = () => {showEvents(obj)};
    }
}

function calcTimes() {
    yard.Events.sort(function(a,b){
        return a.sortString > b.sortString;
    });
    //console.log(yard.Events);
    for(var login in yard.Users) {
        var obj = yard.Users[login];
        var time;
        obj.cTimes = [];
        obj.bTimes = [];
        obj.moveCount = 0;
        //console.log(obj.login);
        obj.events.sort(function(a,b){
            return a.timestampUtc - b.timestampUtc;
        });
        for (var i=0;i<obj.events.length;i++) {
            var e = obj.events[i];
            var next = obj.events[i+1];
            //time to complete
            if(e.type.value=="HostlerStartEvent" && next != undefined &&
               next.type.value=="HostlerCompleteEvent" &&
               e.locationCode == next.locationCode){
                time = (next.timestampUtc - e.timestampUtc) / 60;
                if(time > 1) {
                    obj.cTimes.push(time);
                    obj.moveCount++;
                }
            }
            //time between moves
            if(e.type.value=="HostlerCompleteEvent" && next != undefined &&
               next.type.value=="HostlerStartEvent" &&
               e.locationCode != next.locationCode){
                time = (next.timestampUtc - e.timestampUtc) / 60;
                if(time < 360) {
                    obj.bTimes.push(time);
                }
            }
        }
        if(obj.cTimes.length > 0) {
            obj.avgComplete = obj.cTimes.reduce((total, value, index, array) => {
                return total + value;
            });
        }
        obj.avgComplete /= obj.cTimes.length;

        if(obj.bTimes.length > 0) {
            obj.avgBetween = obj.bTimes.reduce((total, value, index, array) => {
                return total + value;
            });
        }
        obj.avgBetween /= obj.bTimes.length;
    }
    drawScreen();
}

function toggleModal() {
    var modal = document.getElementById("wModal");
    modal.classList.toggle("show-modal");
    modal.classList.toggle("modal");
}

function setModal(id) {
    var button = document.getElementById('bClose');
    var window = document.getElementById(id);
    var children = document.getElementById("modal-content").children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        child.style.display = "none";
    }
    button.style.display = "block";
    window.style.display = "block";
}

function getEvents() {
    //await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    yard.GetEvents("HostlerCreateEvent",0,1000);
    yard.GetEvents("HostlerStartEvent",0,1000);
    yard.GetEvents("HostlerCompleteEvent",0,1000);
}

function parseToken(a) {
    var tok1 = a.split("window.ymsSecurityToken = \"");
    var tok2 = tok1[1].split("\";");
    yard.token = tok2[0];
}

function setBuildingInput() {
    var inBuilding = document.getElementById("inBuilding");
    yard.code = inBuilding.value;
}

function setStartTimeInput() {
    var inStart = document.getElementById("inStart");
    //console.log(parseDate(inStart.value));
    yard.startTime = parseDate(inStart.value);
}

function setEndTimeInput() {
    var inEnd = document.getElementById("inEnd");
    yard.endTime = parseDate(inEnd.value);
}

function pullData() {
    yard.output.innerHTML = "";
    yard.Users = {};
    yard.Logins.length = 0;
    yard.eventReport = 0;
    setStartTimeInput();
    setEndTimeInput();
    getEvents();
}
//input.setSelectionRange(2, 5);
({cont:'',mask:'__/__/____ __:__'})
let inputMask = function(opt) {
    let out = opt.mask;
    for(const c of opt.cont){
        out = out.replace('_',c);
    }; return out;
}

//let inputMask = () => new Object

let startDate = {
    cont:'',
    pos:0,
    mask:'__/__/____ __:__'
};
let endDate = {
    cont:'',
    pos:0,
    mask:'__/__/____ __:__'
};

function cleanStart(evt){
    let target = evt.target;
    if(evt.key.match("[0-9]")) {
        startDate.cont += evt.key;
    } else if (evt.key.match("Backspace")) {
        startDate.cont=startDate.cont.slice(0, -1);
    }
    //console.log(startDate.cont)
    target.value = inputMask(startDate);
    let num=startDate.pos+target.value.search('_');
    target.setSelectionRange(num, num+1);
    //setStartTimeInput();
}

function cleanEnd(evt){
    let target = evt.target;
    if(evt.key.match("[0-9]")) {
        endDate.cont += evt.key;
    } else if (evt.key.match("Backspace")) {
        endDate.cont=endDate.cont.slice(0, -1);
    }
    //console.log(startDate.cont)
    target.value = inputMask(endDate);
    let num=target.value.search('_');
    target.setSelectionRange(num, num+1);
    //console.log(evt.key);
    //setStartTimeInput();
}

function setEvents() {
    var newDate;
    var bPull = document.getElementById("bPull");
    var inBuilding = document.getElementById("inBuilding");
    var inStart = document.getElementById("inStart");
    var inEnd = document.getElementById("inEnd");
    inBuilding.oninput = function (evt) {
        evt.target.value = evt.target.value.toUpperCase();
        setBuildingInput();
    }
    //inStart.oninput = setStartTimeInput;
    inStart.onkeydown="return false;"
    inStart.onkeypress = cleanStart;
    inEnd.onkeydown="return false;"
    inEnd.onkeypress = cleanEnd;
    //inEnd.oninput = setEndTimeInput;
    bPull.onclick = pullData;

    //newDate = new Date(Date.now()-(12*60*60*1000))
    //inStart.value = dateString(newDate);
    //newDate = new Date(Date.now())
    //inEnd.value = dateString(newDate);
    //setStartTimeInput();
    //setEndTimeInput();
}
//var double = num => num * 2
function setHead() {
    var headTitle = "<title>Hostler Dashboard</title>"
    //headTitle += `<link rel="icon" type="image/x-icon" async="" crossorigin="anonymous" href="https://images-na.ssl-images-amazon.com/images/G/01/TransCentral/images/favicon.ico">`;
    var headStyle = `<style>

</style>
`;
    document.head.innerHTML = headTitle+headStyle;
}

function setBody() {
    document.body.innerHTML = `
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
<div class="container-fluid">
<nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark mb-5">
<a class="navbar-brand" href="https://trans-logistics.amazon.com">CLT2-YARD2</a>
<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
 </button>
<div class="collapse navbar-collapse" id="navbarCollapse">
<ul class="navbar-nav mr-auto">
<li class="nav-item">
<a class="nav-link" href="https://trans-logistics.amazon.com/yard-2">Yard 2</a>
</li>
<li class="nav-item active">
<a class="nav-link" href=" https://trans-logistics.amazon.com/hostlerdash">Hostler Dashboard<span
class="sr-only">(current)</span></a>
</li>
<li class="nav-item">
<a class="nav-link" href="https://trans-logistics.amazon.com/moves" tabindex="-1"
aria-disabled="true">Moves</a>
</li>
</ul>
</div>
</nav>
</div>

<div class="jumbotron">
<div class="container">
    <form class="form-group form-group-sm">
    <div class="form-row justify-content-center">
<div class="col-xs-2">
<label for="inputsm">FC</label>
<input id="inBuilding" placeholder="FC" type="text" size="4" class="form-control">
</div>
<div class="col-xs-4">
<label for="inputsm">Start Time</label>
<input id="inStart" readonly placeholder="MM/DD/YYYY HH:MM" type="text" class="form-control input-sm">
</div>
<div class="col-xs-6">
<label for="inputsm">End Time</label>
<div class="input-group">
<input id="inEnd" readonly placeholder="MM/DD/YYYY HH:MM" type="text" class="form-control">
<div class="input-group-append">
<button id="bPull" type="button" class="btn btn-info">
<span class="spinner-grow spinner-grow-sm"></span>
Pull
</button>
</div>
</div>
</div>
    </div>
    </form>
</div>
    </div>
</div>
<div class="container">
<table id='driverList' class="table table-striped">
</table>
</div>
<div id="wModal" class="modal">
<div class="modal-dialog">
<div class="modal-content">
<div class="modal-header">
<h4 class="modal-title">History window</h4>
<div id="modal-content" class="modal-content"><span id="bClose" class="close-button" style="display: block;">Ã—</span>
</div>
<div class="modal-body">
<div id="eventWindow" style="display: none;">
<table id="tEvent" class="table table-striped"></table>
</div>
<div class="modal-footer"></div>
</div>
</div>
</div>
</div>
</div>

<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
`
}

function empty(){}
(function() {
    'use strict';
    //console.log(formatdate(''));
    setHead();
    setBody();
    //createTopbar();
    //parseDate('01/25/2019 19:14');
    yard.output = document.getElementById("driverList");
    var bClose = document.getElementById("bClose");
    bClose.onclick = toggleModal;
    //document.body.style.fontFamily = "arial";
    getToken();
    setEvents();
    //console.log(InputMask.maskedValue());
    //sconsole.log(inputMask({cont:'01',mask:'__/__/____ __:__'}));
    //autoReload();
    // Your code here...
})();