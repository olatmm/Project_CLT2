// ==UserScript==
// @name         moves
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  list of hostler moves
// @author       sffinn
// @match        https://trans-logistics.amazon.com/moves
// @grant        none
// ==/UserScript==

function pushCell(row,content) {
    var newCell = row.insertCell(row.cells.length);
    newCell.innerHTML = content;
    return newCell
}

var yard = {
    Assets: [],
    Locations : [],
    Movements : [],
    GetMoves : function() {
        var method = "listHostlerMoves";
        var payload = "{\"method\":\"com.amazon.yms.coral.privateapi.YMSServiceInternal." + method + "\"";
        payload += ",\"context\":{\"securityToken\":\"" + yard.token + "\"}}";
        ymsPost(yard.ParseMoves, method, payload);
    },
    ParseMoves : function(a) {
        var obj = JSON.parse(a);
        var now = new Date();
        var activeCount = 0;
        var inactiveCount = 0;
        var cell;
        yard.output.innerHTML = "";
        var row = yard.output.insertRow(yard.output.rows.length);
        row.id = "rowID"
        pushCell(row,"Driver");
        pushCell(row,"Requested by");
        pushCell(row,"Time");
        pushCell(row,"Source");
        pushCell(row,"");
        pushCell(row,"Destination");
        pushCell(row,"Trailer");
        obj.movements.forEach(function(move) {
            row = yard.output.insertRow(yard.output.rows.length);

            var createDate = new Date(move.createdTimestampUtc);

            if(move.executor) {
                cell = pushCell(row,move.executor);
                activeCount += 1;
            } else {
                cell = pushCell(row,"");
                inactiveCount += 1;
            }
            cell.style.fontSize = "17px";

            var req = move.requestedBy
            pushCell(row,move.requestedBy.split("@")[0]);

            var time = Math.floor((now/1000 - createDate) / 60);
            pushCell(row,time);
            pushCell(row,move.sourceLocation.code);
            pushCell(row,">");
            pushCell(row,move.targetLocation.code);
            pushCell(row, move.yardAssets[0].name);
            //console.log(Math.floor((time / 30.0) * 255).toString(16))
            //rowColor.r= Math.floor((time / 30.0) * 120);
            /*
            if(time < 30) {
                rowColor.r= Math.floor((time / 30.0) * 120);
            } else {
                rowColor.g=Math.floor(255 - (time / 30.0) * 255);
            }

            rowColor.desaturate();
            var color;
            var tempC;
            tempC = Math.floor(rowColor.r).toString(16);

            color +=
            console.log("");
            console.log(" "+ Math.floor(rowColor.r).toString(16));
            console.log(" "+ Math.floor(rowColor.g).toString(16));
            console.log(" "+ Math.floor(rowColor.b).toString(16));*/

        });
        document.title = "moves " + (yard.output.rows.length-1) + " inactive " + inactiveCount;
    },
    RefreshScreen : function() {
        yard.output.style.fontSize = "11px";
        document.body.appendChild(yard.output);
        yard.OutputYard()
    }
};
var rowColor={r:0,g:0,b:0,
    desaturate:function(){
        var f = 0.2; // desaturate by 20%
        var L = 0.3*rowColor.r + 0.6*rowColor.g + 0.1*rowColor.b;
        rowColor.r = rowColor.r + f * (L - rowColor.r);
        rowColor.g = rowColor.g + f * (L - rowColor.g);
        rowColor.b = rowColor.b + f * (L - rowColor.b);
    }
};
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
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


function ymsPost(callback, method, payload) {
    var url = "https://yms-na.amazon.com/YMSServiceInternal/"
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
        xmlhttp.setRequestHeader("X-Amz-Target", "com.amazon.yms.coral.privateapi.YMSServiceInternal." + method);
        xmlhttp.send(payload);
    }
    catch(e) {
        alert("invalid");
    }
}

function getToken() {
    httpget("https://trans-logistics.amazon.com/yms/shipclerk/", parseToken);
}

function parseToken(a) {
    var tok1 = a.split("window.ymsSecurityToken = \"");
    var tok2 = tok1[1].split("\";");
    yard.token = tok2[0];
    yard.GetMoves();
}

function autoReload() {
    setInterval(yard.GetMoves, .25 * 60 * 1000)
}

function createTopbar() {
    yard.topBar = document.createElement("Div");
    yard.topBar.classList.add("sticky");
    document.body.appendChild(yard.topBar);


    yard.search = document.createElement('input');
    yard.search.type = "text";
    yard.search.placeholder = "Search...";
    yard.search.oninput = yard.OutputYard;
    yard.topBar.appendChild(yard.search);


    yard.btnReload = document.createElement("Button");
    yard.btnReload.onclick = yard.GetYard;
    yard.btnReload.innerHTML = "Reload";
    yard.topBar.appendChild(yard.btnReload);

    var btnForce = document.createElement("Button");
    btnForce.innerHTML = "Force Move";
    //btnForce.onclick = openForceMoveWindow;
    yard.topBar.appendChild(btnForce);

    var btnHostler = document.createElement("Button");
    btnHostler.innerHTML = "Hostler Move";
    yard.topBar.appendChild(btnHostler);



}

function setHead() {
    var headTitle = "<title>moves</title>"
    //headTitle += `<link rel="icon" type="image/x-icon" async="" crossorigin="anonymous" href="https://images-na.ssl-images-amazon.com/images/G/01/TransCentral/images/favicon.ico">`;
    var headStyle = "<style>.odd{background-color:#ffffff;}";
    headStyle +=`html {
    font-family: "arial";
}
* {
    box-sizing: border-box;
}
table {
    border-collapse: collapse;
}
tr {
    height: 38px;
}
td {
    padding: 0px 0px 0px 12px;
  border-bottom:1pt solid black;
}
tr.border_bottom td {
  border-bottom:1pt solid black;
}
tr:nth-child(even) {background-color: #e6e6e6;}`
    headStyle += ".sticky {"
    headStyle += "position: sticky;top: 0;"
    headStyle += "display: inline-block;"
    headStyle += "background-color: #FFFFF;"
    headStyle += "border: 2px solid #000000;}"
    headStyle += ".reloadButton {position: absolute;top: 0px;right: -38;}"
    headStyle += ".forcemove-window {position: fixed;top: 10px;right: 50%;width: 300px;height: 300px;background-color: #f9f9f9;}"
    headStyle += ".pad1 { padding: 19;}"



    headStyle += ".asdf {"
    headStyle += "-webkit-touch-callout: none;"
    headStyle += "-webkit-user-select: none;"
    headStyle += "-khtml-user-select: none;"
    headStyle += "-moz-user-select: none;"
    headStyle += "-ms-user-select: none;"
    headStyle += "user-select: none;}"

    headStyle += "</style>";
    document.head.innerHTML = headTitle+headStyle;
}

function setBody() {
    document.body.innerHTML = `
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
<div class="container-fluid pb-5">
<nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark mb-5">
<a class="navbar-brand" href="https://trans-logistics.amazon.com">CLT2-YARD2</a>
<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse"
aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
<span class="navbar-toggler-icon"></span>
</button>
<div class="collapse navbar-collapse" id="navbarCollapse">
<ul class="navbar-nav mr-auto">
<li class="nav-item">
<a class="nav-link" href="https://trans-logistics.amazon.com/yard-2">Yard 2</a>
</li>
<li class="nav-item">
<a class="nav-link" href=" https://trans-logistics.amazon.com/hostlerdash">Hostler Dashboard</a>
</li>
<li class="nav-item">
<a class="nav-link active" href="https://trans-logistics.amazon.com/moves" tabindex="-1"
aria-disabled="true">Moves<span
class="sr-only">(current)</span></a>
</li>
</ul>
</div>
</nav>
</div>
<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
`
}

function empty(){}

(function() {
    'use strict';
    setHead();
    setBody();
    //createTopbar();
    yard.output = document.createElement("table");
    yard.output.id="accessData"
    document.body.appendChild(yard.output);

    yard.output.style.fontSize = "11px";
    //document.body.style.fontFamily = "arial";
    getToken();
    autoReload();
    // Your code here...
})();